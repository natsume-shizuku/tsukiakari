import { useId } from 'react';
import type { HotspotQuestion as HotspotCard } from './domain';
import { AnswerResult } from './MatchQuestion';

interface Props { card: HotspotCard; placements: Record<string, string>; disabled: boolean; revealed: boolean; onChange: (placements: Record<string, string>) => void; }

export function HotspotQuestion({ card, placements, disabled, revealed, onChange }: Props) {
  const id = useId();
  if (revealed) return <section className="answer-table" aria-label={card.table.title}>
    <h3>{card.table.title}</h3>
    <dl className="answer-review">{card.rows.map(row => {
      const chosen = placements[row.id];
      const text = (optionId: string) => row.options.find(option => option.id === optionId)?.text ?? '';
      return <div key={row.id}><dt>{row.label}</dt><dd><AnswerResult chosen={chosen ? text(chosen) : null} correct={text(row.correctOptionId)} right={chosen === row.correctOptionId}/></dd></div>;
    })}</dl>
  </section>;
  return <section className="answer-table is-hotspot" aria-label={card.table.title}>
    <h3>{card.table.title}</h3>
    <div className="answer-table-head" aria-hidden="true"><span>{card.table.rowHeading}</span><span>{card.table.answerHeading}</span></div>
    {card.rows.map(row => {
      const selectId = id + row.id;
      return <div className="answer-row" key={row.id}>
        <label className="answer-row-label" htmlFor={selectId}>{row.label}</label>
        <select id={selectId} value={placements[row.id] ?? ''} disabled={disabled} onChange={event => {
          const next = { ...placements };
          if (event.target.value) next[row.id] = event.target.value; else delete next[row.id];
          onChange(next);
        }}>
          <option value="">Select an answer</option>
          {row.options.map(option => <option key={option.id} value={option.id}>{option.text}</option>)}
        </select>
      </div>;
    })}
  </section>;
}
