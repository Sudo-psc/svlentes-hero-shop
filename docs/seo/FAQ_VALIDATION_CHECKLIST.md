# Checklist de Validação - FAQs Saraiva Vision
**Autor:** Dr. Philipe Saraiva Cruz  
**Data:** 27 de Outubro de 2025

## ✅ PRÉ-PUBLICAÇÃO

### 1. Validação Técnica

#### Schema Markup
- [ ] Testar cada página no Google Rich Results Test
  - URL: https://search.google.com/test/rich-results
  - ✅ Homepage
  - ✅ Catarata
  - ✅ Glaucoma
  - ✅ Lentes de Contato
  - ✅ Consulta Oftalmológica

- [ ] Validar JSON no Schema.org Validator
  - URL: https://validator.schema.org/
  - [ ] Sem erros críticos
  - [ ] Sem warnings importantes

- [ ] Verificar sintaxe JSON
  - URL: https://jsonlint.com/
  - [ ] Todos os schemas válidos

#### Componentes React
- [ ] Testar accordion em diferentes navegadores
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari
  - [ ] Mobile Chrome
  - [ ] Mobile Safari

- [ ] Verificar acessibilidade
  - [ ] Navegação por teclado (Tab, Enter, Space)
  - [ ] Screen reader compatibility
  - [ ] ARIA labels corretos
  - [ ] Contraste de cores adequado (WCAG AA)

- [ ] Performance
  - [ ] Lighthouse Score > 90
  - [ ] Tempo de carregamento < 3s
  - [ ] No layout shift (CLS < 0.1)
  - [ ] Animações suaves (60 FPS)

### 2. Validação de Conteúdo

#### Qualidade das Respostas
- [ ] Linguagem acessível (sem jargão excessivo)
- [ ] Flesch Reading Ease Score > 60
  - URL: https://www.webfx.com/tools/read-able/
- [ ] Respostas completas (150-300 palavras)
- [ ] Informações médicas precisas
- [ ] Sem erros de português

#### SEO On-Page
- [ ] Title tags otimizados (50-60 caracteres)
- [ ] Meta descriptions (150-160 caracteres)
- [ ] H1 único por página
- [ ] Estrutura de headings lógica (H1 > H2 > H3)
- [ ] Internal links funcionando
- [ ] Alt text em imagens
- [ ] URLs amigáveis

#### CTAs (Call-to-Actions)
- [ ] Cada resposta tem link relevante
- [ ] CTAs claros e persuasivos
- [ ] Links não quebrados
- [ ] Telefone clicável (mobile)
- [ ] WhatsApp link funcionando
- [ ] Botão de agendamento visível

### 3. Revisão Editorial

#### Consistência
- [ ] Tom de voz uniforme em todas as páginas
- [ ] Formatação consistente
- [ ] Nomenclaturas padronizadas
- [ ] Dados atualizados (endereço, telefone, horários)

#### Compliance
- [ ] Conformidade com CFM (Conselho Federal de Medicina)
- [ ] Sem promessas não comprováveis
- [ ] Disclaimer adequado onde necessário
- [ ] LGPD compliance (dados pessoais)

---

## 🚀 PÓS-PUBLICAÇÃO

### Dia 1-7: Monitoramento Inicial

#### Google Search Console
- [ ] Submeter sitemap atualizado
- [ ] Solicitar indexação das páginas
- [ ] Verificar cobertura (sem erros)
- [ ] Monitorar Core Web Vitals

#### Analytics
- [ ] Configurar eventos de clique no accordion
- [ ] Rastrear CTAs específicos de FAQ
- [ ] Configurar goals para conversões
- [ ] Verificar fontes de tráfego

### Semana 2-4: Otimização

#### Ajustes Baseados em Dados
- [ ] Analisar FAQs mais acessadas
- [ ] Identificar perguntas sem resposta
- [ ] Revisar FAQs com baixo engagement
- [ ] Adicionar FAQs baseadas em perguntas reais de pacientes

#### Rich Results
- [ ] Verificar aparição de FAQs nos resultados
- [ ] Monitorar impressões e cliques
- [ ] Comparar CTR com páginas sem rich results
- [ ] Documentar melhorias

### Mês 2-3: Expansão

#### Conteúdo Adicional
- [ ] Criar blog posts aprofundados para top FAQs
- [ ] Produzir vídeos respondendo FAQs populares
- [ ] Desenvolver infográficos
- [ ] Criar PDF downloadável com FAQs

#### Distribuição
- [ ] Compartilhar FAQs nas redes sociais
- [ ] Email marketing com FAQs destacadas
- [ ] WhatsApp Business: mensagens automáticas com FAQs
- [ ] Google Business Profile: adicionar FAQs

---

## 📊 KPIs E MÉTRICAS

### Métricas de SEO (mensal)

| Métrica | Baseline | Meta 30d | Meta 90d | Atual |
|---------|----------|----------|----------|-------|
| Páginas indexadas com FAQ | 0 | 5 | 5 | - |
| Impressões FAQ queries | - | 500 | 2000 | - |
| Cliques via FAQ | - | 50 | 200 | - |
| CTR médio | - | 10% | 15% | - |
| Posição média FAQ keywords | - | <20 | <10 | - |
| Featured snippets conquistados | 0 | 2 | 5 | - |

### Métricas de Engajamento (mensal)

