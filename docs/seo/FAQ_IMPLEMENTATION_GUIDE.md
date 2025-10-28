# Guia de Implementação - FAQs Saraiva Vision
**Autor:** Dr. Philipe Saraiva Cruz  
**Data:** 27 de Outubro de 2025

## 📦 ARQUIVOS CRIADOS

### Componentes React
- `/src/components/SEO/FAQSchema.tsx` - Schema JSON-LD
- `/src/components/SEO/FAQAccordion.tsx` - Accordion visual

### Dados
- `/src/data/faqs/homepage.ts` - FAQs da homepage
- `/src/data/faqs/catarata.ts` - FAQs de catarata
- `/src/data/faqs/glaucoma.ts` - FAQs de glaucoma
- `/src/data/faqs/lentes-contato.ts` - FAQs de lentes de contato
- `/src/data/faqs/consulta.ts` - FAQs de consulta oftalmológica
- `/src/data/faqs/index.ts` - Exportações centralizadas

---

## 🚀 COMO IMPLEMENTAR

### 1. Homepage (exemplo completo)

Crie ou edite `/src/app/page.tsx`:

```typescript
import { FAQAccordion } from '@/components/SEO/FAQAccordion'
import { FAQSchema } from '@/components/SEO/FAQSchema'
import { homepageFAQs } from '@/data/faqs'

export default function HomePage() {
  return (
    <>
      {/* Schema markup para SEO */}
      <FAQSchema faqs={homepageFAQs} />

      {/* Seu conteúdo da página aqui */}
      <HeroSection />
      <AboutSection />
      <ServicesSection />

      {/* Seção de FAQs */}
      <FAQAccordion
        faqs={homepageFAQs}
        title="Perguntas Frequentes"
        subtitle="Tire suas dúvidas sobre a Saraiva Vision"
        className="bg-gray-50"
      />

      {/* Resto do conteúdo */}
      <ContactSection />
    </>
  )
}
```

### 2. Página de Catarata

Crie `/src/app/catarata/page.tsx`:

```typescript
import { FAQAccordion } from '@/components/SEO/FAQAccordion'
import { FAQSchema } from '@/components/SEO/FAQSchema'
import { cataractFAQs } from '@/data/faqs'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cirurgia de Catarata | Lentes Intraoculares | Saraiva Vision',
  description:
    'Cirurgia de catarata com tecnologia moderna. Lentes monofocais, multifocais e tóricas. Recuperação rápida. Dr. Philipe Saraiva Cruz. Agende avaliação.',
  keywords:
    'cirurgia catarata, catarata tem cura, lente intraocular, sintomas catarata, cirurgia catarata preço',
}

export default function CataractPage() {
  return (
    <>
      <FAQSchema faqs={cataractFAQs} />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            Cirurgia de Catarata
          </h1>

          {/* Seu conteúdo sobre catarata */}
          <CataractInfo />
          <SurgeryProcess />
          <LensTypes />
        </div>
      </section>

      <FAQAccordion
        faqs={cataractFAQs}
        title="Dúvidas sobre Catarata"
        subtitle="Tudo o que você precisa saber sobre cirurgia de catarata"
      />
    </>
  )
}
```

### 3. Página de Glaucoma

```typescript
import { FAQAccordion } from '@/components/SEO/FAQAccordion'
import { FAQSchema } from '@/components/SEO/FAQSchema'
import { glaucomaFAQs } from '@/data/faqs'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glaucoma: Diagnóstico e Tratamento | Saraiva Vision',
  description:
    'Detecção precoce e tratamento de glaucoma. Exames completos: tonometria, campimetria, OCT. Preserve sua visão. Dr. Philipe Saraiva Cruz.',
  keywords:
    'glaucoma tratamento, pressão ocular, sintomas glaucoma, exame glaucoma, glaucoma cura',
}

export default function GlaucomaPage() {
  return (
    <>
      <FAQSchema faqs={glaucomaFAQs} />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            Glaucoma: O Ladrão Silencioso da Visão
          </h1>

          <GlaucomaInfo />
          <TreatmentOptions />
          <PreventionTips />
        </div>
      </section>

      <FAQAccordion
        faqs={glaucomaFAQs}
        title="Perguntas sobre Glaucoma"
        subtitle="Entenda essa doença silenciosa e como prevenir"
      />
    </>
  )
}
```

