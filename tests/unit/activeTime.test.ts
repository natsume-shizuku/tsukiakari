import { describe, expect, it } from 'vitest';
import { createActiveTimer } from '../../src/activeTime';

describe('active review timing', () => {
  it('counts active intervals once and caps an unattended card at thirty seconds', () => {
    const timer = createActiveTimer(0);
    expect(timer.read(10_000)).toBe(10_000);
    expect(timer.read(40_000)).toBe(30_000);
    expect(timer.read(120_000)).toBe(30_000);
    timer.interact(120_000);
    expect(timer.read(125_000)).toBe(35_000);
  });
  it('excludes blur, background and time before a readonly tab gains focus', () => {
    const timer = createActiveTimer(0, 0, false);
    expect(timer.read(60_000)).toBe(0);
    timer.setActive(60_000, true);
    timer.setActive(70_000, false);
    expect(timer.read(200_000)).toBe(10_000);
    timer.setActive(200_000, true);
    expect(timer.read(205_000)).toBe(15_000);
  });
  it('resumes previously accumulated time without counting the pause or reload gap', () => {
    const before = createActiveTimer(0);
    const saved = before.read(5_000);
    const resumed = createActiveTimer(100_000, saved);
    expect(resumed.read(105_000)).toBe(10_000);
  });
  it('does not extend the idle deadline on redundant visibility notifications', () => {
    const timer = createActiveTimer(0);
    timer.setActive(20_000, true);
    expect(timer.read(50_000)).toBe(30_000);
  });
});
