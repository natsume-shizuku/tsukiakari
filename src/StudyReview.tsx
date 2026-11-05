import { useCallback, useEffect, useRef, useState } from 'react';
import { timeZoneLabel, type WorkspaceSnapshot, type ReviewSession } from './domain';
import { findPublishedCard } from './content/catalog';
import { getDeckQueue, initialState, scheduleReview } from './scheduling';
import { skipUnavailableReview, refreshReview, revealReview, setCopySuspended, submitReview, undoLastReview } from './reviewStorage';
import type { useWorkspace } from './useWorkspace';
import { createActiveTimer } from './activeTime';
import { CopyAnnotations } from './CopyAnnotations';

type Desk = ReturnType<typeof useWorkspace>;

export function useStudyClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 15_000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('focus', update); };
  }, []);
  return Math.max(now, Date.now());
}

function useActiveDuration(turnId: string) {
  const read = useRef<() => number>(() => 0);
  useEffect(() => {
    let saved = 0;
    try {
      const record = JSON.parse(sessionStorage.getItem('tsukiakari-active-time') ?? 'null');
      if (record?.turnId === turnId && Number.isSafeInteger(record.durationMs) && record.durationMs >= 0 && record.durationMs <= 86_400_000) saved = record.durationMs;
    } catch { /* Timing is best effort; the database still owns review records. */ }
    const timer = createActiveTimer(performance.now(), saved, document.visibilityState === 'visible' && document.hasFocus());
    const persist = () => {
      const durationMs = timer.read(performance.now());
      try { sessionStorage.setItem('tsukiakari-active-time', JSON.stringify({ turnId, durationMs })); } catch { /* Reviews can still be saved when session storage is unavailable. */ }
      return durationMs;
    };
    const interact = () => { timer.interact(performance.now()); persist(); };
    const visibility = () => {
      timer.setActive(performance.now(), document.visibilityState === 'visible' && document.hasFocus());
      persist();
    };
    read.current = persist;
    window.addEventListener('pointerdown', interact);
    window.addEventListener('keydown', interact);
    window.addEventListener('focus', visibility);
    window.addEventListener('blur', visibility);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      persist();
      window.removeEventListener('pointerdown', interact); window.removeEventListener('keydown', interact);
      window.removeEventListener('focus', visibility); window.removeEventListener('blur', visibility);
      window.removeEventListener('pagehide', persist); document.removeEventListener('visibilitychange', visibility);
    };
  }, [turnId]);
  return () => read.current();
}

export function dueLabel(dueAt: number | null, now: number) {
  if (dueAt === null) return 'New';
  const minutes = Math.max(1, Math.round((dueAt - now) / 60_000));
  if (minutes < 60) return minutes + ' min';
  if (minutes < 1440) return Math.round(minutes / 60) + ' hr';
  return Math.round(minutes / 1440) + ' day' + (Math.round(minutes / 1440) === 1 ? '' : 's');
}

