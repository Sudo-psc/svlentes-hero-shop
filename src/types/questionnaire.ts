export interface AnswerOption {
  value: string;
  label: string;
  tooltip?: string;
}

export type QuestionType = 'multiple-choice' | 'range-slider';

export interface BaseQuestion {
  id: string;
  category: 'lifestyle' | 'ocular-health' | 'preferences' | 'refractive' | 'environmental';
  questionText: string;
  type: QuestionType;
  options: AnswerOption[];
  isCritical?: boolean;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
}

export interface RangeSliderQuestion extends BaseQuestion {
  type: 'range-slider';
  min: number;
  max: number;
  step: number;
}

export type Question = MultipleChoiceQuestion | RangeSliderQuestion;

export interface ConditionalLogic {
  questionId: string;
  showIf: {
    questionId: string;
    answerValues: string[];
    operator: 'AND' | 'OR' | 'NOT';
  }[];
  priority: number;
}

export interface UserAnswer {
  questionId: string;
  value: string | number;
}

export interface QuestionnaireState {
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>;
  progress: number;
  startTime: number;
  estimatedTime: number;
}
