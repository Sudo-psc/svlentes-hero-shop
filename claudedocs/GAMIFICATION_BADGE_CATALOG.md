# Gamification Badge Catalog

**Document Version:** 1.0.0
**Last Updated:** 2025-10-30
**Status:** 🚧 Implementation Phase

---

## 🏅 Overview

This document defines the complete achievement/badge system for SV Lentes. Badges are collectible milestones that:

- **Recognize** user accomplishments and engagement
- **Motivate** continued platform usage
- **Showcase** user status and expertise
- **Unlock** exclusive rewards and perks

---

## 🎨 Badge Rarity System

| Rarity | Color | Drop Rate | Characteristics |
|--------|-------|-----------|-----------------|
| **Common** | Bronze (`#CD7F32`) | 60% | Easy to obtain, introductory achievements |
| **Rare** | Silver (`#C0C0C0`) | 25% | Moderate effort required, regular engagement |
| **Epic** | Purple (`#9333EA`) | 12% | Significant accomplishment, dedicated users |
| **Legendary** | Gold (`#FFD700`) | 3% | Exceptional achievement, elite status |

---

## 📚 Badge Categories

### 1. SUBSCRIPTION (Assinatura)

Achievements related to subscription lifecycle and management.

#### Common Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Primeiro Passo** | `first-step` | 100 | 50 | Complete sua primeira assinatura | Sign up for any plan |
| **Informado** | `well-informed` | 50 | 25 | Complete seu perfil com todas as informações | Fill all required profile fields |
| **Pagamento Pontual** | `on-time-payer` | 75 | 30 | Realize 3 pagamentos no prazo | 3 payments before due date |

#### Rare Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Assinante Ativo** | `active-subscriber` | 200 | 100 | Mantenha assinatura ativa por 3 meses | 3 consecutive active months |
| **Upgrade Master** | `upgrade-master` | 300 | 150 | Faça upgrade do plano | Upgrade to higher tier |
| **Renovação Automática** | `auto-renew-enabled` | 150 | 75 | Ative a renovação automática | Enable auto-renewal |

#### Epic Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Cliente Gold** | `gold-customer` | 500 | 250 | 12 meses de assinatura ativa | 12 consecutive active months |
| **Compromisso Anual** | `annual-commitment` | 1,000 | 500 | Assine plano anual | Subscribe to 12-month plan |
| **Zero Atrasos** | `never-late` | 600 | 300 | 12 pagamentos consecutivos no prazo | 12 on-time payments |

#### Legendary Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Cliente Platinum** | `platinum-customer` | 2,000 | 1,000 | 24 meses de assinatura ativa | 24 consecutive active months |
| **VIP SV Lentes** | `vip-member` | 5,000 | 2,500 | 36 meses de fidelidade total | 36 months active + zero missed payments |

---

### 2. ENGAGEMENT (Engajamento)

Achievements for platform interaction and daily activities.

#### Common Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Bem-Vindo** | `welcome` | 50 | 25 | Faça login pela primeira vez | First login |
| **Explorador** | `explorer` | 75 | 40 | Visite todas as seções do dashboard | Visit all 5 main sections |
| **Primeiro Contato** | `first-contact` | 100 | 50 | Entre em contato com suporte via WhatsApp | Send first support message |

#### Rare Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Usuário Ativo** | `active-user` | 200 | 100 | 30 logins em 30 dias | 30 logins in 30-day period |
| **Feedback Valioso** | `valuable-feedback` | 250 | 125 | Envie 5 feedbacks construtivos | Submit 5 validated feedback forms |
| **Avaliador** | `reviewer` | 150 | 75 | Avalie 3 entregas | Rate 3 completed orders |

#### Epic Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Super Engajado** | `super-engaged` | 500 | 250 | 100 logins em 90 dias | 100 logins in 90-day period |
| **Embaixador** | `ambassador` | 750 | 375 | Complete todas as missões de engajamento | Complete 50 engagement missions |
| **Mestre do Conteúdo** | `content-master` | 600 | 300 | Leia todos os artigos educacionais | Read all 20 educational articles |

