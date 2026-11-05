import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LearningCopy, PublishedCard, Source, StudyPack, CanonicalNoteRef } from './domain';
import type { useWorkspace } from './useWorkspace';
import { findPublishedCard, canonicalNotes, browsableNotes, visibleCurations, cardCurations, noteCurations, matchesCurationCard } from './content/catalog';
import { CopyAnnotations } from './CopyAnnotations';
import './notes-reader.css';

type CardRef = { packId: string; cardId: string; copyId?: string };
interface ReaderNote {
  key: string;
  title: string;
  body: string;
  kind: 'published' | 'personal';
  label: string;
  curationTitles: string[];
  pack?: StudyPack;
  copy?: LearningCopy;
  sources: Source[];
  cards: PublishedCard[];
}
export function NotesReader({ desk, initialNoteRef, onOpenCard, onDirtyChange }: {
  desk: ReturnType<typeof useWorkspace>;
  initialNoteRef?: CanonicalNoteRef;
  onOpenCard: (ref: CardRef) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const workspace = desk.workspace!;
  const [search, setSearch] = useState('');
  const [packId, setPackId] = useState('');
  const [deckId, setDeckId] = useState('');
  const [kind, setKind] = useState('');
  const [selectedKey, setSelectedKey] = useState(() => initialNoteRef ? JSON.stringify(['published',initialNoteRef.packId,initialNoteRef.noteId]) : '');
  const [linkedUnavailable, setLinkedUnavailable] = useState(() => Boolean(initialNoteRef && !canonicalNotes.some(({pack,note}) => pack.id === initialNoteRef.packId && note.id === initialNoteRef.noteId)));
  const unavailableRef = useRef<HTMLParagraphElement>(null);
  const [mobileReading, setMobileReading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [indexVisible, setIndexVisible] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const dirty = useRef(false);
  const indexScroll = useRef(0);
  const pageScroll = useRef(0);
  const editButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const reportDirty = useCallback((value: boolean) => {
    dirty.current = value;
    onDirtyChange?.(value);
  }, [onDirtyChange]);
  const index = useRef<HTMLDivElement>(null);
  const reader = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const noteButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusReader = useRef(false);
  const activeDecks = workspace.decks.filter(deck => !deck.archived);
  const notes = useMemo(() => {
    const decks = workspace.decks.filter(deck => !deck.archived);
    const copies = workspace.copies.filter(copy => !copy.removed && decks.some(deck => deck.id === copy.deckId));
    const all: ReaderNote[] = [
      ...browsableNotes.filter(({ pack, note }) => (!packId || noteCurations({ packId: pack.id, noteId: note.id }).some(curation => curation.id === packId)) &&
        (!deckId || pack.cards.some(card => card.noteIds.includes(note.id) &&
          (!packId || matchesCurationCard({ packId: pack.id, cardId: card.id }, packId)) &&
          copies.some(copy => copy.deckId === deckId && copy.packId === pack.id && copy.cardId === card.id))))
        .map(({ pack, note }) => ({
          key: JSON.stringify(['published', pack.id, note.id]), title: note.title, body: note.body,
          kind: 'published' as const, label: 'Published reference note', pack,
          curationTitles: noteCurations({ packId: pack.id, noteId: note.id }).map(curation => curation.title),
          sources: pack.sources.filter(source => note.sourceIds.includes(source.id)),
          cards: pack.cards.filter(card => card.noteIds.includes(note.id) && (!packId || matchesCurationCard({ packId: pack.id, cardId: card.id }, packId))),
        })),
      ...copies.filter(copy => copy.personalNote.trim() && (!deckId || copy.deckId === deckId) && (!packId || matchesCurationCard(copy, packId)))
        .map(copy => {
          const published = findPublishedCard(copy);
          return {
            key: JSON.stringify(['personal', copy.id]), title: published?.card.prompt ?? 'Unavailable card',
            body: copy.personalNote, kind: 'personal' as const,
            label: 'Personal note · ' + (decks.find(deck => deck.id === copy.deckId)?.name ?? 'Unavailable deck'),
            pack: published?.pack, copy,
            curationTitles: cardCurations(copy).map(curation => curation.title),
            sources: published?.pack.sources.filter(source => published.card.sourceIds.includes(source.id)) ?? [],
            cards: published ? [published.card] : [],
          };
        }),
    ];
    const needle = search.trim().toLocaleLowerCase();
    return all.filter(note => (!kind || note.kind === kind) &&
      (!needle || [note.title, note.body, note.label, note.pack?.title, ...note.curationTitles].join(' ').toLocaleLowerCase().includes(needle)));
  }, [workspace, search, packId, deckId, kind]);
  const selected = linkedUnavailable ? undefined : notes.find(note => note.key === selectedKey) ?? notes[0];
  const selectedIndex = selected ? notes.indexOf(selected) : -1;

  const filterCount = [packId, deckId, kind].filter(Boolean).length;
  useEffect(() => {
    if (!initialNoteRef) return;
    // App's accepted hash navigation has already guarded any personal draft.
    reportDirty(false); setEditing(false); setSaveFeedback('');
    setSearch(''); setPackId(''); setDeckId(''); setKind('');
    const found = canonicalNotes.some(({pack,note}) => pack.id === initialNoteRef.packId && note.id === initialNoteRef.noteId);
    setLinkedUnavailable(!found);
    setSelectedKey(JSON.stringify(['published',initialNoteRef.packId,initialNoteRef.noteId]));
    focusReader.current = found; setMobileReading(found);
    requestAnimationFrame(() => {
      if (found) { title.current?.focus({preventScroll:true}); if (window.matchMedia('(max-width: 899px)').matches) reader.current?.scrollIntoView({block:'start'}); }
      else unavailableRef.current?.focus();
    });
  }, [initialNoteRef?.packId, initialNoteRef?.noteId, reportDirty]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => {
    index.current?.scrollTo({ top: 0 });
  }, [search, packId, deckId, kind]);
  useEffect(() => {
    if (focusReader.current) {
      title.current?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 899px)').matches) reader.current?.scrollIntoView({ block: 'start' });
      focusReader.current = false;
    }
  }, [selected?.key, mobileReading]);
  const leaveEditor = () => {
    if (desk.busy) return false;
    if (dirty.current && !window.confirm('Discard unsaved changes to this personal note?')) return false;
    reportDirty(false);
    setEditing(false);
    return true;
  };
  const changeFilter = (change: () => void) => {
    if (!leaveEditor()) return;
    setLinkedUnavailable(false); setMobileReading(false);
    change();
    setSaveFeedback('');
    setSelectedKey('');
  };
  const read = (note: ReaderNote) => {
    if (note.key !== selected?.key && !leaveEditor()) return;
    if (!mobileReading) {
      indexScroll.current = index.current?.scrollTop ?? 0;
      pageScroll.current = window.scrollY;
    }
    focusReader.current = true;
    setLinkedUnavailable(false);
    setSaveFeedback('');
    setSelectedKey(note.key);
    setMobileReading(true);
    if (selected?.key === note.key && mobileReading) title.current?.focus({ preventScroll: true });
  };
  const back = () => {
    if (!leaveEditor()) return;
    setMobileReading(false);
    requestAnimationFrame(() => {
      if (index.current) index.current.scrollTop = indexScroll.current;
      window.scrollTo({ top: pageScroll.current });
      const button = selected ? noteButtons.current.get(selected.key) : undefined;
      button?.focus({ preventScroll: true });
    });
  };
  const finishEditing = () => {
    reportDirty(false);
    setEditing(false);
    requestAnimationFrame(() => (editButton.current ?? title.current ?? searchInput.current)?.focus({ preventScroll: true }));
  };
  const openCard = (card: PublishedCard) => {
    const pack = selected?.pack;
    if (!pack || !leaveEditor()) return;
    const copy = selected.copy ?? (deckId
      ? workspace.copies.find(copy => copy.deckId === deckId && copy.packId === pack.id && copy.cardId === card.id && !copy.removed)
      : undefined);
    onOpenCard({ packId: pack.id, cardId: card.id, copyId: copy?.id });
  };
  const resetFilters = () => changeFilter(() => { setPackId(''); setDeckId(''); setKind(''); });
  return <section className={'notes-workspace' + (mobileReading && selected ? ' notes-reading' : '') + (!indexVisible ? ' notes-index-hidden' : '')} aria-label="Notes">
    <h2 className="sr-only">Notes</h2>
    {linkedUnavailable && <p ref={unavailableRef} tabIndex={-1} role="status" className="notice"><strong>The requested note is unavailable.</strong> Your saved test answers and learning data are retained. Choose another reference from the index.</p>}
    <div className="notes-controls">
      <div className="notes-searchbar">
        <div className="notes-search"><label htmlFor="notes-search">Search notes</label><input ref={searchInput} id="notes-search" type="search" value={search} onChange={event => changeFilter(() => setSearch(event.target.value))} placeholder="Titles, note text, or deck names…"/></div>
        <button className="button secondary" aria-expanded={filtersOpen} aria-controls="notes-advanced-filters" onClick={() => setFiltersOpen(value => !value)}>Note filters{filterCount > 0 ? ' (' + filterCount + ')' : ''}</button>
        {filterCount > 0 && <button className="button secondary" onClick={resetFilters}>Reset filters</button>}
        <span className="quiet-label notes-result-count" role="status">{!selected && saveFeedback ? saveFeedback : `${notes.length} matching ${notes.length === 1 ? 'note' : 'notes'}`}</span>
      </div>
      <div id="notes-advanced-filters" className="notes-filters" hidden={!filtersOpen}>
        <div><label htmlFor="notes-pack">Notes study pack</label><select id="notes-pack" value={packId} onChange={event => changeFilter(() => setPackId(event.target.value))}><option value="">All packs</option>{visibleCurations.map(pack => <option value={pack.id} key={pack.id}>{pack.title}</option>)}</select></div>
        <div><label htmlFor="notes-deck">Notes deck</label><select id="notes-deck" value={deckId} onChange={event => changeFilter(() => setDeckId(event.target.value))}><option value="">All decks</option>{activeDecks.map(deck => <option value={deck.id} key={deck.id}>{deck.name}</option>)}</select></div>
        <div><label htmlFor="notes-kind">Note type</label><select id="notes-kind" value={kind} onChange={event => changeFilter(() => setKind(event.target.value))}><option value="">All notes</option><option value="published">Published references</option><option value="personal">Personal notes</option></select></div>
      </div>
    </div>
    {notes.length ? <div className="notes-split">
      <div ref={index} className="notes-index" role="region" aria-label="Note list" tabIndex={0}>
        {notes.map(note => <article className="library-note notes-index-item" key={note.key}>
          <button ref={element => { if (element) noteButtons.current.set(note.key, element); else noteButtons.current.delete(note.key); }}
            className="notes-index-button" aria-describedby={'note-kind-' + encodeURIComponent(note.key)} aria-label={'Read note: ' + note.title} aria-current={selected?.key === note.key ? 'true' : undefined} onClick={() => read(note)}>
            <strong>{note.title}</strong>
            <span id={'note-kind-' + encodeURIComponent(note.key)} className="notes-kind-label">{note.kind === 'personal' ? note.label : 'Published reference'}</span>
          </button>
        </article>)}
      </div>
      {selected && <section ref={reader} className="note-reader" role="region" aria-label="Note reader" tabIndex={0}>
        <div className="note-reader-navigation">
          <button className="button secondary notes-mobile-back" onClick={back}>← Back to notes</button>
          <button className="button secondary notes-index-toggle" aria-expanded={indexVisible} onClick={() => setIndexVisible(value => !value)}>{indexVisible ? 'Hide index' : 'Show index'}</button>
          <span className={"quiet-label notes-navigation-status" + (saveFeedback ? " notes-save-feedback" : "")} role="status">{saveFeedback || `${selectedIndex + 1} of ${notes.length}`}</span>
          <div className="note-step-buttons"><button className="button secondary" disabled={selectedIndex <= 0 || desk.busy} onClick={() => read(notes[selectedIndex - 1])}>Previous note</button><button className="button secondary" disabled={selectedIndex >= notes.length - 1 || desk.busy} onClick={() => read(notes[selectedIndex + 1])}>Next note</button></div>
        </div>
        <article className="note-document" key={selected.key}>
          <header className="note-reader-heading">
            <h3 ref={title} tabIndex={-1}>{selected.title}</h3>
            <p className="note-reader-metadata"><span className="notes-kind-label">{selected.label}</span><span>{selected.curationTitles.length ? selected.curationTitles.join(' · ') : selected.pack?.title ?? 'Published content unavailable'}</span></p>
          </header>
          {editing && selected.copy ? <div className="note-inline-editor">
            {desk.error && <p role="alert" className="annotation-error">{desk.error}</p>}
            <CopyAnnotations desk={desk} copy={selected.copy} onDirtyChange={reportDirty} onSaved={() => { setSaveFeedback('Personal notes and tags saved.'); finishEditing(); }} onDiscard={finishEditing}/>
          </div> : <>
            <div className="note-reader-body">{selected.body.split(/\n\s*\n/).map((paragraph, position) => <p key={position}>{paragraph}</p>)}</div>
            {selected.copy && <div className="note-reader-edit"><button ref={editButton} className="button secondary" disabled={!desk.canWrite || desk.busy} onClick={() => { setSaveFeedback(''); setEditing(true); requestAnimationFrame(() => reader.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus()); }}>Edit personal note</button><span className="quiet-label">Your annotation for this deck. {!desk.canWrite && 'Editing is available in the active writing tab.'}</span></div>}
          </>}
          <section className="note-reader-sources"><h4>{selected.kind === 'personal' ? 'Related card sources' : 'Sources'}</h4>
            {selected.sources.length ? <ul className="source-links">{selected.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul> : <p className="muted">Source links are unavailable because the published content is not installed.</p>}
          </section>
          <details className="note-reader-related"><summary>Related cards <span className="count-badge">{selected.cards.length}</span></summary>
            {selected.cards.length ? <ul>{selected.cards.map(card => <li key={card.id}><button className="button secondary" onClick={() => openCard(card)} aria-label={'Open related card: ' + card.prompt}>{card.prompt} <span aria-hidden="true">↗</span></button></li>)}</ul> : <p className="muted">This note has no available related cards.</p>}
          </details>
        </article>
      </section>}
    </div> : <div className="notice notes-empty"><h3>No notes match these filters.</h3><p>Try another search or include all packs, decks, and note types. Personal notes appear after you save a note on a card in an active deck.</p><button className="button secondary" onClick={() => changeFilter(() => { setSearch(''); setPackId(''); setDeckId(''); setKind(''); })}>Clear note filters</button></div>}
  </section>;
}
