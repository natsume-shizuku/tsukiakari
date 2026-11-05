/**
 * Optional learner-owned backup in the hidden Google Drive app folder.
 * The browser talks to Google directly: there is no server, and tokens stay in memory.
 */
const scope = 'https://www.googleapis.com/auth/drive.appdata';
const signInScript = 'https://accounts.google.com/gsi/client';
const filesUrl = 'https://www.googleapis.com/drive/v3/files';
const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files';
const fileFields = 'id,modifiedTime,size';
export const driveBackupName = 'tsukiakari-backup.json';
const seenKey = 'tsukiakari.drive-seen';
const clientIdOverride = 'tsukiakari.driveClientId';
const unchanged = 'Your data has not changed.';

interface TokenResponse { access_token?: string; expires_in?: number; error?: string; scope?: string; }
interface TokenError { type?: string; }
interface GoogleOauth {
  initTokenClient(config: { client_id: string; scope: string; prompt: string; callback: (response: TokenResponse) => void; error_callback: (error: TokenError) => void }): { requestAccessToken(): void };
  hasGrantedAllScopes(response: TokenResponse, ...scopes: string[]): boolean;
  revoke(token: string, done?: () => void): void;
}
declare global { interface Window { google?: { accounts: { oauth2: GoogleOauth } } } }

export interface DriveFile { id: string; modifiedTime: string; size?: string; }
export class DriveError extends Error {}
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
const defaultFetch: FetchFn = (url, init) => fetch(url, init);

function configuredClientId(): string {
  const built = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (built) return built;
  try { return globalThis.localStorage?.getItem(clientIdOverride) ?? ''; } catch { return ''; }
}
/** Without a client ID the section shows as coming soon, so builds work with no Google setup. */
export const driveClientId = configuredClientId();

let token: { value: string; expiresAt: number } | null = null;
let script: Promise<void> | null = null;
export const hasDriveAccess = () => token !== null && token.expiresAt > Date.now();

function loadSignIn(): Promise<void> {
  if (window.google) return Promise.resolve();
  script ??= new Promise<void>((resolve, reject) => {
    const element = document.createElement('script');
    element.src = signInScript;
    element.async = true;
    element.onload = () => resolve();
    element.onerror = () => { element.remove(); script = null; reject(new DriveError(`Google sign-in could not be loaded. Check your connection and try again. ${unchanged}`)); };
    document.head.append(element);
  });
  return script;
}
/** Loaded ahead of the click, so browsers treat the sign-in popup as user initiated. */
export function prepareDriveSignIn() { loadSignIn().catch(() => { /* Reported when the learner uses Drive. */ }); }

function signInFailure(error: TokenError): DriveError {
  if (error.type === 'popup_closed') return new DriveError(`Google sign-in was closed before it finished. ${unchanged}`);
  if (error.type === 'popup_failed_to_open') return new DriveError(`Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again. ${unchanged}`);
  return new DriveError(`Google sign-in did not finish. ${unchanged}`);
}

/** Must run from a click: Google requires a user action for each new token. */
export async function driveAccessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  await loadSignIn();
  const oauth = window.google?.accounts.oauth2;
  if (!oauth) throw new DriveError(`Google sign-in could not be loaded. ${unchanged}`);
  return new Promise<string>((resolve, reject) => {
    oauth.initTokenClient({
      client_id: driveClientId, scope, prompt: '',
      callback: response => {
        if (response.error || !response.access_token) { reject(new DriveError(`Google sign-in did not finish. ${unchanged}`)); return; }
        if (!oauth.hasGrantedAllScopes(response, scope)) { reject(new DriveError(`Saving needs permission for this site's private Drive folder. Try again and allow it. ${unchanged}`)); return; }
        token = { value: response.access_token, expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000 };
        resolve(token.value);
      },
      error_callback: error => reject(signInFailure(error)),
    }).requestAccessToken();
  });
}
export function disconnectDrive() {
  const current = token;
  token = null;
  if (current) window.google?.accounts.oauth2.revoke(current.value);
}

async function failureReason(response: Response): Promise<string> {
  try { return JSON.stringify(await response.json()); } catch { return ''; }
}
async function request(accessToken: string, url: string, init: RequestInit, fetchFn: FetchFn): Promise<Response> {
  let response: Response;
  try {
    response = await fetchFn(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${accessToken}` } });
  } catch { throw new DriveError(`Google Drive could not be reached. Check your connection and try again. ${unchanged}`); }
  if (response.ok) return response;
  if (response.status === 401) { token = null; throw new DriveError(`Your Google sign-in has expired. Try again to sign back in. ${unchanged}`); }
  if ((await failureReason(response)).includes('storageQuotaExceeded')) throw new DriveError(`Your Google Drive is full, so the backup was not saved. ${unchanged}`);
  throw new DriveError(`Google Drive could not finish this (error ${response.status}). ${unchanged}`);
}

export async function findDriveBackup(accessToken: string, fetchFn = defaultFetch): Promise<DriveFile | null> {
  const query = new URLSearchParams({ spaces: 'appDataFolder', q: `name='${driveBackupName}' and trashed=false`, orderBy: 'modifiedTime desc', pageSize: '1', fields: `files(${fileFields})` });
  const response = await request(accessToken, `${filesUrl}?${query}`, {}, fetchFn);
  const { files } = await response.json() as { files?: DriveFile[] };
  return files?.[0] ?? null;
}
export async function saveDriveBackup(accessToken: string, json: string, existing: DriveFile | null, fetchFn = defaultFetch): Promise<DriveFile> {
  if (existing) {
    const response = await request(accessToken, `${uploadUrl}/${encodeURIComponent(existing.id)}?uploadType=media&fields=${fileFields}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: json }, fetchFn);
    return await response.json() as DriveFile;
  }
  const boundary = 'tsukiakari-' + crypto.randomUUID();
  const metadata = JSON.stringify({ name: driveBackupName, parents: ['appDataFolder'], mimeType: 'application/json' });
  const body = [`--${boundary}`, 'Content-Type: application/json; charset=UTF-8', '', metadata, `--${boundary}`, 'Content-Type: application/json', '', json, `--${boundary}--`, ''].join('\r\n');
  const response = await request(accessToken, `${uploadUrl}?uploadType=multipart&fields=${fileFields}`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }, fetchFn);
  return await response.json() as DriveFile;
}
export async function readDriveBackup(accessToken: string, file: DriveFile, fetchFn = defaultFetch): Promise<string> {
  const response = await request(accessToken, `${filesUrl}/${encodeURIComponent(file.id)}?alt=media`, {}, fetchFn);
  return response.text();
}

/** The Drive copy this browser last saved or restored. Unknown copies get a warning before being replaced. */
export function lastSeenDriveCopy(): string | null {
  try { return localStorage.getItem(seenKey); } catch { return null; }
}
export function markDriveCopySeen(modifiedTime: string) {
  try { localStorage.setItem(seenKey, modifiedTime); } catch { /* Losing this only adds a warning before the next save. */ }
}
