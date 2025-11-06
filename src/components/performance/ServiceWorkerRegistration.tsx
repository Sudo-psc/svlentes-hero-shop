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

        let intervalId: ReturnType<typeof setInterval> | undefined
        let registration: ServiceWorkerRegistration | undefined
        let newWorker: ServiceWorker | undefined
        
        // Handler para mudança de estado do service worker
        const handleStateChange = () => {
            if (
                newWorker &&
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
            ) {
                // Nova versão disponível
                console.log('[SW] Nova versão do Service Worker disponível')
                setUpdateAvailable(true)

                // Notificar usuário com evento customizado (não bloqueante)
                // O componente pai ou um toast system pode escutar este evento
                window.dispatchEvent(
                    new CustomEvent('sw-update-available', {
                        detail: { reload: () => window.location.reload() }
                    })
                )
                
                // Log para desenvolvedores
                console.log('[SW] Dispatched sw-update-available event. Use toast/banner to notify user.')
            }
        }
        
        // Handler para atualização encontrada
        const handleUpdateFound = () => {
            // Remove listener do worker anterior se existir
            if (newWorker) {
                newWorker.removeEventListener('statechange', handleStateChange)
            }
            
            newWorker = registration?.installing

            if (newWorker) {
                newWorker.addEventListener('statechange', handleStateChange)
            }
        }

        // Registrar Service Worker
        const registerServiceWorker = async () => {
            try {
                registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                })

                console.log('[SW] Service Worker registrado com sucesso:', registration.scope)

                // Verificar atualizações
                registration.addEventListener('updatefound', handleUpdateFound)

                // Verificar por atualizações a cada 1 hora
                intervalId = setInterval(() => {
                    registration?.update()
                }, 60 * 60 * 1000)

                // Verificar imediatamente se há uma atualização
                registration.update()
            } catch (error) {
                console.error('[SW] Falha ao registrar Service Worker:', error)
            }
        }

        // Aguardar o evento load para não atrasar o carregamento inicial
        if (document.readyState === 'complete') {
            registerServiceWorker()
        } else {
            window.addEventListener('load', registerServiceWorker)
        }

        // Cleanup function
        return () => {
            window.removeEventListener('load', registerServiceWorker)
            if (intervalId) {
                clearInterval(intervalId)
            }
            if (registration) {
                registration.removeEventListener('updatefound', handleUpdateFound)
            }
            if (newWorker) {
                newWorker.removeEventListener('statechange', handleStateChange)
            }
        }
    }, [])

    // Componente não renderiza nada
    return null
}
