import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { QuestionGroup } from './domain';

/** Reference document beside the question. The panel scrolls on its own, so it takes keyboard focus. */
export function CaseStudyPane({ group }: { group: QuestionGroup }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (event: KeyboardEvent, index: number) => {
    const last = group.exhibits.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };
  const exhibit = group.exhibits[active] ?? group.exhibits[0];
  return <aside className="panel case-pane" aria-label={'Case study: ' + group.title}>
    <p className="eyebrow">Case study</p>
    <h2 className="case-pane-title">{group.title}</h2>
    <div className="case-tabs" role="tablist" aria-label="Case study sections">{group.exhibits.map((item, index) => <button key={item.id} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={id + 'tab-' + item.id} aria-selected={index === active} aria-controls={id + 'panel'} tabIndex={index === active ? 0 : -1} className={'case-tab' + (index === active ? ' is-active' : '')} onClick={() => setActive(index)} onKeyDown={event => move(event, index)}>{item.title}</button>)}</div>
    <div id={id + 'panel'} role="tabpanel" tabIndex={0} aria-labelledby={id + 'tab-' + exhibit.id} className="case-panel"><p>{exhibit.body}</p></div>
  </aside>;
}
