import { useEffect, useState } from 'react'

export function useNonce() {
    const [nonce, setNonce] = useState<string>('')

    useEffect(() => {
        // Get nonce from meta tag or response header
        const metaNonce = document.querySelector('meta[name="csp-nonce"]')
        if (metaNonce) {
            setNonce(metaNonce.getAttribute('content') || '')
        } else {
            // Fallback: get from response headers via server-side rendering
            const responseHeaders = (window as any).__CSP_NONCE__
            if (responseHeaders) {
                setNonce(responseHeaders)
            }
        }
    }, [])

    return nonce
}