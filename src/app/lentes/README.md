# Páginas de Redirecionamento SV Lentes

## Visão Geral

Este diretório contém as páginas de redirecionamento que encaminham usuários de `svlentes.com.br` para `https://saraivavision.com.br/lentes`.

## Rotas Disponíveis

### 1. `/lentes` - Redirecionamento Server-Side (Recomendado)

**Arquivo**: `src/app/lentes/page.tsx`

**Características**:
- ✅ Redirecionamento server-side usando `redirect()` do Next.js
- ✅ HTTP 307 (Temporary Redirect)
- ✅ Mais rápido - redirecionamento antes do HTML ser enviado
- ✅ SEO otimizado com meta tags apropriadas
- ✅ Não exibe UI de transição (redirect imediato)

**Quando usar**: Esta é a opção recomendada para a maioria dos casos. O usuário é redirecionado instantaneamente sem ver nenhuma UI intermediária.

**Exemplo de uso**:
```
https://svlentes.com.br/lentes
→ Redireciona para: https://saraivavision.com.br/lentes
```

---

### 2. `/lentes-redirect` - Redirecionamento Client-Side (Alternativa)

**Arquivo**: `src/app/lentes-redirect/page.tsx`

**Características**:
- ✅ Redirecionamento client-side usando `window.location.href`
- ✅ Exibe UI de transição amigável
- ✅ Inclui link manual para redirecionamento
- ✅ Animações de loading
- ✅ Informações de contato da clínica
- ⚠️ Requer JavaScript habilitado

**Quando usar**: Use esta opção quando você deseja exibir uma mensagem ou UI de transição ao usuário antes de redirecioná-lo.

**Exemplo de uso**:
```
https://svlentes.com.br/lentes-redirect
→ Exibe UI de transição
→ Redireciona após delay configurável
```

---

## Componentes

### `RedirectClient` Component

**Arquivo**: `src/app/lentes/redirect-client.tsx`

Componente reutilizável para redirecionamento client-side com UI.

**Props**:
```typescript
interface RedirectClientProps {
  url: string      // URL de destino
  delay?: number   // Delay em ms antes do redirect (padrão: 0)
}
```

**Recursos**:
- 🎨 UI moderna e responsiva com Tailwind CSS
- 🔄 Animações de loading
- 🔗 Link manual de fallback
- 📱 Totalmente responsivo
- ℹ️ Informações de contato da Saraiva Vision

**Exemplo de uso**:
```tsx
import RedirectClient from './redirect-client'

export default function MyRedirectPage() {
  return <RedirectClient url="https://example.com" delay={2000} />
}
```

---

## Metadata SEO

Ambas as páginas incluem metadata otimizada para SEO:

```typescript
{
  title: 'Redirecionando para SV Lentes | Saraiva Vision',
  description: 'Redirecionando para a página de lentes de contato da Saraiva Vision.',
  robots: {
    index: false,    // Não indexar página de redirect
    follow: true,    // Seguir links
  },
  alternates: {
    canonical: 'https://saraivavision.com.br/lentes',
  },
  openGraph: {
    title: 'SV Lentes - Saraiva Vision',
    description: 'Assinatura de lentes de contato com acompanhamento oftalmológico',
    url: 'https://saraivavision.com.br/lentes',
    siteName: 'Saraiva Vision',
    locale: 'pt_BR',
    type: 'website',
  },
}
```

---

## Configuração no Vercel

Para usar estas páginas com o domínio `svlentes.com.br`:

### Opção 1: Redirecionamento no Vercel Dashboard

1. Acesse o Vercel Dashboard
2. Vá em **Settings** > **Domains**
3. Adicione `svlentes.com.br`
4. Configure redirect para `https://svlentes.shop/lentes`

### Opção 2: Redirecionamento no vercel.json

Já configurado em `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "svlentes.com.br"
        }
      ],
      "destination": "https://saraivavision.com.br/lentes",
      "permanent": true
    }
  ]
}
```

---

## Testes

### Testar Redirecionamento Server-Side

```bash
# Desenvolvimento local
curl -I http://localhost:3000/lentes

# Produção
curl -I https://svlentes.shop/lentes
```

**Resposta esperada**:
```
HTTP/1.1 307 Temporary Redirect
Location: https://saraivavision.com.br/lentes
```

### Testar Redirecionamento Client-Side

1. Acesse `http://localhost:3000/lentes-redirect` no navegador
2. Verifique se a UI de transição é exibida
3. Confirme se o redirecionamento ocorre automaticamente
4. Teste o link manual de fallback

---

## Performance

### Server-Side Redirect (`/lentes`)
- ⚡ Redirecionamento instantâneo
- 📦 Sem JavaScript necessário
- 🚀 Tempo de resposta: ~50ms

### Client-Side Redirect (`/lentes-redirect`)
- ⏱️ Tempo de carregamento: ~200ms (First Contentful Paint)
- 📦 Requer JavaScript habilitado
- 🎨 Exibe UI de transição

---

## Considerações de SEO

### Status HTTP

- **Server-Side (307)**: Redirecionamento temporário
  - Não transfere PageRank
  - Mantém o método HTTP original
  - Motores de busca continuam indexando URL original

- **Permanent (301)**: Use em `vercel.json` para SEO
  - Transfere PageRank para URL de destino
  - Motores de busca atualizam índices

### Meta Tags

- `robots: noindex, follow`: Não indexa página de redirect
- `canonical`: Aponta para URL final
- OpenGraph: Configurado para compartilhamento social

---

## Troubleshooting

### Redirecionamento não funciona

1. **Verifique o build**:
   ```bash
   npm run build
   npm run start
   ```

2. **Verifique os logs do Next.js**:
   ```bash
   # Ative debug mode
   DEBUG=* npm run dev
   ```

3. **Teste com curl**:
   ```bash
   curl -I http://localhost:3000/lentes
   ```

### Loop de redirecionamento

- Verifique se `saraivavision.com.br/lentes` não redireciona de volta
- Confirme configurações no `vercel.json`
- Verifique regras no Vercel Dashboard

### Client-side não funciona

- Confirme que JavaScript está habilitado
- Verifique console do navegador para erros
- Teste em navegadores diferentes

---

## Manutenção

### Alterar URL de destino

Edite a constante `REDIRECT_URL` nos arquivos:
- `src/app/lentes/page.tsx`
- `src/app/lentes-redirect/page.tsx`

```typescript
const REDIRECT_URL = 'https://nova-url.com.br/lentes'
```

### Adicionar delay no redirect

Para `/lentes-redirect`, altere o prop `delay`:

```tsx
<RedirectClient url={REDIRECT_URL} delay={3000} /> // 3 segundos
```

### Personalizar UI

Edite `src/app/lentes/redirect-client.tsx` para customizar:
- Cores e estilo (Tailwind classes)
- Animações
- Textos e mensagens
- Informações de contato

---

## Suporte

Para mais informações sobre redirecionamentos no Next.js:
- [Next.js Redirects Documentation](https://nextjs.org/docs/app/api-reference/functions/redirect)
- [Vercel Redirects Guide](https://vercel.com/docs/edge-network/redirects)

Para questões específicas do projeto:
- **Email**: saraivavision@gmail.com
- **WhatsApp**: (33) 99860-1427
