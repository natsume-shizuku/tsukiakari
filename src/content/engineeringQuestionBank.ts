import fixture from './engineering-question-bank.json';
import { validateQuestionBank } from '../questionBankValidation';

/** Software-only bank; never imported into the Library or counted as real exam content. */
export const engineeringQuestionBank = validateQuestionBank(fixture);
