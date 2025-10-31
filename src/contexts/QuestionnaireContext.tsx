'use client';

import React,
{
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo
} from 'react';
import { QuestionnaireState, UserAnswer } from '@/types/questionnaire';

interface QuestionnaireContextType extends QuestionnaireState {
  // eslint-disable-next-line no-unused-vars
  updateAnswer: (answer: UserAnswer) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export const QuestionnaireProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});

  const updateAnswer = (answer: UserAnswer) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [answer.questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    // This will be expanded later with actual question data
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
  };

  const prevQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  // Dummy values for now
  const progress = 0;
  const startTime = useMemo(() => Date.now(), []);
  const estimatedTime = 10 * 60 * 1000; // 10 minutes

  const value = useMemo(() => ({
    currentQuestionIndex,
    answers,
    progress,
    startTime,
    estimatedTime,
    updateAnswer,
    nextQuestion,
    prevQuestion,
  }), [answers, currentQuestionIndex, progress, startTime, estimatedTime]);

  return (
    <QuestionnaireContext.Provider value={value}>
      {children}
    </QuestionnaireContext.Provider>
  );
};

export const useQuestionnaire = (): QuestionnaireContextType => {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  }
  return context;
};