#### Legendary Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Superfã SV Lentes** | `superfan` | 3,000 | 1,500 | Alcance nível 50 de engajamento | Reach level 50 + 500 logins |

---

### 3. LOYALTY (Fidelidade)

Achievements for long-term commitment and consistent usage.

#### Common Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **3 Dias** | `streak-3` | 50 | 25 | Acesse 3 dias seguidos | 3-day login streak |
| **Primeira Semana** | `first-week` | 100 | 50 | Complete sua primeira semana | 7-day login streak |

#### Rare Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Semana de Dedicação** | `week-dedication` | 200 | 100 | 7 dias de login consecutivo | 7-day login streak |
| **Mês Completo** | `full-month` | 500 | 250 | 30 dias de login consecutivo | 30-day login streak |
| **Retorno Triunfal** | `triumphant-return` | 150 | 75 | Volte após 90 dias de inatividade | Return after 90-day absence |

#### Epic Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Cem Dias** | `hundred-days` | 1,000 | 500 | 100 dias de login consecutivo | 100-day login streak |
| **Inabalável** | `unshakeable` | 1,500 | 750 | Mantenha streak após perder um dia (grace) | Use streak freeze + maintain |
| **Veterano** | `veteran` | 800 | 400 | 1 ano como cliente ativo | 365 days since registration |

#### Legendary Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Lenda Viva** | `living-legend` | 5,000 | 2,500 | 365 dias de login consecutivo | 365-day login streak |
| **Dinastia SV Lentes** | `sv-dynasty` | 10,000 | 5,000 | 1,000 dias de streak | 1,000-day login streak |

---

### 4. MILESTONE (Marcos)

Achievements for reaching significant platform milestones.

#### Common Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Nível 5** | `level-5` | 100 | 50 | Alcance o nível 5 | Reach level 5 |
| **100 Pontos** | `points-100` | 50 | 25 | Acumule 100 pontos | Earn 100 total points |
| **Primeira Recompensa** | `first-reward` | 75 | 40 | Resgate sua primeira recompensa | Claim any reward |

#### Rare Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Nível 10** | `level-10` | 300 | 150 | Alcance o nível 10 | Reach level 10 |
| **Mil Pontos** | `points-1000` | 200 | 100 | Acumule 1.000 pontos totais | Earn 1,000 total points |
| **Colecionador** | `collector` | 250 | 125 | Desbloqueie 10 badges | Unlock 10 badges |

#### Epic Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Nível 25** | `level-25` | 1,000 | 500 | Alcance o nível 25 | Reach level 25 |
| **Cinco Mil Pontos** | `points-5000` | 500 | 250 | Acumule 5.000 pontos totais | Earn 5,000 total points |
| **Mestre Colecionador** | `master-collector` | 750 | 375 | Desbloqueie 25 badges | Unlock 25 badges |

#### Legendary Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Nível 50** | `level-50` | 5,000 | 2,500 | Alcance o nível 50 | Reach level 50 |
| **Dez Mil Pontos** | `points-10000` | 2,000 | 1,000 | Acumule 10.000 pontos totais | Earn 10,000 total points |
| **Completionista** | `completionist` | 10,000 | 5,000 | Desbloqueie todos os badges disponíveis | Unlock 50+ badges |

---

### 5. SPECIAL (Especiais)

Limited-time, seasonal, or unique achievements.

#### Common Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Aniversariante** | `birthday-user` | 100 | 50 | Faça login no seu aniversário | Login on birthday |
| **Ano Novo, Você Novo** | `new-year` | 150 | 75 | Participe do evento de Ano Novo | Active during New Year event |

#### Rare Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Aniversário SV Lentes** | `sv-anniversary` | 300 | 150 | Celebre o aniversário da plataforma | Active during anniversary event |
| **Early Adopter** | `early-adopter` | 500 | 250 | Cadastre-se nos primeiros 1.000 usuários | Registration #1-1000 |
| **Beta Tester** | `beta-tester` | 400 | 200 | Participe do programa beta | Join beta program |

