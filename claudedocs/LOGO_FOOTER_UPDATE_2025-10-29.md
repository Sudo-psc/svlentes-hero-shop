# Logo Footer Update - GIF Animado 3x Maior

**Data**: 2025-10-29
**Autor**: Claude Code + Dr. Philipe Saraiva Cruz

## Resumo da Mudança

Atualização do logo no footer para usar o GIF animado `/logo_animado.gif` com tamanho 3 vezes maior que o logo original.

## Alterações Realizadas

### Arquivo: `src/components/ui/logo.tsx`

#### 1. Novo Tamanho: `footer-animated`
```typescript
const SIZE_CONFIG = {
  // ... outros tamanhos ...
  "footer-animated": { wrapper: "h-[168px] w-[168px]", dimension: 168 } // 3x do tamanho md (56 * 3 = 168)
}
```

**Cálculo**:
- Tamanho original (`md`): 56px × 56px
- Novo tamanho (`footer-animated`): 168px × 168px (56 × 3)

#### 2. Prop `useAnimatedGif` Adicionada
```typescript
interface LogoProps {
  // ... outras props ...
  useAnimatedGif?: boolean  // Nova prop para alternar entre logo estático e GIF animado
}
```

#### 3. Lógica de Seleção de Fonte
```typescript
const logoSrc = useAnimatedGif ? "/logo_animado.gif" : "/images/logo.jpeg"
```

#### 4. Componente `LogoFooter` Atualizado
```typescript
export const LogoFooter = React.forwardRef<HTMLDivElement, LogoProps>((props, ref) => (
  <Logo ref={ref} size="footer-animated" variant="footer" useAnimatedGif={true} {...props} />
))
```

## Componentes Afetados

### `src/components/layout/Footer.tsx`
- Já usa `<LogoFooter>` na linha 85
- **Nenhuma mudança necessária** - a atualização é automática

## Detalhes Técnicos

### Arquivo GIF
- **Localização**: `/root/svlentes-hero-shop/public/logo_animado.gif`
- **Tamanho do arquivo**: 1.9MB
- **Data de criação**: 2025-10-12

### Next.js Image Component
- Usando `unoptimized={true}` para preservar animação do GIF
- Propriedade `priority` ativa para carregamento prioritário
- `object-contain` para manter proporções

### Tailwind CSS Classes
```css
wrapper: "h-[168px] w-[168px]"  /* Tamanho do container */
className: "w-full h-full object-contain"  /* Imagem responsiva */
```

## Compatibilidade

### Componentes Não Afetados
- ✅ `LogoHeader` - continua usando logo estático em tamanho `md`
- ✅ `Logo` genérico - funciona com ambas as opções

### Retrocompatibilidade
- ✅ Mantém suporte total a todos os tamanhos anteriores (`sm`, `md`, `lg`, `xl`)
- ✅ Props opcionais não quebram implementações existentes
- ✅ Fallback automático para logo estático quando `useAnimatedGif=false`

## Características do Design

### Visual
- **Tamanho**: 3x maior (168px × 168px)
- **Animação**: Mantém animação original do GIF
- **Posicionamento**: Centralizado com `mx-auto md:mx-0`

### Comportamento
- **Hover**: `hover:opacity-90 transition-all`
- **Responsividade**: Centralizado em mobile, alinhado à esquerda em desktop

## Testes Recomendados

### Manual
1. Verificar visualização no footer em `/` (homepage)
2. Testar responsividade (mobile/tablet/desktop)
3. Confirmar animação do GIF está funcionando
4. Validar tamanho correto (168px × 168px)

### Navegadores
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Android)

### Performance
- **Impacto**: +1.9MB no carregamento inicial do footer
- **Otimização**: GIF carregado com `priority` para evitar layout shift
- **Cache**: Arquivo estático, cache de longo prazo no navegador

## Deployment

### Build
```bash
npm run build
```

### Restart Service (Production)
```bash
systemctl restart svlentes-nextjs
```

### Verificação
```bash
# Verificar serviço
systemctl status svlentes-nextjs

# Ver logs
journalctl -u svlentes-nextjs -f

# Test endpoint
curl -I https://svlentes.shop
```

## Rollback

Caso necessário reverter:

```typescript
// Em src/components/ui/logo.tsx
export const LogoFooter = React.forwardRef<HTMLDivElement, LogoProps>((props, ref) => (
  <Logo ref={ref} size="md" variant="footer" {...props} />  // Remove useAnimatedGif={true}
))
```

## Notas Adicionais

### Acessibilidade
- ✅ Atributo `alt="SV Lentes"` mantido
- ✅ Animação não interfere com leitores de tela
- ✅ Sem texto em movimento (WCAG 2.1 compliance)

### SEO
- ✅ Logo com `alt` descritivo
- ✅ Sem impacto negativo em SEO (imagem decorativa no footer)

### LGPD
- ✅ Arquivo local, sem tracking externo
- ✅ Sem coleta de dados de usuário

## Referências

- Next.js Image Component: https://nextjs.org/docs/api-reference/next/image
- GIF Optimization: https://web.dev/fast/#optimize-your-images
- Tailwind CSS: https://tailwindcss.com/docs

## Status

- ✅ **Implementado**: 2025-10-29
- ✅ **Testado**: Component builds successfully
- ⏳ **Deploy**: Aguardando deploy em produção
