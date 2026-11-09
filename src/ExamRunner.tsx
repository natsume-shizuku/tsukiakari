import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExamQuestion, QuestionGroup, TestAttempt, TestSection } from './domain';
import type { useWorkspace } from './useWorkspace';
import { CaseStudyPane } from './CaseStudyPane';
import PlacedAnswer from './PlacedAnswer';
import { QuestionAnswer } from './QuestionAnswer';
import { SelectionOptions } from './SelectionOptions';
import { QUESTIONS_PER_PAGE } from './testEngine';
import { isAnswered, isComplete, isSelection, requiredSelections, type Answer } from './testGrading';
import { closeSeriesQuestion, closeTestSection, finishTestAttempt, revealTestAnswer, savePlacedAnswer, saveTestAnswer, saveTestFlag, saveTestPosition } from './testStorage';
import { timeText, useNow } from './useNow';

type Desk = ReturnType<typeof useWorkspace>;
type Write = () => Promise<unknown>;
interface Page { start: number; end: number; section: TestSection; sectionStart: number; sectionEnd: number; }

/** Pages stay inside a section so a lock never splits one. A series is one question at a time because it only moves forward. */
function buildPages(attempt: TestAttempt): Page[] {
  const pages: Page[] = [];
  let sectionStart = 0;
  for (const section of attempt.delivery!.sections) {
    const sectionEnd = sectionStart + section.cardIds.length;
    const size = section.kind === 'series' ? 1 : QUESTIONS_PER_PAGE;
    for (let start = sectionStart; start < sectionEnd; start += size) pages.push({ start, end: Math.min(start + size, sectionEnd), section, sectionStart, sectionEnd });
    sectionStart = sectionEnd;
  }
  return pages;
}
function instruction(card: ExamQuestion): string {
  if (card.kind === 'match') return `Drag an item from ${card.tray} onto each row, or select an item and then a row. An item can be used once, more than once, or not at all. Each correct row is worth one point.`;
  if (card.kind === 'order') return `Drag ${requiredSelections(card)} items into the answer area in the correct order, or select an item and then a position. Not every item is needed.`;
  if (card.kind === 'hotspot') return 'Choose one answer in each row. Each correct row is worth one point.';
  if (card.kind === 'multiple') return `Choose ${requiredSelections(card)} answers. Each correct answer is worth one point.`;
  return 'Choose one answer.';
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

export default function ExamRunner({ desk, attempt, onDirtyChange, onSetup, onAbandon }: { desk: Desk; attempt: TestAttempt; onDirtyChange?: (dirty: boolean) => void; onSetup: () => void; onAbandon: () => void }) {
  const delivery = attempt.delivery!;
  const total = attempt.questions.length;
  const exam = attempt.mode === 'exam';
  const now = useNow(attempt.deadlineAt !== null);
  const expired = attempt.deadlineAt !== null && attempt.deadlineAt <= now;
  const [position, setPosition] = useState(delivery.position);
  const [localLock, setLocalLock] = useState(delivery.lockedBefore);
  const [drafts, setDrafts] = useState<Record<string, Answer>>({});
  const [flags, setFlags] = useState(delivery.flaggedCardIds);
  const [unsaved, setUnsaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const deskRef = useRef(desk);
  deskRef.current = desk;

  // Writes run one at a time and only the latest per key survives, so quick drops cannot be lost.
  const queue = useRef(new Map<string, Write>());
  const running = useRef<Promise<void> | null>(null);
  const drain = useCallback(() => {
    running.current ??= (async () => {
      while (queue.current.size) {
        const [key, write] = queue.current.entries().next().value as [string, Write];
        queue.current.delete(key);
        const answerCard = key.startsWith('answer:') ? key.slice(7) : null;
        if (!await deskRef.current.mutate(write, answerCard ? 'Test answer saved.' : '')) {
          if (!queue.current.has(key)) queue.current = new Map([[key, write], ...queue.current]);
          setUnsaved(true);
          return;
        }
        setUnsaved(false);
        if (answerCard && !queue.current.has(key)) setDrafts(previous => { const next = { ...previous }; delete next[answerCard]; return next; });
      }
    })().finally(() => { running.current = null; });
    return running.current;
  }, []);
  const enqueue = useCallback((key: string, write: Write) => {
    // A read-only tab can look around, but only the writing tab saves.
    if (deskRef.current.access !== 'writer') return;
    queue.current.delete(key);
    queue.current.set(key, write);
    void drain();
  }, [drain]);

  const pending = Object.keys(drafts).length > 0 || unsaved;
  useEffect(() => { onDirtyChange?.(pending); return () => onDirtyChange?.(false); }, [pending, onDirtyChange]);
  useEffect(() => {
    if (!pending) return;
    const prevent = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [pending]);

  const pages = buildPages(attempt);
  const pageIndex = pages.findIndex(item => position >= item.start && position < item.end);
  const page = pages[pageIndex];
  const previous = pages[pageIndex - 1], following = pages[pageIndex + 1];
  const floor = exam ? Math.max(delivery.lockedBefore, localLock) : 0;
  const oneWay = exam && page.section.kind === 'series';
  const leavesSection = exam && following !== undefined && following.section !== page.section;
  const answerOf = (cardId: string) => drafts[cardId] ?? attempt.responses.find(item => item.cardId === cardId);
  const groupOf = (card: ExamQuestion): QuestionGroup | undefined => attempt.groups?.find(group => group.id === card.groupId);
  const reachable = (index: number) => !exam || (!oneWay && index >= floor && index >= page.sectionStart && index < page.sectionEnd);
  const indexes = attempt.questions.map((_, index) => index);
  const complete = (index: number) => isComplete(attempt.questions[index].card, answerOf(attempt.questions[index].card.id));
  const done = indexes.filter(complete).length;

  const showQuestion = (index: number) => requestAnimationFrame(() => {
    document.querySelector(`.test-question[data-index="${index}"]`)?.scrollIntoView({ block: 'start' });
    document.getElementById('test-question-title-' + attempt.questions[index].card.id)?.focus({ preventScroll: true });
    centerCurrentButton();
  });
  useEffect(() => {
    if (position > 0) { showQuestion(position); return; }
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    // Only on arrival: later moves bring their own question into view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (index: number) => {
    setPosition(index);
    if (index !== position) enqueue('position', () => saveTestPosition(attempt.id, index));
    showQuestion(index);
  };
  const unansweredOpen = indexes.filter(index => reachable(index) && !complete(index));
  const flaggedOpen = indexes.filter(index => reachable(index) && flags.includes(attempt.questions[index].card.id));
  const jumpWithin = (candidates: number[]) => goTo(candidates.find(index => index > position) ?? candidates[0]);
  const saveSelection = (cardId: string, optionIds: string[]) => {
    setDrafts(saved => ({ ...saved, [cardId]: { selectedOptionIds: optionIds } }));
    enqueue('answer:' + cardId, () => saveTestAnswer(attempt.id, cardId, optionIds));
  };
  const savePlacements = (cardId: string, placements: Record<string, string>) => {
    setDrafts(saved => ({ ...saved, [cardId]: { selectedOptionIds: [], placements } }));
    enqueue('answer:' + cardId, () => savePlacedAnswer(attempt.id, cardId, placements));
  };
  const toggleFlag = (cardId: string) => {
    const flagged = flags.includes(cardId);
    setFlags(saved => flagged ? saved.filter(id => id !== cardId) : [...saved, cardId]);
    enqueue('flag:' + cardId, () => saveTestFlag(attempt.id, cardId, !flagged));
  };
  const next = () => {
    if (!following) return;
    if (oneWay) {
      setLocalLock(position + 1);
      enqueue('close:' + position, () => closeSeriesQuestion(attempt.id));
    } else if (leavesSection) {
      const left = indexes.filter(index => index >= page.sectionStart && index < page.sectionEnd && !complete(index)).length;
      if (!window.confirm(`Leave this section? You will not be able to return to it.${left ? ` ${left} ${left === 1 ? 'question is' : 'questions are'} not fully answered.` : ''}`)) return;
      setLocalLock(page.sectionEnd);
      enqueue('close:' + page.sectionEnd, () => closeTestSection(attempt.id));
    } else { goTo(following.start); return; }
    setPosition(following.start);
    showQuestion(following.start);
  };
  const finish = async () => {
    await drain();
    if (queue.current.size) return;
    const skipped = attempt.questions.filter(item => !isAnswered(answerOf(item.card.id))).length;
    const summary = [skipped ? `${skipped} unanswered ${skipped === 1 ? 'question' : 'questions'} will count as skipped.` : '', flags.length ? `${flags.length} flagged for review.` : ''].filter(Boolean).join(' ');
    if (!expired && !window.confirm(`Finish this test and show all answers? ${summary} Responses will be locked.`.replace(/ +/g, ' '))) return;
    await desk.mutate(() => finishTestAttempt(attempt.id), 'Test completed. Results are saved in this browser.');
  };
  const reveal = async (cardId: string) => {
    await drain();
    if (queue.current.size) return;
    const shown = await desk.mutate(() => revealTestAnswer(attempt.id, cardId), 'Answer revealed. This response is now locked.');
    if (shown) requestAnimationFrame(() => document.getElementById('test-answer-' + cardId)?.focus({ preventScroll: true }));
  };
  const leave = () => { if (!pending || window.confirm('Discard unsaved test answer changes? Saved answers will remain available.')) onSetup(); };

  const shown = attempt.questions.slice(page.start, page.end);
  const cases = [...new Set(shown.map(item => groupOf(item.card)))].filter((group): group is QuestionGroup => group?.kind === 'case-study');
  const renderQuestion = (question: TestAttempt['questions'][number], index: number) => {
    const { card } = question;
    const answer = answerOf(card.id);
    const revealed = Boolean(attempt.responses.find(item => item.cardId === card.id)?.revealed);
    const canAnswer = desk.access === 'writer' && !expired && !revealed && index >= floor;
    const flagged = flags.includes(card.id);
    const group = groupOf(card);
    const hintId = 'test-selection-hint-' + card.id;
    return <div key={card.id} data-index={index} className="panel test-question exam-question">
      <h2 tabIndex={-1} id={'test-question-title-' + card.id} className="test-question-title"><span className="test-question-number">Question {index + 1} of {total}</span>
        {group?.kind === 'series' && <span className="exam-scenario">{group.exhibits.map(exhibit => exhibit.body).join('\n\n')}</span>}
        {card.prompt}</h2>
      {group?.kind === 'series' && <p className="exam-series-note">{exam ? 'This question is part of a series. Each proposes a different solution to the same scenario. After you move on, you cannot return to it.' : 'This question is part of a series. Each proposes a different solution to the same scenario.'}</p>}
      <p id={hintId} className="test-selection-hint">{instruction(card)}{card.kind === 'multiple' && !revealed && <span aria-live="polite"> {answer?.selectedOptionIds.length ?? 0} of {requiredSelections(card)} selected.</span>}</p>
      {isSelection(card)
        ? <SelectionOptions card={card} selectedOptionIds={answer?.selectedOptionIds ?? []} revealed={revealed} disabled={!canAnswer} saving={false} hintId={hintId} onAnswer={optionIds => saveSelection(card.id, optionIds)}/>
        : <PlacedAnswer key={card.id} card={card} placements={answer?.placements ?? {}} disabled={!canAnswer} revealed={revealed} onChange={placements => savePlacements(card.id, placements)}/>}
      <div className="test-question-actions">
        {!exam && !revealed && <button className="button secondary" disabled={!canAnswer} onClick={() => { void reveal(card.id); }}>Reveal answer</button>}
        {!oneWay && !revealed && <button className="button secondary" aria-pressed={flagged} onClick={() => toggleFlag(card.id)}>{flagged ? 'Remove flag' : 'Flag for review'}</button>}
      </div>
      {revealed && <QuestionAnswer question={question} answer={answer} scoring={attempt.scoring} completed={false}/>}
    </div>;
  };

  return <section className="tests-page test-attempt exam-runner">
    <header className="test-attempt-heading"><div><p className="eyebrow">{attempt.fixture ? 'Engineering preview · ' : ''}{exam ? 'Exam Mode' : 'Practice Mode'}</p><h1 ref={heading} tabIndex={-1}>{attempt.bankTitle ?? attempt.bankId}</h1></div><div className="test-actions"><button className="button secondary" onClick={leave}>Back to Tests</button><button className="button secondary" disabled={!desk.canWrite || expired} onClick={onAbandon}>Abandon test</button></div></header>
    {attempt.fixture && <p className="test-fixture-notice">Sample questions for trying the test tools. These results are marked as engineering preview data.</p>}
    <div className="test-session-bar"><span role="status" aria-live="polite">{done} of {total} answered</span>{attempt.deadlineAt !== null && <strong className={expired ? 'test-time-ended' : ''} aria-label="Time remaining">{expired ? 'Time ended' : timeText(attempt.deadlineAt - now)}</strong>}<span className="fine-print">Selections save automatically</span><button className="button primary" disabled={desk.access !== 'writer' || expired} onClick={() => { void finish(); }}>Finish test</button></div>
    {expired && <div className="notice error" role="alert"><p>Time has ended. Responses are locked. Only answers saved before the deadline count.</p><button className="button secondary" disabled={!desk.canWrite} onClick={() => { void finish(); }}>Retry finalization</button></div>}
    {unsaved && <div className="notice error" role="alert"><p>A change has not been saved yet.</p><button className="button secondary" onClick={() => { setUnsaved(false); void drain(); }}>Retry saving</button></div>}
    <div className="test-focus">
      <div className="test-focus-main">
        {page.section.kind !== 'general' && <p className="exam-section-label">{page.section.title}</p>}
        <div className={'exam-stage' + (cases.length ? ' has-case' : '')}>
          {cases.length > 0 && <div className="exam-cases">{cases.map(group => <CaseStudyPane key={group.id} group={group}/>)}</div>}
          <div className="test-questions">{shown.map((question, offset) => renderQuestion(question, page.start + offset))}</div>
        </div>
        {pages.length > 1 && <div className="test-move">
          <button className="button secondary" disabled={!previous || oneWay || (exam && (previous.section !== page.section || previous.start < floor))} onClick={() => goTo(previous.start)}>Previous page</button>
          <button className="button secondary" disabled={!following || expired} onClick={next}>{oneWay ? 'Next question' : leavesSection ? 'Next section' : 'Next page'}</button>
        </div>}
      </div>
      <nav className="test-navigator" aria-label="Test questions">
        <p className="fine-print test-nav-legend">{done} answered · {flags.length} flagged</p>
        {unansweredOpen.length > 0 && <button className="button secondary test-nav-next" onClick={() => jumpWithin(unansweredOpen)}>Next unanswered</button>}
        {flaggedOpen.length > 0 && <button className="button secondary test-nav-next" onClick={() => jumpWithin(flaggedOpen)}>Next flagged</button>}
        {pages.length > 1 && <ol className="test-nav-grid">{pages.map((item, index) => {
          const questions = attempt.questions.slice(item.start, item.end);
          const first = item.start + 1, last = item.end;
          const answered = questions.filter(question => isComplete(question.card, answerOf(question.card.id))).length;
          const hasFlag = questions.some(question => flags.includes(question.card.id));
          const target = indexes.slice(item.start, item.end).find(reachable);
          const lock = !exam || target !== undefined || index === pageIndex ? '' : item.end <= page.start ? ', closed' : ', opens later';
          return <li key={first}><button type="button" data-page={index} disabled={target === undefined} className={'test-nav-button' + (answered === questions.length ? ' is-answered' : '') + (hasFlag ? ' is-flagged' : '')} aria-current={index === pageIndex ? 'page' : undefined} aria-label={`${first === last ? `Question ${first}` : `Questions ${first} to ${last}`}, ${answered} of ${questions.length} answered${hasFlag ? ', flagged' : ''}${lock}`} onClick={() => { if (target !== undefined) goTo(target); }}><span>{first === last ? first : `${first}–${last}`}</span><small>{answered}/{questions.length}</small></button></li>;
        })}</ol>}
      </nav>
    </div>
  </section>;
}
