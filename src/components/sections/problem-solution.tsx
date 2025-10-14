'use client';

import { customerProblems, svlentesSolutions } from '@/data/problems-solutions';
import { openWhatsAppWithContext } from '@/lib/whatsapp';

export function ProblemSolution() {
  const handleSpecialistContact = () => {
    openWhatsAppWithContext('consultation', {
      page: 'landing-page',
      section: 'problem-solution',
      userInfo: {
        nome: 'Interessado via Problema-Solução'
      }
    });
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Problemas que Você Conhece vs Nossa Solução
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Transformamos as principais dores de quem usa lentes de contato em soluções práticas e econômicas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Problemas */}
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">😤</span>
                Problemas Comuns
              </h3>
            </div>

            <div className="space-y-4">
              {customerProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-start space-x-3 p-4 bg-red-50 border border-red-100 rounded-lg"
                >
                  <span className="text-2xl flex-shrink-0">{problem.icon}</span>
                  <p className="text-gray-700 font-medium">{problem.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Soluções */}
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">✨</span>
                Soluções SV Lentes
              </h3>
            </div>

            <div className="space-y-4">
              {svlentesSolutions.map((solution) => (
                <div
                  key={solution.id}
                  className="flex items-start space-x-3 p-4 bg-green-50 border border-green-100 rounded-lg"
                >
                  <span className="text-2xl flex-shrink-0">{solution.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{solution.title}</h4>
                    <p className="text-gray-600 text-sm">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Contextual */}
        <div className="mt-12 text-center">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Pronto para Resolver Esses Problemas?
            </h3>
            <p className="text-gray-600 mb-6">
              Converse com nosso especialista e descubra como a SVlentes pode transformar sua experiência com lentes de contato
            </p>
            <button
              onClick={handleSpecialistContact}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Falar com um Especialista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}