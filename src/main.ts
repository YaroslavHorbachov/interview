import { questions } from './angular-questions';
import { Levels, Technologies } from './enums/filters.enum';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { groupBy } from 'lodash';
import { InterviewQuestion } from './interfaces/interview.interface';
import { Score } from './enums';

interface CreateInterviewOptions {
  readonly technologies: Technologies[];
  readonly levels: Levels[];
  readonly filename: string;
}

interface InterviewPerformanceOptions {
  readonly path: string[];
}

type AggregatedPerformance = {
  readonly [key in Technologies]: GroupPerformance;
};

interface AggregateGroup {
  readonly currentKnowledge: number;
  readonly currentPractice: number;
}

interface GroupPerformance extends AggregateGroup {
  readonly minKnowledge: number;
  readonly minPractice: number;
  readonly totalQuestions: number;
}

const MINIMUM_KNOWLEDGE_PERCENTAGE = 50;
const MINIMUM_PRACTICE_PERCENTAGE = 30;

async function createInterviewQuestions(options: CreateInterviewOptions) {
  const { levels, technologies, filename } = options;
  const targetQuestions = questions.filter((question) => {
    const isAngularDirection = technologies.includes(question.technology);
    const isBeginner = levels.includes(question.level);

    return [isAngularDirection, isBeginner].every(Boolean);
  });
  const data = JSON.stringify(targetQuestions);

  await writeFile(`src/assets/${filename}.json`, data);
}

// createInterviewQuestions({
//   levels: [Levels.Beginner],
//   technologies: [Technologies.Angular, Technologies.RxJS],
//   filename: 'angular-beginner-ana',
// });

function computeMinimumPracticeCount(total: number) {
  return (total / 100) * MINIMUM_PRACTICE_PERCENTAGE;
}

function computeMinimumKnowledgeCount(total: number) {
  return (total / 100) * MINIMUM_KNOWLEDGE_PERCENTAGE;
}

function computeScore(score: Score): number {
  switch (score) {
    case Score.NotFamiliar: {
      return 0;
    }

    case Score.Elementary: {
      return 0.5;
    }

    case Score.Intermediate: {
      return 1;
    }

    case Score.Advanced: {
      return 1.5;
    }

    default: {
      console.error(`Score: ${score}`);

      return 0;
    }
  }
}

async function computePerformance(options: InterviewPerformanceOptions) {
  const { path } = options;
  const computedPath = join('src/assets', ...path, 'responses.json');
  const rawFile = await readFile(computedPath);
  const parsedRawFile = rawFile.toString('utf-8');
  const json = JSON.parse(parsedRawFile);
  const groupedJson = groupBy<InterviewQuestion>(json, ({ technology }) => technology);

  const aggregator = new Map<string, GroupPerformance>();

  for (const key in groupedJson) {
    if (Object.prototype.hasOwnProperty.call(groupedJson, key)) {
      const group = groupedJson[key];
      const totalQuestions = group.length;
      const minPractice = computeMinimumPracticeCount(totalQuestions);
      const minKnowledge = computeMinimumKnowledgeCount(totalQuestions);
      const aggregatedGroup = group.reduce(
        (aggregateGroup, item) => {
          const { knowledgeScore, practiceScore } = item;
          const [computedKnowledgeScore, computedPracticeScore] = [knowledgeScore, practiceScore].map(computeScore);

          const currentKnowledge = aggregateGroup.currentKnowledge + computedKnowledgeScore;
          const currentPractice = aggregateGroup.currentPractice + computedPracticeScore;

          return { ...aggregateGroup, currentKnowledge, currentPractice };
        },
        { currentKnowledge: 0, currentPractice: 0 } as AggregateGroup
      );
      const groupPerformance: GroupPerformance = {
        ...aggregatedGroup,
        minKnowledge,
        minPractice,
        totalQuestions,
      };

      aggregator.set(key, groupPerformance);
    }
  }

  console.log(aggregator);
}

computePerformance({ path: ['angular', 'beginner', 'ana'] });
