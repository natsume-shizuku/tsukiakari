import { z } from 'zod';
import type { QuestionBank, StudyPack } from './domain';
import { examQuestionSchema, idSchema, questionGroupSchema, sourceSchema } from './validation.ts';
import { QUESTION_FORMATS } from './testGrading.ts';

const text = z.string().refine(value => value.trim().length > 0, 'Text must not be blank.');
const unique = (values: string[]) => new Set(values).size === values.length;
const share = z.number().finite().nonnegative().max(100);
const blueprintSchema = z.strictObject({
  defaultCount: z.number().int().min(50), caseStudyEvery: z.number().int().positive(), seriesEvery: z.number().int().positive(),
  shares: z.strictObject({ single: share, multiple: share, match: share, order: share, hotspot: share, series: share }),
});
export const questionBankSchema = z.strictObject({
  id: idSchema, version: text, title: text, description: text, fixture: z.boolean(),
  domains: z.array(z.strictObject({ id: idSchema, title: text, weight: z.number().finite().positive().max(100) })).min(1),
  sources: z.array(sourceSchema).min(1), questions: z.array(examQuestionSchema).min(1),
  groups: z.array(questionGroupSchema).optional(), blueprint: blueprintSchema.optional(),
}).superRefine((bank, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (!unique(bank.domains.map(domain => domain.id))) issue('Bank domain IDs must be unique.');
  if (Math.abs(bank.domains.reduce((total, domain) => total + domain.weight, 0) - 100) > 1e-8) issue('Bank domain weights must total 100 percent.');
  if (!unique(bank.sources.map(source => source.id))) issue('Bank source IDs must be unique.');
  if (!unique(bank.questions.map(question => question.id))) issue('Bank question IDs must be unique.');
  if (!unique(bank.questions.map(question => question.prompt.trim().toLocaleLowerCase()))) issue('Bank questions must not duplicate the same prompt.');
  for (const question of bank.questions) {
    if (!bank.domains.some(domain => domain.id === question.domainId)) issue('Question refers to an unknown bank domain.');
    if (question.sourceIds.some(id => !bank.sources.some(source => source.id === id))) issue('Question refers to an unregistered bank source.');
  }
  const groups = bank.groups ?? [];
  if (!unique(groups.map(group => group.id))) issue('Bank group IDs must be unique.');
  if (bank.questions.some(question => question.groupId !== undefined && !groups.some(group => group.id === question.groupId))) issue('Question refers to an unknown bank group.');
  for (const group of groups) {
    const members = bank.questions.filter(question => question.groupId === group.id);
    if (members.length < 2) issue('A bank group needs at least two questions.');
    if (group.kind === 'series' && members.some(question => question.kind !== 'single' || question.options.length !== 2)) issue('Series questions must be two-option single answers.');
  }
  if (bank.blueprint) {
    const total = QUESTION_FORMATS.reduce((sum, format) => sum + bank.blueprint!.shares[format], 0);
    if (Math.abs(total - 100) > 1e-8) issue('Blueprint format shares must total 100 percent.');
  }
});

export function validateQuestionBank(input: unknown): QuestionBank { return questionBankSchema.parse(input); }

/** Validate newly published banks against canonical notes, never historical attempt snapshots. */
export function validateQuestionBankReferences(bank: QuestionBank, packs: readonly StudyPack[]): void {
  const byId = new Map(packs.map(pack => [pack.id, pack]));
  for (const question of bank.questions) {
    for (const reference of question.relatedNotes) {
      const pack = byId.get(reference.packId);
      if (!pack || !pack.notes.some(note => note.id === reference.noteId)) {
        throw new Error('Question refers to an unavailable canonical note: ' + reference.packId + '/' + reference.noteId + '.');
      }
      if (!bank.fixture && pack.fixture) {
        throw new Error('A published question bank cannot reference engineering fixture notes.');
      }
    }
  }
}