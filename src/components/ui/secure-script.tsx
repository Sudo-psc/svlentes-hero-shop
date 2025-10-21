'use client'

import Script from 'next/script'
import { useNonce } from '@/hooks/use-nonce'

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

    if (src) {
        return (
            <Script
                id={id}
                src={src}
                strategy={strategy}
                nonce={nonce}
                {...props}
            />
        )
    }

    if (dangerouslySetInnerHTML) {
        return (
            <script
                id={id}
                nonce={nonce}
                dangerouslySetInnerHTML={dangerouslySetInnerHTML}
                {...props}
            />
        )
    }

    return <script id={id} nonce={nonce} {...props} />
}