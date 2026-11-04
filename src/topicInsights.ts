import type { StudyCuration, StudyPack, WorkspaceSnapshot } from './domain';
import { studyPacks, studyCurations } from './content/catalog';
import { addStudyDays, getStudyDay, studyDayAsUtcNoon } from './studyDay';

export type TopicPeriod = '30' | 'all';
export interface TopicScope { deckId?: string; curationId?: string; period?: TopicPeriod; }
export interface TopicCatalog { packs: StudyPack[]; curations: StudyCuration[]; }
export interface TopicActivity {
  key: string; title: string; groupTitle: string; fixture: boolean; unavailable: boolean;
  packId?: string; curationId?: string; topicId?: string; href: string | null;
  reviews: number; again: number; right: number; againRate: number | null; distinctCards: number;
}
export interface TopicSummary { today: string; from: string | null; period: TopicPeriod; rows: TopicActivity[]; }
const cardKey = (packId: string, cardId: string) => JSON.stringify([packId, cardId]);

/** Current content determines grouping; the saved log, not a surviving deck copy, determines identity/date. */
export function getTopicStatistics(workspace: WorkspaceSnapshot, now: number, scope: TopicScope = {}, catalog: TopicCatalog = { packs: studyPacks, curations: studyCurations }): TopicSummary {
  const period = scope.period ?? '30';
  if (period !== '30' && period !== 'all') throw new Error('Choose a supported topic period.');
  const today = getStudyDay(now, workspace.preferences);
  // Clamp only at the supported calendar edge, not to a fixed millisecond duration across DST.
  const from = period === 'all' ? null : today < '0000-01-30' ? '0000-01-01' : addStudyDays(today, -29);
  const curation = scope.curationId ? catalog.curations.find(item => item.id === scope.curationId) : undefined;
  if (scope.curationId && !curation) throw new Error('The selected study pack is unavailable.');
  const rows = new Map<string, TopicActivity>();
  const membership = new Map<string, string>();
  const distinct = new Map<string, Set<string>>();
  const addRow = (row: Omit<TopicActivity, 'reviews' | 'again' | 'right' | 'againRate' | 'distinctCards'>) => {
    rows.set(row.key, { ...row, reviews: 0, again: 0, right: 0, againRate: null, distinctCards: 0 });
    distinct.set(row.key, new Set());
  };
  if (curation) {
    for (const topic of curation.topics) {
      const key = JSON.stringify(['curation', curation.id, topic.id]);
      addRow({ key, title: topic.title, groupTitle: curation.title, fixture: curation.fixture, unavailable: false,
        curationId: curation.id, topicId: topic.id,
        href: '#library/cards?curation=' + encodeURIComponent(curation.id) + '&topic=' + encodeURIComponent(topic.id) });
    }
    for (const ref of curation.cards) {
      if (catalog.packs.some(pack => pack.id === ref.packId && pack.cards.some(card => card.id === ref.cardId)))
        membership.set(cardKey(ref.packId, ref.cardId), JSON.stringify(['curation', curation.id, ref.topicId]));
    }
  } else {
    for (const pack of catalog.packs) {
      for (const topic of pack.topics) {
        const key = JSON.stringify(['pack', pack.id, topic.id]);
        addRow({ key, title: topic.title, groupTitle: pack.title, fixture: pack.fixture, unavailable: false,
          packId: pack.id, topicId: topic.id,
          href: '#library/cards?owner=' + encodeURIComponent(pack.id) + '&topic=' + encodeURIComponent(topic.id) });
      }
      for (const card of pack.cards) membership.set(cardKey(pack.id, card.id), JSON.stringify(['pack', pack.id, card.topicId]));
    }
  }
  for (const log of workspace.reviewLogs) {
    if (log.undone || !Number.isFinite(log.at) || log.at > now || (scope.deckId && log.deckId !== scope.deckId) || log.studyDay > today || (from && log.studyDay < from)) continue;
    try { studyDayAsUtcNoon(log.studyDay); } catch { continue; }
    const identity = cardKey(log.copyBefore.packId, log.copyBefore.cardId);
    let key = membership.get(identity);
    if (!key || !rows.has(key)) {
      // An absent card cannot be assumed to belong to a selected curation.
      if (curation) continue;
      const pack = catalog.packs.find(item => item.id === log.copyBefore.packId);
      key = JSON.stringify(['unavailable', log.copyBefore.packId]);
      if (!rows.has(key)) addRow({ key, title: 'Published content unavailable', groupTitle: pack?.title ?? 'Unavailable study material',
        fixture: pack?.fixture ?? false, unavailable: true, packId: log.copyBefore.packId, href: null });
    }
    const row = rows.get(key)!;
    row.reviews++;
    row[log.rating]++;
    distinct.get(key)!.add(identity);
  }
  for (const row of rows.values()) {
    row.distinctCards = distinct.get(row.key)!.size;
    row.againRate = row.reviews ? row.again / row.reviews : null;
  }
  return { today, from, period, rows: [...rows.values()] };
}
