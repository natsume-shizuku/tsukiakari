import { useEffect, useMemo, useRef, useState } from 'react';
import { MINIMUM_EXAM_QUESTIONS } from './validation';
import type { ReactNode } from 'react';
import type { QuestionBank, TestAttempt, TestQuestionSnapshot } from './domain';
import type { useWorkspace } from './useWorkspace';
import { questionBankManifests, visibleBankManifests, loadQuestionBank } from './content/questionBanks';
import { abandonTestAttempt, expireTestAttempts, finishTestAttempt, revealTestAnswer, retryTestAttempt, saveTestAnswer, startTest } from './testStorage';
import './tests-page.css';
import { TestDomainResults, QuestionLearningResources } from './TestDomainResults';

type Desk = ReturnType<typeof useWorkspace>;
function useNow(ticking: boolean) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!ticking) return;
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 1000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [ticking]);
  return Math.max(now, Date.now());
}
/** Mounted above routes so exam deadlines also finalize while browsing elsewhere. */
export function TestDeadlineMonitor({ desk, onExpired }: { desk: Desk; onExpired: (attemptId: string) => void }) {
  const active = desk.workspace?.testAttempts.find(attempt => attempt.completedAt === null);
  const now = useNow(active?.deadlineAt != null);
  const attempted = useRef(new Set<string>());
  useEffect(() => {
    if (!active || active.deadlineAt === null || active.deadlineAt > now || !desk.canWrite || attempted.current.has(active.id)) return;
    let ended: TestAttempt[] = [];
    void desk.mutate(async () => { attempted.current.add(active.id); ended = await expireTestAttempts(); }, 'Exam time ended.').then(saved => {
      if (saved && ended.length) onExpired(ended[0].id);
    });
  }, [active, now, desk.canWrite, desk.mutate, onExpired]);
  return null;
}
function attemptTitle(attempt: TestAttempt) { return attempt.bankTitle ?? attempt.bankId; }
function percent(attempt: TestAttempt) { return Math.round(100 * (attempt.result?.correct ?? 0) / attempt.questions.length); }
function timeText(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
}

