import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Deck } from './domain';
import { findPublishedCard } from './content/catalog';
import { deleteDeck, renameDeck, setDeckArchived, removeCardsFromDeck } from './collectionStorage';
import { DeckSettings } from './DeckSettings';
import { CardDetails } from './CardDetails';
import type { useWorkspace } from './useWorkspace';
import './decks.css';
import './deck-manage.css';

type Desk = ReturnType<typeof useWorkspace>;
type ManageProps = { desk: Desk; deckId: string; onDirtyChange?: (dirty: boolean) => void };

export function DeckManage({ desk, deckId, onDirtyChange }: ManageProps) {
  const deck = desk.workspace?.decks.find(item => item.id === deckId);
  const copies = desk.workspace?.copies.filter(copy => copy.deckId === deckId && !copy.removed) ?? [];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const wasSaving = useRef(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (desk.busy) setFeedback('');
    else if (wasSaving.current) setFeedback(desk.error ? '' : desk.message ?? '');
    wasSaving.current = desk.busy;
  }, [desk.busy, desk.message, desk.error]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-manage-close]')?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      requestAnimationFrame(() => {
        const opener = document.querySelector<HTMLAnchorElement>('a[href="#study/deck/' + encodeURIComponent(deckId) + '"]');
        if (opener) opener.focus({ preventScroll: true });
        else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      });
    };
  }, [deckId]);
  const close = () => { if (!desk.busy) window.location.hash = '#study'; };
  const outside = (event: React.MouseEvent<HTMLDialogElement> | React.PointerEvent<HTMLDialogElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
  };
  return <dialog ref={dialogRef} className="deck-manage-dialog" aria-label={'Manage ' + (deck?.name ?? 'unavailable deck')}
    onCancel={event => { event.preventDefault(); close(); }}
    onPointerDown={event => { backdropPress.current = outside(event); }}
    onClick={event => { if (backdropPress.current && outside(event)) close(); backdropPress.current = false; }}>
    <header className="deck-modal-heading"><div><p className="eyebrow">Deck management</p><h1>{deck?.name ?? 'Deck unavailable'}</h1>{deck && <p className="deck-heading-count">{copies.length} cards · {copies.filter(copy => copy.suspended).length} suspended{deck.archived ? ' · Archived' : ''}</p>}</div><button data-manage-close className="button secondary" disabled={desk.busy} onClick={close}>Close deck settings</button></header>
    <div className="deck-modal-body">
      {desk.error && <div className="notice error" role="alert">{desk.error}</div>}
      {feedback && <p className="notice" role="status">{feedback}</p>}
      {deck && desk.workspace ? <DeckManager key={deck.id} desk={desk} deck={deck} onDirtyChange={onDirtyChange}/> : <p>This deck could not be found in your collection.</p>}
    </div>
  </dialog>;
}