#### Epic Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Influenciador** | `influencer` | 1,000 | 500 | Convide 10 amigos que se tornaram clientes | 10 successful referrals |
| **Campeão de Evento** | `event-champion` | 1,500 | 750 | Vença um desafio especial | Win special challenge event |
| **Caçador de Easter Eggs** | `easter-egg-hunter` | 800 | 400 | Encontre 5 easter eggs escondidos | Find 5 hidden easter eggs |

#### Legendary Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Lendário de Evento** | `event-legend` | 5,000 | 2,500 | Vença 5 desafios especiais consecutivos | Win 5 special challenges |
| **Fundador** | `founder` | 10,000 | 5,000 | Usuário dos primeiros 100 | Registration #1-100 + 1 year active |

---

### 6. REFERRAL (Indicações)

Achievements for inviting friends and growing the community.

#### Common Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Primeiro Amigo** | `first-friend` | 100 | 50 | Convide seu primeiro amigo | 1 successful referral |
| **Compartilhador** | `sharer` | 50 | 25 | Compartilhe link de indicação 3 vezes | Share referral link 3 times |

#### Rare Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Networking** | `networking` | 300 | 150 | Convide 3 amigos que compraram | 3 successful referrals |
| **Influenciador Bronze** | `bronze-influencer` | 500 | 250 | Convide 5 amigos que compraram | 5 successful referrals |

#### Epic Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Influenciador Prata** | `silver-influencer` | 1,500 | 750 | Convide 10 amigos que compraram | 10 successful referrals |
| **Construtor de Comunidade** | `community-builder` | 2,000 | 1,000 | 15 indicações ativas por 3 meses | 15 referrals active for 3+ months |

#### Legendary Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Influenciador Ouro** | `gold-influencer` | 5,000 | 2,500 | Convide 25 amigos que compraram | 25 successful referrals |
| **Embaixador Oficial** | `official-ambassador` | 10,000 | 5,000 | 50 indicações + status VIP | 50 successful referrals + VIP status |

---

### 7. HEALTH (Saúde Ocular)

Achievements for medical compliance and eye health care.

#### Common Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Primeira Consulta** | `first-consultation` | 150 | 75 | Agende sua primeira consulta | Schedule first consultation |
| **Prescrição Atualizada** | `prescription-updated` | 100 | 50 | Envie receita atualizada | Upload current prescription |
| **Check-up Mensal** | `monthly-checkup` | 75 | 40 | Complete questionário de saúde ocular | Complete health questionnaire |

#### Rare Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Cuidado Consistente** | `consistent-care` | 300 | 150 | 3 consultas agendadas e concluídas | 3 completed consultations |
| **Olhos Saudáveis** | `healthy-eyes` | 400 | 200 | 12 meses sem problemas oculares | 12 months of health check-ins |
| **Paciente Exemplar** | `exemplary-patient` | 500 | 250 | Compareça a todas as consultas agendadas | 100% consultation attendance |

#### Epic Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Saúde em Dia** | `up-to-date-health` | 1,000 | 500 | Prescrição sempre atualizada por 1 ano | 12 months with current prescription |
| **Visão Perfeita** | `perfect-vision` | 1,500 | 750 | Mantenha check-ups mensais por 12 meses | 12 consecutive monthly check-ins |

#### Legendary Badges

| Badge | Slug | Points | XP | Description | Requirements |
|-------|------|--------|----|-----------| -------------|
| **Guardião da Visão** | `vision-guardian` | 5,000 | 2,500 | 24 meses de cuidado ocular perfeito | 24 months of perfect health compliance |

---

## 🎯 Badge Progress Tracking

### Progress Types

| Type | Description | Example |
|------|-------------|---------|
| **Binary** | Completed or not | Upload prescription (0 or 1) |
| **Incremental** | Step-by-step progress | Login 7 days (progress: 0-7) |
| **Cumulative** | Accumulate over time | Earn 1,000 points (current: 450/1,000) |
| **Streak** | Consecutive actions | 30-day login streak (current: 15) |

### Hidden Badges

Some badges are **secret** (isSecret: true) and don't show requirements until unlocked:

