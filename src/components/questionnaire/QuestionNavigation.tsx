'use client';

import React from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';

export const QuestionNavigation: React.FC = () => {
  const { prevQuestion, nextQuestion } = useQuestionnaire();

  return (
    <div className="flex justify-between mt-8">
      <button
        onClick={prevQuestion}
        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
      >
        Previous
      </button>
      <button
        onClick={nextQuestion}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Next
      </button>
    </div>
  );
};
