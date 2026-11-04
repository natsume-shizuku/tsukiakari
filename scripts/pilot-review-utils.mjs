import { createHash } from 'node:crypto';
export function contentFingerprint(item, editorial, sources) {
  const usedSources = item.sourceIds.map(id => sources.find(source => source.id === id));
  if (usedSources.some(source => !source)) throw new Error('Missing source while fingerprinting ' + item.id);
  return createHash('sha256').update(JSON.stringify({ item, editorial, sources: usedSources })).digest('hex');
}
export function pilotItems(bundle) { return [...bundle.notes, ...bundle.cards, ...bundle.questions]; }
