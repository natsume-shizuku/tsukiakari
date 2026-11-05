import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { PublishedCard, Source, StudyPack } from './domain';
import type { useWorkspace } from './useWorkspace';
import { findPublishedCard, cardCurations } from './content/catalog';
import { removeCardsFromDeck } from './collectionStorage';
import { setCopySuspended } from './reviewStorage';
import { CopyAnnotations } from './CopyAnnotations';
import './card-inspector.css';

export type CardDetailRef = { packId: string; cardId: string; copyId?: string };
type InspectorTab = 'answer' | 'notes' | 'history';
const tabs: { id: InspectorTab; label: string }[] = [{ id: 'answer', label: 'Answer' }, { id: 'notes', label: 'My notes' }, { id: 'history', label: 'History' }];
const formatDate = (at: number | null) => at === null ? 'Not scheduled' : new Date(at).toLocaleString('en');
function Sources({ sources }: { sources: Source[] }) {
  return <ul className="source-links">{sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul>;
}
export function CardDetails({ desk, detail, onDirtyChange, fixedCopy = false, onClose, closeLabel = 'Close details' }: {
  desk: ReturnType<typeof useWorkspace>;
  detail: CardDetailRef;
  onDirtyChange?: (dirty: boolean) => void;
  fixedCopy?: boolean;
  onClose?: () => void;
  closeLabel?: string;
}) {
  const workspace = desk.workspace!;
  const published = findPublishedCard(detail);
  const id = useId();
  const [tab, setTab] = useState<InspectorTab>('answer');
  const [selectedCopyId, setSelectedCopyId] = useState(detail.copyId);
  const [feedback, setFeedback] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionArea = useRef<HTMLDivElement>(null);
  const actionButton = useRef<HTMLButtonElement>(null);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const dirty = useRef(false);
  const [hasDraft, setHasDraft] = useState(false);
  const onDirty = useCallback((value: boolean) => { dirty.current = value; setHasDraft(value); onDirtyChange?.(value); }, [onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => { setSelectedCopyId(detail.copyId); setFeedback(''); setTab('answer'); setActionsOpen(false); }, [detail.copyId, detail.packId, detail.cardId]);
  useEffect(() => {
    if (!actionsOpen) return;
    const outside = (event: PointerEvent) => { if (!actionArea.current?.contains(event.target as Node)) setActionsOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [actionsOpen]);
  const copies = workspace.copies.filter(copy => !copy.removed && workspace.decks.some(deck => deck.id === copy.deckId && !deck.archived) && copy.packId === detail.packId && copy.cardId === detail.cardId && (!fixedCopy || copy.id === detail.copyId));
  const copy = selectedCopyId ? copies.find(copy => copy.id === selectedCopyId) : copies[0];
  const deckName = workspace.decks.find(deck => deck.id === copy?.deckId)?.name ?? 'Your deck';
  const state = workspace.schedulerStates.find(state => state.copyId === copy?.id);
  const history = workspace.reviewLogs.filter(event => event.copyId === copy?.id).sort((a, b) => b.sequence - a.sequence);
  const canLeave = () => !dirty.current || window.confirm('Discard unsaved personal notes and tags?');
  const closeActions = () => { setActionsOpen(false); actionButton.current?.focus(); };
  const removeCopy = async () => {
    if (!copy || !desk.canWrite || !canLeave()) return;
    if (!window.confirm('Remove this card from “' + deckName + '”? Progress, notes, tags, and history are kept for re-adding. If this is the current review card, its session will close. Other decks are unchanged.')) return;
    setFeedback('');
    const message = 'Removed card from “' + deckName + '”. Progress, notes, and tags are retained for re-adding.';
    if (await desk.mutate(() => removeCardsFromDeck(copy.deckId, [copy.id]), message)) {
      onDirty(false); setSelectedCopyId(copy.id); setFeedback(message); setActionsOpen(false); setTab('answer');
      window.requestAnimationFrame(() => tabButtons.current[0]?.focus());
    }
  };
  const suspend = async () => {
    if (!copy || !desk.canWrite || dirty.current) return;
    setFeedback('');
    const message = copy.suspended ? 'Card resumed.' : 'Card suspended.';
    if (await desk.mutate(() => setCopySuspended(copy.id, !copy.suspended), message)) { setFeedback(message); closeActions(); }
  };
  const unavailable = selectedCopyId
    ? 'This deck copy is no longer active. Its personal notes and history are retained. Re-add the card to this deck to use them again.'
    : 'Add this card to a deck to save personal notes and tags and begin scheduled study.';
  return <div className="card-details-content card-inspector">
    <header className="card-inspector-header">
      <div className="card-inspector-copy">
        {copy ? fixedCopy ? <div><span className="fine-print">Deck</span><strong>{deckName}</strong></div> : <div><label htmlFor={id + '-copy'}>Deck copy</label><select id={id + '-copy'} value={copy.id} disabled={desk.busy} onChange={event => { if (canLeave()) { onDirty(false); setFeedback(''); setSelectedCopyId(event.target.value); setActionsOpen(false); } }}>{copies.map(item => <option key={item.id} value={item.id}>{workspace.decks.find(deck => deck.id === item.deckId)?.name}</option>)}</select></div> : <strong>{selectedCopyId ? 'Inactive deck copy' : 'Published card'}</strong>}
        {copy && <span className={'card-badge badge-' + (copy.suspended ? 'suspended' : state?.state ?? 'new')}>{copy.suspended ? 'Suspended' : state?.state ?? 'new'}</span>}
        {copy?.tags.includes('leech') && <span className="card-badge badge-leech">Leech</span>}
      </div>
      <div className="card-inspector-header-actions">
        {copy && <div className="card-inspector-action-area" ref={actionArea} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActionsOpen(false); }} onKeyDown={event => { if (event.key === 'Escape' && actionsOpen) { event.preventDefault(); event.stopPropagation(); closeActions(); } }}>
          <button ref={actionButton} className="button secondary" aria-expanded={actionsOpen} aria-controls={id + '-actions'} onClick={() => setActionsOpen(value => !value)}>Card actions <span aria-hidden="true">⌄</span></button>
          {actionsOpen && <div id={id + '-actions'} className="card-inspector-action-menu" role="group" aria-label="Selected card actions">
            <button className="button secondary" disabled={!desk.canWrite || hasDraft} onClick={() => void suspend()}>{copy.suspended ? 'Resume card' : 'Suspend card'}</button>
            <button className="button secondary" disabled={!desk.canWrite} onClick={() => void removeCopy()}>Remove from this deck</button>
            {hasDraft && <p className="fine-print">Save or discard your note edits before suspending or resuming.</p>}
            <p className="fine-print">Removing preserves this deck’s progress and notes for re-adding.</p>
          </div>}
        </div>}
        {onClose && <button className="button secondary" onClick={onClose}>{closeLabel}</button>}
      </div>
    </header>
    <div className="card-inspector-tabs" role="tablist" aria-label="Card detail sections">
      {tabs.map((item, index) => <button key={item.id} ref={element => { tabButtons.current[index] = element; }} id={id + '-tab-' + item.id} role="tab" aria-label={item.label} aria-selected={tab === item.id} aria-controls={id + '-panel-' + item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault(); setTab(tabs[next].id); tabButtons.current[next]?.focus();
      }}>{item.label}{item.id === 'notes' && hasDraft && <span className="card-inspector-draft" aria-label="Unsaved changes">•</span>}</button>)}
    </div>
    {desk.error && <div className="notice error card-inspector-notice" role="alert">{desk.error}</div>}
    {feedback && <div className="card-inspector-notice" role="status" aria-live="polite">{feedback}</div>}
    <section className="card-inspector-panel" role="tabpanel" id={id + '-panel-answer'} aria-labelledby={id + '-tab-answer'} hidden={tab !== 'answer'} tabIndex={0}>
      {published ? <PublishedDetails pack={published.pack} card={published.card}/> : <div className="notice"><h3>Published card unavailable</h3><p>Your saved notes, schedule, and review history are retained.</p></div>}
    </section>
    <section className="card-inspector-panel" role="tabpanel" id={id + '-panel-notes'} aria-labelledby={id + '-tab-notes'} hidden={tab !== 'notes'} tabIndex={0}>
      {copy ? <CopyAnnotations key={copy.id} desk={desk} copy={copy} onDirtyChange={onDirty}/> : <div className="notice"><h3>Personal notes unavailable</h3><p>{unavailable}</p></div>}
    </section>
    <section className="card-inspector-panel" role="tabpanel" id={id + '-panel-history'} aria-labelledby={id + '-tab-history'} hidden={tab !== 'history'} tabIndex={0}>
      {copy ? <><h3>Schedule</h3><dl className="library-state"><div><dt>Status</dt><dd>{copy.suspended ? 'Suspended · ' : ''}{state?.state ?? 'new'}</dd></div><div><dt>Due</dt><dd>{formatDate(state?.dueAt ?? null)}</dd></div><div><dt>Reviews</dt><dd>{state?.repetitions ?? 0}</dd></div><div><dt>Review lapses</dt><dd>{state?.lapses ?? 0}</dd></div><div><dt>Last review</dt><dd>{formatDate(state?.lastReviewAt ?? null)}</dd></div><div><dt>Learned revision</dt><dd>{copy.contentRevision}</dd></div></dl>
        <h3>Review history</h3><p className="fine-print">Newest first. Undone reviews remain visible and are excluded from statistics.</p>
        {history.length ? <div role="region" aria-label="Review history list"><ol className="library-history">{history.map(event => <li key={event.id}><div><strong>{event.rating === 'again' ? 'Again' : 'Right'}{event.undone ? ' · Undone' : ''}</strong><time dateTime={new Date(event.at).toISOString()}>{formatDate(event.at)}</time></div><p>{event.before.state} → {event.after.state} · Next due {formatDate(event.after.dueAt)}</p><p className="fine-print">Revision {event.contentRevision} · {(event.durationMs / 1000).toFixed(1)} seconds · Study day {event.studyDay}</p></li>)}</ol></div> : <p className="muted">No saved reviews for this deck’s copy.</p>}
      </> : <div className="notice"><h3>History unavailable</h3><p>{unavailable}</p></div>}
    </section>
  </div>;
}
function PublishedDetails({ pack, card }: { pack: StudyPack; card: PublishedCard }) {
  return <section className="library-published">
    <div className="card-inspector-metadata"><span>{cardCurations({ packId: pack.id, cardId: card.id }).map(curation => curation.title).join(' · ') || pack.title} · {pack.topics.find(topic => topic.id === card.topicId)?.title} · Revision {card.revision}</span>{pack.fixture && <span className="fixture-badge">Engineering fixture</span>}</div>
    <h3 className="library-detail-question">{card.prompt}</h3>
    {card.options && <ol className="options-preview" type="A">{card.options.map(option => <li key={option.id} className={option.id === card.correctOptionId ? 'card-inspector-correct' : undefined}>{option.text}{option.id === card.correctOptionId && <strong> — Correct</strong>}</li>)}</ol>}
    <div className="card-inspector-answer"><p className="eyebrow">Answer</p><p className="library-prose">{card.answer}</p></div>
    {card.explanation && <p className="library-prose">{card.explanation}</p>}
    <div className="card-inspector-sources"><h3>Sources</h3><Sources sources={pack.sources.filter(source => card.sourceIds.includes(source.id))}/></div>
    {card.noteIds.length > 0 && <div className="card-inspector-references"><h3>Reference notes</h3>{pack.notes.filter(note => card.noteIds.includes(note.id)).map(note => <details key={note.id}><summary>{note.title}</summary><div><p className="library-prose">{note.body}</p><Sources sources={pack.sources.filter(source => note.sourceIds.includes(source.id))}/></div></details>)}</div>}
    {card.tags.length > 0 && <div className="card-badges" aria-label="Published tags">{card.tags.map(tag => <span key={tag} className="card-badge badge-tag">#{tag}</span>)}</div>}
  </section>;
}