| Métrica | Baseline | Meta 30d | Meta 90d | Atual |
|---------|----------|----------|----------|-------|
| Tempo médio na página FAQ | - | 2min | 3min | - |
| Taxa de rejeição FAQ pages | - | <50% | <40% | - |
| Cliques em accordion items | - | 200 | 800 | - |
| Cliques em CTAs das respostas | - | 20 | 80 | - |
| Taxa de conversão FAQ → Lead | - | 2% | 5% | - |

### Métricas de Negócio (mensal)

| Métrica | Baseline | Meta 30d | Meta 90d | Atual |
|---------|----------|----------|----------|-------|
| Agendamentos via FAQ pages | 0 | 5 | 20 | - |
| Ligações telefônicas | - | 10 | 40 | - |
| Mensagens WhatsApp | - | 15 | 60 | - |
| ROI estimado | R$ 0 | R$ 2.500 | R$ 10.000 | - |

---

## 🔧 FERRAMENTAS NECESSÁRIAS

### SEO e Validação
- [x] Google Search Console
- [x] Google Rich Results Test
- [x] Schema.org Validator
- [x] JSONLint
- [ ] Screaming Frog SEO Spider (opcional)
- [ ] Ahrefs/SEMrush (opcional)

### Analytics e Monitoramento
- [ ] Google Analytics 4
- [ ] Google Tag Manager
- [ ] Hotjar/Microsoft Clarity (heatmaps)
- [ ] CallRail (phone tracking - opcional)

### Performance
- [ ] Google PageSpeed Insights
- [ ] Lighthouse CI
- [ ] WebPageTest.org
- [ ] GTmetrix

### Acessibilidade
- [ ] WAVE (Web Accessibility Evaluation Tool)
- [ ] axe DevTools
- [ ] Screen reader (NVDA/JAWS)

---

## 📝 TEMPLATE DE RELATÓRIO SEMANAL

```markdown
# Relatório FAQs Saraiva Vision - Semana [X]
**Período:** [data inicial] a [data final]

## 📈 Resumo Executivo
- Total de impressões: X (+Y% vs. semana anterior)
- Total de cliques: X (+Y%)
- CTR médio: X%
- Conversões (leads): X
- ROI estimado: R$ X

## 🎯 Destaques da Semana
- ✅ [Conquista importante]
- ✅ [Melhoria implementada]
- ⚠️ [Ponto de atenção]

## 📊 Desempenho por Página

### Homepage FAQs
- Impressões: X
- Cliques: X
- CTR: X%
- FAQ mais acessada: "[pergunta]"

### Catarata FAQs
- Impressões: X
- Cliques: X
- CTR: X%
- FAQ mais acessada: "[pergunta]"

[Repetir para outras páginas]

## 🔍 Top 5 Queries
1. "[query 1]" - X impressões - Posição X
2. "[query 2]" - X impressões - Posição X
3. "[query 3]" - X impressões - Posição X
4. "[query 4]" - X impressões - Posição X
5. "[query 5]" - X impressões - Posição X

## 💡 Insights e Oportunidades
- [Insight 1]
- [Insight 2]
- [Oportunidade identificada]

## ✅ Ações para Próxima Semana
- [ ] [Ação 1]
- [ ] [Ação 2]
- [ ] [Ação 3]

## 📌 Observações
[Notas adicionais]

---
**Preparado por:** [Nome]
**Data:** [Data]
```

---

## 🚨 TROUBLESHOOTING RÁPIDO

### Schema não valida
```bash
# 1. Verificar JSON
cat schema.json | python -m json.tool

# 2. Testar localmente
curl -X POST https://validator.schema.org/ \
  -d "@schema.json" \
  -H "Content-Type: application/ld+json"
```

### Accordion não abre/fecha
```javascript
// Verificar no console do navegador
console.log('FAQ Accordion mounted')
// Se não aparecer, problema com 'use client' ou hidratação
```

### FAQs não aparecem no Google
**Checklist rápido:**
1. Página indexada? (Search Console)
2. Schema válido? (Rich Results Test)
3. Conteúdo único? (não duplicado)
4. Aguardou 2-4 semanas?
5. robots.txt não bloqueia?
6. Sitemap atualizado?

---

## 📞 CONTATOS DE SUPORTE

### Técnico
- **Desenvolvedor:** [nome]
- **Email:** dev@saraivavision.com.br
- **Disponibilidade:** Segunda a Sexta, 9h-18h

### Conteúdo
- **Editor:** [nome]
- **Email:** conteudo@saraivavision.com.br

### SEO
- **Especialista:** [nome]
- **Email:** seo@saraivavision.com.br

---

## 🎓 RECURSOS ADICIONAIS

### Documentação Oficial
- [Google Search Central - FAQ Schema](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

### Tutoriais Recomendados
- [Moz: FAQ Schema Guide](https://moz.com/learn/seo/faq-schema)
- [Ahrefs: How to Get Featured Snippets](https://ahrefs.com/blog/featured-snippets/)
- [Search Engine Journal: FAQ SEO Best Practices](https://www.searchenginejournal.com/)

### Comunidades
- [r/SEO (Reddit)](https://reddit.com/r/SEO)
- [WebmasterWorld](https://www.webmasterworld.com/)
- [Google Search Central Community](https://support.google.com/webmasters/community)

---

**Última atualização:** 27 de Outubro de 2025  
**Versão:** 1.0  
**Autor:** Dr. Philipe Saraiva Cruz

