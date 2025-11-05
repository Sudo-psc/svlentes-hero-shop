'use client'

/**
 * Service Worker Registration Component
 * Registra o Service Worker para funcionalidade offline com fallback robusto
 */

import { useEffect, useState } from 'react'

export function ServiceWorkerRegistration() {
    const [updateAvailable, setUpdateAvailable] = useState(false)

    useEffect(() => {
        // Verificar se Service Worker é suportado
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            console.log('[SW] Service Workers não são suportados neste navegador')
            return
        }

        // Permitir em desenvolvimento também para testar offline
        const isDev = process.env.NODE_ENV === 'development'
        const shouldRegister = process.env.NODE_ENV === 'production' || isDev

        if (!shouldRegister) {
            return
        }

        // Registrar Service Worker
        const registerServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                })

                console.log('[SW] Service Worker registrado com sucesso:', registration.scope)

                // Verificar atualizações
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing

                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (
                                newWorker.state === 'installed' &&
                                navigator.serviceWorker.controller
                            ) {
                                // Nova versão disponível
                                console.log('[SW] Nova versão do Service Worker disponível')
                                setUpdateAvailable(true)

                                // Notificar usuário
                                if (window.confirm('Nova versão disponível. Atualizar agora?')) {
                                    window.location.reload()
                                }
                            }
                        })
                    }
                })

                // Verificar por atualizações a cada 1 hora
                setInterval(() => {
                    registration.update()
                }, 60 * 60 * 1000)

                // Verificar imediatamente se há uma atualização
                registration.update()
            } catch (error) {
                console.error('[SW] Falha ao registrar Service Worker:', error)
            }
        }

        // Aguardar o evento load para não atrasar o carregamento inicial
        if (typeof document !== 'undefined' && document.readyState === 'complete') {
            registerServiceWorker()
        } else if (typeof window !== 'undefined') {
            window.addEventListener('load', registerServiceWorker)
            return () => window.removeEventListener('load', registerServiceWorker)
        }
    }, [])

    // Componente não renderiza nada
    return null
}
