import { sel } from '../support/selection';
import { fixturePack } from '../../src/content/fixtures';
import { describe, expect, it } from 'vitest';
import { engineeringQuestionBank as bank } from '../../src/content/engineeringQuestionBank';
import { validateQuestionBank, validateQuestionBankReferences } from '../../src/questionBankValidation';

describe('question-bank publication structure', () => {
  it.each(['duplicate-question', 'duplicate-prompt', 'unknown-domain', 'unknown-source', 'duplicate-domain', 'weight-total', 'weight-zero', 'missing-rationale', 'wrong-answer', 'single-multiple', 'multiple-single', 'duplicate-answer', 'duplicate-option'])('rejects %s', variant => {
    const input = structuredClone(bank);
    const single = input.questions.find(question => question.kind === 'single')!;
    const multi = input.questions.find(question => question.kind === 'multiple')!;
    if (variant === 'duplicate-question') input.questions[1].id = input.questions[0].id;
    if (variant === 'duplicate-prompt') input.questions[1].prompt = input.questions[0].prompt;
    if (variant === 'unknown-domain') single.domainId = 'unknown';
    if (variant === 'unknown-source') single.sourceIds = ['unknown'];
    if (variant === 'duplicate-domain') input.domains[1].id = input.domains[0].id;
    if (variant === 'weight-total') input.domains[0].weight++;
    if (variant === 'weight-zero') input.domains[0].weight = 0;
    if (variant === 'missing-rationale') delete single.optionExplanations[sel(single).options[0].id];
    if (variant === 'wrong-answer') sel(single).correctOptionIds = ['unknown'];
    if (variant === 'single-multiple') sel(single).correctOptionIds = sel(single).options.slice(0, 2).map(option => option.id);
    if (variant === 'multiple-single') sel(multi).correctOptionIds = [sel(multi).correctOptionIds[0]];
    if (variant === 'duplicate-answer') sel(multi).correctOptionIds[1] = sel(multi).correctOptionIds[0];
    if (variant === 'duplicate-option') sel(single).options[1].id = sel(single).options[0].id;
    expect(() => validateQuestionBank(input)).toThrow();
  });
  it('permits a draft inventory without mistaking it for exam eligibility', () => {
    const draft = structuredClone(bank);
    draft.fixture = false; draft.questions = draft.questions.slice(0, 2);
    draft.questions.forEach(question => { question.status = 'draft'; });
    expect(validateQuestionBank(draft).questions).toHaveLength(2);
  });
});

describe('question-bank canonical note references', () => {
  const referencedBank = () => {
    const input = structuredClone(bank);
    input.questions[0].relatedNotes = [{ packId: fixturePack.id, noteId: fixturePack.notes[0].id }];
    return input;
  };
  it('accepts exact canonical references without rewriting their identities', () => {
    const input = referencedBank();
    const before = structuredClone(input);
    expect(() => validateQuestionBankReferences(input, [fixturePack])).not.toThrow();
    expect(input).toEqual(before);
  });
  it.each(['missing-pack', 'missing-note', 'curation-id'])('rejects %s references', variant => {
    const input = referencedBank();
    const ref = input.questions[0].relatedNotes[0];
    if (variant === 'missing-note') ref.noteId = 'unavailable-note';
    else ref.packId = variant === 'curation-id' ? 'developer-shared-foundations' : 'unavailable-pack';
    expect(() => validateQuestionBankReferences(input, [fixturePack])).toThrow(/canonical note/);
  });
  it('rejects fixture notes in real banks but accepts real canonical notes', () => {
    const input = referencedBank(); input.fixture = false;
    expect(() => validateQuestionBankReferences(input, [fixturePack])).toThrow(/fixture notes/);
    expect(() => validateQuestionBankReferences(input, [{ ...fixturePack, fixture: false }])).not.toThrow();
  });
});