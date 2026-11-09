import type { ExamQuestion, SelectionQuestion } from './domain';
import { HotspotQuestion } from './HotspotQuestion';
import { MatchQuestion } from './MatchQuestion';
import { OrderQuestion } from './OrderQuestion';
import './exam-runner.css';

interface Props { card: Exclude<ExamQuestion, SelectionQuestion>; placements: Record<string, string>; disabled: boolean; revealed: boolean; onChange: (placements: Record<string, string>) => void; }

/** Loaded on demand so the drag library only reaches browsers that open a simulator test. */
export default function PlacedAnswer({ card, ...rest }: Props) {
  if (card.kind === 'match') return <MatchQuestion card={card} {...rest}/>;
  if (card.kind === 'order') return <OrderQuestion card={card} {...rest}/>;
  return <HotspotQuestion card={card} {...rest}/>;
}
