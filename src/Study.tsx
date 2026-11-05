import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Deck, WorkspaceSnapshot } from './domain';
import { createDeck } from './storage';
import { setDeckArchived } from './collectionStorage';
import { getDeckQueue } from './scheduling';
import type { useWorkspace } from './useWorkspace';
import './decks.css';

type Desk = ReturnType<typeof useWorkspace>;

function DeckTile({ deck, workspace, now, canWrite, onStart }: { deck: Deck; workspace: WorkspaceSnapshot; now: number; canWrite: boolean; onStart: () => void }) {
  const count = workspace.copies.filter(copy => copy.deckId === deck.id && !copy.removed).length;
  const queue = getDeckQueue(workspace, deck.id, now);
  const active = workspace.session?.deckId === deck.id;
  return <article className="deck-tile"><div className="deck-tile-top"><span className="deck-symbol" aria-hidden="true">▤</span><span className="quiet-label">Personal deck</span></div>
    <h3>{deck.name}</h3><p className="deck-card-count"><strong>{count}</strong> {count === 1 ? 'card' : 'cards'} added</p>
    <dl className="deck-queue"><div><dt>Learning due</dt><dd>{queue.learningIds.length}</dd></div><div><dt>Reviews due</dt><dd>{queue.reviewIds.length}</dd></div><div><dt>New available</dt><dd>{queue.newIds.length}</dd></div></dl>
    <div className="deck-actions"><button className="button" disabled={!canWrite || !count} onClick={onStart}>{active ? 'Continue' : 'Study'} {deck.name}</button><a className="button secondary" href={'#study/deck/' + encodeURIComponent(deck.id)} aria-label={'Manage ' + deck.name}>Manage</a></div>
    <div className="deck-meta"><span>{deck.settings.newCardsPerDay} new / day</span><span>{queue.suspendedCount} suspended</span></div>
    <p className="fine-print">{queue.newUsed} new introduced · {queue.reviewsUsed} reviews used today</p>
  </article>;
}

export function Study({ desk, now, onStart }: { desk: Desk; now: number; onStart: (deck: Deck) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [saveError, setSaveError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) { dialog.showModal(); dialog.querySelector<HTMLInputElement>('input')?.focus(); }
    if (!open && dialog.open) { dialog.close(); openerRef.current?.focus(); }
  }, [open]);
  const workspace = desk.workspace;
  if (!workspace) return null;
  const decks = workspace.decks.filter(deck => !deck.archived);
  const matchingDecks = decks.filter(deck => deck.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const archived = workspace.decks.filter(deck => deck.archived);
  const current = decks.find(deck => deck.id === workspace.session?.deckId);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaveError(false);
    const saved = await desk.mutate(() => createDeck(name.trim()), 'Deck created and saved in this browser.');
    if (saved) { setName(''); setOpen(false); } else setSaveError(true);
  };
  return <>
    <header className="page-header"><p className="eyebrow">A little, often</p><h1>Your decks</h1><p>A quiet place to return to what you want to remember.</p></header>
    {current && <section className="panel continue-study"><div><p className="eyebrow">Pick up where you left off</p><h2>{current.name}</h2><p className="muted">{workspace.session?.copyId ? 'Your saved card and answer are ready when you are.' : 'Check your queue for cards that are ready to study.'}</p></div><button className="button" disabled={!desk.canWrite} onClick={() => onStart(current)}>Continue studying</button></section>}
    <section className="section-block" aria-labelledby="decks-title"><div className="section-heading"><h2 id="decks-title">Personal decks <span className="count-badge">{decks.length}</span></h2><div className="deck-actions"><a className="text-link" href="#library/packs">Browse Library</a><button ref={openerRef} className="button" disabled={!desk.canWrite} onClick={() => { setSaveError(false); setOpen(true); }}>Create a deck</button></div></div>
      {decks.length > 3 && <div className="deck-search"><label htmlFor="deck-search">Search personal decks</label><input id="deck-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a deck by name"/></div>}
      {decks.length ? matchingDecks.length ? <div className="deck-grid">{matchingDecks.map(deck => <DeckTile key={deck.id} deck={deck} workspace={workspace} now={now} canWrite={desk.canWrite} onStart={() => onStart(deck)}/>)}</div> : <p className="muted">No decks match this search.</p> : <div className="empty-decks"><span className="empty-decks-icon" aria-hidden="true">▤</span><h3>Make room for your first deck.</h3><p>Create a deck, then add cards from Library.</p></div>}
    </section>
    <p className="fine-print">Decks start with 20 new cards per day. A card added to another deck has independent progress, notes, and tags.</p>
    <div className="foundation-note deck-fixture-note"><p><span className="fixture-badge">Study material</span> Sourced Contact Center study packs are available in Library.</p></div>
    {!!archived.length && <details className="panel archived-decks"><summary>Archived decks <span className="count-badge">{archived.length}</span></summary><p className="fine-print">Archived decks keep all cards, history, and notes. Restore a deck to study it again.</p><ul>{archived.map(deck => <li key={deck.id}><a href={'#study/deck/' + encodeURIComponent(deck.id)}>{deck.name}</a><button className="button secondary" disabled={!desk.canWrite} onClick={() => void desk.mutate(() => setDeckArchived(deck.id, false), 'Deck restored with its existing progress.')} aria-label={'Restore ' + deck.name}>Restore</button></li>)}</ul></details>}
    <dialog ref={dialogRef} className="deck-dialog" aria-labelledby="create-deck-title" onCancel={event => { if (desk.busy) event.preventDefault(); else setOpen(false); }} onClose={() => { setOpen(false); openerRef.current?.focus(); }}>
      <form onSubmit={submit}><h2 id="create-deck-title">Create a deck</h2><p className="muted">Give your collection a name. Each deck has its own progress and daily allowance.</p><label htmlFor="deck-name">Deck name</label><input id="deck-name" value={name} onChange={event => setName(event.target.value)} maxLength={80} required disabled={!desk.canWrite} autoComplete="off" autoFocus placeholder="e.g. My evening studies"/>
        {saveError && <p role="alert" className="notice error">{desk.error ?? 'The deck could not be saved. Your name is kept here so you can try again.'}</p>}
        <div className="deck-actions dialog-actions"><button type="button" className="button secondary" disabled={desk.busy} onClick={() => setOpen(false)}>Cancel</button><button className="button" disabled={!desk.canWrite || !name.trim()}>{desk.busy ? 'Saving…' : 'Create deck'}</button></div>
      </form>
    </dialog>
  </>;
}