export function TestsPage({ desk, onDirtyChange, initialBankId, initialAttemptId }: { desk: Desk; onDirtyChange?: (dirty: boolean) => void; initialBankId?: string; initialAttemptId?: string }) {
  const attempts = desk.workspace?.testAttempts ?? [];
  const active = attempts.find(attempt => attempt.completedAt === null);
  const [selectedId, setSelectedId] = useState<string | null>(initialAttemptId ?? active?.id ?? null);
  const [bankId, setBankId] = useState(() => initialBankId ?? attempts.find(item => item.id === initialAttemptId)?.bankId ?? new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('bank') ?? '');
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const previewButton = useRef<HTMLButtonElement>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [loadRevision, setLoadRevision] = useState(0);
  const [domainId, setDomainId] = useState('');
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [count, setCount] = useState('20');
  const [minutes, setMinutes] = useState('120');
  const [setupError, setSetupError] = useState('');
  const [setupNotice, setSetupNotice] = useState('');
  const [starting, setStarting] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = attempts.find(attempt => attempt.id === selectedId);
  useEffect(() => {
    if (initialBankId !== undefined) { setBankId(initialBankId); setDomainId(''); setSetupError(''); setPreviewing(false); }
  }, [initialBankId]);
  const autoOpenedAttempt = useRef(initialAttemptId === undefined ? active?.id : undefined);
  useEffect(() => {
    if (!autoOpenedAttempt.current || selectedId !== autoOpenedAttempt.current) return;
    // Restoring at plain #tests must retain an addressable result after completion.
    // Replace the entry so Back to Tests still leads to setup, not another auto-resume.
    const id = autoOpenedAttempt.current;
    autoOpenedAttempt.current = undefined;
    window.history.replaceState(null, '', '#tests?attempt=' + encodeURIComponent(id));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, [selectedId]);
  const previousRouteAttempt = useRef(initialAttemptId);
  useEffect(() => {
    if (initialAttemptId !== undefined) setSelectedId(initialAttemptId);
    else if (previousRouteAttempt.current !== undefined) setSelectedId(null);
    previousRouteAttempt.current = initialAttemptId;
  }, [initialAttemptId]);
  const openAttempt = (id: string) => { setSelectedId(id); window.location.hash = '#tests?attempt=' + encodeURIComponent(id); };
  const manifest = questionBankManifests.find(item => item.id === bankId);
  useEffect(() => {
    let current = true;
    setBank(null);
    setBankError('');
    if (!bankId) { setBankLoading(false); return () => { current = false; }; }
    setBankLoading(true);
    void loadQuestionBank(bankId).then(loaded => {
      if (current) setBank(loaded);
    }).catch(error => {
      if (current) setBankError(error instanceof Error ? error.message : 'The question bank could not be loaded.');
    }).finally(() => { if (current) setBankLoading(false); });
    return () => { current = false; };
  }, [bankId, loadRevision]);
  const currentBank = bank?.id === bankId ? bank : null;
  const selectedDomain = mode === 'practice' ? domainId : '';
  const eligible = currentBank?.questions.filter(question => question.status === 'approved' && (!selectedDomain || question.domainId === selectedDomain)).length ?? 0;
  const approvedCount = currentBank?.questions.filter(question => question.status === 'approved').length ?? 0;
  const unpublishedBank = Boolean(currentBank && !currentBank.fixture && approvedCount < 300);
  const minimumCount = mode === 'exam' ? MINIMUM_EXAM_QUESTIONS : 1;
  const insufficient = Boolean(currentBank && eligible < minimumCount);
  // Runs when the selection changes, not on typing, so a typed count is never altered.
  useEffect(() => {
    if (mode === 'practice' && eligible > 0 && Number(count) > eligible) setCount(String(eligible));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, eligible]);
  const begin = async () => {
    setSetupError('');
    setSetupNotice('');
    if (!currentBank || bankLoading) { setSetupError('Choose a question bank and wait for it to load.'); return; }
    if (unpublishedBank) { setSetupError('This pilot is available for reading only. Full tests require at least 300 approved questions.'); return; }
    const questionCount = Number(count);
    const duration = mode === 'exam' ? Number(minutes) : 120;
    if (insufficient) { setSetupError(mode === 'exam' ? `Exams need at least ${MINIMUM_EXAM_QUESTIONS} available questions.` : 'This selection has no available questions. Choose another domain or All domains.'); return; }
    if (!Number.isInteger(questionCount) || questionCount < minimumCount || questionCount > eligible) { setSetupError(`Choose a whole number from ${minimumCount} to ${eligible}. The question count is never reduced automatically.`); return; }
    if (mode === 'exam' && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) { setSetupError('Choose a time limit from 1 to 1440 whole minutes.'); return; }
    setStarting(true);
    let created: TestAttempt | undefined;
    try {
      const saved = await desk.mutate(async () => { created = await startTest(currentBank, { mode, count: questionCount, durationMinutes: duration, fixturePreview: currentBank.fixture, ...(selectedDomain ? { domainId: selectedDomain } : {}) }); }, 'Test started. Answers are saved in this browser.');
      if (saved && created) openAttempt(created.id);
    } finally { setStarting(false); }
  };
  const retry = async (attempt: TestAttempt) => {
    let created: TestAttempt | undefined;
    const saved = await desk.mutate(async () => { created = await retryTestAttempt(attempt.id); }, 'A fresh attempt with the same questions has started.');
    if (saved && created) openAttempt(created.id);
  };
  const goSetup = () => { setSelectedId(null); window.location.hash = '#tests' + (bankId ? '?bank=' + encodeURIComponent(bankId) : ''); requestAnimationFrame(() => heading.current?.focus()); };
  const abandon = async (attempt: TestAttempt) => {
    if (!desk.canWrite || !window.confirm('Abandon this test? Its saved answers and any unsaved changes will be discarded. No score will be recorded. You can then start a new test.')) return;
    const saved = await desk.mutate(() => abandonTestAttempt(attempt.id), 'Test abandoned.');
    if (saved) { setSetupNotice('Test abandoned. You can start a new test.'); goSetup(); }
  };
  if (selected) return <AttemptReader key={selected.id} desk={desk} attempt={selected} onDirtyChange={onDirtyChange} onSetup={goSetup} onAbandon={() => { void abandon(selected); }} onRetry={() => { void retry(selected); }} hasOtherActive={Boolean(active && active.id !== selected.id)}/>;
  if (previewing && currentBank) return <PilotQuestionPreview bank={currentBank} onClose={() => { setPreviewing(false); requestAnimationFrame(() => previewButton.current?.focus()); }}/>;
  return <section className="tests-page">
    <header className="page-header"><p className="eyebrow">Put it into practice</p><h1 ref={heading} tabIndex={-1}>Tests</h1><p>Practice at your pace or take a timed exam. Test results stay separate from flashcard study.</p></header>
    {active && <section className="panel test-resume" aria-label="Unfinished test"><div><h2>Your {active.mode === 'exam' ? 'exam' : 'practice test'} is in progress</h2><p>{attemptTitle(active)} · {active.questions.length} questions. Finish or abandon this attempt to start another.</p></div><div className="test-actions"><button className="button primary" onClick={() => openAttempt(active.id)}>Resume test</button><button className="button secondary" disabled={!desk.canWrite} onClick={() => { void abandon(active); }}>Abandon test</button></div></section>}
    {initialAttemptId && !selected && <p role="status" className="notice">This saved test is unavailable. Your other saved learning data is retained.</p>}
    {setupNotice && <p role="status" className="notice">{setupNotice}</p>}
    <section className="panel test-setup" aria-labelledby="test-setup-heading"><h2 id="test-setup-heading">New test</h2>
      <div className="test-setup-fields">
        <div className="test-pack-field"><label htmlFor="test-bank">Question bank</label><select id="test-bank" value={bankId} onChange={event => { setBankId(event.target.value); setDomainId(''); setSetupError(''); }}><option value="">Choose a question bank</option>{bankId && !manifest && <option value={bankId}>Unavailable question bank</option>}{visibleBankManifests.map(item => <option value={item.id} key={item.id}>{item.title}{item.fixture ? ' — sample data' : ''}</option>)}</select></div>
        <div><label htmlFor="test-mode">Test mode</label><select id="test-mode" value={mode} onChange={event => { const next = event.target.value as 'practice' | 'exam'; setMode(next); setCount(next === 'exam' ? '100' : '20'); setSetupError(''); }}><option value="practice">Practice Mode</option><option value="exam">Exam Mode</option></select></div>
        {mode === 'practice' && manifest && <div><label htmlFor="test-domain">Practice domain</label><select id="test-domain" value={domainId} onChange={event => { setDomainId(event.target.value); setSetupError(''); }}><option value="">All domains</option>{manifest.domains.map(domain => <option key={domain.id} value={domain.id}>{domain.title}</option>)}</select></div>}
        <div><label htmlFor="test-count">Number of questions</label><input id="test-count" type="number" min={minimumCount} max={eligible || undefined} step="1" value={count} onChange={event => setCount(event.target.value)}/></div>
        {mode === 'exam' && <div><label htmlFor="test-minutes">Time limit (minutes)</label><input id="test-minutes" type="number" min="1" max="1440" step="1" value={minutes} onChange={event => setMinutes(event.target.value)}/></div>}
      </div>
      {bankLoading && <p role="status" className="fine-print">Loading question bank…</p>}
      {bankError && <div className="notice error test-bank-error" role="alert"><p>{bankError} Your saved learning data has not changed.</p><button className="button secondary" onClick={() => setLoadRevision(value => value + 1)}>Retry loading question bank</button></div>}
      {currentBank && !bankLoading && <p className="fine-print">{eligible} available questions. New tests prefer questions you have not seen, then those seen least recently.{mode === 'exam' ? ' Exams balance questions across the bank’s domains.' : ''}</p>}
      {insufficient && !unpublishedBank && <p className="notice" role="status">{mode === 'exam' ? `Exams need at least ${MINIMUM_EXAM_QUESTIONS} available questions.` : 'This selection has no available questions. Choose another domain or All domains.'}</p>}
      {unpublishedBank && <div className="notice"><p>This pilot contains {approvedCount} reviewed questions. Full practice and exams require at least 300 approved questions.</p><button ref={previewButton} className="button secondary" onClick={() => setPreviewing(true)}>Preview pilot questions</button></div>}
      {manifest?.fixture && <p className="test-fixture-notice">Engineering preview · Generated arithmetic questions exercise the test tools. This is sample data, not an exam study pack.</p>}
      <p>{mode === 'practice' ? 'Reveal an answer whenever you need help.' : 'Answers stay hidden until you finish. The timer continues if you leave the page or close your browser.'}</p>
      {setupError && <p role="alert" className="notice error">{setupError}</p>}
      <button className="button primary" disabled={!desk.canWrite || Boolean(active) || starting || bankLoading || !currentBank || insufficient || unpublishedBank} onClick={() => { void begin(); }}>{mode === 'exam' ? 'Start exam' : 'Start practice'}</button>
    </section>
  </section>;
}

function PilotQuestionPreview({ bank, onClose }: { bank: QuestionBank; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const questions = bank.questions.filter(question => question.status === 'approved');
  return <section className="tests-page test-attempt" aria-label="Pilot question preview">
    <header className="test-attempt-heading"><div><p className="eyebrow">Read-only content pilot</p><h1 ref={heading} tabIndex={-1}>Question preview</h1></div><button className="button secondary" onClick={onClose}>Back to Tests</button></header>
    <p>{bank.title} · {questions.length} sourced questions. Answers are shown for review; this preview records no responses, score, or question exposure. These are original study questions, not Microsoft exam questions.</p>
    <div className="test-questions">{questions.map((card, index) => <Question key={card.id}
      question={{bankId:bank.id,card,sources:bank.sources.filter(source => card.sourceIds.includes(source.id)),domainTitle:bank.domains.find(domain => domain.id === card.domainId)!.title}}
      number={index+1} selectedOptionIds={[]} revealed disabled saving={false} practice={false} completed preview
      onAnswer={() => {}} onReveal={() => {}} revealDisabled>{null}</Question>)}</div>
  </section>;
}

function AttemptReader({ desk, attempt, onDirtyChange, onSetup, onAbandon, onRetry, hasOtherActive }: { desk: Desk; attempt: TestAttempt; onDirtyChange?: (dirty: boolean) => void; onSetup: () => void; onAbandon: () => void; onRetry: () => void; hasOtherActive: boolean }) {
  const now = useNow(attempt.completedAt === null && attempt.deadlineAt !== null);
  const completed = attempt.completedAt !== null;
  const expired = !completed && attempt.deadlineAt !== null && attempt.deadlineAt <= now;
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [reviewingExam, setReviewingExam] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('review') === '1');
  const [answerNotice, setAnswerNotice] = useState('');
  const [answerSaving, setAnswerSaving] = useState(false);
  const answerInFlight = useRef(false);
  const [progress, setProgress] = useState(() => loadProgress(attempt));
  const position = progress.position;
  const pending = Object.keys(drafts).length > 0 && !completed;
  const heading = useRef<HTMLHeadingElement>(null);
  const resultsDialog = useRef<HTMLDialogElement>(null);
  const canAnswer = desk.access === 'writer' && !completed && !expired;
  const showExamResult = completed && attempt.mode === 'exam' && !reviewingExam;
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }, []);
  useEffect(() => {
    if (completed && attempt.mode === 'practice') {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    }
  }, [completed, attempt.mode]);
  useEffect(() => { onDirtyChange?.(pending); return () => onDirtyChange?.(false); }, [pending, onDirtyChange]);
  useEffect(() => {
    if (!pending) return;
    const prevent = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [pending]);
  useEffect(() => {
    if (showExamResult && resultsDialog.current && !resultsDialog.current.open) resultsDialog.current.showModal();
  }, [showExamResult]);
  const responsesByCard = useMemo(() => new Map(attempt.responses.map(item => [item.cardId, item])), [attempt.responses]);
  useEffect(() => { saveProgress(attempt.id, completed ? null : progress); }, [attempt.id, completed, progress]);
  const goTo = (index: number) => {
    setProgress(previous => ({ ...previous, position: index }));
    const id = attempt.questions[index].card.id;
    requestAnimationFrame(() => {
      document.querySelector(`.test-question[data-index="${index}"]`)?.scrollIntoView({ block: 'start' });
      document.getElementById('test-question-title-' + id)?.focus({ preventScroll: true });
      centerCurrentButton();
    });
  };
  const toggleFlag = (cardId: string) => setProgress(previous => ({ ...previous, flagged: previous.flagged.includes(cardId) ? previous.flagged.filter(id => id !== cardId) : [...previous.flagged, cardId] }));
  const answer = async (cardId: string, optionIds: string[]) => {
    if (!canAnswer || desk.busy || answerInFlight.current) return;
    answerInFlight.current = true;
    setAnswerSaving(true);
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDrafts(previous => ({ ...previous, [cardId]: optionIds }));
    setAnswerNotice('');
    let updated: TestAttempt | undefined;
    const saved = await desk.mutate(async () => { updated = await saveTestAnswer(attempt.id, cardId, optionIds); }, 'Test answer saved.');
    if (saved) {
      setDrafts(previous => { const next = { ...previous }; delete next[cardId]; return next; });
      if (updated?.completedAt !== null && !sameSelection(updated?.responses.find(item => item.cardId === cardId)?.selectedOptionIds ?? [], optionIds)) setAnswerNotice('Time ended before this answer could be saved. Results use the responses saved before the deadline.');
    }
    answerInFlight.current = false;
    setAnswerSaving(false);
    requestAnimationFrame(() => { if (focus?.isConnected && document.activeElement === document.body && !focus.matches(':disabled')) focus.focus({ preventScroll: true }); });
  };
  const leave = () => { if (!pending || window.confirm('Discard unsaved test answer changes? Saved answers will remain available.')) onSetup(); };
  const finish = async () => {
    const unanswered = attempt.questions.length - answered;
    const summary = [unanswered ? `${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'} will count as skipped.` : '', progress.flagged.length ? `${progress.flagged.length} flagged for review.` : ''].filter(Boolean).join(' ');
    if (!expired && !window.confirm(`Finish this test and show all answers? ${summary} Responses will be locked.`.replace(/ +/g, ' '))) return;
    await desk.mutate(() => finishTestAttempt(attempt.id), 'Test completed. Results are saved in this browser.');
  };
  const reveal = async (cardId: string) => {
    const saved = await desk.mutate(() => revealTestAnswer(attempt.id, cardId), 'Answer revealed. This response is now locked.');
    if (saved) requestAnimationFrame(() => document.getElementById('test-answer-' + cardId)?.focus({ preventScroll: true }));
  };
  const answered = attempt.responses.filter(item => item.selectedOptionIds.length > 0).length;
  const reviewExam = () => { setReviewingExam(true); const query = new URLSearchParams({attempt:attempt.id,review:'1'}); window.history.replaceState(null,'','#tests?' + query.toString()); requestAnimationFrame(() => heading.current?.focus()); };
  const page = Math.floor(position / QUESTIONS_PER_PAGE);
  const pageStart = page * QUESTIONS_PER_PAGE;
  const pageCount = Math.ceil(attempt.questions.length / QUESTIONS_PER_PAGE);
  const goToNext = (matches: (question: TestAttempt['questions'][number]) => boolean) => {
    const later = attempt.questions.findIndex((question, index) => index > position && matches(question));
    goTo(later >= 0 ? later : attempt.questions.findIndex(matches));
  };
  const renderQuestion = (question: TestAttempt['questions'][number], index: number) => {
      const saved = responsesByCard.get(question.card.id);
      const hasDraft = Object.prototype.hasOwnProperty.call(drafts, question.card.id) && !completed;
      const chosen = hasDraft ? drafts[question.card.id] : saved?.selectedOptionIds ?? [];
      const revealed = completed || Boolean(saved?.revealed);
      return <Question key={question.card.id} question={question} number={index + 1} total={completed ? undefined : attempt.questions.length} selectedOptionIds={chosen} revealed={revealed} disabled={!canAnswer || Boolean(saved?.revealed)} saving={desk.busy || answerSaving} practice={attempt.mode === 'practice'} completed={completed}
        onAnswer={optionIds => { void answer(question.card.id, optionIds); }} onReveal={() => { void reveal(question.card.id); }} revealDisabled={!canAnswer || (hasDraft && !answerSaving)}>
        {hasDraft && !desk.busy && !answerSaving && <div id={"test-pending-" + question.card.id} className="test-pending-answer"><p role="alert">This selection is not saved.</p><button className="button secondary" disabled={!canAnswer} onClick={() => { void answer(question.card.id, drafts[question.card.id]); }}>Retry saving answer</button><button className="button secondary" disabled={desk.busy} onClick={() => setDrafts(previous => { const next = { ...previous }; delete next[question.card.id]; return next; })}>Discard unsaved answer</button></div>}
        {!completed && <div className="test-question-actions"><button className="button secondary" aria-pressed={progress.flagged.includes(question.card.id)} onClick={() => toggleFlag(question.card.id)}>{progress.flagged.includes(question.card.id) ? 'Remove flag' : 'Flag for review'}</button></div>}
      </Question>;
  };
  return <section className="tests-page test-attempt">
    <header className="test-attempt-heading"><div><p className="eyebrow">{attempt.fixture ? 'Engineering preview · ' : ''}{attempt.mode === 'exam' ? 'Exam Mode' : 'Practice Mode'}</p><h1 ref={heading} tabIndex={-1}>{attemptTitle(attempt)}</h1></div><div className="test-actions"><button className="button secondary" onClick={leave}>Back to Tests</button>{!completed && <button className="button secondary" disabled={!desk.canWrite || expired} onClick={onAbandon}>Abandon test</button>}</div></header>
    {attempt.fixture && <p className="test-fixture-notice">Sample questions for trying the test tools. These results are marked as engineering preview data.</p>}
    <div className="test-session-bar"><span role="status" aria-live="polite">{answered} of {attempt.questions.length} answered{completed ? ' · Completed' : ''}</span>{attempt.deadlineAt !== null && !completed && <strong className={expired ? 'test-time-ended' : ''} aria-label="Time remaining">{expired ? 'Time ended' : timeText(attempt.deadlineAt - now)}</strong>}<span className="fine-print">{completed ? new Date(attempt.completedAt!).toLocaleString() : 'Selections save automatically'}</span>{!completed && <button className="button primary test-finish-button" disabled={!desk.canWrite || pending || expired} onClick={() => { void finish(); }}>Finish test</button>}</div>
    {expired && <div className="notice error" role="alert"><p>Time has ended. Responses are locked. Only answers saved before the deadline count.</p><button className="button secondary" disabled={!desk.canWrite} onClick={() => { void finish(); }}>Retry finalization</button></div>}
    {pending && !desk.busy && !answerSaving && <div className="notice error" role="status"><p>An answer has not been saved. Retry or discard the pending answer before finishing.</p><button className="button secondary" onClick={() => { const cardId = Object.keys(drafts)[0]; goTo(attempt.questions.findIndex(question => question.card.id === cardId)); requestAnimationFrame(() => document.getElementById("test-pending-" + cardId)?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true })); }}>Go to unsaved answer</button></div>}
    {answerNotice && <p className="notice error" role="alert">{answerNotice}</p>}
    {completed && Object.keys(drafts).length > 0 && <p className="notice error">An unsaved answer was not included. The results below use saved responses only.</p>}
    {completed && attempt.result && <section className="panel test-score" aria-label="Test score"><strong>{attempt.result.correct}/{attempt.questions.length} ({percent(attempt)}%)</strong><span>{attempt.result.correct} correct · {attempt.result.wrong} wrong · {attempt.result.skipped} skipped</span>{attempt.mode === 'practice' && <span className="fine-print">{attempt.responses.filter(item => item.revealed).length} answers revealed during practice</span>}<div className="test-actions"><button className="button primary" disabled={!desk.canWrite || hasOtherActive} onClick={onRetry}>Retry same questions</button><button className="button secondary" onClick={leave}>New test</button>{attempt.mode === 'exam' && !reviewingExam && <button className="button secondary" onClick={reviewExam}>Review exam</button>}</div></section>}
    {completed && !showExamResult && <TestDomainResults attempt={attempt}/>}
    {!showExamResult && completed && <div className="test-questions">{attempt.questions.map(renderQuestion)}</div>}
    {!completed && <div className="test-focus">
      <div className="test-focus-main">
        <div className="test-questions">{attempt.questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE).map((question, offset) => renderQuestion(question, pageStart + offset))}</div>
        {pageCount > 1 && <div className="test-move">
          <button className="button secondary" disabled={page === 0} onClick={() => goTo(pageStart - QUESTIONS_PER_PAGE)}>Previous page</button>
          <button className="button secondary" disabled={page === pageCount - 1} onClick={() => goTo(pageStart + QUESTIONS_PER_PAGE)}>Next page</button>
        </div>}
      </div>
      <nav className="test-navigator" aria-label="Test questions">
        <p className="fine-print test-nav-legend">{answered} answered · {progress.flagged.length} flagged</p>
        {answered < attempt.questions.length && <button className="button secondary test-nav-next" onClick={() => goToNext(question => !responsesByCard.get(question.card.id)?.selectedOptionIds.length)}>Next unanswered</button>}
        {progress.flagged.length > 0 && <button className="button secondary test-nav-next" onClick={() => goToNext(question => progress.flagged.includes(question.card.id))}>Next flagged</button>}
        {pageCount > 1 && <ol className="test-nav-grid">{Array.from({ length: pageCount }, (_, index) => {
          const questions = attempt.questions.slice(index * QUESTIONS_PER_PAGE, (index + 1) * QUESTIONS_PER_PAGE);
          const first = index * QUESTIONS_PER_PAGE + 1;
          const last = first + questions.length - 1;
          const done = questions.filter(question => responsesByCard.get(question.card.id)?.selectedOptionIds.length).length;
          const hasFlag = questions.some(question => progress.flagged.includes(question.card.id));
          return <li key={first}><button type="button" data-page={index} className={'test-nav-button' + (done === questions.length ? ' is-answered' : '') + (hasFlag ? ' is-flagged' : '')} aria-current={index === page ? 'page' : undefined} aria-label={`${first === last ? `Question ${first}` : `Questions ${first} to ${last}`}, ${done} of ${questions.length} answered${hasFlag ? ', flagged' : ''}`} onClick={() => goTo(index * QUESTIONS_PER_PAGE)}><span>{first === last ? first : `${first}–${last}`}</span><small>{done}/{questions.length}</small></button></li>;
        })}</ol>}
      </nav>
    </div>}
    {showExamResult && <dialog ref={resultsDialog} className="test-results-dialog" aria-labelledby="test-results-title" onCancel={event => { event.preventDefault(); reviewExam(); }}><h2 id="test-results-title">Test results</h2><p className="test-result-total">{attempt.result?.correct ?? 0}/{attempt.questions.length} ({percent(attempt)}%)</p><p>{attempt.result?.correct ?? 0} correct · {attempt.result?.wrong ?? 0} wrong · {attempt.result?.skipped ?? 0} skipped</p><p>Your responses are saved. Review the exam to see answers, explanations, and references.</p><button className="button primary" autoFocus onClick={reviewExam}>Review exam</button></dialog>}
  </section>;
}

