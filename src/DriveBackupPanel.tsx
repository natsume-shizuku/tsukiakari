import { useEffect, useState } from 'react';
import { disconnectDrive, DriveError, driveAccessToken, driveClientId, findDriveBackup, hasDriveAccess, lastSeenDriveCopy, markDriveCopySeen, prepareDriveSignIn, readDriveBackup, saveDriveBackup } from './driveBackup';

const when = (time: string) => new Date(time).toLocaleString('en');
const failure = (cause: unknown) => cause instanceof DriveError ? cause.message : 'Google Drive could not finish this. Your data has not changed.';

export function DriveBackupPanel({ canSave, canRestore, createBackupJson, onPreview, refresh }: {
  canSave: boolean; canRestore: boolean; createBackupJson: () => Promise<string>;
  onPreview: (json: string, modifiedTime: string) => void; refresh: number;
}) {
  const [working, setWorking] = useState(false);
  const [connected, setConnected] = useState(hasDriveAccess);
  const [lastCopy, setLastCopy] = useState(lastSeenDriveCopy);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { if (driveClientId) prepareDriveSignIn(); }, []);
  useEffect(() => { setLastCopy(lastSeenDriveCopy()); }, [refresh]);

  // Until a client ID is configured this is only a placeholder: nothing contacts Google.
  if (!driveClientId) return <section className="transfer-drive" aria-labelledby="drive-backup-title">
    <h3 id="drive-backup-title">Google Drive backup</h3>
    <p><span className="fixture-badge">Coming soon</span> Keep a copy in a private folder in your own Google Drive, then restore it on another device. This isn't available yet, so use Export full backup for now.</p>
    <div className="transfer-actions">
      <button className="button secondary" disabled>Save to Drive</button>
      <button className="button secondary" disabled>Restore from Drive</button>
    </div>
  </section>;

  const run = async (work: (token: string) => Promise<void>) => {
    setWorking(true); setError(''); setNotice('');
    try {
      const token = await driveAccessToken();
      setConnected(true);
      await work(token);
    } catch (cause) {
      setError(failure(cause));
      setConnected(hasDriveAccess());
    } finally { setWorking(false); }
  };
  const save = () => run(async token => {
    const existing = await findDriveBackup(token);
    if (existing && existing.modifiedTime !== lastSeenDriveCopy() && !window.confirm(`Google Drive has a backup from ${when(existing.modifiedTime)} that this browser has not restored. Saving replaces it with the data in this browser. Replace it?`)) {
      setNotice('Nothing was saved. Your Google Drive backup is unchanged.');
      return;
    }
    const file = await saveDriveBackup(token, await createBackupJson(), existing);
    markDriveCopySeen(file.modifiedTime);
    setLastCopy(file.modifiedTime);
    setNotice('Saved to Google Drive.');
  });
  const restore = () => run(async token => {
    const existing = await findDriveBackup(token);
    if (!existing) { setNotice('No backup was found in this Google Drive yet.'); return; }
    onPreview(await readDriveBackup(token, existing), existing.modifiedTime);
    setNotice(`Backup from ${when(existing.modifiedTime)} is ready to review below. Nothing has changed yet.`);
  });
  const disconnect = () => { disconnectDrive(); setConnected(false); setNotice('Disconnected from Google. Your Drive backup stays in your Drive.'); setError(''); };

  return <section className="transfer-drive" aria-labelledby="drive-backup-title">
    <h3 id="drive-backup-title">Google Drive backup</h3>
    <p>Keep a copy in a private folder in your own Google Drive, then restore it on another device. Tsukiakari has no server and never sees this data. Saving replaces the previous copy, and nothing saves automatically.</p>
    <p className="fine-print">{lastCopy ? `Last saved or restored here: ${when(lastCopy)}.` : 'Not saved from this browser yet.'} You can delete this copy under Manage apps in your Google Drive settings.</p>
    <div className="transfer-actions">
      <button className="button secondary" disabled={!canSave || working} onClick={() => { void save(); }}>Save to Drive</button>
      <button className="button secondary" disabled={!canRestore || working} onClick={() => { void restore(); }}>Restore from Drive</button>
      {connected && <button className="button secondary" disabled={working} onClick={disconnect}>Disconnect Google</button>}
    </div>
    {error && <p role="alert" className="notice error">{error}</p>}
    {notice && <p role="status" className="notice">{notice}</p>}
  </section>;
}
