'use client'
import React, { useEffect, useState } from 'react'
import { usePersonalization } from '@/hooks/usePersonalization'
import { PersonaAnalyzer } from '@/lib/personalization/persona-analyzer'
import { PersonalizationEngine } from '@/lib/personalization/personalization-engine'
export function PersonalizationTest() {
    const {
        profile,
        persona,
        confidence,
        variations,
        isLoading,
        error,
        isInitialized,
        isPersonaDetected,
        recommendations,
        trackBehavior,
        trackConversion,
        getAnalytics,
        debugInfo
    } = usePersonalization({
        autoInitialize: true,
        config: {
            enabled: true,
            debug: true,
            autoUpdate: true,
            updateInterval: 30000, // 30 segundos para teste
            consentRequired: false
        }
    })
    const [analytics, setAnalytics] = useState<any>(null)
    const [debugData, setDebugData] = useState<any>(null)
    const [testResults, setTestResults] = useState<string[]>([])
    // Coletar analytics e debug info
    useEffect(() => {
        if (isInitialized) {
            getAnalytics().then(setAnalytics)
            debugInfo().then(setDebugData)
        }
    }, [isInitialized, getAnalytics, debugInfo])
    // Testar funcionalidades
    useEffect(() => {
        if (isPersonaDetected && persona) {
            const tests = [
                `✅ Persona detectada: ${persona}`,
                `✅ Confiança: ${(confidence * 100).toFixed(1)}%`,
                `✅ Nível de engajamento: ${profile?.engagementLevel}`,
                `✅ Probabilidade de conversão: ${((profile?.conversionProbability || 0) * 100).toFixed(1)}%`,
                `✅ Padrões comportamentais: ${profile?.behavioralPatterns.length}`,
                `✅ Recomendações: ${recommendations.length}`,
                `✅ Variações disponíveis: ${variations ? Object.keys(variations).length : 0}`
            ]
            setTestResults(tests)
        }
    }, [isPersonaDetected, persona, confidence, profile, variations, recommendations])
    // Testar tracking de comportamento
    const handleTestClick = () => {
        trackBehavior({
            type: 'click',
            element: 'test-button',
            value: {
                action: 'persona-test',
                timestamp: new Date().toISOString()
            }
        })
    }
    // Testar conversão
    const handleTestConversion = () => {
        trackConversion({
            type: 'test_conversion',
            value: 100,
            currency: 'BRL'
        })
    }
    // Testar atualização manual
    const handleManualUpdate = async () => {
        try {
            const sessionId = profile?.sessionId || 'test-session'
            const engine = new PersonalizationEngine(sessionId, {
                enabled: true,
                debug: true,
                autoUpdate: false,
                updateInterval: 60000,
                consentRequired: false
            })
            await engine.updateProfile({
                deviceInfo: undefined,
                pageAnalysis: undefined,
                trafficSource: undefined,
                temporalData: undefined
            })
            const newProfile = await engine.getAnalytics()
            setTestResults(prev => [...prev, `✅ Atualização manual: ${JSON.stringify(newProfile)}`])
        } catch (error) {
            setTestResults(prev => [...prev, `❌ Erro na atualização: ${error}`])
        }
    }
    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-xl font-bold text-red-800 mb-4">❌ Erro no Sistema de Personalização</h2>
                <p className="text-red-700">{error}</p>
            </div>
        )
    }
    if (isLoading) {
        return (
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-xl font-bold text-blue-800 mb-4">🔄 Inicializando Sistema de Personalização...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-blue-700 mt-4 text-center">Analisando comportamento e detectando persona...</p>
            </div>
        )
    }
    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🧪 Teste do Sistema de Personalização</h2>
            {/* Status do Sistema */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">📊 Status do Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Inicializado:</span>
                        <span className={`ml-2 font-medium ${isInitialized ? 'text-green-600' : 'text-red-600'}`}>
                            {isInitialized ? '✅ Sim' : '❌ Não'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Persona Detectada:</span>
                        <span className={`ml-2 font-medium ${isPersonaDetected ? 'text-green-600' : 'text-yellow-600'}`}>
                            {isPersonaDetected ? '✅ Sim' : '⏳ Aguardando...'}
                        </span>
                    </div>
                </div>
            </div>
            {/* Informações da Persona */}
            {persona && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-700 mb-3">👤 Persona Detectada</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-gray-600">Prob. Conversão:</span>
                            <span className="ml-2 font-medium text-blue-800">{((profile?.conversionProbability || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Confiança:</span>
                            <span className="ml-2 font-medium text-blue-800">{(confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Engajamento:</span>
                            <span className="ml-2 font-medium text-blue-800">{profile?.engagementLevel}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Prob. Conversão:</span>
                            <span className="ml-2 font-medium text-blue-800">{((profile?.conversionProbability || 0) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Variações de Conteúdo */}
            {variations && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-700 mb-3">🎨 Variações de Conteúdo</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-gray-600">Variant:</span>
                            <span className="ml-2 font-medium text-green-800">{variations.variant}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Microcopy:</span>
                            <span className="ml-2 font-medium text-green-800">
                                {variations.microcopy ? '✅ Disponível' : '❌ Não disponível'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Visual:</span>
                            <span className="ml-2 font-medium text-green-800">
                                {variations.visualElements ? '✅ Disponível' : '❌ Não disponível'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {/* Testes Realizados */}
            {testResults.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-700 mb-3">✅ Testes Realizados</h3>
                    <ul className="space-y-1 text-sm text-yellow-800">
                        {testResults.map((test, index) => (
                            <li key={index}>{test}</li>
                        ))}
                    </ul>
                </div>
            )}
            {/* Botões de Teste */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">🧪 Botões de Teste</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleTestClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Testar Click
                    </button>
                    <button
                        onClick={handleTestConversion}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Testar Conversão
                    </button>
                    <button
                        onClick={handleManualUpdate}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Atualizar Manualmente
                    </button>
                </div>
            </div>
            {/* Analytics */}
            {analytics && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                    <h3 className="font-semibold text-indigo-700 mb-3">📈 Analytics</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-gray-600">Session ID:</span>
                            <span className="ml-2 font-mono text-indigo-800">{analytics.sessionId}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Última Atualização:</span>
                            <span className="ml-2 font-medium text-indigo-800">
                                {new Date(analytics.lastUpdated).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Recomendações:</span>
                            <span className="ml-2 font-medium text-indigo-800">
                                {analytics.recommendations?.join(', ') || 'Nenhuma'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {/* Debug Info */}
            {debugData && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3">🐛 Debug Info</h3>
                    <details className="text-xs">
                        <summary className="cursor-pointer hover:text-gray-600">
                            Ver informações de debug
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded overflow-x-auto">
                            {JSON.stringify(debugData, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
            {/* Perfil Completo */}
            {profile && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3">📋 Perfil Completo</h3>
                    <details className="text-xs">
                        <summary className="cursor-pointer hover:text-gray-600">
                            Ver perfil completo
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-800 text-blue-400 rounded overflow-x-auto max-h-64">
                            {JSON.stringify(profile, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
            {/* Status Final */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-gray-200">
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">🎉 Sistema de Personalização Funcionando!</h3>
                    <p className="text-sm text-gray-600">
                        O sistema está detectando personas automaticamente e adaptando o conteúdo em tempo real.
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                        <p>ID da Sessão: {profile?.sessionId}</p>
                        <p>Timestamp: {new Date().toISOString()}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default PersonalizationTest