function DeckManager({ desk, deck, onDirtyChange }: { desk: Desk; deck: Deck; onDirtyChange?: (dirty: boolean) => void }) {
  const [tab, setTab] = useState<'settings' | 'cards'>('settings');
  const [name, setName] = useState(deck.name);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [detailDirty, setDetailDirty] = useState(false);
  const nameDirty = name !== deck.name;
  const dirty = nameDirty || settingsDirty || detailDirty;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty]);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0; }, [search]);
  const [selected, setSelected] = useState<string[]>([]);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [detailRevision, setDetailRevision] = useState(0);
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (mobileDetail && window.matchMedia('(max-width: 899px)').matches) backRef.current?.focus({ preventScroll: true });
  }, [mobileDetail]);
  const workspace = desk.workspace!;
  const copies = workspace.copies.filter(copy => copy.deckId === deck.id && !copy.removed);
  const removedCount = workspace.copies.filter(copy => copy.deckId === deck.id && copy.removed).length;
  const matching = copies.filter(copy => {
    const published = findPublishedCard(copy);
    return [published?.card.prompt, published?.card.answer, published?.pack.title, copy.personalNote, ...copy.tags].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  });
  const selectedIds = selected.filter(id => copies.some(copy => copy.id === id));
  const selectedCopy = selectedIds.length === 1 ? copies.find(copy => copy.id === selectedIds[0]) : undefined;
  const canEdit = desk.canWrite && !deck.archived;
  const previousSelectionCount = useRef(0);
  useEffect(() => {
    if (previousSelectionCount.current && !selectedIds.length && tab === 'cards') {
      setMobileDetail(false);
      requestAnimationFrame(() => (listRef.current ?? searchInput.current)?.focus({ preventScroll: true }));
    }
    previousSelectionCount.current = selectedIds.length;
  }, [selectedIds.length, tab]);
  const backToCards = () => {
    setMobileDetail(false);
    requestAnimationFrame(() => {
      const target = listRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ?? listRef.current;
      target?.focus({ preventScroll: true });
    });
  };
  const select = (ids: string[]) => {
    if (desk.busy) return;
    if (ids.length === selectedIds.length && ids.every(id => selectedIds.includes(id))) {
      setMobileDetail(ids.length === 1);
      return;
    }
    if (detailDirty && !window.confirm('Discard your unsaved note and tag changes?')) return;
    if (detailDirty) setDetailRevision(value => value + 1);
    setDetailDirty(false);
    setSelected(ids);
    setMobileDetail(ids.length === 1);
  };
  const [selectSeveral, setSelectSeveral] = useState(false);
  const selectCard = (id: string, additive: boolean) => {
    select(additive ? selectedIds.includes(id) ? selectedIds.filter(selectedId => selectedId !== id) : [...selectedIds, id] : [id]);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() && await desk.mutate(() => renameDeck(deck.id, name.trim()), 'Deck name saved.')) setName(name.trim());
  };
  const remove = async () => {
    if (!selectedIds.length || !canEdit || detailDirty) return;
    const active = workspace.session?.deckId === deck.id && !!workspace.session.copyId && selectedIds.includes(workspace.session.copyId);
    const explanation = 'Remove ' + selectedIds.length + ' ' + (selectedIds.length === 1 ? 'card' : 'cards') + ' from ' + deck.name + '? Their schedules, review history, and personal notes will be preserved. Adding the same cards again restores them.' + (active ? ' This will close this deck’s current review session.' : '');
    if (!window.confirm(explanation)) return;
    if (await desk.mutate(() => removeCardsFromDeck(deck.id, selectedIds), 'Cards removed. Add them again from Library to restore their progress.')) setSelected([]);
  };
  const archive = async () => {
    if (dirty || !canEdit) return;
    if (!window.confirm('Archive ' + deck.name + '? Its cards, progress, settings, and notes will be preserved. Its current review session will close. You can restore the deck from Study.')) return;
    await desk.mutate(() => setDeckArchived(deck.id, true), 'Deck archived. Your cards and progress are preserved.');
  };
  return <>
    <div className="deck-manage-tabs" role="tablist" aria-label="Manage deck sections" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'settings' : event.key === 'End' ? 'cards' : tab === 'settings' ? 'cards' : 'settings';
      setTab(next); document.getElementById('manage-' + next + '-tab')?.focus();
    }}>
      <button id="manage-settings-tab" className="button secondary" role="tab" tabIndex={tab === 'settings' ? 0 : -1} aria-selected={tab === 'settings'} aria-controls="manage-settings-panel" onClick={() => setTab('settings')}>Settings</button>
      <button id="manage-cards-tab" className="button secondary" role="tab" tabIndex={tab === 'cards' ? 0 : -1} aria-selected={tab === 'cards'} aria-controls="manage-cards-panel" onClick={() => setTab('cards')}>Cards</button>
    </div>
    <div id="manage-settings-panel" className="manage-settings-scroll" role="tabpanel" aria-labelledby="manage-settings-tab" hidden={tab !== 'settings'}>
      {deck.archived && <section className="panel continue-study"><div><h2>Archived deck</h2><p className="muted">Your cards, progress, settings, and notes are preserved. Restore this deck to study or edit it.</p></div><button className="button" disabled={!desk.canWrite} onClick={() => void desk.mutate(() => setDeckArchived(deck.id, false), 'Deck restored with its existing progress.')}>Restore deck</button></section>}
      {dirty && <p className="notice deck-draft-notice" role="status">You have unsaved changes. Save or discard them before archiving or deleting this deck.</p>}
      <section className="panel deck-name-panel"><h2>Deck name</h2><form onSubmit={submit}><label htmlFor="rename-deck">Deck name</label><div className="input-action"><input id="rename-deck" value={name} onChange={event => setName(event.target.value)} maxLength={80} autoComplete="off" required disabled={!canEdit}/><button className="button secondary" disabled={!canEdit || !name.trim() || name.trim() === deck.name}>Save name</button></div><div className="deck-draft-actions"><button type="button" className="button secondary" disabled={!nameDirty || desk.busy} onClick={() => setName(deck.name)}>Discard name changes</button><span role="status">{nameDirty ? 'Unsaved changes' : ''}</span></div></form></section>
      <DeckSettings desk={desk} deckId={deck.id} onDirtyChange={setSettingsDirty}/>
      <DeleteDeck desk={desk} deck={deck} disabled={dirty}/>
      {!deck.archived && <section className="panel archive-panel"><div><h2>Archive this deck</h2><p className="muted">Hide it from your active decks while keeping its cards, progress, settings, and notes.</p></div><button className="button secondary" disabled={!canEdit || dirty} onClick={() => void archive()}>Archive deck</button></section>}
    </div>
    <div id="manage-cards-panel" className={'manage-cards-panel' + (mobileDetail && selectedCopy && !deck.archived ? ' manage-reading' : '')} role="tabpanel" aria-labelledby="manage-cards-tab" hidden={tab !== 'cards'}>
      <section className="panel membership-panel" aria-labelledby="deck-cards-title"><div className="membership-controls"><div className="section-heading"><h2 id="deck-cards-title">Cards in this deck</h2><span className="quiet-label">{copies.length} cards</span></div>
        <label htmlFor="deck-card-search">Search deck cards</label><input ref={searchInput} id="deck-card-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search questions, answers, or personal notes"/>
        <p className="fine-print membership-help">Click a card to select it. Hold Ctrl while clicking, or turn on Select several, to add or remove cards from your selection. Removing preserves progress and notes.</p>
        {!!copies.length && <div className="membership-toolbar"><button type="button" className="button secondary multi-select-toggle" aria-pressed={selectSeveral} onClick={() => setSelectSeveral(value => !value)}>Select several</button><button type="button" className="button secondary" disabled={!matching.length || desk.busy} onClick={() => select(Array.from(new Set([...selectedIds, ...matching.map(copy => copy.id)])))}>Select all matching cards</button><button type="button" className="button secondary" disabled={!selectedIds.length || desk.busy} onClick={() => select([])}>Clear selection</button><span className="quiet-label">{selectedIds.length} selected{selectedIds.some(id => !matching.some(copy => copy.id === id)) && ' (including cards outside this search)'}</span>{selectedCopy && !deck.archived && <button type="button" className="button secondary manage-open-detail" onClick={() => setMobileDetail(true)}>View selected card</button>}{selectedIds.length > 1 && <button className="button secondary" disabled={!canEdit || detailDirty} onClick={() => void remove()}>Remove selected cards</button>}</div>}
        <p className="fine-print membership-count" role="status">{matching.length} of {copies.length} cards match this search</p></div>
        <div className={'deck-cards-workspace' + (selectedCopy && !deck.archived ? ' has-detail' : '')}>
          {matching.length ? <div ref={listRef} className="membership-scroll" role="region" aria-label="Deck card list" tabIndex={0}><ul className="membership-list">{matching.map(copy => {
            const published = findPublishedCard(copy);
            const state = workspace.schedulerStates.find(item => item.copyId === copy.id);
            const prompt = published?.card.prompt ?? 'Published card unavailable';
            return <li key={copy.id}><button type="button" className="membership-select-row" aria-describedby={'membership-meta-' + copy.id} aria-label={'Select card: ' + prompt} aria-pressed={selectedIds.includes(copy.id)} disabled={desk.busy} onClick={event => selectCard(copy.id, event.ctrlKey || selectSeveral)} onKeyDown={event => {
              if (event.ctrlKey && (event.key === ' ' || event.key === 'Enter')) {
                event.preventDefault();
                if (!event.repeat) selectCard(copy.id, true);
              }
            }}>
              <span className="membership-title">{prompt}</span><span id={'membership-meta-' + copy.id} className="quiet-label">{published?.pack.title ?? copy.packId} · {copy.suspended ? 'Suspended' : state?.state ?? 'New'} · {state?.lapses ?? 0} review lapses{copy.tags.includes('leech') && ' · Leech'}</span>
            </button></li>;
          })}</ul></div> : <p className="muted membership-empty">{copies.length ? 'No cards match this search.' : 'This deck has no cards yet. Add cards from Library.'}</p>}
          {selectedCopy && !deck.archived && <section className="deck-selected-detail" role="region" aria-label="Card details"><button ref={backRef} className="button secondary manage-back" onClick={backToCards}>Back to cards</button><CardDetails key={selectedCopy.id + detailRevision} desk={desk} detail={{ packId: selectedCopy.packId, cardId: selectedCopy.cardId, copyId: selectedCopy.id }} fixedCopy onDirtyChange={setDetailDirty}/></section>}
        </div>
        {!!removedCount && <p className="fine-print membership-removed">{removedCount} removed {removedCount === 1 ? 'card has' : 'cards have'} saved progress. Add the same cards again from Library to restore them.</p>}
      </section>
    </div>
  </>;
}

