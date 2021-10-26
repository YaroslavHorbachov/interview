import { Score, Levels, Technologies } from '../enums';

export interface InterviewQuestion {
  readonly question: string;
  readonly level: Levels;
  readonly technology: Technologies;
  readonly knowledgeScore: Score;
  readonly practiceScore: Score;
  readonly note?: string;
  readonly hint?: string;
}