/** Moves only the navigator's own scroll area, so the page stays on the question. */
function centerCurrentButton() {
  const button = document.querySelector('.test-nav-button[aria-current]');
  const navigator = button?.closest('.test-navigator');
  if (!button || !navigator) return;
  const target = button.getBoundingClientRect();
  const column = navigator.getBoundingClientRect();
  navigator.scrollTop += target.top - column.top - (column.height - target.height) / 2;
}
/** A test in progress shows this many questions per page. Change it here to resize every page. */
const QUESTIONS_PER_PAGE = 5;
interface AttemptProgress { position: number; flagged: string[]; }
const progressKey = (attemptId: string) => 'tsukiakari.test-progress.' + attemptId;
/** Position and flags are a per-browser convenience, so they stay out of the saved attempt. */
function loadProgress(attempt: TestAttempt): AttemptProgress {
  const ids = attempt.questions.map(question => question.card.id);
  const firstOpen = attempt.responses.find(response => !response.selectedOptionIds.length);
  const fresh: AttemptProgress = { position: firstOpen ? Math.max(0, ids.indexOf(firstOpen.cardId)) : 0, flagged: [] };
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(progressKey(attempt.id)) ?? 'null');
    if (typeof saved !== 'object' || saved === null) return fresh;
    const { position, flagged } = saved as Partial<AttemptProgress>;
    return {
      position: typeof position === 'number' && Number.isInteger(position) && position >= 0 && position < ids.length ? position : fresh.position,
      flagged: Array.isArray(flagged) ? flagged.filter(id => ids.includes(id)) : [],
    };
  } catch { return fresh; }
}
function saveProgress(attemptId: string, progress: AttemptProgress | null) {
  try {
    if (progress) window.localStorage.setItem(progressKey(attemptId), JSON.stringify(progress));
    else window.localStorage.removeItem(progressKey(attemptId));
  } catch { /* Losing the position or flags never affects saved answers. */ }
}

