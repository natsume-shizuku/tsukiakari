import { useId } from 'react';
import type { CanonicalNoteRef, TestAttempt, TestQuestionSnapshot } from './domain';
import { studyPacks } from './content/catalog';
import { getLearningResources, getTestDomainResults } from './testResults';
import './test-results.css';

function LearningResources({ refs, title, unlinkedQuestions = 0 }: { refs: CanonicalNoteRef[]; title: string; unlinkedQuestions?: number }) {
  const id = useId();
  const resources = getLearningResources(refs, studyPacks);
  return <details className="test-learning-resources">
    <summary>{title}<span className="quiet-label">{resources.notes.length} {resources.notes.length === 1 ? 'note' : 'notes'} · {resources.cards.length} related {resources.cards.length === 1 ? 'card' : 'cards'}</span></summary>
    <div className="test-learning-body">
      <p className="fine-print">Current study material linked from the references saved with these questions. Browsing does not count as a review.</p>
      {!refs.length && <p>No study-note links were saved with these questions. Recorded answers and sources are still available.</p>}
      {resources.unavailableNotes.length > 0 && <p className="test-resource-unavailable">{resources.unavailableNotes.length} linked {resources.unavailableNotes.length === 1 ? 'reference note is' : 'reference notes are'} unavailable in the current study material. Recorded answers and sources are still available.</p>}
      {unlinkedQuestions > 0 && refs.length > 0 && <p className="fine-print">{unlinkedQuestions} {unlinkedQuestions === 1 ? 'question has' : 'questions have'} no saved study-note links.</p>}
      {resources.notes.length > 0 && <section aria-labelledby={id + '-notes'}><h4 id={id + '-notes'}>Current reference notes</h4><ul className="test-resource-list" aria-label="Current reference notes">{resources.notes.map(note => <li key={JSON.stringify([note.packId, note.noteId])}><a href={'#library/notes?owner=' + encodeURIComponent(note.packId) + '&note=' + encodeURIComponent(note.noteId)}>{note.title}</a></li>)}</ul></section>}
      {resources.cards.length > 0 && <details className="test-resource-cards"><summary>Related cards <span className="quiet-label">{resources.cards.length}</span></summary><ul className="test-resource-list" aria-label="Related cards">{resources.cards.map(card => <li key={JSON.stringify([card.packId, card.cardId])}><a href={'#library/cards?owner=' + encodeURIComponent(card.packId) + '&card=' + encodeURIComponent(card.cardId)}>{card.prompt}</a></li>)}</ul></details>}
      {resources.notes.length > 0 && resources.cards.length === 0 && <p className="fine-print">No current cards reference these notes.</p>}
    </div>
  </details>;
}

/** Callers render this only with a revealed answer or a completed test. */
export function QuestionLearningResources({ question }: { question: TestQuestionSnapshot }) {
  return <LearningResources refs={question.card.relatedNotes} title="Related study material"/>;
}

export function TestDomainResults({ attempt }: { attempt: TestAttempt }) {
  const groups = getTestDomainResults(attempt);
  if (attempt.completedAt === null) return null;
  return <section className="test-domain-results" aria-label="Results by domain">
    <header><h2>Results by domain</h2><p className="fine-print">{attempt.mode === 'practice' ? 'Practice' : 'Exam'} results from this attempt’s saved questions and answers. Domain names are the ones recorded when the test started.</p></header>
    {attempt.mode === 'practice' && <p className="fine-print">Revealed counts include correct, wrong and skipped questions whose answers you opened during practice. Correct without reveal is shown separately.</p>}
    <div className="test-domain-grid">{groups.map(group => <article className="panel test-domain-card" aria-label={group.title} key={group.domainId}>
      <header><h3>{group.title}</h3><p>{group.correct}/{group.total} correct <span className="fine-print">({Math.round(100 * group.correct / group.total)}%)</span></p></header>
      <dl className="test-domain-metrics"><div><dt>Correct</dt><dd>{group.correct}</dd></div><div><dt>Wrong</dt><dd>{group.wrong}</dd></div><div><dt>Skipped</dt><dd>{group.skipped}</dd></div>{attempt.mode === 'practice' && <><div><dt>Revealed during practice</dt><dd>{group.revealed}</dd></div><div><dt>Correct without reveal</dt><dd>{group.correctWithoutReveal}</dd></div></>}</dl>
      <LearningResources refs={group.relatedNotes} title={'Study resources for ' + group.title} unlinkedQuestions={group.unlinkedQuestions}/>
    </article>)}</div>
    {!groups.length && <p>No domain results were recorded for this attempt.</p>}
  </section>;
}
