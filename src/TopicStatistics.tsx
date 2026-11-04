import { useId, useMemo, useState } from 'react';
import type { WorkspaceSnapshot } from './domain';
import { studyCurations } from './content/catalog';
import { getTopicStatistics, type TopicPeriod } from './topicInsights';
import './topic-statistics.css';

export function TopicStatistics({ workspace, now, deckId }: { workspace: WorkspaceSnapshot; now: number; deckId?: string }) {
  const id = useId();
  const [period, setPeriod] = useState<TopicPeriod>('30');
  const [curationId, setCurationId] = useState('');
  const [order, setOrder] = useState('topic');
  const selectedCuration = studyCurations.find(item => item.id === curationId);
  const summary = useMemo(() => getTopicStatistics(workspace, now, { period, deckId: deckId || undefined, curationId: selectedCuration?.id }), [workspace, now, period, deckId, selectedCuration?.id]);
  const rows = useMemo(() => order === 'again' ? [...summary.rows].sort((a, b) => (b.againRate ?? -1) - (a.againRate ?? -1) || b.reviews - a.reviews || a.title.localeCompare(b.title)) : [...summary.rows].sort((a, b) => Number(a.fixture) - Number(b.fixture)), [summary, order]);
  return <section className="panel topic-statistics" aria-labelledby={id + '-heading'}>
    <header className="topic-statistics-heading"><div><h2 id={id + '-heading'}>Flashcard topics</h2><p className="fine-print">See which topics prompted Again, alongside the number of reviews behind each rate.</p></div>
      <div className="topic-statistics-controls">
        <div><label htmlFor={id + '-period'}>Topic period</label><select id={id + '-period'} value={period} onChange={event => setPeriod(event.target.value as TopicPeriod)}><option value="30">Past 30 study days</option><option value="all">All time</option></select></div>
        <div><label htmlFor={id + '-pack'}>Topic study pack</label><select id={id + '-pack'} value={selectedCuration?.id ?? ''} onChange={event => setCurationId(event.target.value)}><option value="">All study material</option>{studyCurations.map(pack => <option key={pack.id} value={pack.id}>{pack.title}{pack.fixture ? ' · Engineering fixture' : ''}</option>)}</select></div>
        <div><label htmlFor={id + '-order'}>Topic order</label><select id={id + '-order'} value={order} onChange={event => setOrder(event.target.value)}><option value="topic">Topic order</option><option value="again">Higher Again rate first</option></select></div>
      </div>
    </header>
    <p className="fine-print topic-statistics-method">Grouped by current {selectedCuration ? 'study-pack' : 'published'} topics. {summary.from ? summary.from + ' through ' + summary.today + ', inclusive.' : 'All retained study days through ' + summary.today + '.'} Repeated reviews count separately. A card studied in two decks counts once in Distinct cards. Small samples can vary.</p>
    <div className="topic-statistics-list">{rows.map(row => <article key={row.key} className="topic-statistics-row" aria-label={row.title + ' · ' + row.groupTitle}>
      <div className="topic-statistics-name"><h3>{row.href ? <a href={row.href}>{row.title}</a> : row.title}</h3><p className="fine-print">{row.groupTitle}{row.fixture && ' · Engineering fixture'}</p>{!row.reviews && <span className="topic-statistics-unreviewed">Not studied</span>}{row.unavailable && <p className="fine-print">Retained reviews; the original published card is unavailable.</p>}</div>
      <dl className="topic-statistics-values"><div><dt>Reviews</dt><dd>{row.reviews.toLocaleString()}</dd></div><div><dt>Again</dt><dd>{row.again.toLocaleString()}</dd></div><div><dt>Right</dt><dd>{row.right.toLocaleString()}</dd></div><div><dt>Again rate</dt><dd aria-label={row.againRate === null ? 'Not studied' : undefined}>{row.againRate === null ? '—' : (100 * row.againRate).toFixed(1) + '%'}</dd></div><div><dt>Distinct cards</dt><dd>{row.distinctCards.toLocaleString()}</dd></div></dl>
    </article>)}</div>
    {!rows.length && <p className="topic-statistics-empty">No current topics are available for this selection.</p>}
    <p className="fine-print topic-statistics-footer">These totals use saved flashcard reviews, including retained history for removed cards. Undone reviews and tests are excluded. The Deck filter above applies here.</p>
  </section>;
}
