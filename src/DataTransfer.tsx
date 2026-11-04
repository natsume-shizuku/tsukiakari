import { useEffect, useRef, useState } from 'react';
import type { WorkspaceSnapshot } from './domain';
import type { useWorkspace } from './useWorkspace';
import { findPublishedCard } from './content/catalog';
import { createDeckBackup, createFullBackup, createSettingsBackup, parseBackup, type Backup } from './portability';
import { importBackup } from './portabilityStorage';
import './data-transfer.css';

type Desk = ReturnType<typeof useWorkspace>;
const maximumBytes = 100 * 1024 * 1024;

function downloadJson(value: Backup, label: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  if (blob.size > maximumBytes) throw new Error('This export exceeds the supported 100 MB JSON limit. No data has changed.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tsukiakari-${label}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.append(link);
  try { link.click(); } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
function failureText(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 2000) : 'The file could not be read. Please select a valid Tsukiakari JSON export.';
}

export function DataTransfer({ desk, onRestore }: { desk: Desk; onRestore?: () => void }) {
  const workspace = desk.workspace;
  const [deckId, setDeckId] = useState('');
  const [candidate, setCandidate] = useState<Backup | null>(null);
  const [fileName, setFileName] = useState('');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [safetyWorkspace, setSafetyWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const readVersion = useRef(0);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => { readVersion.current += 1; }, []);
  useEffect(() => { setSafetyConfirmed(false); }, [workspace]);
  useEffect(() => { if (candidate) previewHeading.current?.focus(); }, [candidate]);
  if (!workspace) return null;
  const selectedDeck = workspace.decks.find(deck => deck.id === deckId);
  const currentSafety = safetyWorkspace === workspace;
  const exportJson = (kind: 'full' | 'deck' | 'settings', safety = false) => {
    setError(''); setNotice('');
    try {
      const value = kind === 'full' ? createFullBackup(workspace) : kind === 'settings' ? createSettingsBackup(workspace) : createDeckBackup(workspace, deckId);
      downloadJson(value, safety ? 'before-restore' : kind === 'deck' ? 'deck-selection' : kind);
      if (safety) { setSafetyWorkspace(workspace); setSafetyConfirmed(false); }
      setNotice(safety ? 'Current backup download requested. Check that the JSON file has been saved before continuing.' : 'JSON download requested. Check your browser downloads for the file.');
    } catch (cause) { setError(failureText(cause)); }
  };
  const readFile = async (file: File | undefined) => {
    const version = ++readVersion.current;
    setCandidate(null); setSafetyWorkspace(null); setSafetyConfirmed(false); setError(''); setNotice(''); setFileName(file?.name ?? '');
    if (!file) { setReading(false); return; }
    if (file.size > maximumBytes) { setReading(false); setError('This file is larger than 100 MB. Choose a smaller Tsukiakari JSON export. Your data has not changed.'); return; }
    setReading(true);
    try {
      const text = await file.text();
      if (version !== readVersion.current) return;
      const parsed = parseBackup(JSON.parse(text));
      setCandidate(parsed);
    } catch (cause) {
      if (version === readVersion.current) setError('This file cannot be imported. Your data has not changed. ' + failureText(cause));
    } finally { if (version === readVersion.current) setReading(false); }
  };
  const apply = async () => {
    if (!candidate || !desk.canWrite || reading) return;
    if (candidate.kind === 'full') {
      if (!currentSafety || !safetyConfirmed) return;
      if (!window.confirm(`Replace all data in this browser with this backup? This replaces ${workspace.decks.length} decks, ${workspace.reviewLogs.length} review records, and ${workspace.testAttempts.length} test attempts. This is not a merge.`)) return;
    } else if (candidate.kind === 'settings' && !window.confirm('Apply these preferences and matching deck settings? Existing progress is retained. Changed deck settings may end the current review session and its undo availability.')) return;
    const importing = candidate;
    const saved = await desk.mutate(() => importBackup(importing), 'JSON import completed.');
    if (!saved) return;
    if (importing.kind === 'full') {
      try { sessionStorage.removeItem('tsukiakari-active-time'); } catch { /* Saved review durations are in the imported database. */ }
      onRestore?.();
    }
    readVersion.current += 1;
    setCandidate(null); setFileName(''); setSafetyWorkspace(null); setSafetyConfirmed(false); setError('');
    setNotice(importing.kind === 'full' ? 'Backup restored. This browser now contains the imported collection.' : importing.kind === 'deck' ? 'Deck imported as a fresh personal deck.' : 'Preferences and matching deck settings imported.');
    if (fileInput.current) fileInput.current.value = '';
    requestAnimationFrame(() => heading.current?.focus());
  };
  return <section className="panel data-transfer" aria-labelledby="data-transfer-title">
    <div className="transfer-heading"><h2 id="data-transfer-title" ref={heading} tabIndex={-1}>Data and transfer</h2><p>Download JSON to move your study data between browsers or keep a backup. Files stay on your device; there is no automatic sync.</p></div>
    <div className="transfer-export-grid">
      <section aria-labelledby="full-export-title"><h3 id="full-export-title">Full backup</h3><p>All decks, settings, progress, notes, tags, review records, saved sessions, and test snapshots. Keep this file private.</p><button className="button secondary" disabled={desk.busy} onClick={() => exportJson('full')}>Export full backup</button></section>
      <section aria-labelledby="settings-export-title"><h3 id="settings-export-title">Settings</h3><p>Appearance, study-day preferences, and each deck’s scheduling settings. Deck settings apply only to matching deck identities.</p><button className="button secondary" disabled={desk.busy} onClick={() => exportJson('settings')}>Export settings</button></section>
      <section aria-labelledby="deck-export-title"><h3 id="deck-export-title">Deck selection</h3><p>Card references and deck settings. Importing creates a fresh deck with no personal notes or progress. Published content is supplied by the website.</p><label htmlFor="transfer-deck">Deck to export</label><select id="transfer-deck" value={selectedDeck?.id ?? ''} onChange={event => setDeckId(event.target.value)} disabled={desk.busy}><option value="">Choose a deck</option>{workspace.decks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}{deck.archived ? ' (archived)' : ''}</option>)}</select><button className="button secondary" disabled={desk.busy || !selectedDeck} onClick={() => exportJson('deck')}>Export deck selection</button></section>
    </div>
    <section className="transfer-import" aria-labelledby="import-json-title"><h3 id="import-json-title">Import JSON</h3><p>Choose an export to validate and preview it before making changes. Full backups replace the current collection; deck selections add a fresh deck.</p><label htmlFor="transfer-file">JSON file (up to 100 MB)</label><input id="transfer-file" ref={fileInput} type="file" accept=".json,application/json" disabled={!desk.canWrite} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void readFile(file); }}/>{!desk.canWrite && !desk.busy && <p className="fine-print">Importing requires the writable browser tab. You can still export the saved data shown here.</p>}{reading && <p role="status">Reading and validating the file…</p>}{fileName && <p className="fine-print transfer-file-name">Selected file: {fileName}</p>}
      {candidate && <section className="transfer-preview" aria-labelledby="transfer-preview-title"><h4 id="transfer-preview-title" ref={previewHeading} tabIndex={-1}>Import preview</h4><p className="fine-print">Exported {new Date(candidate.exportedAt).toLocaleString()}</p><ImportSummary backup={candidate} workspace={workspace}/>
        {candidate.kind === 'full' && <div className="transfer-safety"><h4>Save your current data first</h4><p>Download a current backup before replacing this collection. If the collection changes, download a fresh backup before continuing.</p><button className="button secondary" disabled={!desk.canWrite} onClick={() => exportJson('full', true)}>Download current backup</button><label className="transfer-check"><input type="checkbox" checked={currentSafety && safetyConfirmed} disabled={!currentSafety || !desk.canWrite} onChange={event => setSafetyConfirmed(event.target.checked)}/><span>I have saved the current backup file.</span></label></div>}
        <div className="transfer-actions"><button className="button primary" disabled={!desk.canWrite || reading || (candidate.kind === 'full' && (!currentSafety || !safetyConfirmed))} onClick={() => { void apply(); }}>{candidate.kind === 'full' ? 'Replace collection' : candidate.kind === 'deck' ? 'Import as new deck' : 'Import settings'}</button><button className="button secondary" disabled={desk.busy} onClick={() => { readVersion.current += 1; setCandidate(null); setFileName(''); setSafetyWorkspace(null); setSafetyConfirmed(false); setError(''); setNotice(''); requestAnimationFrame(() => fileInput.current?.focus()); }}>Cancel import</button></div>
      </section>}
    </section>
    {error && <p role="alert" className="notice error transfer-error">{error}</p>}{notice && <p role="status" className="notice">{notice}</p>}
  </section>;
}

