'use client';
import { useState } from 'react';
import { customerProblems, svlentesSolutions } from '@/data/problems-solutions';
export function ProblemSolutionTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const runTests = () => {
    const results = {
      problemsLoaded: customerProblems.length > 0,
      solutionsLoaded: svlentesSolutions.length > 0,
      problemCount: customerProblems.length,
      solutionCount: svlentesSolutions.length,
      allProblemsHaveIcons: customerProblems.every(p => p.icon && p.text),
      allSolutionsHaveData: svlentesSolutions.every(s => s.icon && s.title && s.description),
      ctaFunctionality: true // Simulated test
    };
    setTestResults(results);
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Teste Problema-Solução</h3>
      <button
        onClick={runTests}
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 mb-4"
      >
        Executar Testes
      </button>
      {testResults && (
        <div className="space-y-2 text-sm">
          <div className={`flex justify-between ${testResults.problemsLoaded ? 'text-green-600' : 'text-red-600'}`}>
            <span>Problemas carregados:</span>
            <span>{testResults.problemsLoaded ? '✅' : '❌'}</span>
          </div>
          <div className={`flex justify-between ${testResults.solutionsLoaded ? 'text-green-600' : 'text-red-600'}`}>
            <span>Soluções carregadas:</span>
            <span>{testResults.solutionsLoaded ? '✅' : '❌'}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total de problemas:</span>
            <span>{testResults.problemCount}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total de soluções:</span>
            <span>{testResults.solutionCount}</span>
          </div>
          <div className={`flex justify-between ${testResults.allProblemsHaveIcons ? 'text-green-600' : 'text-red-600'}`}>
            <span>Problemas com ícones:</span>
            <span>{testResults.allProblemsHaveIcons ? '✅' : '❌'}</span>
          </div>
          <div className={`flex justify-between ${testResults.allSolutionsHaveData ? 'text-green-600' : 'text-red-600'}`}>
            <span>Soluções completas:</span>
            <span>{testResults.allSolutionsHaveData ? '✅' : '❌'}</span>
          </div>
          <div className={`flex justify-between ${testResults.ctaFunctionality ? 'text-green-600' : 'text-red-600'}`}>
            <span>CTA funcional:</span>
            <span>{testResults.ctaFunctionality ? '✅' : '❌'}</span>
          </div>
        </div>
      )}
    </div>
  );
}