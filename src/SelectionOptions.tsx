import type { SelectionQuestion } from './domain';

interface Props {
  card: SelectionQuestion; selectedOptionIds: string[]; revealed: boolean; disabled: boolean; saving: boolean;
  hintId: string; onAnswer: (optionIds: string[]) => void;
}

export function SelectionOptions({ card, selectedOptionIds, revealed, disabled, saving, hintId, onAnswer }: Props) {
  const multiple = card.kind === 'multiple';
  const selectionLimit = card.correctOptionIds.length;
  return <fieldset className="test-options" aria-labelledby={'test-question-title-' + card.id} aria-describedby={hintId}>{card.options.map((option, index) => {
    const checked = selectedOptionIds.includes(option.id);
    const correctOption = card.correctOptionIds.includes(option.id);
    const limitReached = multiple && !checked && selectedOptionIds.length >= selectionLimit;
    return <label key={option.id} className={'test-option' + (checked ? ' is-selected' : '') + (revealed && correctOption ? ' is-correct' : '')}>
      <input type={multiple ? 'checkbox' : 'radio'} name={'test-question-' + card.id} value={option.id} checked={checked} disabled={disabled || limitReached} aria-disabled={disabled || limitReached || saving} onClick={event => { if (saving) event.preventDefault(); }} onChange={() => {
        if (saving || limitReached) return;
        onAnswer(multiple ? (checked ? selectedOptionIds.filter(id => id !== option.id) : [...selectedOptionIds, option.id]) : [option.id]);
      }}/><span><strong>{String.fromCharCode(65 + index)}.</strong> {option.text}{revealed && correctOption && <span className="test-option-result">Correct answer</span>}{revealed && checked && !correctOption && <span className="test-option-result">Your answer · Incorrect</span>}</span>
    </label>;
  })}</fieldset>;
}
