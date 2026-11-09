import type { ExamQuestion, QuestionBank, QuestionFormat, QuestionGroup, TestSection } from './domain';
import { questionFormat } from './testGrading';
import { allocateDomainQuotas, shuffle } from './testSelection';

export interface AssembledExam { questions: ExamQuestion[]; groups: QuestionGroup[]; sections: TestSection[]; }
type StandaloneFormat = Exclude<QuestionFormat, 'series'>;
const STANDALONE: readonly StandaloneFormat[] = ['match', 'order', 'hotspot', 'multiple', 'single'];
const notEnough = (what: string) => new Error(`This bank does not have enough ${what} for the requested exam. No questions were substituted.`);

/** Share out a slot count in proportion to weights, by largest remainder. Zero weights get nothing. */
function shareSlots(weights: Map<StandaloneFormat, number>, slots: number): Map<StandaloneFormat, number> {
  const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
  const result = new Map<StandaloneFormat, number>(STANDALONE.map(format => [format, 0]));
  if (slots === 0) return result;
  if (total === 0) throw notEnough('standalone questions');
  const rows = [...weights].filter(([, weight]) => weight > 0).map(([id, weight]) => ({ id, weight: weight * 100 / total }));
  // Rounding must not make the weights miss 100 by more than the allocator allows.
  rows[0].weight += 100 - rows.reduce((sum, row) => sum + row.weight, 0);
  for (const [id, value] of allocateDomainQuotas(rows, slots)) result.set(id as StandaloneFormat, value);
  return result;
}

/**
 * Whole groups go first because they cannot be trimmed. Standalone formats then take the
 * remaining slots, scarcest first, always from the domain furthest below its quota.
 */
export function assembleBlueprintExam(bank: QuestionBank, count: number, lastSeen: ReadonlyMap<string, number>, random: () => number): AssembledExam {
  const blueprint = bank.blueprint;
  if (!blueprint) throw new Error('This question bank has no exam blueprint.');
  const seen = (question: ExamQuestion) => lastSeen.get(question.id) ?? -1;
  const leastSeen = (questions: ExamQuestion[]) => shuffle(questions, random).sort((a, b) => seen(a) - seen(b));
  const approved = bank.questions.filter(question => question.status === 'approved');
  const groups = bank.groups ?? [];
  const members = (group: QuestionGroup) => approved.filter(question => question.groupId === group.id);
  const pickGroups = (kind: QuestionGroup['kind'], wanted: number, label: string) => {
    const ranked = shuffle(groups.filter(group => group.kind === kind && members(group).length >= 2), random)
      .sort((a, b) => Math.max(...members(a).map(seen)) - Math.max(...members(b).map(seen)));
    if (ranked.length < wanted) throw notEnough(label);
    return ranked.slice(0, wanted);
  };
  // Exams are long enough for at least one of each. Short practice tests simply leave them out.
  const cases = pickGroups('case-study', Math.round(count / blueprint.caseStudyEvery), 'whole case studies');
  const series = pickGroups('series', Math.round(count / blueprint.seriesEvery), 'whole question series');
  const chosenGroups = [...cases, ...series];
  const grouped = chosenGroups.flatMap(members);
  if (grouped.length > count) throw notEnough('room for whole case studies at this question count');

  const domainTargets = allocateDomainQuotas(bank.domains, count);
  const domainCounts = new Map(bank.domains.map(domain => [domain.id, 0]));
  const tally = (question: ExamQuestion, by: number) => domainCounts.set(question.domainId, domainCounts.get(question.domainId)! + by);
  grouped.forEach(question => tally(question, 1));
  const deficit = (domainId: string) => domainTargets.get(domainId)! - domainCounts.get(domainId)!;

  const formatRows = Object.entries(blueprint.shares).filter(([, weight]) => weight > 0).map(([id, weight]) => ({ id, weight }));
  const formatTargets = allocateDomainQuotas(formatRows, count);
  const placed = (format: StandaloneFormat) => grouped.filter(question => questionFormat(question, groups) === format).length;
  const needs = new Map(STANDALONE.map(format => [format, Math.max(0, (formatTargets.get(format) ?? 0) - placed(format))]));
  const anyNeed = [...needs.values()].some(need => need > 0);
  const slots = shareSlots(anyNeed ? needs : new Map(STANDALONE.map(format => [format, blueprint.shares[format]])), count - grouped.length);

  const pools = new Map(STANDALONE.map(format => [format, leastSeen(approved.filter(question => question.groupId === undefined && question.kind === format))]));
  const selected: ExamQuestion[] = [];
  const scarcestFirst = [...STANDALONE].sort((a, b) => pools.get(a)!.length / (slots.get(a)! || 1) - pools.get(b)!.length / (slots.get(b)! || 1));
  for (const format of scarcestFirst) {
    const pool = pools.get(format)!;
    for (let slot = 0; slot < slots.get(format)!; slot++) {
      if (!pool.length) throw notEnough(format + ' questions');
      let best = 0;
      for (let index = 1; index < pool.length; index++) if (deficit(pool[index].domainId) > deficit(pool[best].domainId)) best = index;
      const [question] = pool.splice(best, 1);
      selected.push(question);
      tally(question, 1);
    }
  }

  // Same-format swaps correct any domain the greedy pass left more than one away from quota.
  for (let guard = 0; guard <= count * bank.domains.length; guard++) {
    const domains = [...bank.domains].sort((a, b) => deficit(b.id) - deficit(a.id));
    const under = domains[0], over = domains[domains.length - 1];
    if (deficit(under.id) <= 1 && deficit(over.id) >= -1) break;
    let swapped = false;
    for (let index = 0; index < selected.length && !swapped; index++) {
      const question = selected[index];
      if (question.domainId !== over.id) continue;
      const pool = pools.get(question.kind as StandaloneFormat)!;
      const replacement = pool.findIndex(item => item.domainId === under.id);
      if (replacement < 0) continue;
      const [incoming] = pool.splice(replacement, 1, question);
      selected[index] = incoming;
      tally(question, -1);
      tally(incoming, 1);
      swapped = true;
    }
    if (!swapped) break;
  }
  if (bank.domains.some(domain => Math.abs(deficit(domain.id)) > 1)) throw notEnough('questions in each domain');

  const general = shuffle(selected, random);
  const sections: TestSection[] = [];
  if (general.length) sections.push({ id: 'section-general', kind: 'general', title: 'Questions', cardIds: general.map(question => question.id) });
  for (const group of chosenGroups) {
    sections.push({ id: 'section-' + group.id, kind: group.kind, title: group.title, groupId: group.id, cardIds: members(group).map(question => question.id) });
  }
  return { questions: [...general, ...chosenGroups.flatMap(members)], groups: chosenGroups, sections };
}

/** The largest exam the pool supports, so setup can state it instead of failing on start. */
export function maxBlueprintCount(bank: QuestionBank, minimum = 50): number {
  const approved = bank.questions.filter(question => question.status === 'approved').length;
  for (let count = approved; count >= minimum; count--) {
    try { assembleBlueprintExam(bank, count, new Map(), () => 0); return count; } catch { /* Try a smaller exam. */ }
  }
  return 0;
}
