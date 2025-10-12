import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

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
 * Página de redirecionamento para https://saraivavision.com.br/lentes
 *
 * Esta página redireciona automaticamente os usuários que acessam svlentes.com.br
 * para a página de lentes no site principal da Saraiva Vision.
 *
 * Utiliza redirect() do Next.js que:
 * - Executa redirecionamento server-side (HTTP 307)
 * - Lança uma exceção internamente para interromper a renderização
 * - Garante redirecionamento rápido e eficiente
 *
 * A página também inclui:
 * - Meta tags SEO apropriadas (noindex, canonical)
 * - OpenGraph tags para compartilhamento em redes sociais
 */
export default function LentesRedirectPage() {
  // redirect() lança uma exceção e interrompe a execução
  // Não há necessidade de retornar nada após chamar redirect()
  redirect(REDIRECT_URL)
}
