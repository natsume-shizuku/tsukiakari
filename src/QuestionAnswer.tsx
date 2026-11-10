import type { TestAttempt, TestQuestionSnapshot } from './domain';
import { gradeQuestion, type Answer } from './testGrading';
import { answerReasoning, type AnswerReason } from './answerReasoning';
import { QuestionLearningResources } from './TestDomainResults';
import './test-answer-details.css';

function Reasons({ reasons }: { reasons: AnswerReason[] }) {
  return <dl className="test-option-explanations">{reasons.map(reason => <div key={reason.id}><dt>{reason.label}{reason.contexts.map(context => <span key={context} className="test-reason-context">{context}</span>)}</dt><dd>{reason.explanation}</dd></div>)}</dl>;
}

export function QuestionAnswer({ question, answer, scoring, completed, preview = false }: { question: TestQuestionSnapshot; answer: Answer | undefined; scoring: TestAttempt['scoring']; completed: boolean; preview?: boolean }) {
  const { card } = question;
  const grade = gradeQuestion(card, answer, scoring);
  const status = preview ? 'Answer preview' : grade.state === 'skipped' ? 'Skipped' : grade.state === 'correct' ? 'Correct' : grade.state === 'partial' ? `Partly correct · ${grade.earned} of ${grade.possible} points` : 'Incorrect';
  const { incorrect, remaining } = answerReasoning(card, preview ? undefined : answer);
  // Native disclosure state survives saves on this question, but resets for a different snapshot identity.
  const identity = JSON.stringify([question.bankId, card.id, card.revision]);
  return <div id={'test-answer-' + card.id} tabIndex={-1} className="test-answer"><p className="test-answer-status">{status}{!completed ? ' · Response locked after reveal' : ''}</p><h3>Answer</h3><p>{card.answer}</p><p>{card.explanation}</p>
    {card.kind === 'multiple' && <p className="fine-print">{scoring ? 'Each correct selection is worth one point.' : 'All correct options are required for one point. Partial selections receive no points.'}</p>}
    {incorrect.length > 0 && <section className="test-selected-reasons" aria-label="About your answer"><h3>About your answer</h3><Reasons reasons={incorrect}/></section>}
    {remaining.length > 0 && <details key={'why-' + identity} className="test-why test-answer-details"><summary>Why these choices?</summary><Reasons reasons={remaining}/></details>}
    <QuestionLearningResources key={'learning-' + identity} question={question}/>
    <details key={'references-' + identity} className="test-references test-answer-details"><summary>References ({question.sources.length})</summary><ul>{question.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></details>
  </div>;
}
