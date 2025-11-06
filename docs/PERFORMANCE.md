# Guia de Performance

## Cache e Entrega de Conteúdo
- Habilite o cache reverso definido em `nginx/production.conf` para `_next/static`, assets e dados ISR.
- Configure CDN (`CDN_DOMAIN`) apontando para o Nginx para offload de assets pesados.
- Utilize `Cache-Control: public, max-age=31536000, immutable` para assets versionados.

## Build e Otimização
- Execute `npm run build` em máquinas com >= 4 vCPU e 4GB RAM para evitar OOM.
- Mantenha dependências atualizadas (`npm run security:deps-check`).
- Ative `next build --profile` em ambientes de staging para investigar gargalos.
- Utilizar `output: 'standalone'` (já configurado em `next.config.js`) para reduzir tamanho do bundle runtime.

## Estratégias de Renderização
- Uso misto de SSG/ISR no App Router: ver `src/app` para rotas estáticas (planos, faq) vs. rotas dinâmicas (`/api/**`).
- Habilitar `revalidate` em páginas que buscam dados externos para reduzir chamadas em tempo real.
- Para APIs de longa duração (ASAAS, SendPulse), implemente filas e webhooks quando possível.

## Monitoramento de Métricas
- Colete métricas de latência e throughput com `scripts/monitor.sh` e envie para Datadog/AWS CloudWatch.
- Configure alertas para:
  - Latência > 2s por 5 minutos
  - Taxa de erros HTTP 5xx > 1%
  - Consumo de memória > 85%
- Exponha métricas customizadas via `/api/monitoring/**` (já implementado no projeto).

## Frontend
- Utilize imagens otimizadas (`next/image` com WebP/AVIF).
- Prefetch de rotas críticas com `next/link`.
- Habilitar `ServiceWorkerRegistration` (já presente em `src/components/performance/ServiceWorkerRegistration.tsx`).
- Monitorar Core Web Vitals via Google Analytics (`NEXT_PUBLIC_GA_MEASUREMENT_ID`).

## Load Testing
- Antes de grandes lançamentos, rodar `npx artillery run specs/performance.yaml` (criar plano customizado).
- Validar limites de rate limiting (`limit_req` em Nginx) sob carga realista.

## Rotinas Recomendadas
- Rodar `scripts/test-local.sh` a cada PR crítico.
- Agendar `npm run lighthouse` semanalmente para acompanhar desempenho percepcionado.
