import { describe, expect, it } from 'vitest';
import { studyPacks, findPublishedCard } from '../../src/content/catalog';
import { collectionFixturePack } from '../../src/content/collectionFixtures';
import { fixturePack } from '../../src/content/fixtures';
import { validateCatalog } from '../../src/validation';

describe('collection-scale engineering fixtures', () => {
  it('adds an independent fixture pack without changing the foundation fixtures', () => {
    expect(validateCatalog(studyPacks)).toEqual(studyPacks);
    expect(studyPacks.filter(pack => pack.fixture).map(pack => pack.id)).toEqual(['developer-foundation-fixture', 'developer-collection-fixture']);
    expect(fixturePack.cards).toHaveLength(4);
    expect(fixturePack.notes).toHaveLength(2);
    expect(collectionFixturePack.fixture).toBe(true);
    expect(collectionFixturePack.examEnabled).toBe(false);
    expect(collectionFixturePack.cards).toHaveLength(120);
    expect(collectionFixturePack.notes).toHaveLength(40);
    expect(collectionFixturePack.topics).toHaveLength(4);
    expect(collectionFixturePack.cards.filter(card => card.kind === 'recall')).toHaveLength(60);
    expect(collectionFixturePack.cards.filter(card => card.kind === 'mcq')).toHaveLength(60);
  });

  it('has distinct prompts, correct arithmetic, and unambiguous multiple-choice options', () => {
    expect(new Set(collectionFixturePack.cards.map(card => card.prompt)).size).toBe(120);
    for (const card of collectionFixturePack.cards) {
      const match = card.prompt.match(/What is (\d+) \+ (\d+)\?/);
      expect(match).not.toBeNull();
      expect(card.answer).toBe(String(Number(match![1]) + Number(match![2])));
      if (card.kind === 'mcq') {
        expect(card.options).toHaveLength(4);
        expect(new Set(card.options!.map(option => option.text)).size).toBe(4);
        expect(card.options!.find(option => option.id === card.correctOptionId)?.text).toBe(card.answer);
      }
      expect(findPublishedCard({ packId: collectionFixturePack.id, cardId: card.id })?.card).toEqual(card);
      expect(findPublishedCard({ packId: fixturePack.id, cardId: card.id })).toBeUndefined();
    }
  });

  it('gives every note three linked cards and every topic thirty cards', () => {
    for (const note of collectionFixturePack.notes) {
      expect(collectionFixturePack.cards.filter(card => card.noteIds.includes(note.id))).toHaveLength(3);
    }
    for (const topic of collectionFixturePack.topics) {
      expect(collectionFixturePack.cards.filter(card => card.topicId === topic.id)).toHaveLength(30);
    }
    expect(collectionFixturePack.cards[0].id).toBe('collection-card-001');
    expect(collectionFixturePack.cards.at(-1)?.id).toBe('collection-card-120');
  });
});
