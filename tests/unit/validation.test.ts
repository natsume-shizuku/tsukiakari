import { describe, expect, it } from 'vitest';
import { fixturePack } from '../../src/content/fixtures';
import { defaultPreferences, newDeckSettings } from '../../src/domain';
import { deckSettingsSchema, preferencesSchema, validateCatalog, validatePack } from '../../src/validation';

function packCopy() { return structuredClone(fixturePack); }

describe('published content validation', () => {
  it('validates original fixtures and preserves every published identity', () => {
    const valid = validatePack(fixturePack);
    expect(valid).toEqual(fixturePack);
    expect(valid.fixture).toBe(true);
    expect(valid.examEnabled).toBe(false);
    expect(valid.cards).toHaveLength(4);
    expect(valid.cards.filter(card => card.kind === 'recall')).toHaveLength(3);
    expect(valid.topics).toHaveLength(2);
    expect(valid.notes).toHaveLength(2);
  });
  it.each(['topics', 'sources', 'notes', 'cards'] as const)('rejects duplicate %s identities', field => {
    const pack = packCopy();
    pack[field].push(structuredClone(pack[field][0]) as never);
    expect(() => validatePack(pack)).toThrow(/unique/);
  });
  it('requires unique stable pack identities across the catalog', () => {
    expect(validateCatalog([fixturePack])).toEqual([fixturePack]);
    expect(() => validateCatalog([fixturePack, fixturePack])).toThrow(/Pack IDs must be unique/);
  });
  it.each(['topicId', 'sourceIds', 'noteIds'] as const)('rejects missing card %s references', field => {
    const pack = packCopy();
    if (field === 'topicId') pack.cards[0].topicId = 'missing';
    else pack.cards[0][field] = ['missing'];
    expect(() => validatePack(pack)).toThrow();
  });
  it('requires a registered source for notes and at least one source per card', () => {
    const pack = packCopy();
    pack.notes[0].sourceIds = ['missing'];
    expect(() => validatePack(pack)).toThrow(/unregistered source/);
    pack.notes[0].sourceIds = [];
    expect(() => validatePack(pack)).toThrow(/Notes need a source/);
    pack.cards[0].sourceIds = [];
    expect(() => validatePack(pack)).toThrow(/Cards need a source/);
  });
  it.each(['http://example.com', 'javascript:alert(1)', 'not a url'])('rejects unsafe source %s', url => {
    const pack = packCopy(); pack.sources[0].url = url;
    expect(() => validatePack(pack)).toThrow();
  });
  it('rejects unknown fields instead of silently dropping them', () => {
    expect(() => validatePack({ ...fixturePack, cloudSync: true })).toThrow();
    const pack = packCopy(); Object.assign(pack.cards[0], { hiddenAnswer: true });
    expect(() => validatePack(pack)).toThrow();
  });
  it('rejects blank prose, blank or padded IDs, and invalid revisions', () => {
    const pack = packCopy(); pack.cards[0].prompt = '  ';
    expect(() => validatePack(pack)).toThrow(/blank/);
    pack.cards[0].prompt = fixturePack.cards[0].prompt;
    pack.cards[0].id = ' padded ';
    expect(() => validatePack(pack)).toThrow(/padded/);
    pack.cards[0].id = 'valid'; pack.cards[0].revision = 0;
    expect(() => validatePack(pack)).toThrow();
  });
  it('checks MCQ answer-key membership and unique options', () => {
    const pack = packCopy(); const card = pack.cards[3];
    card.correctOptionId = 'absent';
    expect(() => validatePack(pack)).toThrow(/Correct option/);
    card.correctOptionId = fixturePack.cards[3].correctOptionId;
    card.options![1].id = card.options![0].id;
    expect(() => validatePack(pack)).toThrow(/Option IDs/);
  });
  it('requires two MCQ options and excludes options from recall cards', () => {
    const pack = packCopy(); pack.cards[3].options = [pack.cards[3].options![0]];
    expect(() => validatePack(pack)).toThrow(/at least two/);
    const recall = packCopy(); recall.cards[0].options = [];
    expect(() => validatePack(recall)).toThrow(/Recall cards/);
  });
  it('does not allow fixtures or undersized packs to enable exams', () => {
    const pack = packCopy(); pack.examEnabled = true;
    expect(() => validatePack(pack)).toThrow(/fixtures cannot enable/);
    pack.fixture = false;
    expect(() => validatePack(pack)).toThrow(/at least 300/);
  });
});

describe('settings contracts', () => {
  it('keeps per-deck step arrays independent', () => {
    const first = newDeckSettings(); const second = newDeckSettings();
    first.learningStepsMinutes.push(120); first.relearningStepsMinutes[0] = 30;
    expect(second.learningStepsMinutes).toEqual([1, 10, 60]);
    expect(second.relearningStepsMinutes).toEqual([10, 60]);
    expect(deckSettingsSchema.parse(second)).toEqual(second);
  });
  it('accepts defaults and rejects invalid preferences without normalization', () => {
    expect(preferencesSchema.parse(defaultPreferences())).toEqual(defaultPreferences());
    expect(() => preferencesSchema.parse({ ...defaultPreferences(), dayStartsAtHour: 24 })).toThrow();
    expect(() => preferencesSchema.parse({ ...defaultPreferences(), timeZone: 'Unknown/Region' })).toThrow();
    expect(() => deckSettingsSchema.parse({ ...newDeckSettings(), learningStepsMinutes: [0] })).toThrow();
    expect(() => deckSettingsSchema.parse({ ...newDeckSettings(), newCardsPerDay: -1 })).toThrow();
  });
});
