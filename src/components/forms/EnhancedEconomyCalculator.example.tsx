'use client'

import { EnhancedEconomyCalculator } from './EnhancedEconomyCalculator'

export default function ExampleUsage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Calculadora de Economia - Demo
        </h1>
        
        <EnhancedEconomyCalculator 
          onContinueAction={() => {
            console.log('Usuário clicou em continuar')
          }}
        />

        <div className="mt-12 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Recursos Implementados ✨</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Customização Avançada</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Seleção de tipo de lente (diária, semanal, mensal)</li>
                <li>• Padrões de uso predefinidos (ocasional, regular, diário)</li>
                <li>• Opção de customizar dias de uso por mês</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">📊 Gráfico Visual</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Comparação visual usando Recharts</li>
                <li>• Gráfico de barras mensal vs anual</li>
                <li>• Tooltips formatados em reais</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎬 Animações</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• CountUp effect nos valores calculados</li>
                <li>• Transições suaves entre estados</li>
                <li>• Feedback visual interativo</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔗 Compartilhamento</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Share API nativa do navegador</li>
                <li>• Fallback para clipboard</li>
                <li>• Mensagem personalizada com economia</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">💾 Cálculos Salvos</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• LocalStorage para persistência</li>
                <li>• Histórico de até 10 cálculos</li>
                <li>• Carregamento rápido de cálculos anteriores</li>
                <li>• Deletar cálculos individualmente</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">💡 Tooltips Explicativos</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Ícone de informação em cada campo</li>
                <li>• Explicações contextuais</li>
                <li>• Interface intuitiva e educativa</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-cyan-50 border border-cyan-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-cyan-900">Como Usar</h2>
          <ol className="text-sm text-cyan-800 space-y-2 list-decimal list-inside">
            <li>Selecione o tipo de lente que você usa</li>
            <li>Escolha sua frequência de uso ou personalize os dias</li>
            <li>Clique em "Calcular Economia" para ver os resultados</li>
            <li>Use os botões de compartilhar e salvar para guardar seus cálculos</li>
            <li>Acesse cálculos salvos através do botão no topo</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
