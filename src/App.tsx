import { useCallback, useEffect, useRef, useState } from 'react';
import type { Deck, Theme } from './domain';
import { savePreferences } from './storage';
import { useWorkspace } from './useWorkspace';
import { startReview, refreshReview } from './reviewStorage';
import { StudyReview, useStudyClock } from './StudyReview';
import { Study } from './Study';
import { DeckManage } from './DeckManage';
import { Library } from './LibraryPage';
import { StatisticsPage } from './StatisticsPage';
import { DataTransfer } from './DataTransfer';
import { TestsPage, TestDeadlineMonitor } from './TestsPage';

type Page = 'study' | 'library' | 'tests' | 'statistics' | 'settings';
type LibrarySection = 'packs' | 'cards' | 'notes' | 'mistakes';
interface Route { page: Page; section: LibrarySection; view: 'overview' | 'review' | 'deck'; deckId: string; copyId?: string; destination?: string; bankId?: string; attemptId?: string; ownerId?: string; cardId?: string; noteId?: string; topicId?: string; curationId?: string; }
const pages: { id: Page; label: string; mark: string }[] = [
  { id: 'study', label: 'Study', mark: '01' }, { id: 'library', label: 'Library', mark: '02' },
  { id: 'tests', label: 'Tests', mark: '03' }, { id: 'statistics', label: 'Statistics', mark: '04' },
];
function readRoute(): Route {
  const [path, query] = window.location.hash.replace(/^#\/?/, '').split('?');
  const [part, detail, encodedDeck] = path.split('/');
  const page = ['study', 'library', 'tests', 'statistics', 'settings'].includes(part) ? part as Page : 'study';
  let deckId = '';
  try { deckId = decodeURIComponent(encodedDeck ?? ''); } catch { /* Invalid links show the missing-deck state. */ }
  const params = new URLSearchParams(query);
  return {
    page, section: detail === 'cards' || detail === 'notes' || detail === 'mistakes' ? detail : 'packs',
    view: page === 'study' && detail === 'review' ? 'review' : page === 'study' && detail === 'deck' ? 'deck' : 'overview',
    deckId, copyId: params.get('copy') ?? undefined, destination: params.get('deck') ?? undefined, bankId: params.get('bank') ?? undefined, attemptId: params.get('attempt') ?? undefined,
    ownerId: params.get('owner') ?? undefined, cardId: params.get('card') ?? undefined, noteId: params.get('note') ?? undefined,
    topicId: params.get('topic') ?? undefined, curationId: params.get('curation') ?? undefined,
  };
}
function Moon({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'moon small' : 'moon'} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M33.8 6.5A19 19 0 1 1 9 31.2 18.9 18.9 0 0 0 33.8 6.5Z" stroke="currentColor" strokeWidth="1.6"/><path d="M8 9h6M11 6v6M36 34h4M38 32v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
function EmptyPanel({ title, children, phase }: { title: string; children: React.ReactNode; phase?: string }) {
  return <section className="empty-panel"><Moon/><div>{phase && <p className="eyebrow">{phase}</p>}<h2>{title}</h2><div className="muted prose">{children}</div></div></section>;
}
function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="page-header"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{children}</p></header>;
}
function App() {
  const [route, setRoute] = useState(readRoute);
  const [feedback, setFeedback] = useState('');
  const [restoreEpoch, setRestoreEpoch] = useState(0);
  const feedbackScope = useRef(0);
  const now = useStudyClock();
  const mainRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const setDirty = useCallback((value: boolean) => { dirty.current = value; }, []);
  const storageDesk = useWorkspace();
  // A confirmation belongs to the route where its write started, even if navigation wins the race.
  const scopedMutate = useCallback(async (operation: () => Promise<unknown>, success: string) => {
    const scope = feedbackScope.current;
    setFeedback('');
    const saved = await storageDesk.mutate(operation, success);
    if (saved && scope === feedbackScope.current) setFeedback(success);
    return saved;
  }, [storageDesk.mutate]);
  const desk = { ...storageDesk, mutate: scopedMutate };
  const { workspace, access, busy, canWrite, mutate } = desk;
  useEffect(() => {
    let previousHash = window.location.hash;
    const onHash = () => {
      if (dirty.current && !window.confirm('Discard your unsaved changes?')) {
        window.history.replaceState(null, '', previousHash || '#study');
        return;
      }
      dirty.current = false;
      feedbackScope.current += 1;
      setFeedback('');
      previousHash = window.location.hash;
      setRoute(readRoute());
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    const title = route.view === 'review' ? 'Review' : route.view === 'deck' ? 'Manage deck' : route.page === 'settings' ? 'Settings' : pages.find(page => page.id === route.page)?.label;
    document.title = title + ' · 月明かり';
    if (route.view !== 'review' && !document.querySelector('dialog[open]')) mainRef.current?.focus({ preventScroll: true });
  }, [route.page, route.section, route.view, route.deckId]);
  useEffect(() => { if (desk.error && !document.querySelector('dialog[open]')) errorRef.current?.focus(); }, [desk.error]);
  useEffect(() => {
    if (!workspace) return;
    document.documentElement.dataset.theme = workspace.preferences.theme;
    try { localStorage.setItem('tsukiakari-theme', workspace.preferences.theme); } catch { /* IndexedDB owns preferences. */ }
  }, [workspace?.preferences.theme]);
  const beginStudy = async (deck: Deck) => {
    if (!workspace || !canWrite) return;
    const session = workspace.session;
    if (session && session.deckId !== deck.id && session.copyId && !window.confirm('Switch to ' + deck.name + '? The current card stays unreviewed, and its open answer will close.')) return;
    if (session?.deckId === deck.id && session.copyId) { window.location.hash = '#study/review'; return; }
    const saved = await mutate(() => session?.deckId === deck.id ? refreshReview(session.turnId) : startReview(deck.id), 'Study queue ready.');
    if (saved) window.location.hash = '#study/review';
  };
  const changeTheme = async (theme: Theme) => {
    if (workspace) await mutate(() => savePreferences({ ...workspace.preferences, theme }), 'Appearance saved.');
  };
  const status = access === 'loading' ? 'Opening browser storage…' : busy ? 'Saving…' : access === 'readonly' ? 'Read-only tab' : access === 'unavailable' ? 'Saving unavailable' : desk.error ? 'Save needs attention' : 'Saved in this browser';
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
    <aside className="sidebar">
      <a className="brand" href="#study" aria-label="月明かり · Tsukiakari home"><Moon small/><span><span className="brand-jp" lang="ja">月明かり</span><span className="brand-en">TSUKIAKARI</span></span></a>
      <p className="sidebar-label">Your study space</p>
      <nav className="primary-nav" aria-label="Main navigation">{pages.map(page => <a key={page.id} href={'#' + page.id} aria-current={route.page === page.id ? 'page' : undefined}><span className="nav-mark" aria-hidden="true">{page.mark}</span><span>{page.label}</span><span className="nav-arrow" aria-hidden="true">↗</span></a>)}</nav>
      <div className="sidebar-bottom"><a className="settings-link" href="#settings" aria-current={route.page === 'settings' ? 'page' : undefined}><span aria-hidden="true">⚙</span> Settings</a><span className={'save-status ' + (desk.error || access === 'unavailable' ? 'warning' : access === 'writer' && !busy ? 'ready' : '')} role="status"><span className="status-dot" aria-hidden="true"/>{status}</span><p>One small step,<br/>then another.</p></div>
    </aside>
    <div className="workspace">
      {workspace && <TestDeadlineMonitor key={restoreEpoch} desk={desk}/> }
      <main id="main-content" ref={mainRef} tabIndex={-1} className={route.view === 'review' ? 'review-page' : route.page === 'library' ? 'library-wide' + ((route.section === 'cards' || route.section === 'mistakes') ? ' card-browser-page' : '') : route.page === 'tests' ? 'tests-page' : undefined}>
        {access === 'readonly' && <div className="notice"><strong>This is a read-only tab.</strong><p>Another Tsukiakari tab is saving changes. Close that tab, then reload this one to make changes.</p><button className="button secondary" onClick={() => window.location.reload()}>Reload this tab</button></div>}
        {desk.error && <div ref={errorRef} className="notice error" role="alert" tabIndex={-1}><strong>Storage needs attention</strong><p>{desk.error}</p></div>}
        {route.page !== 'library' && route.page !== 'tests' && <div className={route.view === 'review' ? 'sr-only' : 'mutation-feedback-slot'}>{feedback && <div className="mutation-feedback"><p role="status" aria-live="polite">{feedback}</p>{route.view !== 'review' && <button className="button secondary" aria-label="Dismiss confirmation" onClick={() => setFeedback('')}>Dismiss</button>}</div>}</div>}
        {!workspace ? <EmptyPanel title={access === 'loading' ? 'Opening your study space' : 'Your collection is unavailable'}><p>{access === 'loading' ? 'Checking browser storage before making any changes.' : 'Resolve the storage issue above and reload to continue safely.'}</p></EmptyPanel> : <>
          {route.page === 'study' && route.view !== 'review' && <Study desk={desk} now={now} onStart={deck => void beginStudy(deck)}/>}
          {route.page === 'study' && route.view === 'deck' && <DeckManage desk={desk} deckId={route.deckId} onDirtyChange={setDirty}/>}
          {route.page === 'study' && route.view === 'review' && <>
            <div className="review-page-heading"><a className="text-link" href="#study">← Back to decks</a><h1 className="sr-only">Review</h1></div>
            {workspace.session ? <StudyReview desk={desk} now={now} paused={false} onPause={() => { window.location.hash = '#study'; }} onResume={() => {}} onDirtyChange={setDirty}/> : <EmptyPanel title="Choose a deck to begin"><p>Your review session will open here.</p><a className="button" href="#study">Go to decks</a></EmptyPanel>}
          </>}
          {route.page === 'library' && <Library desk={desk} section={route.section} initialCopyId={route.copyId} initialDeckId={route.destination} initialCardRef={route.cardId === undefined ? undefined : {packId:route.ownerId ?? '',cardId:route.cardId}} initialNoteRef={route.noteId === undefined ? undefined : {packId:route.ownerId ?? '',noteId:route.noteId}} initialTopic={route.topicId === undefined ? undefined : {ownerId:route.ownerId,curationId:route.curationId,topicId:route.topicId}} onDirtyChange={setDirty}/>}
          {route.page === 'tests' && <TestsPage initialAttemptId={route.attemptId} initialBankId={route.bankId} desk={desk} onDirtyChange={setDirty}/>}
          {route.page === 'statistics' && <StatisticsPage workspace={workspace} now={now}/>}
          {route.page === 'settings' && <>
            <PageHeader eyebrow="Make it comfortable" title="Settings">Preferences for your study space.</PageHeader>
            <section className="panel settings-panel"><div><h2>Appearance</h2><p className="muted">Choose a theme or follow your device.</p></div><div className="field"><label htmlFor="theme">Appearance</label><select id="theme" value={workspace.preferences.theme} onChange={event => void changeTheme(event.target.value as Theme)} disabled={!canWrite}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></div></section>
            <section className="panel settings-location"><h2>Deck scheduling settings</h2><p className="muted">Each deck manages its own daily allowances, steps, retention, and leech action. Open Manage on a deck to change them.</p><a className="text-link" href="#study">Go to your decks →</a></section>
            <DataTransfer desk={desk} onRestore={() => setRestoreEpoch(value => value + 1)}/>
            <section className="panel settings-location"><div><h2>Your study day</h2><p>Starts at {String(workspace.preferences.dayStartsAtHour).padStart(2, '0')}:00 in {workspace.preferences.timeZone}. Before this boundary, activity belongs to the previous study day.</p></div></section>
          </>}
        </>}
        {access !== 'loading' && <div className="page-footer-container"><footer className="page-footer"><span lang="ja">月明かり</span><span>Your progress stays in this browser.</span><a href="./third-party-notices.txt" target="_blank" rel="noreferrer">Third-party notices ↗</a></footer></div>}
      </main>
    </div>
  </div>;
}
export default App;