export function StudyReview({ desk, now, paused, onPause, onResume, onDirtyChange }: {
  desk: Desk; now: number; paused: boolean; onPause: () => void; onResume: () => void; onDirtyChange?: (dirty: boolean) => void;
}) {
  const { workspace, canWrite, mutate } = desk;
  if (!workspace?.session) return null;
  const session = workspace.session;
  const deck = workspace.decks.find(item => item.id === session.deckId);
  if (!deck) return null;
  const undoable = workspace.reviewLogs.some(log => log.undoable && !log.undone);
  const undo = () => mutate(() => undoLastReview(), 'Last review undone. Its schedule and daily allowance have been restored.');
  if (paused) return <section className="panel review-paused" aria-label="Paused review"><div><p className="eyebrow">Saved session</p><h2>{deck.name}</h2><p className="muted">Your place and revealed answer are saved in this browser.</p></div><button className="button" onClick={onResume}>Resume review</button></section>;
  if (!session.copyId) {
    const queue = getDeckQueue(workspace, deck.id, now);
    return <section className="panel review-waiting" aria-label="Review session">
      <p className="eyebrow">{deck.name}</p><h2>{queue.orderedIds.length ? 'Cards are ready to review' : 'Nothing due right now'}</h2>
      <p className="muted">{queue.nextDueAt ? 'Next scheduled card: ' + new Intl.DateTimeFormat(undefined, { timeZone: workspace.preferences.timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(queue.nextDueAt) + '.' : 'New cards and reviews will become available as their daily allowances and schedules permit.'}</p>
      <p className="fine-print">Learning steps can return during this session. Daily allowances reset at {workspace.preferences.dayStartsAtHour} a.m. in {timeZoneLabel(workspace.preferences.timeZone)}.</p>
      <div className="review-tools"><button className="button" disabled={!canWrite} onClick={() => void mutate(() => refreshReview(session.turnId), 'Due cards checked.')}>Check due cards</button><button className="button secondary" disabled={!canWrite || !undoable} onClick={() => void undo()}>Undo last review</button><button className="button secondary" onClick={onPause}>Pause review</button></div>
    </section>;
  }
  return <ReviewCard key={session.turnId} desk={desk} workspace={workspace} session={session} now={now} undoable={undoable} undo={undo} onPause={onPause} onDirtyChange={onDirtyChange}/>;
}

function ReviewCard({ desk, workspace, session, now, undoable, undo, onPause, onDirtyChange }: {
  desk: Desk; workspace: WorkspaceSnapshot; session: ReviewSession; now: number;
  undoable: boolean; undo: () => Promise<boolean>; onPause: () => void; onDirtyChange?: (dirty: boolean) => void;
}) {
  const [notesDirty, setNotesDirty] = useState(false);
  const annotationDirty = useCallback((value: boolean) => { setNotesDirty(value); onDirtyChange?.(value); }, [onDirtyChange]);
  const [selected, setSelected] = useState(session.selectedOptionId);
  const [guessed, setGuessed] = useState(session.guessed);
  const panel = useRef<HTMLElement>(null);
  const duration = useActiveDuration(session.turnId);
  const { canWrite, mutate } = desk;
  const copy = workspace.copies.find(item => item.id === session.copyId);
  const published = copy && findPublishedCard(copy);
  const deck = workspace.decks.find(item => item.id === session.deckId);
  useEffect(() => {
    panel.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    panel.current?.focus({ preventScroll: true });
  }, [session.turnId]);
  useEffect(() => { panel.current?.focus({ preventScroll: true }); }, [session.revealed]);
  if (!copy || !published || !deck) return <section className="notice error"><p>This card's published content is unavailable. Your progress is preserved.</p>{copy && deck && <button className="button secondary" disabled={!canWrite} onClick={() => void mutate(() => skipUnavailableReview(session.turnId), 'Unavailable card skipped. Its saved data is preserved.')}>Continue with available cards</button>}</section>;
  const { card, pack } = published;
  const chosen = session.revealed ? session.selectedOptionId : selected;
  const wasGuessed = session.revealed ? session.guessed : guessed;
  const wrong = card.kind === 'mcq' && chosen !== card.correctOptionId;
  const before = workspace.schedulerStates.find(item => item.copyId === copy.id) ?? initialState(copy.id);
  const queue = getDeckQueue(workspace, deck.id, now);
  const reveal = async () => {
    if (!canWrite || session.revealed || (card.kind === 'mcq' && !selected)) return;
    await mutate(() => revealReview(session.turnId, selected, guessed), 'Answer revealed.');
  };
  const rate = async (rating: 'again' | 'right') => {
    if (!canWrite || notesDirty || !session.revealed || (wrong && rating === 'right')) return;
    await mutate(() => submitReview({ turnId: session.turnId, rating, durationMs: duration() }), rating === 'again' ? 'Again saved. Your next card is ready.' : 'Right saved. Your next card is ready.');
  };
  const preview = (rating: 'again' | 'right') => {
    try { return dueLabel(scheduleReview(before, rating, deck.settings, now, workspace.preferences).dueAt, now); }
    catch { return 'After saving'; }
  };
  const onKey = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!canWrite || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof Element && event.target.closest('input,textarea,select,button,a,[contenteditable="true"],[role="dialog"]')) return;
    const key = event.key.toLowerCase();
    if (card.kind === 'mcq' && !session.revealed) {
      const index = ['1', '2', '3', '4'].includes(key) ? Number(key) - 1 : ['a', 'b', 'c', 'd'].indexOf(key);
      if (index >= 0 && card.options?.[index]) { event.preventDefault(); setSelected(card.options[index].id); return; }
      if (key === 'g') { event.preventDefault(); setGuessed(value => !value); return; }
    }
    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      if (session.revealed) void rate(wrong ? 'again' : 'right');
      else void reveal();
    }
  };
  return <section className="review-panel panel" ref={panel} tabIndex={-1} onKeyDown={onKey} aria-label="Review session">
    <header className="review-heading"><div><p className="eyebrow">{deck.name} · {before.state}</p><span className="fixture-badge">{pack.fixture ? 'Engineering fixture' : pack.title}</span>{copy.tags.includes('leech') && <span className="leech-badge">Leech</span>}</div><button className="button secondary" onClick={onPause}>Pause review</button></header>
    <div className="review-queue" aria-label="Available cards"><span>{queue.learningIds.length} learning due</span><span>{queue.reviewIds.length} reviews due</span><span>{queue.newIds.length} new available</span></div>
    <div className="review-content">
      <p className="quiet-label">{card.kind === 'mcq' ? 'Multiple choice' : 'Recall'} · Revision {card.revision}</p>
      <h2 className="review-question">{card.prompt}</h2>
      {card.options && <div className="review-options" role="radiogroup" aria-label="Answer choices">{card.options.map((option, index) => <button key={option.id} type="button" role="radio" aria-checked={chosen === option.id} className={'review-option' + (session.revealed && option.id === card.correctOptionId ? ' correct' : '') + (session.revealed && chosen === option.id && wrong ? ' incorrect' : '')} disabled={!canWrite || session.revealed} onClick={() => { setSelected(option.id); panel.current?.focus({ preventScroll: true }); }}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option.text}{session.revealed && option.id === card.correctOptionId && <strong className="option-result">Correct answer</strong>}{session.revealed && chosen === option.id && wrong && <strong className="option-result">Your answer</strong>}</span></button>)}</div>}
      {card.kind === 'mcq' && <label className="guessed-control"><input type="checkbox" checked={wasGuessed} disabled={!canWrite || session.revealed} onChange={event => { setGuessed(event.target.checked); panel.current?.focus({ preventScroll: true }); }}/>I guessed this answer</label>}
      {session.revealed && <div className="review-answer" data-testid="revealed-answer"><p className="eyebrow">Answer</p><p className="answer">{card.answer}</p><p>{card.explanation}</p>{card.kind === 'mcq' && <p className={wrong ? 'answer-feedback incorrect-text' : 'answer-feedback'}>{wrong ? 'This answer needs another look. Choose Again to relearn it.' : wasGuessed ? 'Correct, but guessed. Choose Again if you want another look.' : 'Correct. Choose Right when you are ready.'}</p>}
        {card.noteIds.length > 0 && <div className="linked-notes"><p className="eyebrow">Reference notes</p>{pack.notes.filter(note => card.noteIds.includes(note.id)).map(note => <p key={note.id}><strong>{note.title}</strong> — {note.body}</p>)}</div>}
        {copy.personalNote && <div className="linked-notes"><p className="eyebrow">Your note</p><p className="personal-prose">{copy.personalNote}</p></div>}
        <details className="review-annotations"><summary>Personal notes and tags</summary><CopyAnnotations desk={desk} copy={copy} onDirtyChange={annotationDirty}/></details>
        <p className="eyebrow">Sources</p><ul className="source-links">{pack.sources.filter(source => card.sourceIds.includes(source.id) || pack.notes.some(note => card.noteIds.includes(note.id) && note.sourceIds.includes(source.id))).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul>
      </div>}
    </div>
    <footer className="review-actions">
      {notesDirty && <p className="fine-print" role="status">Save or discard your note changes before continuing.</p>}
      {session.revealed ? <div className="rating-actions"><button className="button secondary again-button" aria-label="Again" disabled={!canWrite || notesDirty} onClick={() => void rate('again')}>Again <span aria-hidden="true">{preview('again')}</span></button><button className="button" aria-label="Right" disabled={!canWrite || notesDirty || wrong} onClick={() => void rate('right')}>Right <span aria-hidden="true">{preview('right')}</span></button></div> : <button className="button reveal-button" disabled={!canWrite || (card.kind === 'mcq' && !selected)} onClick={() => void reveal()}>Reveal answer</button>}
      <p className="review-shortcuts">{card.kind === 'mcq' && !session.revealed ? '1–4 / A–D choose · G guessed · ' : ''}Space / Enter {session.revealed ? wrong ? 'Again' : 'Right' : 'reveal'}</p>
      <div className="review-tools"><button className="button secondary" disabled={!canWrite || notesDirty || !undoable} onClick={() => void undo()}>Undo last review</button><button className="button secondary" disabled={!canWrite || notesDirty} onClick={() => void mutate(() => setCopySuspended(copy.id, true), 'Card suspended. Resume it from Manage deck or Library when you are ready.')}>Suspend card</button></div>
    </footer>
  </section>;
}
