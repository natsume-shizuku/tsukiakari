import type { ExamQuestion, TestAttempt, TestQuestionSnapshot } from './domain';
import { gradeQuestion, isSelection, type Answer } from './testGrading';
import { QuestionLearningResources } from './TestDomainResults';

/** Every option a question explains, labelled the way the learner saw it. */
function explainedOptions(card: ExamQuestion): { id: string; label: string }[] {
  if (isSelection(card)) return card.options.map((option, index) => ({ id: option.id, label: `${String.fromCharCode(65 + index)}. ${option.text}` }));
  if (card.kind === 'hotspot') return card.rows.flatMap(row => row.options.map(option => ({ id: option.id, label: option.text })));
  return card.tokens.map(token => ({ id: token.id, label: token.text }));
}

export function QuestionAnswer({ question, answer, scoring, completed, preview = false }: { question: TestQuestionSnapshot; answer: Answer | undefined; scoring: TestAttempt['scoring']; completed: boolean; preview?: boolean }) {
  const { card } = question;
  const grade = gradeQuestion(card, answer, scoring);
  const status = preview ? 'Answer preview' : grade.state === 'skipped' ? 'Skipped' : grade.state === 'correct' ? 'Correct' : grade.state === 'partial' ? `Partly correct · ${grade.earned} of ${grade.possible} points` : 'Incorrect';
  const explained = explainedOptions(card).filter(option => card.optionExplanations[option.id]);
  const reasons = <dl className="test-option-explanations">{explained.map(option => <div key={option.id}><dt>{option.label}</dt><dd>{card.optionExplanations[option.id]}</dd></div>)}</dl>;
  return <div id={'test-answer-' + card.id} tabIndex={-1} className="test-answer"><p className="test-answer-status">{status}{!completed ? ' · Response locked after reveal' : ''}</p><h3>Answer</h3><p>{card.answer}</p><p>{card.explanation}</p>
    {card.kind === 'multiple' && <p className="fine-print">{scoring ? 'Each correct selection is worth one point.' : 'All correct options are required for one point. Partial selections receive no points.'}</p>}
    {explained.length > 0 && (completed && !preview
      ? <details className="test-why"><summary>Why these choices?</summary>{reasons}</details>
      : <><h3>Why these choices?</h3>{reasons}</>)}
    <QuestionLearningResources question={question}/>
    <h3>References</h3><ul>{question.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul>
  </div>;
}
