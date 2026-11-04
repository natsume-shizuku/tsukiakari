import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Deck, DeckSettings as Settings } from './domain';
import { saveDeckSettings } from './reviewStorage';
import type { useWorkspace } from './useWorkspace';

type Desk = ReturnType<typeof useWorkspace>;
function stepText(steps: number[]) { return steps.map(minutes => minutes % 60 === 0 ? minutes / 60 + 'h' : minutes + 'm').join(' '); }
function parseSteps(value: string): number[] {
  const pieces = value.trim().split(/\s+/);
  if (!value.trim() || pieces.length > 20) throw new Error('Enter between 1 and 20 steps, such as 1m 10m 1h.');
  const result = pieces.map(piece => {
    const match = /^(\d+)(m|h)$/.exec(piece);
    const minutes = match ? Number(match[1]) * (match[2] === 'h' ? 60 : 1) : NaN;
    if (!Number.isSafeInteger(minutes) || minutes < 1 || minutes >= 1440) throw new Error('Each step must be a positive whole number of minutes below one day. Use m or h, such as 10m or 1h.');
    return minutes;
  });
  if (result.some((value, index) => index > 0 && value <= result[index - 1])) throw new Error('Steps must increase in duration, for example 1m 10m 1h.');
  return result;
}
export function DeckSettings({ desk, deckId, onDirtyChange }: { desk: Desk; deckId: string; onDirtyChange?: (dirty: boolean) => void }) {
  const deck = desk.workspace?.decks.find(item => item.id === deckId);
  if (!deck || deck.archived) return null;
  return <section className="panel deck-settings-panel"><div className="section-heading"><h2>Deck scheduling</h2><span className="quiet-label">Independent for every deck</span></div>
    <p className="muted">Daily allowances and learning steps for {deck.name}.</p>
    <SettingsForm key={deck.id + JSON.stringify(deck.settings)} deck={deck} desk={desk} onDirtyChange={onDirtyChange}/>
    <p className="fine-print">FSRS uses standard parameters. Complete review logs are retained for future optimization. Right maps to FSRS Good.</p>
  </section>;
}
function settingsValues(settings: Settings) {
  return { newCardsPerDay: String(settings.newCardsPerDay), maximumReviewsPerDay: String(settings.maximumReviewsPerDay), learning: stepText(settings.learningStepsMinutes), relearning: stepText(settings.relearningStepsMinutes), retention: String(Math.round(settings.desiredRetention * 100)), threshold: String(settings.leechThreshold), action: settings.leechAction };
}
function SettingsForm({ deck, desk, onDirtyChange }: { deck: Deck; desk: Desk; onDirtyChange?: (dirty: boolean) => void }) {
  const [values, setValues] = useState(() => settingsValues(deck.settings));
  const dirty = JSON.stringify(values) !== JSON.stringify(settingsValues(deck.settings));
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  const [error, setError] = useState('');
  const change = (key: keyof typeof values, value: string) => setValues(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const integer = (value: string, min: number, max: number) => { const number = Number(value); if (!value.trim() || !Number.isSafeInteger(number) || number < min || number > max) throw new Error('Daily limits, retention, and leech threshold must be whole numbers within their displayed ranges.'); return number; };
      const settings: Settings = {
        newCardsPerDay: integer(values.newCardsPerDay, 0, 9999), maximumReviewsPerDay: integer(values.maximumReviewsPerDay, 0, 99999),
        learningStepsMinutes: parseSteps(values.learning), relearningStepsMinutes: parseSteps(values.relearning),
        desiredRetention: integer(values.retention, 70, 99) / 100, leechThreshold: integer(values.threshold, 1, 999), leechAction: values.action,
      };
      setError('');
      if (await desk.mutate(() => saveDeckSettings(deck.id, settings), 'Deck settings saved. Start or resume study to use the updated queue.')) setValues(settingsValues(settings));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Check these settings.'); }
  };
  return <form onSubmit={submit} className="deck-settings-form">
    <div className="settings-fields">
      <div><label htmlFor="new-limit">New cards / day</label><input id="new-limit" type="number" min="0" max="9999" step="1" value={values.newCardsPerDay} onChange={event => change('newCardsPerDay', event.target.value)} disabled={!desk.canWrite} required/></div>
      <div><label htmlFor="review-limit">Maximum reviews / day</label><input id="review-limit" type="number" min="0" max="99999" step="1" value={values.maximumReviewsPerDay} onChange={event => change('maximumReviewsPerDay', event.target.value)} disabled={!desk.canWrite} required/></div>
      <div><label htmlFor="learning-steps">Learning steps</label><input id="learning-steps" value={values.learning} onChange={event => change('learning', event.target.value)} disabled={!desk.canWrite} aria-describedby="steps-help" required/></div>
      <div><label htmlFor="relearning-steps">Relearning steps</label><input id="relearning-steps" value={values.relearning} onChange={event => change('relearning', event.target.value)} disabled={!desk.canWrite} aria-describedby="steps-help" required/></div>
      <div><label htmlFor="retention">Desired retention (%)</label><input id="retention" type="number" min="70" max="99" step="1" value={values.retention} onChange={event => change('retention', event.target.value)} disabled={!desk.canWrite} required/></div>
      <div><label htmlFor="leech-threshold">Leech threshold (review lapses)</label><input id="leech-threshold" type="number" min="1" max="999" step="1" value={values.threshold} onChange={event => change('threshold', event.target.value)} disabled={!desk.canWrite} required/></div>
      <div><label htmlFor="leech-action">Leech action</label><select id="leech-action" value={values.action} onChange={event => change('action', event.target.value)} disabled={!desk.canWrite}><option value="suspend">Suspend</option><option value="tag">Tag only</option></select></div>
    </div>
    <p id="steps-help" className="fine-print">Separate increasing steps with spaces, using m for minutes or h for hours. Each step must be shorter than one day.</p>
    <p className="fine-print">Changes affect future answers and available daily allowances; existing due dates stay unchanged. Saving closes this deck's active queue and clears the last-review undo. Learning and relearning steps continue even when the review limit is reached.</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="deck-draft-actions"><button className="button" disabled={!desk.canWrite || !dirty}>Save deck settings</button><button type="button" className="button secondary" disabled={!dirty || desk.busy} onClick={() => { setValues(settingsValues(deck.settings)); setError(''); }}>Discard settings changes</button><span role="status">{dirty ? 'Unsaved changes' : ''}</span></div>
  </form>;
}