### 4. Página de Lentes de Contato (SVlentes)

```typescript
import { FAQAccordion } from '@/components/SEO/FAQAccordion'
import { FAQSchema } from '@/components/SEO/FAQSchema'
import { contactLensesFAQs } from '@/data/faqs'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lentes de Contato - SVlentes | Adaptação e Vendas | Saraiva Vision',
  description:
    'Lentes de contato gelatinosas, rígidas, coloridas e para astigmatismo. Adaptação profissional. Preços especiais. Compre com segurança na SVlentes.',
  keywords:
    'lentes de contato, lente colorida, lente astigmatismo, lente diária, lente mensal, SVlentes',
}

export default function ContactLensesPage() {
  return (
    <>
      <FAQSchema faqs={contactLensesFAQs} />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            SVlentes - Lentes de Contato
          </h1>

          <LensTypes />
          <AdaptationProcess />
          <ProductCatalog />
        </div>
      </section>

      <FAQAccordion
        faqs={contactLensesFAQs}
        title="Dúvidas sobre Lentes de Contato"
        subtitle="Aprenda a usar lentes de contato com segurança"
      />
    </>
  )
}
```

### 5. Página de Consulta Oftalmológica

```typescript
import { FAQAccordion } from '@/components/SEO/FAQAccordion'
import { FAQSchema } from '@/components/SEO/FAQSchema'
import { consultationFAQs } from '@/data/faqs'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Consulta Oftalmológica Completa | Exames de Vista | Saraiva Vision',
  description:
    'Consulta oftalmológica com exames completos: refração, fundo de olho, tonometria, OCT. Atendimento particular e convênios. Agende online.',
  keywords:
    'consulta oftalmologista, exame de vista, teste de grau, mapeamento retina, checkup oftalmológico',
}

export default function ConsultationPage() {
  return (
    <>
      <FAQSchema faqs={consultationFAQs} />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            Consulta Oftalmológica Completa
          </h1>

          <ExaminationProcess />
          <AvailableExams />
          <BookingSection />
        </div>
      </section>

      <FAQAccordion
        faqs={consultationFAQs}
        title="Dúvidas sobre Consultas"
        subtitle="Prepare-se para sua consulta oftalmológica"
      />
    </>
  )
}
```

---

## 🎨 PERSONALIZAÇÃO DO ACCORDION

### Alterar cores

Edite `/src/components/SEO/FAQAccordion.tsx`:

```typescript
// Trocar cor primária (cyan para outra cor)
<ChevronDown className="text-blue-600" /> // Azul
<ChevronDown className="text-green-600" /> // Verde
<ChevronDown className="text-purple-600" /> // Roxo

// Alterar estilo dos cards
className="rounded-lg border border-gray-200 bg-white" // Atual
className="rounded-xl border-2 border-blue-200 bg-blue-50" // Azul claro
className="rounded-md shadow-lg bg-gradient-to-r from-white to-gray-50" // Gradiente
```

### Abrir primeira pergunta por padrão

```typescript
const [openIndex, setOpenIndex] = useState<number | null>(0) // Abre primeiro item
```

### Permitir múltiplos itens abertos

```typescript
const [openIndexes, setOpenIndexes] = useState<number[]>([])

const toggleAccordion = (index: number) => {
  setOpenIndexes((prev) =>
    prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
  )
}

// No render:
aria-expanded={openIndexes.includes(index)}
```

---

## 🔍 VALIDAÇÃO SEO

### 1. Testar Schema Markup

Acesse: https://search.google.com/test/rich-results

1. Cole a URL da página publicada
2. Ou cole o código HTML completo
3. Verifique se aparece: "✅ Página qualificada para rich results"

### 2. Verificar no Google Search Console

1. Acesse: https://search.google.com/search-console
2. Vá em "Melhorias" → "FAQ"
3. Aguarde 7-14 dias após publicação
4. Verifique páginas indexadas com rich results

