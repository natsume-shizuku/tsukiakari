import { useState } from 'react';
import type { ReactNode } from 'react';
import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import type { Announcements, CollisionDetection, KeyboardCoordinateGetter } from '@dnd-kit/core';

/** Droppable ID for the source list, so a placed token can be dragged back out. */
export const TRAY = 'answer-tray';
export interface DragData { tokenId: string; text: string; from: string | null; }

/** Arrow keys jump straight to the next drop target instead of nudging by a few pixels. */
const jumpToTarget: KeyboardCoordinateGetter = (event, { context: { droppableContainers, droppableRects, over } }) => {
  const step = ({ ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 } as Record<string, number>)[event.code];
  if (!step) return undefined;
  event.preventDefault();
  const targets = droppableContainers.getEnabled().filter(target => droppableRects.has(target.id))
    .sort((a, b) => droppableRects.get(a.id)!.top - droppableRects.get(b.id)!.top || droppableRects.get(a.id)!.left - droppableRects.get(b.id)!.left);
  if (!targets.length) return undefined;
  const current = targets.findIndex(target => target.id === over?.id);
  const next = current < 0 ? (step > 0 ? 0 : targets.length - 1) : (current + step + targets.length) % targets.length;
  const rect = droppableRects.get(targets[next].id)!;
  return { x: rect.left, y: rect.top };
};
const findTarget: CollisionDetection = args => {
  if (!args.pointerCoordinates) return rectIntersection(args);
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

/** Placing or clearing swaps out the focused button, so move focus to the slot rather than losing it. */
export function focusTarget(id: string, force = false) {
  requestAnimationFrame(() => {
    if (!force && document.activeElement && document.activeElement !== document.body) return;
    document.querySelector<HTMLElement>(`[data-drop-target="${CSS.escape(id)}"] button:not(:disabled)`)?.focus({ preventScroll: true });
  });
}

function GripIcon() {
  return <svg className="drag-grip-icon" viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" focusable="false">{[3, 8, 13].flatMap(y => [2, 8].map(x => <circle key={x + '-' + y} cx={x} cy={y} r="1.5"/>))}</svg>;
}

/** Wraps one question's tray and targets. A drop reports the token and where it landed. */
export function AnswerBoard({ children, onDrop, describe }: { children: ReactNode; onDrop: (data: DragData, target: string | null) => void; describe: (target: string) => string }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A short hold separates dragging from scrolling, because tokens fill a phone screen.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpToTarget, scrollBehavior: 'auto' }),
  );
  const [active, setActive] = useState<DragData | null>(null);
  const dataOf = (value: { data: { current?: unknown } }) => value.data.current as DragData;
  const announcements: Announcements = {
    onDragStart: ({ active: item }) => `Picked up ${dataOf(item).text}.`,
    onDragOver: ({ active: item, over }) => over ? `${dataOf(item).text} is over ${describe(String(over.id))}.` : `${dataOf(item).text} is not over a target.`,
    onDragEnd: ({ active: item, over }) => over ? `Placed ${dataOf(item).text} on ${describe(String(over.id))}.` : `${dataOf(item).text} was not placed.`,
    onDragCancel: ({ active: item }) => `Cancelled. ${dataOf(item).text} was not moved.`,
  };
  // The default scrolls 2000px a second from a wide edge zone, which moves rows out from under a held token.
  return <DndContext sensors={sensors} collisionDetection={findTarget} autoScroll={{ threshold: { x: 0, y: 0.08 }, acceleration: 2, interval: 10 }}
    accessibility={{ announcements, screenReaderInstructions: { draggable: 'To pick up, press Space. Use the arrow keys to move between answer targets. Press Space again to drop, or Escape to cancel.' } }}
    onDragStart={event => setActive(dataOf(event.active))}
    onDragCancel={() => setActive(null)}
    onDragEnd={event => { setActive(null); onDrop(dataOf(event.active), event.over ? String(event.over.id) : null); }}>
    {children}
    <DragOverlay dropAnimation={null}>{active && <div className="drag-token is-overlay"><span className="drag-grip"><GripIcon/></span><span className="drag-token-body">{active.text}</span></div>}</DragOverlay>
  </DndContext>;
}

/** The token drags from anywhere with mouse or touch. The grip is its keyboard drag handle, and the text selects it. */
export function DragToken({ id, data, selected, disabled, onSelect }: { id: string; data: DragData; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id, data, disabled });
  return <div ref={setNodeRef} data-testid={id} className={'drag-token' + (selected ? ' is-selected' : '') + (isDragging ? ' is-dragging' : '')} {...listeners}>
    <button {...attributes} ref={setActivatorNodeRef} type="button" className="drag-grip" disabled={disabled} aria-label={'Drag ' + data.text}><GripIcon/></button>
    <button type="button" className="drag-token-body" disabled={disabled} aria-pressed={selected} onClick={onSelect}>{data.text}</button>
  </div>;
}

export function DropTarget({ id, label, disabled, className, children }: { id: string; label: string; disabled: boolean; className: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return <div ref={setNodeRef} data-testid={'target-' + id} data-drop-target={id} role="group" aria-label={label} className={className + (isOver ? ' is-over' : '')}>{children}</div>;
}

export function EmptySlot({ label, selected, disabled, onPlace }: { label: string; selected: DragData | null; disabled: boolean; onPlace: () => void }) {
  return <button type="button" className={'drop-empty' + (selected ? ' is-ready' : '')} disabled={disabled} aria-label={selected ? `Place ${selected.text} on ${label}` : `${label} is empty. Select an item first.`} onClick={() => { if (selected) onPlace(); }}>{disabled ? 'No answer' : selected ? 'Place here' : 'Drop here'}</button>;
}

/** Spoken and visible confirmation for the select-then-place path. */
export function SelectionStatus({ selected, target }: { selected: DragData | null; target: string }) {
  return <p className="drag-status" role="status">{selected ? `Selected: ${selected.text}. Now choose ${target}.` : ''}</p>;
}
