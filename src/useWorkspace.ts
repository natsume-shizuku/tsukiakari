import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkspaceSnapshot } from './domain';
import { loadWorkspace } from './storage';

type Access = 'loading' | 'writer' | 'readonly' | 'unavailable';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [access, setAccess] = useState<Access>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const writeInFlight = useRef(false);
  const ownsLock = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const read = async (nextAccess: Access) => {
      try {
        const snapshot = await loadWorkspace();
        if (!cancelled) {
          setWorkspace(snapshot);
          setAccess(nextAccess);
        }
      } catch {
        if (!cancelled) {
          setAccess('unavailable');
          setError('Browser storage could not be opened safely. Your saved data has not been reset. Check browser storage permissions, then reload this page.');
        }
      }
    };
    const start = async () => {
      // Let StrictMode's initial setup/cleanup finish before requesting a real lock.
      await Promise.resolve();
      if (cancelled) return;
      if (!navigator.locks) {
        await read('unavailable');
        if (!cancelled) setError('This browser cannot protect your data across tabs. Viewing is available, but saving requires a browser with Web Locks support.');
        return;
      }
      try {
        await navigator.locks.request('tsukiakari-writer', { ifAvailable: true }, async (lock) => {
          if (cancelled) return;
          ownsLock.current = Boolean(lock);
          await read(lock ? 'writer' : 'readonly');
          if (lock) await held;
        });
      } catch {
        if (!cancelled) {
          ownsLock.current = false;
          setAccess('unavailable');
          setError('A secure connection is required to save in this browser. Your saved data has not been changed. Open the site over HTTPS or localhost, then reload.');
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
      mounted.current = false;
      ownsLock.current = false;
      release?.();
    };
  }, []);

  const mutate = useCallback(async (operation: () => Promise<unknown>, success: string): Promise<boolean> => {
    if (!ownsLock.current || access !== 'writer' || writeInFlight.current) return false;
    writeInFlight.current = true;
    setBusy(true);
    setError(null);
    setMessage('');
    let saved = false;
    try {
      await operation();
      saved = true;
      const snapshot = await loadWorkspace();
      if (mounted.current) {
        setWorkspace(snapshot);
        setMessage(success);
      }
      return true;
    } catch (cause) {
      if (mounted.current) {
        // Clear the lock flag at once: access only updates on the next render.
        if (saved) { ownsLock.current = false; setAccess('unavailable'); }
        setError(saved
          ? 'The save completed, but the updated collection could not be read. Reload to see the current state. Your data has not been reset.'
          : `The change could not be saved. Your previous data is unchanged. ${cause instanceof Error ? cause.message : 'Please try again.'}`);
      }
      return false;
    } finally {
      writeInFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [access]);

  return { workspace, access, busy, error, message, mutate, canWrite: access === 'writer' && !busy };
}

