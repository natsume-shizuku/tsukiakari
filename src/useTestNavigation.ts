import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, RefObject } from 'react';

/** Reveal site navigation while its measured height keeps the test controls below it. */
export function useTestNavigation(active: boolean, header: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const pinnedRef = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const hoverOnly = useRef(false);
  const suppressHover = useRef(false);
  const revealTimer = useRef<number | undefined>(undefined);
  const hovered = useRef(new Set<HTMLElement>());
  const timer = useRef<number | undefined>(undefined);
  const cancelReveal = useCallback(() => { window.clearTimeout(revealTimer.current); }, []);
  const dismiss = useCallback(() => { pinnedRef.current = false; setPinned(false); suppressHover.current = true; hovered.current.clear(); setOpen(false); }, []);
  const cancelClose = useCallback(() => { window.clearTimeout(timer.current); }, []);
  const scheduleClose = useCallback(() => {
    cancelClose();
    timer.current = window.setTimeout(() => {
      if (!pinnedRef.current && !hovered.current.size && !header.current?.contains(document.activeElement)) setOpen(false);
    }, 200);
  }, [cancelClose, header]);
  useEffect(() => {
    setOpen(false);
    pinnedRef.current = false;
    setPinned(false);
    hovered.current.clear();
    suppressHover.current = false;
    cancelClose();
    cancelReveal();
    return () => { cancelClose(); cancelReveal(); };
  }, [active, cancelClose, cancelReveal]);
  useEffect(() => {
    if (!active) return;
    const rearm = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Element && !trigger.current?.contains(event.target) && !event.target.closest('.site-nav-edge')) suppressHover.current = false;
    };
    document.addEventListener('pointermove', rearm);
    return () => document.removeEventListener('pointermove', rearm);
  }, [active]);
  useEffect(() => {
    if (!active || !open) return;
    const outside = (event: globalThis.MouseEvent) => {
      if (pinnedRef.current) return;
      if (!(event.target instanceof Node) || header.current?.contains(event.target) || trigger.current?.contains(event.target)) return;
      if (event.target instanceof Element && event.target.closest('.site-nav-edge')) return;
      cancelClose();
      dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      cancelClose();
      dismiss();
      trigger.current?.focus({ preventScroll: true });
    };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('click', outside); document.removeEventListener('keydown', escape); };
  }, [active, open, cancelClose, dismiss, header]);
  const enter = (event: PointerEvent<HTMLElement>) => {
    if (!active || suppressHover.current || event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover)').matches) return;
    hovered.current.add(event.currentTarget);
    cancelClose();
    const reveal = () => setOpen(previous => { if (!previous) hoverOnly.current = true; return true; });
    cancelReveal();
    if (event.currentTarget === trigger.current) revealTimer.current = window.setTimeout(reveal, 150);
    else reveal();
  };
  const leave = (event: PointerEvent<HTMLElement>) => { cancelReveal(); hovered.current.delete(event.currentTarget); scheduleClose(); };
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    cancelClose();
    cancelReveal();
    const opening = !open || (event.currentTarget === trigger.current && hoverOnly.current);
    hoverOnly.current = false;
    if (opening) { suppressHover.current = false; setOpen(true); } else dismiss();
    if (!opening) trigger.current?.focus({ preventScroll: true });
    if (opening && event.detail === 0) requestAnimationFrame(() => header.current?.querySelector<HTMLAnchorElement>('nav a')?.focus({ preventScroll: true }));
  };
  const togglePin = (event: MouseEvent<HTMLButtonElement>) => {
    cancelClose();
    cancelReveal();
    hoverOnly.current = false;
    if (pinnedRef.current) {
      dismiss();
      if (event.detail === 0) trigger.current?.focus({ preventScroll: true });
    } else {
      pinnedRef.current = true;
      setPinned(true);
      suppressHover.current = false;
      setOpen(true);
    }
  };
  return { revealed: active && open, pinned, trigger, enter, leave, toggle, togglePin, cancelClose, scheduleClose };
}
