import { describe, expect, it, vi } from 'vitest';
import { DriveError, driveBackupName, findDriveBackup, readDriveBackup, saveDriveBackup } from '../../src/driveBackup';

const file = { id: 'file 1', modifiedTime: '2026-11-05T01:00:00.000Z' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const calls = (fetchFn: ReturnType<typeof vi.fn>) => fetchFn.mock.calls as [string, RequestInit][];

describe('Google Drive backup requests', () => {
  it('looks only in the hidden app folder, newest copy first, and sends the token', async () => {
    const fetchFn = vi.fn(async () => json({ files: [file] }));
    expect(await findDriveBackup('token', fetchFn)).toEqual(file);
    const [url, init] = calls(fetchFn)[0];
    const params = new URL(url).searchParams;
    expect(params.get('spaces')).toBe('appDataFolder');
    expect(params.get('q')).toContain(driveBackupName);
    expect(params.get('orderBy')).toBe('modifiedTime desc');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token');
  });
  it('reports when there is no backup', async () => {
    expect(await findDriveBackup('token', vi.fn(async () => json({ files: [] })))).toBeNull();
  });
  it('creates the first backup inside the app folder', async () => {
    const fetchFn = vi.fn(async () => json(file));
    await saveDriveBackup('token', '{"backup":true}', null, fetchFn);
    const [url, init] = calls(fetchFn)[0];
    expect(init.method).toBe('POST');
    expect(url).toContain('uploadType=multipart');
    expect(init.body).toContain('"parents":["appDataFolder"]');
    expect(init.body).toContain('{"backup":true}');
    const boundary = /boundary=(.+)$/.exec((init.headers as Record<string, string>)['Content-Type'])![1];
    expect(init.body).toContain(`--${boundary}--`);
  });
  it('replaces the existing file rather than adding another', async () => {
    const fetchFn = vi.fn(async () => json(file));
    await saveDriveBackup('token', '{"backup":true}', file, fetchFn);
    const [url, init] = calls(fetchFn)[0];
    expect(init.method).toBe('PATCH');
    expect(url).toContain('/file%201?uploadType=media');
    expect(init.body).toBe('{"backup":true}');
  });
  it('downloads the file contents', async () => {
    const fetchFn = vi.fn(async () => new Response('{"saved":1}'));
    expect(await readDriveBackup('token', file, fetchFn)).toBe('{"saved":1}');
    expect(calls(fetchFn)[0][0]).toContain('/file%201?alt=media');
  });
  it.each([
    [() => json({}, 401), /sign-in has expired/],
    [() => json({ error: { errors: [{ reason: 'storageQuotaExceeded' }] } }, 403), /Drive is full/],
    [() => json({}, 500), /error 500/],
  ])('explains failures and promises nothing changed', async (reply, message) => {
    const attempt = findDriveBackup('token', vi.fn(async () => reply()));
    await expect(attempt).rejects.toThrow(DriveError);
    await expect(attempt).rejects.toThrow(message);
    await expect(attempt).rejects.toThrow(/has not changed/);
  });
  it('treats a network failure the same way', async () => {
    await expect(findDriveBackup('token', vi.fn(async () => { throw new TypeError('offline'); }))).rejects.toThrow(/could not be reached/);
  });
});
