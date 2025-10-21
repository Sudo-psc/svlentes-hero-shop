'use client'

import Script from 'next/script'

interface SecureScriptProps {
    id?: string
    src?: string
    strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload'
    dangerouslySetInnerHTML?: { __html: string }
    [key: string]: any
}

export function SecureScript({
    id,
    src,
    strategy = 'afterInteractive',
    dangerouslySetInnerHTML,
    ...props
}: SecureScriptProps) {
    const nonce = useNonce()

    // Adicionar atributo de nonce para scripts inline
    const scriptProps: any = {
        id,
        nonce,
        ...props
    }

    if (src) {
        return (
            <Script
                {...scriptProps}
                src={src}
                strategy={strategy}
            />
        )
    }

    if (dangerouslySetInnerHTML) {
        return (
            <script
                {...scriptProps}
                dangerouslySetInnerHTML={dangerouslySetInnerHTML}
            />
        )
    }

    return <script {...scriptProps} />
}

// Hook para obter nonce do meta tag ou headers
export function useNonce() {
    if (typeof window === 'undefined') return ''

    const metaTag = document.querySelector('meta[name="csp-nonce"]')
    return metaTag?.getAttribute('content') || ''
}