function DeleteDeck({ desk, deck, disabled }: { desk: Desk; deck: Deck; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) { dialog.showModal(); dialog.querySelector<HTMLButtonElement>('[data-cancel]')?.focus(); }
    if (!open && dialog.open) { dialog.close(); openerRef.current?.focus(); }
  }, [open]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (confirmation !== deck.name || !desk.canWrite || disabled) return;
    setFailed(false);
    if (await desk.mutate(() => deleteDeck(deck.id, confirmation), 'Deck permanently deleted.')) {
      window.location.hash = '#study';
    } else setFailed(true);
  };
  return <>
    <section className="panel archive-panel"><div><h2>Delete this deck</h2><p className="muted">Permanently remove this deck, including its progress, review history, personal notes, and tags. This cannot be undone.</p></div><button ref={openerRef} className="button secondary" disabled={!desk.canWrite || disabled} onClick={() => { setConfirmation(''); setFailed(false); setOpen(true); }}>Delete deck</button></section>
    <dialog ref={dialogRef} className="deck-dialog" aria-labelledby="delete-deck-title" onCancel={event => { if (desk.busy) event.preventDefault(); else setOpen(false); }} onClose={() => { setOpen(false); openerRef.current?.focus(); }}>
      <form onSubmit={submit}><h2 id="delete-deck-title">Permanently delete deck?</h2><p>Deleting <strong>{deck.name}</strong> removes all of its cards, schedules, review history, personal notes, and tags, including previously removed cards. Its current review session will close. This cannot be undone.</p><p className="muted">Published study packs, other decks, and practice test history stay available. Archive the deck instead if you may want it back.</p>
        <label htmlFor="delete-deck-confirmation">Type the deck name to confirm</label><p className="delete-deck-name">{deck.name}</p><input id="delete-deck-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" disabled={!desk.canWrite}/>
        {failed && <p role="alert" className="notice error">{desk.error ?? 'The deck could not be deleted. Your data is unchanged.'}</p>}
        <div className="deck-actions dialog-actions"><button type="button" data-cancel className="button secondary" disabled={desk.busy} onClick={() => setOpen(false)}>Cancel</button><button className="button" disabled={!desk.canWrite || confirmation !== deck.name}>{desk.busy ? 'Deleting…' : 'Permanently delete'}</button></div>
      </form>
    </dialog>
  </>;
}
