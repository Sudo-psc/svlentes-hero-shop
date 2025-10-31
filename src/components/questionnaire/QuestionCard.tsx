'use client';

import React from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';

// Dummy question data for now
const questions = [
  { id: '1', title: 'What is your primary motivation for considering vision correction?' },
  { id: '2', title: 'How would you describe your daily level of physical activity?' },
  { id: '3', title: 'In which type of environment do you spend most of your workday?' },
];

export const QuestionCard: React.FC = () => {
  const { currentQuestionIndex } = useQuestionnaire();
  const question = questions[currentQuestionIndex] || questions[0];

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">{question.title}</h2>
      <div className="space-y-4">
        {/* Options will be rendered here */}
        <div>Option 1</div>
        <div>Option 2</div>
        <div>Option 3</div>
      </div>
    </div>
  );
};