- **Easter Egg Hunter**: Find hidden features
- **Night Owl**: Login at 3 AM
- **Early Bird**: Login before 6 AM
- **Lucky Number**: Be the 7,777th user
- **Perfect Timing**: Complete action at exactly midnight

---

## 🏆 Badge Display & Showcase

### Badge Card Components

```tsx
<BadgeCard>
  <BadgeIcon rarity={rarity} locked={!unlocked} />
  <BadgeName>{name}</BadgeName>
  <BadgeRarity rarity={rarity} />
  <BadgeProgress current={progress} max={maxProgress} />
  <BadgeDescription>{description}</BadgeDescription>
  <BadgeRewards>
    <Points>{pointsAwarded}</Points>
    <XP>{experienceAwarded}</XP>
  </BadgeRewards>
  {unlocked && <BadgeDate>{unlockedAt}</BadgeDate>}
</BadgeCard>
```

### Badge Collection View

Users can view badges in multiple layouts:

1. **Grid View**: All badges in grid with filters
2. **Category View**: Organized by category tabs
3. **Rarity View**: Sorted by rarity
4. **Progress View**: Sort by completion percentage
5. **Timeline View**: Chronological unlock order

### Badge Filters

- **Status**: Locked, In Progress, Unlocked
- **Rarity**: Common, Rare, Epic, Legendary
- **Category**: Subscription, Engagement, Loyalty, etc.
- **Sort**: Newest, Oldest, Rarity, Progress

---

## 🎊 Badge Unlock Experience

### Unlock Animation Sequence

1. **Badge Appears**: Fade in with scale animation (0.5s)
2. **Rarity Glow**: Glow effect based on rarity color (1s)
3. **Confetti**: Particle effects for Epic/Legendary (2s)
4. **Sound**: Achievement sound effect (0.5s)
5. **Toast Notification**: "Badge Desbloqueado!" message
6. **Points Award**: Show points and XP gained

### Notification Copy

```
✨ Badge Desbloqueado!
{BADGE_NAME}

{DESCRIPTION}

+{POINTS} pontos | +{XP} XP

[Ver Coleção]
```

---

## 📊 Badge Statistics

### User Stats Panel

Display on profile:

- **Total Badges**: 23/50
- **Common**: 15/20 (75%)
- **Rare**: 6/15 (40%)
- **Epic**: 2/10 (20%)
- **Legendary**: 0/5 (0%)
- **Completion Rate**: 46%
- **Rarest Badge**: {badge_name}

---

## 🔧 Implementation Notes

### Database Seed

```typescript
// Seed all badges on application startup
const badges = [
  {
    slug: 'first-step',
    name: 'Primeiro Passo',
    description: 'Complete sua primeira assinatura',
    category: 'SUBSCRIPTION',
    rarity: 'COMMON',
    pointsAwarded: 100,
    experienceAwarded: 50,
    icon: 'check-circle',
    requirements: [{ type: 'subscription_count', value: 1, description: 'Sign up for any plan' }],
    maxProgress: 1,
  },
  // ... more badges
]

await prisma.achievement.createMany({ data: badges })
```

### Auto-Unlock Logic

```typescript
// Check badge progress after each action
async function checkBadgeProgress(userId: string, actionType: string) {
  // Get relevant badges for this action
  const badges = await getRelevantBadges(actionType)

  for (const badge of badges) {
    const userAchievement = await getUserAchievement(userId, badge.id)
    const progress = await calculateProgress(userId, badge.requirements)

    if (progress >= badge.maxProgress && !userAchievement.isCompleted) {
      await unlockBadge(userId, badge.id)
    } else {
      await updateBadgeProgress(userId, badge.id, progress)
    }
  }
}
```

---

## 📧 Support & Questions

For questions about the badge system, contact:
- **Design Team**: Badge artwork and visual design
- **Product Team**: Badge requirements and balance
- **Engineering Team**: Badge unlock logic

---

**Last Review Date**: 2025-10-30
**Next Review Date**: 2025-11-30
**Document Owner**: Product & Design Teams
