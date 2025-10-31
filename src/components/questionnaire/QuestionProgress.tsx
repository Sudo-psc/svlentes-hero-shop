'use client';

import React from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';

export const QuestionProgress: React.FC = () => {
  const { progress, estimatedTime } = useQuestionnaire();

  const remainingTime = Math.round(estimatedTime / 1000 / 60);

  return (
    <div className="bg-gray-200 p-4 rounded-lg mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-center text-gray-600 mt-2">
        Estimated time remaining: {remainingTime} minutes
      </p>
    </div>
  );
};
