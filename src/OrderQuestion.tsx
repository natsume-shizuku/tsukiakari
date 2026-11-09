import { useState } from 'react';
import type { OrderQuestion as OrderCard } from './domain';
import { AnswerBoard, DragToken, DropTarget, EmptySlot, SelectionStatus, TRAY, focusTarget, type DragData } from './dragAnswer';
import { AnswerResult } from './MatchQuestion';
import { orderPositionId } from './testGrading';

interface Props { card: OrderCard; placements: Record<string, string>; disabled: boolean; revealed: boolean; onChange: (placements: Record<string, string>) => void; }

export function OrderQuestion({ card, placements, disabled, revealed, onChange }: Props) {
  const [selected, setSelected] = useState<DragData | null>(null);
  const tokenText = (id: string) => card.tokens.find(token => token.id === id)?.text ?? '';
  const positions = card.correctOrder.map((_, index) => orderPositionId(index));
  const positionLabel = (id: string) => id === TRAY ? card.tray : 'Position ' + (positions.indexOf(id) + 1);
  const used = new Set(Object.values(placements));
  const drop = (data: DragData, target: string | null) => {
    setSelected(null);
    if (target === null) return;
    focusTarget(target);
    const next = { ...placements };
    if (data.from) delete next[data.from];
    if (target !== TRAY) {
      // Dropping on a filled position swaps a placed token, or sends the old one back to the tray.
      const displaced = next[target];
      if (displaced && data.from) next[data.from] = displaced;
      next[target] = data.tokenId;
    }
    onChange(next);
  };
  const swap = (index: number, by: number) => {
    const here = positions[index], there = positions[index + by];
    const next = { ...placements };
    const moving = next[here], other = next[there];
    delete next[here]; delete next[there];
    if (moving) next[there] = moving;
    if (other) next[here] = other;
    setSelected(null);
    onChange(next);
    // The move buttons stay where they are, so focus follows the item to its new position.
    focusTarget(there, true);
  };
  if (revealed) return <section className="answer-table" aria-label="Answer area">
    <h3>Answer area</h3>
    <ol className="answer-review">{card.correctOrder.map((correct, index) => {
      const chosen = placements[positions[index]];
      return <li key={correct}><AnswerResult chosen={chosen ? tokenText(chosen) : null} correct={tokenText(correct)} right={chosen === correct}/></li>;
    })}</ol>
  </section>;
  return <AnswerBoard onDrop={drop} describe={positionLabel}>
    <div className="drag-board">
      <DropTarget id={TRAY} label={card.tray} disabled={disabled} className="drag-tray">
        <h3>{card.tray}</h3>
        <div className="drag-tray-list">{card.tokens.filter(token => !used.has(token.id)).map(token => {
          const data = { tokenId: token.id, text: token.text, from: null };
          return <DragToken key={token.id} id={'tray-' + token.id} data={data} disabled={disabled}
            selected={selected?.tokenId === token.id}
            onSelect={() => setSelected(selected?.tokenId === token.id ? null : data)}/>;
        })}</div>
      </DropTarget>
      <section className="answer-table" aria-label="Answer area">
        <h3>Answer area</h3>
        <ol className="answer-order">{positions.map((position, index) => {
          const chosen = placements[position];
          const data = chosen ? { tokenId: chosen, text: tokenText(chosen), from: position } : null;
          const label = positionLabel(position);
          return <li key={position} className="answer-order-row">
            <span className="answer-order-number" aria-hidden="true">{index + 1}</span>
            <DropTarget id={position} label={label} disabled={disabled} className="drop-slot">
              {data ? <div className="drop-filled">
                <DragToken id={'placed-' + position} data={data} disabled={disabled} selected={selected?.from === position}
                  onSelect={() => { if (selected && selected.from !== position) drop(selected, position); else setSelected(selected ? null : data); }}/>
                {!disabled && <div className="order-controls">
                  <button type="button" className="drop-clear" disabled={index === 0} aria-label={`Move ${data.text} up`} onClick={() => swap(index, -1)}>↑</button>
                  <button type="button" className="drop-clear" disabled={index === positions.length - 1} aria-label={`Move ${data.text} down`} onClick={() => swap(index, 1)}>↓</button>
                  <button type="button" className="drop-clear" aria-label={`Remove ${data.text} from ${label}`} onClick={() => { const next = { ...placements }; delete next[position]; setSelected(null); onChange(next); focusTarget(position); }}>×</button>
                </div>}
              </div> : <EmptySlot label={label} selected={selected} disabled={disabled} onPlace={() => drop(selected!, position)}/>}
            </DropTarget>
          </li>;
        })}</ol>
      </section>
    </div>
    <SelectionStatus selected={selected} target="a position"/>
  </AnswerBoard>;
}
