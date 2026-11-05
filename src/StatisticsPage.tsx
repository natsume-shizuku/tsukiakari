import { useMemo, useState } from 'react';
import { timeZoneLabel, type WorkspaceSnapshot } from './domain';
import { addStudyDays, getStudyDay, studyDayAsUtcNoon } from './studyDay';
import { formatActiveTime, getStatistics, type DayActivity } from './statistics';
import './statistics.css';
import { TopicStatistics } from './TopicStatistics';

function dateLabel(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' }).format(studyDayAsUtcNoon(date));
}
function level(reviews: number) { return reviews === 0 ? 0 : reviews < 10 ? 1 : reviews < 30 ? 2 : reviews < 60 ? 3 : 4; }
function dayLabel(day: DayActivity) { return `${dateLabel(day.date)}: ${day.reviews} reviews, ${formatActiveTime(day.durationMs)} active time`; }

export function StatisticsPage({ workspace, now = Date.now() }: { workspace: WorkspaceSnapshot; now?: number }) {
  const today = getStudyDay(now, workspace.preferences);
  const currentYear = Number(today.slice(0, 4));
  const [chosenYear, setChosenYear] = useState(currentYear);
  const [deckId, setDeckId] = useState('');
  const [chosenDate, setChosenDate] = useState(today);
  const year = Math.min(chosenYear, currentYear);
  const stats = useMemo(() => getStatistics(workspace, now, year, deckId || undefined), [workspace, now, year, deckId]);
  const selectedDate = chosenDate.startsWith(String(year) + '-') && chosenDate <= today ? chosenDate : year === currentYear ? today : `${year}-12-31`;
  const selectedDay = stats.days.find(day => day.date === selectedDate) ?? stats.days[0];
  const firstDate = stats.days[0].date;
  const lastDate = year === currentYear ? today : stats.days[stats.days.length - 1].date;
  const firstWeekday = new Date(studyDayAsUtcNoon(firstDate)).getUTCDay();
  const weeks = Math.ceil((firstWeekday + stats.days.length) / 7);
  const chartWidth = 34 + weeks * 16;
  const changeYear = (nextYear: number) => { setChosenYear(nextYear); setChosenDate(nextYear === currentYear ? today : `${nextYear}-12-31`); };
  return <section className="statistics-page">
    <header className="page-header"><p className="eyebrow">See your rhythm</p><h1>Statistics</h1><p>Small sessions add up over time.</p></header>
    <div className="statistics-scope"><div><label htmlFor="statistics-deck">Deck</label><select id="statistics-deck" value={deckId} onChange={event => setDeckId(event.target.value)}><option value="">All decks</option>{workspace.decks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}{deck.archived ? ' · Archived' : ''}</option>)}</select></div><p className="fine-print">Study days begin at {String(workspace.preferences.dayStartsAtHour).padStart(2, '0')}:00 in {timeZoneLabel(workspace.preferences.timeZone)}. Repeated reviews count separately.</p></div>
    <div className="statistics-metrics" aria-label="Study totals">
      <section className="panel"><h2>Today</h2><strong>{stats.todayActivity.reviews.toLocaleString()}</strong><p>reviews · {dateLabel(today)}</p></section>
      <section className="panel"><h2>Today's active time</h2><strong>{formatActiveTime(stats.todayActivity.durationMs)}</strong><p>{(stats.todayActivity.averageMs / 1000).toFixed(1)}s per review</p></section>
      <section className="panel"><h2>Past 7 study days</h2><strong>{formatActiveTime(stats.weekActivity.durationMs)}</strong><p>{stats.weekActivity.reviews.toLocaleString()} reviews, including today</p></section>
      <section className="panel"><h2>Lifetime</h2><strong>{formatActiveTime(stats.lifetime.durationMs)}</strong><p>{stats.lifetime.reviews.toLocaleString()} reviews</p></section>
    </div>
    <section className="panel statistics-calendar" aria-labelledby="statistics-calendar-title">
      <div className="statistics-calendar-heading"><div><h2 id="statistics-calendar-title">Study activity · {year}</h2><p className="fine-print">{stats.yearActivity.reviews.toLocaleString()} reviews · {formatActiveTime(stats.yearActivity.durationMs)} active time</p></div><div className="statistics-year-controls"><button className="button secondary" aria-label="Previous year" disabled={year <= stats.earliestYear} onClick={() => changeYear(year - 1)}>←</button><button className="button secondary" disabled={year === currentYear} onClick={() => changeYear(currentYear)}>This year</button><button className="button secondary" aria-label="Next year" disabled={year >= currentYear} onClick={() => changeYear(year + 1)}>→</button></div></div>
      <figure className="statistics-heatmap"><div className="statistics-heatmap-scroll" role="region" aria-label="Yearly study heatmap" tabIndex={0}><svg viewBox={`0 0 ${chartWidth} 146`} role="img" aria-labelledby="statistics-chart-title statistics-chart-description"><title id="statistics-chart-title">{year} study activity</title><desc id="statistics-chart-description">{stats.studiedDays} study days and {stats.yearActivity.reviews} reviews. Stronger color indicates more reviews. Use the date controls below for daily totals.</desc>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => index % 2 === 1 && <text key={day} x="0" y={38 + index * 16} className="statistics-chart-label">{day}</text>)}
        {stats.days.map((day, index) => { const column = Math.floor((firstWeekday + index) / 7); const row = (firstWeekday + index) % 7; return <g key={day.date}>{day.date.endsWith('-01') && <text x={34 + column * 16} y="14" className="statistics-chart-label">{new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' }).format(studyDayAsUtcNoon(day.date))}</text>}<rect x={34 + column * 16} y={26 + row * 16} width="13" height="13" rx="2" className={`statistics-cell level-${level(day.reviews)}${day.future ? ' is-future' : ''}${day.date === selectedDate ? ' is-selected' : ''}`}><title>{day.future ? `${dateLabel(day.date)}: future study day` : dayLabel(day)}</title></rect></g>; })}
      </svg></div><figcaption><span>Choose a date below to inspect daily totals.</span><span className="statistics-legend">Fewer{[0, 1, 2, 3, 4].map(value => <span key={value} aria-hidden="true" className={`statistics-cell level-${value}`}/>)}More</span></figcaption></figure>
      <div className="statistics-day-reader"><div className="statistics-date-controls"><button className="button secondary" aria-label="Previous study day" disabled={selectedDate <= firstDate} onClick={() => setChosenDate(addStudyDays(selectedDate, -1))}>←</button><div><label htmlFor="statistics-date">Inspect date</label><input id="statistics-date" type="date" value={selectedDate} min={firstDate} max={lastDate} onChange={event => { if (event.target.value >= firstDate && event.target.value <= lastDate) setChosenDate(event.target.value); }}/></div><button className="button secondary" aria-label="Next study day" disabled={selectedDate >= lastDate} onClick={() => setChosenDate(addStudyDays(selectedDate, 1))}>→</button></div><div aria-live="polite" aria-atomic="true"><h3>{dateLabel(selectedDay.date)}</h3><p>{selectedDay.reviews} reviews · {formatActiveTime(selectedDay.durationMs)} active time</p><p className="fine-print">{selectedDay.right} Right · {selectedDay.again} Again</p></div></div>
      <dl className="statistics-year-summary"><div><dt>Daily average</dt><dd>{stats.dailyAverage.toFixed(1)} reviews</dd></div><div><dt>Days studied</dt><dd>{stats.studiedPercentage.toFixed(1)}% <span>({stats.studiedDays}/{stats.elapsedDays})</span></dd></div><div><dt>Current streak</dt><dd>{stats.currentStreak} days</dd></div><div><dt>Longest streak</dt><dd>{stats.longestStreak} days</dd></div></dl>
      <p className="fine-print">Yearly averages include every elapsed day from January 1{year === currentYear ? ' through today' : ' through December 31'}, including days without reviews. Streaks use all retained study history; today's streak stays active if you studied yesterday.</p>
      {!stats.lifetime.reviews && <p className="statistics-empty">Your first saved flashcard review will appear here.</p>}
    </section>
    <TopicStatistics workspace={workspace} now={now} deckId={deckId || undefined}/>
    <p className="fine-print statistics-method">Active time comes from completed flashcard reviews and excludes paused, background, and inactive time. Undone reviews, browsing, and practice tests are excluded. Historical activity keeps its original saved study-day date.</p>
  </section>;
}
