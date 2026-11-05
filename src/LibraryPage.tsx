import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { LearningCopy, CanonicalCardRef, CanonicalNoteRef } from './domain';
import type { useWorkspace } from './useWorkspace';
import { studyCurations, studyPacks, canonicalCards, browsableCards, visibleCurations, cardCurations, matchesCurationCard, findPublishedCard } from './content/catalog';
import { questionBankManifests } from './content/questionBanks';
import { addSelectionToDeck, removeCardsFromDeck } from './collectionStorage';
import { setCopySuspended } from './reviewStorage';
import { database } from './storage';
import { getMistakes } from './library';
import { CardBadges } from './CardBadges';
import { CardDetails, type CardDetailRef } from './CardDetails';
import { NotesReader } from './NotesReader';
import './library.css';
import './libraryActions.css';
import './card-browser.css';

type Desk = ReturnType<typeof useWorkspace>;
type Section = 'packs' | 'cards' | 'notes' | 'mistakes';
type CardRef = CardDetailRef;
const keyFor = (ref: CardRef) => JSON.stringify([ref.packId, ref.cardId]);
const formatDate = (at: number | null) => at === null ? 'Not scheduled' : new Date(at).toLocaleString();
export function Library({ desk, section, initialCopyId, initialDeckId, initialCardRef, initialNoteRef, initialTopic, onDirtyChange }: { desk: Desk; section: Section; initialCopyId?: string; initialDeckId?: string; initialCardRef?: CanonicalCardRef; initialNoteRef?: CanonicalNoteRef; initialTopic?: {ownerId?: string; curationId?: string; topicId: string}; onDirtyChange?: (dirty: boolean) => void }) {
  const workspace = desk.workspace!;
  const activeDecks = workspace.decks.filter(deck => !deck.archived);
  const activeCopies = workspace.copies.filter(copy => !copy.removed && activeDecks.some(deck => deck.id === copy.deckId));
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [packId, setPackId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [kind, setKind] = useState('');
  const [deckId, setDeckId] = useState('');
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');
  const [destination, setDestination] = useState(initialDeckId ?? '');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [selectedMistakes, setSelectedMistakes] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState('');
  const [resourceNotice, setResourceNotice] = useState('');
  const resourceNoticeRef = useRef<HTMLParagraphElement>(null);
  const linkedCardFocus = useRef<string | null>(null);
  const [mistakeSearch, setMistakeSearch] = useState('');
  const [mistakeFiltersOpen, setMistakeFiltersOpen] = useState(false);
  const [mistakeDeck, setMistakeDeck] = useState('');
  const [mistakeStatus, setMistakeStatus] = useState('');
  const [detail, setDetail] = useState<CardRef | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cardList = useRef<HTMLDivElement>(null);
  const mistakeList = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const [detailRevision, setDetailRevision] = useState(0);
  const backdropPointer = useRef<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const acceptedInitial = useRef<string | undefined>(undefined);
  const previousSection = useRef(section);
  const onDirty = useCallback((value: boolean) => { dirty.current = value; onDirtyChange?.(value); }, [onDirtyChange]);
  useEffect(() => { if (initialDeckId) setDestination(initialDeckId); }, [initialDeckId]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => {
    if (previousSection.current !== section) { onDirty(false); dialog.current?.close(); setDetail(null); setFeedback(''); }
    previousSection.current = section;
  }, [section, onDirty]);
  useEffect(() => {
    setResourceNotice(''); linkedCardFocus.current = null;
    if (section !== 'cards' || (!initialCardRef && !initialTopic)) return;
    // Accepted hash navigation has already passed App's unsaved-edit guard.
    onDirty(false); setDetailRevision(value => value + 1);
    setSearch(''); setKind(''); setDeckId(''); setStatus(''); setTag(''); setSelected(new Set());
    setPackId(initialTopic?.curationId ?? '');
    setTopicId(initialTopic ? JSON.stringify(initialTopic.curationId ? [initialTopic.curationId, initialTopic.topicId] : ['@canonical', initialTopic.ownerId ?? '', initialTopic.topicId]) : '');
    const validTopic = !initialTopic || (initialTopic.curationId
      ? studyCurations.some(c => c.id === initialTopic.curationId && c.topics.some(t => t.id === initialTopic.topicId))
      : studyPacks.some(p => p.id === initialTopic.ownerId && p.topics.some(t => t.id === initialTopic.topicId)));
    const card = initialCardRef && canonicalCards.find(item => item.pack.id === initialCardRef.packId && item.card.id === initialCardRef.cardId);
    if (!validTopic || (initialCardRef && !card)) {
      setResourceNotice(initialCardRef && !card ? 'The requested card is unavailable.' : 'The requested topic is unavailable.');
      return;
    }
    if (card) {
      setSelected(new Set([keyFor({packId:card.pack.id,cardId:card.card.id})]));
      linkedCardFocus.current = keyFor({packId:card.pack.id,cardId:card.card.id});
    } else requestAnimationFrame(() => document.getElementById('card-search')?.focus({preventScroll:true}));
  }, [section, initialCardRef?.packId, initialCardRef?.cardId, initialTopic?.ownerId, initialTopic?.curationId, initialTopic?.topicId, onDirty]);
  useEffect(() => {
    if (!resourceNotice) return;
    const frame = requestAnimationFrame(() => resourceNoticeRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [resourceNotice]);
  useEffect(() => { cardList.current?.scrollTo({ top: 0 }); }, [search, packId, topicId, kind, deckId, status, tag, section]);
  useEffect(() => { mistakeList.current?.scrollTo({ top: 0 }); }, [mistakeSearch, mistakeDeck, mistakeStatus, section]);
  const canLeave = () => !dirty.current || window.confirm('Discard unsaved personal notes and tags?');
  const changeSelection = (change: () => void) => {
    if (!canLeave()) return;
    if (dirty.current) setDetailRevision(value => value + 1);
    onDirty(false); setResourceNotice(''); change();
  };
  const changeCardFilter = (change: () => void) => changeSelection(() => { change(); setSelected(new Set()); });
  const changeMistakeFilter = (change: () => void) => changeSelection(() => { change(); setSelectedMistakes(new Set()); });
  const clearSelection = () => changeSelection(() => {
    setSelected(new Set()); setSelectedMistakes(new Set());
    opener.current?.focus({ preventScroll: true });
  });
  const close = () => {
    if (!canLeave()) return;
    onDirty(false); dialog.current?.close(); setDetail(null);
    opener.current?.focus({ preventScroll: true });
  };
  const isBackdrop = (event: PointerEvent<HTMLDialogElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget && (event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY >= rect.bottom);
  };
  const open = (ref: CardRef) => {
    if (!canLeave()) return;
    onDirty(false);
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDetail(ref);
  };
  useEffect(() => {
    if (!initialCopyId || acceptedInitial.current === initialCopyId) return;
    const copy = activeCopies.find(copy => copy.id === initialCopyId);
    if (copy) {
      acceptedInitial.current = initialCopyId;
      if (section === 'cards') { setSelected(new Set([keyFor(copy)])); setDestination(copy.deckId); }
      else setDetail({ packId: copy.packId, cardId: copy.cardId, copyId: copy.id });
    }
  }, [initialCopyId, workspace, section]);
  useEffect(() => { if (detail && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [detail]);
  useEffect(() => {
    if (!detail) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [Boolean(detail)]);
  // Fixture cards a learner already saved stay browsable; the rest are hidden.
  const allCards = useMemo(() => {
    const owned = canonicalCards.filter(({ pack, card }) => pack.fixture && !browsableCards.some(item => item.pack.id === pack.id && item.card.id === card.id) && workspace.copies.some(copy => !copy.removed && copy.packId === pack.id && copy.cardId === card.id));
    return owned.length ? [...owned, ...browsableCards] : browsableCards;
  }, [workspace.copies]);
  const topicScope: string[] | null = topicId ? JSON.parse(topicId) : null;
  const canonicalTopicScope = topicScope?.[0] === '@canonical' ? topicScope : null;
  const states = new Map(workspace.schedulerStates.map(state => [state.copyId, state]));
  const destinationDeck = activeDecks.find(deck => deck.id === destination) ?? activeDecks[0];
  const searchText = search.trim().toLocaleLowerCase();
  const filtered = allCards.filter(({ pack, card }) => {
    const ref = { packId: pack.id, cardId: card.id };
    if (packId && !matchesCurationCard(ref, packId) || topicScope && (canonicalTopicScope ? pack.id !== topicScope[1] || card.topicId !== topicScope[2] : !matchesCurationCard(ref, topicScope[0], topicScope[1])) || kind && card.kind !== kind) return false;
    const copies = activeCopies.filter(copy => copy.packId === pack.id && copy.cardId === card.id && (!deckId || copy.deckId === deckId));
    if (deckId && !copies.length) return false;
    if (status && !copies.some(copy => status === 'suspended' ? copy.suspended : status === 'leech' ? copy.tags.includes('leech') : status === 'active' ? !copy.suspended : (states.get(copy.id)?.state ?? 'new') === status)) return false;
    if (tag && !card.tags.includes(tag) && !copies.some(copy => copy.tags.includes(tag))) return false;
    return !searchText || [card.prompt, card.answer, card.explanation, ...card.tags, ...copies.flatMap(copy => [copy.personalNote, ...copy.tags])].join(' ').toLocaleLowerCase().includes(searchText);
  });
  const tags = [...new Set([...allCards.flatMap(({ card }) => card.tags), ...activeCopies.flatMap(copy => copy.tags)])].sort();
  const selectCard = (ref: CardRef, element: HTMLElement, additive: boolean) => {
    const key = keyFor(ref);
    if (!additive && selected.size === 1 && selected.has(key)) return;
    changeSelection(() => {
      opener.current = element;
      setSelected(previous => {
        if (!additive) return new Set([key]);
        const next = new Set(previous); next.has(key) ? next.delete(key) : next.add(key); return next;
      });
    });
  };
  const selectMistake = (id: string, element: HTMLElement, additive: boolean) => {
    if (!additive && selectedMistakes.size === 1 && selectedMistakes.has(id)) return;
    changeSelection(() => {
      opener.current = element;
      setSelectedMistakes(previous => {
        if (!additive) return new Set([id]);
        const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next;
      });
    });
  };
  const destinationCopies = workspace.copies.filter(copy => copy.deckId === destinationDeck?.id);
  const membershipFor = (ref: CardRef) => destinationCopies.find(copy => copy.packId === ref.packId && copy.cardId === ref.cardId);
  const selectedRefs = allCards.filter(({ pack, card }) => selected.has(keyFor({ packId: pack.id, cardId: card.id }))).map(({ pack, card }) => ({ packId: pack.id, cardId: card.id }));
  const selectedMissing = selectedRefs.filter(ref => !membershipFor(ref) || membershipFor(ref)?.removed);
  const selectedMembers = selectedRefs.flatMap(ref => { const copy = membershipFor(ref); return copy && !copy.removed ? [copy] : []; });
  const singleRef = selectedRefs.length === 1 ? selectedRefs[0] : undefined;
  // The inspector mounts after selection commits; focus only its committed tab.
  useEffect(() => {
    if (section !== 'cards' || !singleRef || linkedCardFocus.current !== keyFor(singleRef)) return;
    const frame = requestAnimationFrame(() => {
      cardList.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({block:'nearest'});
      document.querySelector<HTMLButtonElement>('.library-inline-detail [role="tab"][aria-selected="true"]')?.focus({preventScroll:true});
      linkedCardFocus.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [section, singleRef?.packId, singleRef?.cardId, detailRevision]);
  // Retain the chosen membership identity after removal; never remount onto another deck.
  const eligibleCopies = workspace.copies.filter(copy => activeDecks.some(deck => deck.id === copy.deckId));
  const singleCopy = singleRef ? eligibleCopies.find(copy => copy.packId === singleRef.packId && copy.cardId === singleRef.cardId && copy.deckId === (deckId || destinationDeck?.id)) ?? eligibleCopies.find(copy => copy.packId === singleRef.packId && copy.cardId === singleRef.cardId) : undefined;
  const add = async (refs: CardRef[]) => {
    if (!destinationDeck || !desk.canWrite || !canLeave()) return;
    const missingRefs = refs.filter(ref => !membershipFor(ref) || membershipFor(ref)?.removed);
    if (!missingRefs.length) { setFeedback('Already in this deck. No duplicate cards were added.'); return; }
    const restored = missingRefs.filter(ref => membershipFor(ref)?.removed).length;
    const added = missingRefs.length - restored;
    const counts = [added ? 'Added ' + added + (added === 1 ? ' card' : ' cards') : '', restored ? 'Restored ' + restored + (restored === 1 ? ' card' : ' cards') : ''].filter(Boolean).join(' · ');
    const alreadyAdded = refs.length - missingRefs.length;
    const message = counts + ' to “' + destinationDeck.name + '”.' + (restored ? ' Previous progress, notes, and tags are restored.' : '') + (alreadyAdded ? ' ' + alreadyAdded + ' already in this deck.' : '');
    setFeedback('');
    if (await desk.mutate(() => addSelectionToDeck(destinationDeck.id, missingRefs.map(({ packId, cardId }) => ({ packId, cardId }))), message)) {
      onDirty(false); setFeedback(message); setSelected(new Set());
    }
  };
  const remove = async (copies: LearningCopy[]) => {
    if (!destinationDeck || !copies.length || !desk.canWrite || !canLeave()) return;
    if (!window.confirm('Remove ' + copies.length + (copies.length === 1 ? ' card' : ' cards') + ' from “' + destinationDeck.name + '”? Progress, notes, tags, and history are kept for re-adding. If the current review card is removed, its session will close. Other decks are unchanged.')) return;
    setFeedback('');
    const message = 'Removed ' + copies.length + (copies.length === 1 ? ' card' : ' cards') + ' from “' + destinationDeck.name + '”. Progress and notes are retained for re-adding.';
    if (await desk.mutate(() => removeCardsFromDeck(destinationDeck.id, copies.map(copy => copy.id)), message)) {
      onDirty(false); setFeedback(message); setSelected(new Set());
    }
  };
  const missing = activeCopies.filter(copy => !findPublishedCard(copy));
  const topics = visibleCurations.filter(pack => !packId || pack.id === packId).flatMap(pack => pack.topics.map(topic => ({ ...topic, packId: pack.id, packTitle: pack.title })));
  const mistakes = getMistakes(workspace).filter(row => {
    if (!activeCopies.some(copy => copy.id === row.copy.id) || mistakeDeck && row.copy.deckId !== mistakeDeck) return false;
    if (mistakeStatus === 'suspended' && !row.copy.suspended || mistakeStatus === 'active' && row.copy.suspended || mistakeStatus === 'leech' && !row.leech || mistakeStatus === 'again' && row.lastRating !== 'again' || mistakeStatus === 'right' && row.lastRating !== 'right') return false;
    const published = findPublishedCard(row.copy);
    return [published?.card.prompt ?? 'Unavailable card', row.copy.personalNote, ...row.copy.tags].join(' ').toLocaleLowerCase().includes(mistakeSearch.trim().toLocaleLowerCase());
  });
  const selectedMistakeRows = mistakes.filter(row => selectedMistakes.has(row.copy.id));
  const singleMistake = selectedMistakeRows.length === 1 ? selectedMistakeRows[0].copy : undefined;
  const suspendMistakes = async (suspended: boolean) => {
    const copies = selectedMistakeRows.map(row => row.copy).filter(copy => copy.suspended !== suspended);
    if (!copies.length || !desk.canWrite || !canLeave()) return;
    setFeedback('');
    const message = (suspended ? 'Suspended ' : 'Unsuspended ') + copies.length + (copies.length === 1 ? ' selected card.' : ' selected cards.');
    if (await desk.mutate(() => database.transaction('rw', database.tables, async () => {
      for (const copy of copies) await setCopySuspended(copy.id, suspended, undefined, database);
    }), message)) { onDirty(false); setFeedback(message); setSelectedMistakes(new Set()); }
  };
  const inspector = (ref: CardRef, fixedCopy = false) => <section className="library-inline-detail panel" role="region" aria-label="Card details">
    <CardDetails key={keyFor(ref) + (ref.copyId ?? '') + detailRevision} desk={desk} detail={ref} onDirtyChange={onDirty} fixedCopy={fixedCopy} onClose={clearSelection}/>
  </section>;

  const filterCount = [packId, topicId, kind, deckId, status, tag].filter(Boolean).length;
  const mistakeFilterCount = [mistakeDeck, mistakeStatus].filter(Boolean).length;
  const destinationControl = <div className="library-destination-control"><label htmlFor="library-destination">Destination deck</label><select id="library-destination" value={destinationDeck?.id ?? ''} disabled={!activeDecks.length || desk.busy} onChange={event => changeSelection(() => { setDestination(event.target.value); setFeedback(''); })}>{activeDecks.length ? activeDecks.map(deck => <option value={deck.id} key={deck.id}>{deck.name}</option>) : <option value="">Create a deck first</option>}</select></div>;
  const destinationPanel = <section className="library-destination panel library-pack-destination" role="region" aria-label="Study pack destination">
      {destinationControl}
      {destinationDeck && <a className="text-link library-manage-link" href={'#study/deck/' + encodeURIComponent(destinationDeck.id)} title={'Manage ' + destinationDeck.name}>Manage deck ↗</a>}
      <span className="quiet-label library-result-count">{visibleCurations.length} available packs</span>
      {!activeDecks.length && <a className="text-link" href="#study">Create your first deck ↗</a>}
      <div className="library-operation-feedback" role="status" aria-live="polite">{feedback}</div>
      {desk.error && <p className="library-operation-error">{desk.error}</p>}
    </section>;
  const cardSelectionControls = <section className="library-destination panel card-browser-toolbar" role="region" aria-label="Card selection controls">
      <div className="library-actions library-bulk-actions">
        <span className="fine-print library-selection-count">{selectedRefs.length} selected</span>
        <button className="button secondary" aria-label={'Select all ' + filtered.length + ' matching cards'} disabled={!filtered.length} onClick={() => changeSelection(() => setSelected(previous => new Set([...previous, ...filtered.map(({ pack, card }) => keyFor({ packId: pack.id, cardId: card.id }))])))}>Select all</button>
        <button className="button secondary" disabled={!selected.size || desk.busy} onClick={clearSelection}>Clear selection</button>
        <button className="button" aria-label={'Add selected cards (' + selectedMissing.length + ')'} disabled={!desk.canWrite || !destinationDeck || !selectedMissing.length} onClick={() => void add(selectedMissing)}>Add ({selectedMissing.length})</button>
        <button className="button secondary" aria-label={'Remove selected cards (' + selectedMembers.length + ')'} disabled={!desk.canWrite || !destinationDeck || !selectedMembers.length} onClick={() => void remove(selectedMembers)}>Remove ({selectedMembers.length})</button>
      </div>
      <div className="library-operation-feedback" role="status" aria-live="polite" title={feedback}>{feedback}</div>
      {desk.error && <p className="library-operation-error">{desk.error}</p>}
    </section>;

  return <div className="library-page">
    <header className="page-header"><p className="eyebrow">Keep knowledge close</p><h1>Library</h1><p>Explore the material behind your decks. Browsing does not count as study.</p></header>
    <nav className="section-nav library-section-nav" aria-label="Library sections">{(['packs', 'cards', 'notes', 'mistakes'] as const).map(item => <a href={'#library/' + item} key={item} aria-current={section === item ? 'page' : undefined}>{{ packs: 'Study packs', cards: 'Card browser', notes: 'Notes', mistakes: 'Mistakes' }[item]}</a>)}</nav>
    {resourceNotice && <p ref={resourceNoticeRef} tabIndex={-1} role="status" className="notice"><strong>{resourceNotice}</strong> Your saved learning data is retained. Choose another card or reset the filters.</p>}
    {missing.length > 0 && <div className="notice"><strong>{missing.length} saved card {missing.length === 1 ? 'reference is' : 'references are'} unavailable.</strong><p>Your personal notes and review history are retained. The published content is not installed.</p>{missing.map(copy => <button className="button secondary" key={copy.id} onClick={() => open({ ...copy, copyId: copy.id })}>Inspect unavailable card in {activeDecks.find(deck => deck.id === copy.deckId)?.name}</button>)}</div>}
    {section === 'packs' && destinationPanel}
    {section === 'packs' && <>
      <h2 className="sr-only">Study packs</h2>
      <div className="library-pack-list">{visibleCurations.map(pack => {
        const membership = activeCopies.filter(copy => copy.deckId === destinationDeck?.id && pack.cards.some(ref => ref.packId === copy.packId && ref.cardId === copy.cardId));
        const complete = pack.cards.every(ref => membership.some(copy => copy.packId === ref.packId && copy.cardId === ref.cardId));
        return <section className="panel library-pack" key={pack.id} aria-label={pack.title}><div>{pack.fixture && <span className="fixture-badge">Engineering fixture · not a study pack</span>}<h2>{pack.title}</h2><p className="muted">{pack.description}</p><p className="fine-print">{pack.cards.length} cards · {pack.notes.length} reference notes · {pack.questionBankIds.length ? 'Shared question bank' : 'No exam pool'}</p>{pack.questionBankIds.map(bankId => <p key={bankId}><a className="text-link" href={'#tests?bank=' + encodeURIComponent(bankId)}>Open {questionBankManifests.find(bank => bank.id === bankId)?.title ?? 'question bank'} ↗</a></p>)}{destinationDeck && <p className="library-membership">{membership.length} of {pack.cards.length} cards in {destinationDeck.name}</p>}</div><button className="button secondary" disabled={!desk.canWrite || !destinationDeck || complete} onClick={() => void add(pack.cards.map(({ packId, cardId }) => ({ packId, cardId })))}>{complete ? 'All pack cards added' : 'Add entire pack'}</button></section>;
      })}</div>
    </>}

    {section === 'cards' && <>
      <h2 className="sr-only">Card browser</h2>
      <div className="card-browser-search panel library-toolbar">
        <div className="library-search"><label htmlFor="card-search">Search cards</label><input id="card-search" type="search" value={search} onChange={event => changeCardFilter(() => setSearch(event.target.value))} placeholder="Questions, answers, personal notes…"/></div>
        {destinationControl}
        <button className="button secondary card-filter-toggle" aria-expanded={filtersOpen} aria-controls="card-advanced-filters" onClick={() => setFiltersOpen(value => !value)}>Filters{filterCount ? ' (' + filterCount + ')' : ''}<span aria-hidden="true">{filtersOpen ? '−' : '+'}</span></button>
        {filterCount > 0 && <button className="button secondary" onClick={() => changeCardFilter(() => { setPackId(''); setTopicId(''); setKind(''); setDeckId(''); setStatus(''); setTag(''); })}>Reset filters</button>}
        <span className="quiet-label library-result-count">{filtered.length} matching cards</span>
        {!activeDecks.length && <a className="text-link library-create-deck" href="#study">Create your first deck ↗</a>}
      </div>
      <div id="card-advanced-filters" className="library-filters panel card-advanced-filters" hidden={!filtersOpen}>

        <div><label htmlFor="card-pack">Study pack</label><select id="card-pack" value={packId} onChange={event => changeCardFilter(() => { setPackId(event.target.value); setTopicId(''); })}><option value="">All packs</option>{packId && !studyCurations.some(p => p.id === packId) && <option value={packId}>Unavailable study pack</option>}{visibleCurations.map(pack => <option key={pack.id} value={pack.id}>{pack.title}</option>)}</select></div>
        <div><label htmlFor="card-topic">Topic</label><select id="card-topic" value={topicId} onChange={event => changeCardFilter(() => setTopicId(event.target.value))}><option value="">All topics</option>{canonicalTopicScope && <option value={topicId}>{studyPacks.find(p => p.id === canonicalTopicScope[1])?.topics.find(t => t.id === canonicalTopicScope[2])?.title ?? 'Unavailable topic'} · Published topic</option>}{topicId && !canonicalTopicScope && !topics.some(t => JSON.stringify([t.packId,t.id]) === topicId) && <option value={topicId}>Unavailable topic</option>}{topics.map(topic => <option value={JSON.stringify([topic.packId, topic.id])} key={JSON.stringify([topic.packId, topic.id])}>{topic.title}{!packId ? ' · ' + topic.packTitle : ''}</option>)}</select></div>
        <div><label htmlFor="card-kind">Card type</label><select id="card-kind" value={kind} onChange={event => changeCardFilter(() => setKind(event.target.value))}><option value="">All types</option><option value="recall">Recall</option><option value="mcq">Multiple choice</option></select></div>
        <div><label htmlFor="card-deck">Deck filter</label><select id="card-deck" value={deckId} onChange={event => changeCardFilter(() => setDeckId(event.target.value))}><option value="">All published cards</option>{activeDecks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></div>
        <div><label htmlFor="card-status">Card status</label><select id="card-status" value={status} onChange={event => changeCardFilter(() => setStatus(event.target.value))}><option value="">Any status</option><option value="new">New in a deck</option><option value="learning">Learning</option><option value="review">Review</option><option value="relearning">Relearning</option><option value="active">Not suspended</option><option value="suspended">Suspended</option><option value="leech">Leech</option></select></div>
        <div><label htmlFor="card-tag">Tag filter</label><select id="card-tag" value={tag} onChange={event => changeCardFilter(() => setTag(event.target.value))}><option value="">All tags</option>{tags.map(value => <option key={value} value={value}>{value}</option>)}</select></div>
      </div>
      {cardSelectionControls}
      <div className={'library-browser-workspace card-browser-workspace' + (singleRef ? ' has-inspector' : '')}>
        <div ref={cardList} className="library-rows library-scroll-list" role="region" aria-label="Card list" tabIndex={0}>{filtered.map(({ pack, card }) => {
          const ref = { packId: pack.id, cardId: card.id };
          const copies = activeCopies.filter(copy => copy.packId === pack.id && copy.cardId === card.id && (!deckId || copy.deckId === deckId));
          const member = membershipFor(ref);
          const inDestination = member && !member.removed;
          return <article className={'library-row' + (selected.has(keyFor(ref)) ? ' is-selected' : '')} key={keyFor(ref)}>
            <button className="library-card-open" aria-pressed={selected.has(keyFor(ref))} aria-describedby={'card-meta-' + encodeURIComponent(keyFor(ref)) + ' card-badges-' + encodeURIComponent(keyFor(ref)) + (destinationDeck ? ' card-membership-' + encodeURIComponent(keyFor(ref)) : '')} aria-label={'Select card: ' + card.prompt} onClick={event => selectCard(ref, event.currentTarget, event.ctrlKey)}>
              <strong>{card.prompt}</strong><span id={'card-meta-' + encodeURIComponent(keyFor(ref))} className="quiet-label">{pack.title} · {pack.topics.find(topic => topic.id === card.topicId)?.title} · {copies.length} deck {copies.length === 1 ? 'copy' : 'copies'}</span>
              {cardCurations(ref).some(curation => curation.id !== pack.id) && <span className="quiet-label">Also in: {cardCurations(ref).filter(curation => curation.id !== pack.id).map(curation => curation.title).join(' · ')}</span>}
              <CardBadges id={'card-badges-' + encodeURIComponent(keyFor(ref))} card={card} copies={copies} decks={activeDecks} states={states}/>
              {destinationDeck && <span id={'card-membership-' + encodeURIComponent(keyFor(ref))} className={'library-membership ' + (inDestination ? 'is-member' : '')}>{inDestination ? '✓ In ' : member?.removed ? 'Removed from ' : 'Not in '}{destinationDeck.name}</span>}
            </button>
          </article>;
        })}{!filtered.length && <p className="notice">No cards match these filters.</p>}</div>
        {singleRef ? inspector({ ...singleRef, copyId: singleCopy?.id }) : <section className="card-browser-empty panel" aria-label="Selection summary"><h2>{selectedRefs.length > 1 ? `${selectedRefs.length} cards selected` : 'Select a card to read'}</h2><p className="muted">{selectedRefs.length > 1 ? 'Use the controls above to add or remove selected cards. Select just one to read its answer and notes.' : 'Click a card for its answer, personal notes, and history. Hold Ctrl while clicking to select multiple cards.'}</p></section>}
      </div>
    </>}
    {section === 'notes' && <NotesReader desk={desk} initialNoteRef={initialNoteRef} onOpenCard={open} onDirtyChange={onDirty}/>}
    {section === 'mistakes' && <>
      <h2 className="sr-only">Mistakes</h2>
      <div className="card-browser-search panel library-toolbar">
        <div className="library-search"><label htmlFor="mistake-search">Search mistakes</label><input id="mistake-search" type="search" value={mistakeSearch} onChange={event => changeMistakeFilter(() => setMistakeSearch(event.target.value))} placeholder="Questions, personal notes, tags…"/></div>
        <button className="button secondary card-filter-toggle" aria-expanded={mistakeFiltersOpen} aria-controls="mistake-advanced-filters" onClick={() => setMistakeFiltersOpen(value => !value)}>Filters{mistakeFilterCount ? ' (' + mistakeFilterCount + ')' : ''}<span aria-hidden="true">{mistakeFiltersOpen ? '−' : '+'}</span></button>
        {mistakeFilterCount > 0 && <button className="button secondary" onClick={() => changeMistakeFilter(() => { setMistakeDeck(''); setMistakeStatus(''); })}>Reset filters</button>}
        <span className="quiet-label library-result-count">{mistakes.length} matching mistakes<span>Flashcard reviews only</span></span>
      </div>
      <div id="mistake-advanced-filters" className="library-filters panel card-advanced-filters" hidden={!mistakeFiltersOpen}>
        <div><label htmlFor="mistake-deck">Mistakes deck</label><select id="mistake-deck" value={mistakeDeck} onChange={event => changeMistakeFilter(() => setMistakeDeck(event.target.value))}><option value="">All decks</option>{activeDecks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></div>
        <div><label htmlFor="mistake-status">Mistakes status</label><select id="mistake-status" value={mistakeStatus} onChange={event => changeMistakeFilter(() => setMistakeStatus(event.target.value))}><option value="">All mistakes</option><option value="active">Not suspended</option><option value="suspended">Suspended</option><option value="leech">Leeches</option><option value="again">Latest review: Again</option><option value="right">Latest review: Right</option></select></div>
      </div>
      <section className="library-destination panel card-browser-toolbar mistakes-toolbar" role="region" aria-label="Mistake selection controls">
        <div className="library-actions library-bulk-actions">
          <span className="fine-print library-selection-count">{selectedMistakeRows.length} selected</span>
          <button className="button secondary" aria-label={'Select all ' + mistakes.length + ' mistakes'} disabled={!mistakes.length} onClick={() => changeSelection(() => setSelectedMistakes(new Set(mistakes.map(row => row.copy.id))))}>Select all</button>
          <button className="button secondary" aria-label="Suspend selected cards" disabled={!desk.canWrite || !selectedMistakeRows.some(row => !row.copy.suspended)} onClick={() => void suspendMistakes(true)}>Suspend</button>
          <button className="button secondary" aria-label="Unsuspend selected cards" disabled={!desk.canWrite || !selectedMistakeRows.some(row => row.copy.suspended)} onClick={() => void suspendMistakes(false)}>Resume</button>
          <button className="button secondary" disabled={!selectedMistakes.size || desk.busy} onClick={clearSelection}>Clear selection</button>
        </div>
        <div className="library-operation-feedback" role="status" aria-live="polite" title={feedback}>{feedback}</div>
        {desk.error && <p className="library-operation-error">{desk.error}</p>}
      </section>
      <div className={'library-browser-workspace card-browser-workspace' + (singleMistake ? ' has-inspector' : '')}>
        <div ref={mistakeList} className="library-rows library-scroll-list" role="region" aria-label="Mistake list" tabIndex={0}>{mistakes.map(row => <article className={'library-mistake library-row' + (selectedMistakes.has(row.copy.id) ? ' is-selected' : '')} key={row.copy.id}>
          <button className="library-card-open" aria-pressed={selectedMistakes.has(row.copy.id)} aria-label={'Select mistake: ' + (findPublishedCard(row.copy)?.card.prompt ?? 'Unavailable card')} onClick={event => selectMistake(row.copy.id, event.currentTarget, event.ctrlKey)}>
            <span className="eyebrow">{activeDecks.find(deck => deck.id === row.copy.deckId)?.name}</span>
            <strong>{findPublishedCard(row.copy)?.card.prompt ?? 'Unavailable card'}</strong>
            <span className="quiet-label">{row.againCount} Again {row.againCount === 1 ? 'review' : 'reviews'} · {row.lapses} review lapses</span>
            <span className="fine-print">Last Again: {formatDate(row.lastAgainAt)} · Latest review: {row.lastRating === 'right' ? 'Right — improving' : 'Again'}</span>
            <span className="library-actions">{row.leech && <span className="leech-badge">Leech</span>}{row.copy.suspended && <span className="fixture-badge">Suspended</span>}</span>
          </button>
        </article>)}{!mistakes.length && <p className="notice">No flashcard mistakes match these filters.</p>}</div>
        {singleMistake ? inspector({ ...singleMistake, copyId: singleMistake.id }, true) : <section className="card-browser-empty panel" aria-label="Selection summary"><h2>{selectedMistakeRows.length > 1 ? `${selectedMistakeRows.length} cards selected` : 'Select a mistake to read'}</h2><p className="muted">{selectedMistakeRows.length > 1 ? 'Use the controls above to suspend or unsuspend selected cards. Select just one to read its answer and notes.' : 'Click a card for its answer, personal notes, and history. Hold Ctrl while clicking to select multiple cards.'}</p><p className="fine-print">Cards with a saved Again review remain here so you can see their history. Undone reviews and test results are excluded.</p></section>}
      </div>
    </>}
    {detail && <dialog ref={dialog} className="library-dialog" aria-label="Card details" onCancel={event => { event.preventDefault(); close(); }}
      onPointerDown={event => { backdropPointer.current = event.isPrimary && event.button === 0 && isBackdrop(event) ? event.pointerId : null; }}
      onPointerUp={event => { const dismiss = backdropPointer.current === event.pointerId && isBackdrop(event); backdropPointer.current = null; if (dismiss) close(); }}
      onPointerCancel={() => { backdropPointer.current = null; }}>
      <CardDetails key={keyFor(detail) + (detail.copyId ?? '')} desk={desk} detail={detail} onDirtyChange={onDirty} onClose={close}/>
    </dialog>}
  </div>;
}
