'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered:', registration)

                        // Check for updates every hour
                        setInterval(() => {
                            registration.update()
                        }, 3600000)
                    })
                    .catch((error) => {
                        console.log('SW registration failed:', error)
                    })
            })

            // Listen for SW updates
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('SW updated, reloading page...')
                window.location.reload()
            })
        }
    }, [])

    return null
}
