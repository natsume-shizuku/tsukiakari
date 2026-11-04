/** Per-turn elapsed time excludes background periods and inactivity beyond 30 seconds. */
export function createActiveTimer(start: number, saved = 0, initiallyActive = true) {
  let total = saved;
  let last = start;
  let activity = start;
  let active = initiallyActive;
  const read = (now: number) => {
    if (active) total += Math.max(0, Math.min(now, activity + 30_000) - last);
    last = now;
    total = Math.min(total, 86_400_000);
    return Math.round(total);
  };
  return {
    read,
    interact(now: number) { read(now); activity = now; },
    setActive(now: number, next: boolean) {
      read(now);
      if (!active && next) activity = now;
      active = next;
    },
  };
}
