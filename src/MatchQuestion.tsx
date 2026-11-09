import { useState } from 'react';
import type { MatchQuestion as MatchCard } from './domain';
import { AnswerBoard, DragToken, DropTarget, EmptySlot, SelectionStatus, TRAY, focusTarget, type DragData } from './dragAnswer';

interface Props { card: MatchCard; placements: Record<string, string>; disabled: boolean; revealed: boolean; onChange: (placements: Record<string, string>) => void; }

export function MatchQuestion({ card, placements, disabled, revealed, onChange }: Props) {
  const [selected, setSelected] = useState<DragData | null>(null);
  const tokenText = (id: string) => card.tokens.find(token => token.id === id)?.text ?? '';
  const rowLabel = (id: string) => card.rows.find(row => row.id === id)?.label ?? card.tray;
  const removed = (rowId: string) => { const next = { ...placements }; delete next[rowId]; return next; };
  const drop = (data: DragData, target: string | null) => {
    setSelected(null);
    if (target === null) return;
    focusTarget(target);
    if (target === TRAY) { if (data.from) onChange(removed(data.from)); return; }
    // Tokens are reusable: a tray token copies in, while a placed token moves.
    const next = data.from ? removed(data.from) : { ...placements };
    onChange({ ...next, [target]: data.tokenId });
  };
  if (revealed) return <section className="answer-table" aria-label={card.table.title}>
    <h3>{card.table.title}</h3>
    <dl className="answer-review">{card.rows.map(row => {
      const chosen = placements[row.id];
      return <div key={row.id}><dt>{row.label}</dt><dd><AnswerResult chosen={chosen ? tokenText(chosen) : null} correct={tokenText(row.correctTokenId)} right={chosen === row.correctTokenId}/></dd></div>;
    })}</dl>
  </section>;
  return <AnswerBoard onDrop={drop} describe={rowLabel}>
    <div className="drag-board">
      <DropTarget id={TRAY} label={card.tray} disabled={disabled} className="drag-tray">
        <h3>{card.tray}</h3>
        <div className="drag-tray-list">{card.tokens.map(token => {
          const data = { tokenId: token.id, text: token.text, from: null };
          return <DragToken key={token.id} id={'tray-' + token.id} data={data} disabled={disabled}
            selected={selected?.tokenId === token.id && selected.from === null}
            onSelect={() => setSelected(selected?.tokenId === token.id && selected.from === null ? null : data)}/>;
        })}</div>
      </DropTarget>
      <section className="answer-table" aria-label={card.table.title}>
        <h3>{card.table.title}</h3>
        <div className="answer-table-head" aria-hidden="true"><span>{card.table.rowHeading}</span><span>{card.table.answerHeading}</span></div>
        {card.rows.map(row => {
          const chosen = placements[row.id];
          const data = chosen ? { tokenId: chosen, text: tokenText(chosen), from: row.id } : null;
          return <div className="answer-row" key={row.id}>
            <p className="answer-row-label">{row.label}</p>
            <DropTarget id={row.id} label={row.label} disabled={disabled} className="drop-slot">
              {data ? <div className="drop-filled">
                <DragToken id={'placed-' + row.id} data={data} disabled={disabled} selected={selected?.from === row.id}
                  onSelect={() => { if (selected && selected.from !== row.id) drop(selected, row.id); else setSelected(selected ? null : data); }}/>
                {!disabled && <button type="button" className="drop-clear" aria-label={`Remove ${data.text} from ${row.label}`} onClick={() => { setSelected(null); onChange(removed(row.id)); focusTarget(row.id); }}>×</button>}
              </div> : <EmptySlot label={row.label} selected={selected} disabled={disabled} onPlace={() => drop(selected!, row.id)}/>}
            </DropTarget>
          </div>;
        })}
      </section>
    </div>
    <SelectionStatus selected={selected} target="a row"/>
  </AnswerBoard>;
}

export function AnswerResult({ chosen, correct, right }: { chosen: string | null; correct: string; right: boolean }) {
  return <>
    <p className={right ? 'answer-right' : 'answer-wrong'}><strong>{right ? 'Correct:' : 'Your answer:'}</strong> {chosen ?? 'No answer'}</p>
    {!right && <p className="answer-right"><strong>Correct answer:</strong> {correct}</p>}
  </>;
}