### 3. Teste de Legibilidade

Use: https://www.webfx.com/tools/read-able/

**Meta:** Flesch Reading Ease Score > 60

### 4. Teste de Performance

```bash
npm install -g lighthouse

lighthouse https://saraivavision.com.br --view
```

**Metas:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: 100

---

## 📈 MONITORAMENTO DE RESULTADOS

### Métricas para acompanhar:

1. **Google Search Console:**
   - Impressões para queries de FAQ
   - CTR (taxa de cliques)
   - Posição média
   - Páginas com rich results

2. **Google Analytics:**
   - Tempo na página (deve aumentar)
   - Taxa de rejeição (deve diminuir)
   - Páginas por sessão (deve aumentar)

3. **Conversões:**
   - Cliques em CTAs dentro das respostas
   - Agendamentos de consulta
   - Ligações telefônicas

### Relatório mensal sugerido:

```markdown
## Relatório SEO FAQs - [Mês/Ano]

### Rich Results
- Páginas indexadas com FAQ: X/5
- Impressões totais: X
- Cliques totais: X
- CTR médio: X%

### Tráfego Orgânico
- Visitantes via FAQ queries: +X%
- Tempo médio na página: X min
- Taxa de rejeição: X%

### Conversões
- Leads via FAQ pages: X
- Agendamentos: X
- ROI estimado: R$ X

### Próximas ações:
- [ ] Adicionar FAQs sobre [tema]
- [ ] Atualizar respostas com base em perguntas recebidas
- [ ] Criar conteúdo aprofundado para top 3 FAQs
```

---

## 🎯 PRÓXIMOS PASSOS

### Curto prazo (1-2 semanas):
1. ✅ Implementar FAQs nas 5 páginas principais
2. ⏳ Validar schema markup de todas as páginas
3. ⏳ Submeter sitemap atualizado no Search Console
4. ⏳ Configurar monitoramento no Analytics

### Médio prazo (1-3 meses):
5. ⏳ Adicionar seção de FAQs em páginas de blog
6. ⏳ Criar landing pages para FAQs de alto volume
7. ⏳ Implementar schema de vídeo para FAQs em vídeo
8. ⏳ A/B test de diferentes formatos de accordion

### Longo prazo (3-6 meses):
9. ⏳ Expandir para voice search optimization
10. ⏳ Criar FAQ chatbot com respostas automáticas
11. ⏳ Internacionalização (FAQs em inglês/espanhol)
12. ⏳ Conteúdo multimídia (infográficos, vídeos explicativos)

---

## 🆘 TROUBLESHOOTING

### Schema não aparece no Rich Results Test

**Possíveis causas:**
- JSON inválido (use JSONLint.com)
- Script não está no `<head>` ou final do `<body>`
- Página não está indexada pelo Google
- Conteúdo duplicado em múltiplas páginas

**Solução:**
```typescript
// Verificar se o script está sendo renderizado
console.log('FAQ Schema loaded:', document.querySelector('script[type="application/ld+json"]'))
```

### FAQs não aparecem nos resultados de busca

**Motivos:**
- Aguardar 2-4 semanas após publicação
- Concorrência alta para keywords
- Conteúdo não é relevante para query
- Problemas de indexação

**Ações:**
- Verificar cobertura no Search Console
- Criar conteúdo mais aprofundado
- Otimizar title e meta description
- Conseguir backlinks para a página

### Accordion não funciona no mobile

**Checklist:**
- Verificar se `'use client'` está presente
- Testar gestos de toque (não apenas clique)
- Validar CSS de transições
- Testar em diferentes navegadores mobile

---

## 📞 SUPORTE

Para dúvidas sobre implementação:
- **Email:** contato@saraivavision.com.br
- **WhatsApp:** [número]
- **Desenvolvedor responsável:** [nome]

**Documentação adicional:**
- `/docs/seo/FAQS_SARAIVAVISION.md`
- `/docs/seo/FAQ_SCHEMAS_JSON_LD.md`

---

**Criado com ❤️ para Saraiva Vision**  
**Autor:** Dr. Philipe Saraiva Cruz