function ImportSummary({ backup, workspace }: { backup: Backup; workspace: WorkspaceSnapshot }) {
  const references = backup.kind === 'full' ? backup.workspace.copies : backup.kind === 'deck' ? backup.deck.cards : [];
  const missing = references.filter(card => !findPublishedCard(card));
  return <>
    {backup.kind === 'full' && <><p><strong>Full replacement</strong> — all existing learner records in this browser will be replaced. There is no merge.</p><dl className="transfer-counts"><div><dt>Decks</dt><dd>{backup.workspace.decks.length}</dd></div><div><dt>Card copies</dt><dd>{backup.workspace.copies.length}</dd></div><div><dt>Review records</dt><dd>{backup.workspace.reviewLogs.length}</dd></div><div><dt>Test attempts</dt><dd>{backup.workspace.testAttempts.length}</dd></div></dl><p className="fine-print">Saved flashcard session: {backup.workspace.session ? 'included' : 'none'}. Exam deadlines keep their original time and may already have expired.</p></>}
    {backup.kind === 'deck' && <><p><strong>New deck: {backup.deck.name}</strong></p><p>{backup.deck.cards.length} card references will be added with the exported deck settings. Existing decks stay unchanged. Progress and personal notes start empty.</p></>}
    {backup.kind === 'settings' && <><p><strong>Settings only</strong> — progress, cards, notes, and test results stay unchanged.</p><p>Appearance: {backup.preferences.theme}. Study day starts at {String(backup.preferences.dayStartsAtHour).padStart(2, '0')}:00 in {backup.preferences.timeZone}.</p><p>Matching decks to update:</p><ul>{backup.decks.filter(deck => workspace.decks.some(current => current.id === deck.id)).map(deck => <li key={deck.id}>{workspace.decks.find(current => current.id === deck.id)?.name}</li>)}</ul>{!backup.decks.some(deck => workspace.decks.some(current => current.id === deck.id)) && <p className="fine-print">No matching decks. Only collection preferences will be applied.</p>}{backup.decks.some(deck => !workspace.decks.some(current => current.id === deck.id)) && <p className="fine-print">{backup.decks.filter(deck => !workspace.decks.some(current => current.id === deck.id)).length} deck settings have no matching deck and will be skipped.</p>}</>}
    {missing.length > 0 && <div className="notice"><p><strong>{missing.length} card references are unavailable on this website.</strong> Their identities and saved data will be retained, but they cannot be studied until matching content is available.</p><details><summary>View unavailable references</summary><ul>{missing.map((card, index) => <li key={index}>{card.packId} / {card.cardId}</li>)}</ul></details></div>}
  </>;
}
