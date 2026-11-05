import { useMemo, useState } from 'react';
import { timeZoneLabel, type Preferences } from './domain';
import { saveStudyDay } from './storage';
import type { useWorkspace } from './useWorkspace';

type Desk = ReturnType<typeof useWorkspace>;
const hours = Array.from({ length: 24 }, (_, hour) => hour);
const hourLabel = (hour: number) => String(hour).padStart(2, '0') + ':00';

function zoneChoices(current: string): string[] {
  const known = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return Array.from(new Set([current, ...known])).sort((a, b) => a.localeCompare(b));
}

export function StudyDaySettings({ desk, preferences }: { desk: Desk; preferences: Preferences }) {
  const [timeZone, setTimeZone] = useState(preferences.timeZone);
  const [hour, setHour] = useState(preferences.dayStartsAtHour);
  const zones = useMemo(() => zoneChoices(preferences.timeZone), [preferences.timeZone]);
  const changed = timeZone !== preferences.timeZone || hour !== preferences.dayStartsAtHour;
  const save = () => { void desk.mutate(() => saveStudyDay({ timeZone, dayStartsAtHour: hour }), 'Study day saved.'); };
  return <section className="panel settings-location study-day-settings" aria-labelledby="study-day-title">
    <div><h2 id="study-day-title">Your study day</h2><p>Starts at {hourLabel(preferences.dayStartsAtHour)} in {timeZoneLabel(preferences.timeZone)}. Before this boundary, activity belongs to the previous study day.</p></div>
    <div className="study-day-fields">
      <div><label htmlFor="study-day-hour">Day starts at</label><select id="study-day-hour" value={hour} onChange={event => setHour(Number(event.target.value))}>{hours.map(value => <option key={value} value={value}>{hourLabel(value)}</option>)}</select></div>
      <div><label htmlFor="study-day-zone">Time zone</label><select id="study-day-zone" value={timeZone} onChange={event => setTimeZone(event.target.value)}>{zones.map(zone => <option key={zone} value={zone}>{timeZoneLabel(zone)}</option>)}</select></div>
    </div>
    <p className="fine-print">Saving ends any review in progress and clears undo for your last review. Past reviews keep their dates, and due cards stay scheduled.</p>
    <button className="button secondary" disabled={!changed || !desk.canWrite} onClick={save}>Save study day</button>
  </section>;
}
