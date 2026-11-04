import type { Deck, LearningCopy, PublishedCard, SchedulerState } from './domain';

export function CardBadges({ card, copies, decks, states, id }: {
  id: string;
  card: PublishedCard; copies: LearningCopy[]; decks: Deck[]; states: Map<string, SchedulerState>;
}) {
  const deckNames = (items: LearningCopy[]) => items.map(copy => decks.find(deck => deck.id === copy.deckId)?.name ?? 'Unavailable deck').join(', ');
  const stages = ['new', 'learning', 'review', 'relearning'] as const;
  const labels = { new: 'New', learning: 'Learning', review: 'Review', relearning: 'Relearning' };
  const suspended = copies.filter(copy => copy.suspended);
  const tags = new Map<string, { label: string; origins: string[] }>();
  const addTag = (label: string, origin: string) => {
    const key = label.toLocaleLowerCase('en');
    const entry = tags.get(key) ?? { label, origins: [] };
    if (!entry.origins.includes(origin)) entry.origins.push(origin);
    tags.set(key, entry);
  };
  card.tags.forEach(tag => addTag(tag, 'Published tag'));
  copies.forEach(copy => copy.tags.forEach(tag => addTag(tag, 'Tag in ' + deckNames([copy]))));
  return <span className="card-badges" id={id}>
    <span className="card-badge badge-type" title="Card type">{card.kind === 'mcq' ? 'Multiple choice' : 'Recall'}</span>
    {!copies.length && <span className="card-badge badge-unadded">Not in a deck</span>}
    {stages.map(stage => {
      const matching = copies.filter(copy => (states.get(copy.id)?.state ?? 'new') === stage);
      return matching.length ? <span key={stage} className={'card-badge badge-status badge-' + stage} title={labels[stage] + ' in: ' + deckNames(matching)}>{labels[stage]}{copies.length > 1 && ' · ' + matching.length}</span> : null;
    })}
    {!!suspended.length && <span className="card-badge badge-suspended" title={'Suspended in: ' + deckNames(suspended)}>Suspended{copies.length > 1 && ' · ' + suspended.length}</span>}
    {[...tags.entries()].map(([key, tag]) => <span key={key} className={'card-badge badge-tag' + (key === 'leech' ? ' badge-leech' : '')} title={tag.origins.join('; ')}>#{tag.label}<span className="sr-only"> ({tag.origins.join("; ")})</span></span>)}
  </span>;
}
