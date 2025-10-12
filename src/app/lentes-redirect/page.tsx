import type { Metadata } from 'next'
import RedirectClient from '../lentes/redirect-client'

// URL de destino para redirecionamento
const REDIRECT_URL = 'https://saraivavision.com.br/lentes'

// Configuração do metadata para SEO
export const metadata: Metadata = {
  title: 'Redirecionando para SV Lentes | Saraiva Vision',
  description: 'Redirecionando para a página de lentes de contato da Saraiva Vision.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: REDIRECT_URL,
  },
  openGraph: {
    title: 'SV Lentes - Saraiva Vision',
    description: 'Assinatura de lentes de contato com acompanhamento oftalmológico',
    url: REDIRECT_URL,
    siteName: 'Saraiva Vision',
    locale: 'pt_BR',
    type: 'website',
  },
}

/**
 * Página de redirecionamento client-side para https://saraivavision.com.br/lentes
 *
 * Esta é uma versão alternativa que usa apenas redirecionamento client-side.
 * Útil quando você deseja mostrar uma UI de transição ao usuário.
 *
 * Diferenças entre /lentes e /lentes-redirect:
 * - /lentes: Usa redirect() do Next.js (server-side, HTTP 307, mais rápido)
 * - /lentes-redirect: Usa window.location.href (client-side, exibe UI de transição)
 *
 * Escolha baseada no caso de uso:
 * - Use /lentes para redirecionamento imediato sem UI
 * - Use /lentes-redirect para exibir mensagem ao usuário antes do redirect
 */
export default function LentesRedirectClientPage() {
  return <RedirectClient url={REDIRECT_URL} delay={0} />
}
