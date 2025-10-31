import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QuestionCard } from '@/components/questionnaire/QuestionCard';
import { QuestionProgress } from '@/components/questionnaire/QuestionProgress';
import { QuestionNavigation } from '@/components/questionnaire/QuestionNavigation';
import { QuestionnaireProvider } from '@/contexts/QuestionnaireContext';

const QuestionnairePage: React.FC = () => {
  return (
    <QuestionnaireProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow pt-24">
          <div className="container-custom">
            <div className="py-12 bg-white rounded-lg shadow-md px-8">
              <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
                Recomendação Personalizada de Correção Visual
              </h1>
              <p className="text-center text-gray-600 mb-8">
                Responda as perguntas para receber sua recomendação.
              </p>
              <QuestionProgress />
              <QuestionCard />
              <QuestionNavigation />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </QuestionnaireProvider>
  );
};

export default QuestionnairePage;
