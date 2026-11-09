/** Selection helpers shared by random draws and blueprint assembly. */
export function shuffle<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error('Invalid random value.');
    const other = Math.floor(draw * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** Largest remainders win; equal fractions retain the declared order. */
export function allocateDomainQuotas(domains: readonly { id: string; title?: string; weight: number }[], count: number): Map<string, number> {
  if (!Number.isSafeInteger(count) || count < 1 || !domains.length ||
      domains.some(domain => !Number.isFinite(domain.weight) || domain.weight <= 0) ||
      new Set(domains.map(domain => domain.id)).size !== domains.length ||
      Math.abs(domains.reduce((sum, domain) => sum + domain.weight, 0) - 100) > 1e-8) {
    throw new Error('Domain quotas require a positive count and weights totaling 100 percent.');
  }
  const rows = domains.map((domain, index) => {
    // Whole-number units keep equal remainders equal, so ties follow domain order.
    const units = Math.round(count * domain.weight * 1e6);
    const remainder = units % 1e8;
    return { id: domain.id, count: (units - remainder) / 1e8, remainder, index };
  });
  const remaining = count - rows.reduce((sum, row) => sum + row.count, 0);
  const ordered = [...rows].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index++) ordered[index].count++;
  return new Map(rows.map(row => [row.id, row.count]));
}