function sameSelection(left: string[], right: string[]) {
  return left.length === right.length && left.every(id => right.includes(id));
}

function Question({ question, number, total, selectedOptionIds, revealed, disabled, saving, practice, completed, onAnswer, onReveal, revealDisabled, children, preview = false }: {
  question: TestQuestionSnapshot; number: number; total?: number; selectedOptionIds: string[]; revealed: boolean; disabled: boolean; saving: boolean; practice: boolean; completed: boolean;
  onAnswer: (optionIds: string[]) => void; onReveal: () => void; revealDisabled: boolean; children: ReactNode; preview?: boolean;
}) {
  const card = question.card;
  const multiple = card.kind === 'multiple';
  const correct = sameSelection(selectedOptionIds, card.correctOptionIds);
  const selectionLimit = card.correctOptionIds.length;
  const selectionHintId = 'test-selection-hint-' + card.id;
  return <div className="panel test-question" data-index={number - 1}><h2 id={"test-question-title-" + card.id} tabIndex={-1} className="test-question-title"><span className="test-question-number">Question {number}{total ? ` of ${total}` : ''}</span>{card.prompt}</h2>
    <p id={selectionHintId} className="test-selection-hint">{multiple ? `Choose ${selectionLimit} answers.` : 'Choose one answer.'}{multiple && !revealed && <span aria-live="polite"> {selectedOptionIds.length} of {selectionLimit} selected.</span>}</p>
    <fieldset className="test-options" aria-labelledby={"test-question-title-" + card.id} aria-describedby={selectionHintId}>{card.options.map((option, index) => {
      const checked = selectedOptionIds.includes(option.id);
      const correctOption = card.correctOptionIds.includes(option.id);
      const limitReached = multiple && !checked && selectedOptionIds.length >= selectionLimit;
      return <label key={option.id} className={'test-option' + (checked ? ' is-selected' : '') + (revealed && correctOption ? ' is-correct' : '')}>
        <input type={multiple ? 'checkbox' : 'radio'} name={'test-question-' + card.id} value={option.id} checked={checked} disabled={disabled || limitReached} aria-disabled={disabled || limitReached || saving} onClick={event => { if (saving) event.preventDefault(); }} onChange={() => {
          if (saving || limitReached) return;
          onAnswer(multiple ? (checked ? selectedOptionIds.filter(id => id !== option.id) : [...selectedOptionIds, option.id]) : [option.id]);
        }}/><span><strong>{String.fromCharCode(65 + index)}.</strong> {option.text}{revealed && correctOption && <span className="test-option-result">Correct answer</span>}{revealed && checked && !correctOption && <span className="test-option-result">Your answer · Incorrect</span>}</span>
      </label>;
    })}</fieldset>
    {!revealed && practice && <div className="test-question-actions"><button className="button secondary" disabled={revealDisabled} aria-disabled={revealDisabled || saving} onClick={() => { if (!saving) onReveal(); }}>Reveal answer</button></div>}
    {children}
    {revealed && <div id={'test-answer-' + card.id} tabIndex={-1} className="test-answer"><p className="test-answer-status">{preview ? 'Answer preview' : selectedOptionIds.length ? (correct ? 'Correct' : 'Incorrect') : 'Skipped'}{!completed ? ' · Response locked after reveal' : ''}</p><h3>Answer</h3><p>{card.answer}</p><p>{card.explanation}</p>{multiple && <p className="fine-print">All correct options are required for one point. Partial selections receive no points.</p>}
      {card.options.some(option => card.optionExplanations[option.id]) && <><h3>Why these choices?</h3><dl className="test-option-explanations">{card.options.map((option, index) => card.optionExplanations[option.id] ? <div key={option.id}><dt>{String.fromCharCode(65 + index)}. {option.text}</dt><dd>{card.optionExplanations[option.id]}</dd></div> : null)}</dl></>}
      <QuestionLearningResources question={question}/>
      <h3>References</h3><ul>{question.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul>
    </div>}
  </div>;
}
