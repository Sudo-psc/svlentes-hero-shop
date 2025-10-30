# Sumário de Melhorias UX - SV Lentes

**Status:** Análise Completa | Pronto para Implementação  
**Data:** 2025-10-13

---

## 📋 Análise Realizada

### Problemas Identificados

1. **❌ Inconsistência Crítica: CRM**
   - Encontradas 10 arquivos com CRM 65.870 (incorreto)
   - Valor correto: CRM-MG 69.870
   - Risco: Informação médica inconsistente (compliance)

2. **❌ CTAs Confusos**
   - Hero atual: "Agendar consulta" + "Tirar dúvidas"
   - Falta clareza sobre próximo passo
   - Sugestão: "Começar Assinatura" (primário) + "Calcular Economia" (secundário)

3. **❌ Trust Badges Repetitivos**
   - "CRM 69.870" aparece 15+ vezes
   - "Pioneiro no Brasil" aparece 8+ vezes
   - "ANVISA" aparece 5+ vezes
   - Dilui impacto e polui visualmente

4. **❌ Copy Redundante**
   - "Até 40% de economia" - 6 ocorrências
   - "4.9/5" sem fonte/reviews
   - Emojis em bullets (🏆📦💰) - informal

5. **❌ "Como Funciona" Vertical**
   - Difícil de escanear
   - Muito texto
   - Sugestão: Timeline horizontal 4 passos

6. **✅ Header** - JÁ BOM
   - Persistente ✓
   - Navegação clara ✓
   - CTA presente ✓
   - Apenas ajustar label do CTA

---

## 🎯 Plano de Implementação

### FASE 1: Correções Críticas (URGENTE)

**Arquivo único de referência criado:**
- ✅ `src/data/doctor-info.ts` já existe com dados corretos

**Tarefas:**
```bash
# 1. Corrigir CRM 65.870 → 69.870 em 10 arquivos
src/app/api/schedule-consultation/route.ts
src/app/agendamento-confirmado/page.tsx
src/app/agendar-consulta/layout.tsx
src/app/agendar-consulta/metadata.ts
src/app/agendar-consulta/page.tsx
src/app/politica-privacidade/page.tsx
src/components/trust/__tests__/DoctorCard.test.tsx
src/components/sections/FinalCTA.tsx
src/components/privacy/PrivacyPolicy.tsx
src/types/wireframe.ts

# 2. Importar de doctor-info.ts ao invés de hardcode
import { doctorInfo } from '@/data/doctor-info'
const crm = doctorInfo.crm // "CRM 69.870"
```

**Estimativa:** 30 minutos  
**Risco:** Baixo  
**Impacto:** Alto (compliance + confiança)

---

### FASE 2: Otimização de Conversão (IMPORTANTE)

**2.1 Consolidar CTAs no Hero**

Arquivo: `src/components/sections/VideoHeroSection.tsx`

```tsx
// Antes:
- "Agendar consulta com oftalmologista"
- "Tirar dúvidas no WhatsApp"

// Depois:
- [Primário] "Começar Assinatura" → /assinar
- [Secundário] "Calcular Economia" → /calculadora
```

**2.2 Criar TrustStrip Component**

Novo arquivo: `src/components/trust/TrustStrip.tsx`

```tsx
export function TrustStrip() {
  return (
    <div className="flex items-center justify-center gap-6">
      <TrustBadge icon={Shield} text="CRM-MG 69.870" />
      <TrustBadge icon={Certificate} text="ANVISA" />
      <TrustBadge icon={Award} text="Pioneiro no Brasil" />
      <TrustBadge icon={Clock} text="10+ anos" />
      <TrustBadge icon={Truck} text="Entrega Grátis" />
    </div>
  )
}
```

Usar TrustStrip em:
- Header (on scroll) - já existe parcialmente
- Logo após hero (novo)
- Footer (consolidado)

**Remover badges de:**
- Texto corrido
- Cards duplicados
- Seções individuais

**Estimativa:** 2 horas  
**Risco:** Médio  
**Impacto:** Alto (clareza + conversão)

---

### FASE 3: Melhorias Visuais (DESEJÁVEL)

**3.1 BenefitCard Component**

Novo arquivo: `src/components/ui/BenefitCard.tsx`

```tsx
<BenefitCard
  icon={<Award className="w-8 h-8" />}
  title="Pioneiro no Brasil"
  description="Primeiro serviço de assinatura..."
  variant="primary"
/>
```

Substituir emojis:
- 🏆 → Award icon
- 📦 → Truck icon
- 💰 → DollarSign icon
- 👨‍⚕️ → Stethoscope icon

**3.2 Timeline "Como Funciona"**

Novo arquivo: `src/components/sections/HowItWorksTimeline.tsx`

```
[1 Consulta] ──▶ [2 Prescrição] ──▶ [3 Entrega] ──▶ [4 Reposição]
```

**3.3 Auditar Copy Redundante**

Buscar e reduzir:
- "Até 40%" - manter apenas 2x (hero + calculadora)
- "Pioneiro" - via TrustStrip apenas
- Remover "4.9/5" se não temos reviews

**Estimativa:** 4 horas  
**Risco:** Baixo  
**Impacto:** Médio (UX + polimento)

---

## 📊 Estimativa Total

| Fase | Tempo | Complexidade | Impacto | Prioridade |
|------|-------|--------------|---------|------------|
| Fase 1 | 30min | Baixa | Alto | 🔴 Crítica |
| Fase 2 | 2h | Média | Alto | 🟡 Importante |
| Fase 3 | 4h | Média | Médio | 🟢 Desejável |
| **Total** | **6.5h** | - | - | - |

---

## 🚦 Decisão Recomendada

### Implementar AGORA (Fase 1):
✅ Corrigir CRM 65.870 → 69.870  
⏱️ 30 minutos  
🎯 Zero downtime  
✅ Compliance garantido

### Agendar Esta Semana (Fase 2):
- CTAs consolidados
- TrustStrip component
- Remover repetições

### Backlog (Fase 3):
- BenefitCard component
- Timeline horizontal
- Polimento final

---

## 📝 Próxima Ação

**Opção A: Implementação Imediata (Fase 1)**
```bash
# Executar correção automática
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/65\.870/69.870/g' {} \;

# Validar
npm run test
npm run lint
npm run build
```

**Opção B: Revisão Manual**
- Revisar cada arquivo individualmente
- Garantir contexto correto
- Atualizar para importar de doctor-info.ts

**Opção C: Implementação Completa**
- Todas as 3 fases
- 1-2 dias de trabalho
- Maior impacto em conversão

---

## ✅ Recomendação Final

1. **Implementar Fase 1 AGORA** (30min)
2. **Planejar Fase 2 para esta semana** (sprint)
3. **Backlog Fase 3** (próximo ciclo)

**Justificativa:**
- Fase 1 é compliance (crítico)
- Fase 2 impacta conversão (ROI alto)
- Fase 3 é polimento (pode esperar)

---

**Documento criado por:** Claude AI Agent  
**Data:** 2025-10-13  
**Status:** Pronto para decisão do usuário
