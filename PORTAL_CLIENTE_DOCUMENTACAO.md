# Portal do Cliente - Documentação de Funcionalidades

## Visão Geral

O Portal do Cliente (Área do Assinante) foi expandido para incluir funcionalidades completas de gestão de consultas, histórico médico e assinatura.

## Novas Funcionalidades Implementadas

### 1. Sistema de Agendamento de Consultas

**Localização:** `/area-assinante/consultas`

**Características:**
- ✅ Visualização de agendamentos futuros e histórico
- ✅ Criação de novos agendamentos
- ✅ Informações detalhadas de cada consulta
- ✅ Suporte para consultas presenciais e virtuais
- ✅ Status de agendamento (Agendado, Confirmado, Cancelado, etc.)
- ✅ Links para consultas virtuais quando aplicável

**API Endpoints:**
- `GET /api/assinante/appointments` - Lista agendamentos
  - Query params: `status`, `page`, `limit`
- `POST /api/assinante/appointments` - Cria novo agendamento
  - Body: `{ type, scheduledDate, duration, isVirtual, patientNotes }`

**Tipos de Consulta:**
- `INITIAL_CONSULTATION` - Consulta Inicial
- `FOLLOW_UP` - Retorno
- `EMERGENCY` - Urgência
- `ROUTINE_CHECK` - Consulta de Rotina
- `PRESCRIPTION_RENEWAL` - Renovação de Receita

**Status de Agendamento:**
- `SCHEDULED` - Agendado
- `CONFIRMED` - Confirmado
- `CANCELLED` - Cancelado
- `COMPLETED` - Concluído
- `NO_SHOW` - Não Compareceu
- `RESCHEDULED` - Reagendado

### 2. Histórico Médico

**Localização:** `/area-assinante/historico-medico`

**Características:**
- ✅ Visualização de receitas médicas
- ✅ Acesso a notas de consultas
- ✅ Resultados de exames
- ✅ Diagnósticos
- ✅ Planos de tratamento
- ✅ Filtros por tipo de documento
- ✅ Download de documentos
- ✅ Indicador de documentos confidenciais
- ✅ Validade de prescrições

**API Endpoints:**
- `GET /api/assinante/medical-records` - Lista registros médicos
  - Query params: `type`, `page`, `limit`

**Tipos de Registro:**
- `PRESCRIPTION` - Receita Médica
- `CONSULTATION_NOTES` - Notas de Consulta
- `EXAM_RESULTS` - Resultados de Exames
- `DIAGNOSIS` - Diagnóstico
- `TREATMENT_PLAN` - Plano de Tratamento

### 3. Validação de Senha Aprimorada

**Localização:** `/area-assinante/registro`

**Melhorias:**
- ✅ Requisito mínimo de 8 caracteres (antes: 6)
- ✅ Obrigatoriedade de letra maiúscula
- ✅ Obrigatoriedade de letra minúscula
- ✅ Obrigatoriedade de número
- ✅ Obrigatoriedade de caractere especial
- ✅ Medidor visual de força da senha
- ✅ Feedback em tempo real com checklist
- ✅ Indicador de progresso colorido

**Níveis de Força:**
- Fraca (1-2 pontos): Vermelho
- Média (3 pontos): Amarelo
- Boa (4 pontos): Azul
- Forte (5 pontos): Verde

## Esquema do Banco de Dados

### Tabela: appointments

```prisma
model Appointment {
  id                String
  userId            String
  appointmentNumber String
  type              AppointmentType
  status            AppointmentStatus
  scheduledDate     DateTime
  duration          Int
  doctorName        String
  doctorCRM         String?
  location          String?
  isVirtual         Boolean
  meetingLink       String?
  patientNotes      String?
  internalNotes     String?
  cancelledAt       DateTime?
  cancellationReason String?
  completedAt       DateTime?
  reminderSent      Boolean
  reminderSentAt    DateTime?
  createdAt         DateTime
  updatedAt         DateTime
}
```

### Tabela: medical_records

```prisma
model MedicalRecord {
  id              String
  userId          String
  appointmentId   String?
  recordType      MedicalRecordType
  title           String
  description     String
  data            Json
  documentUrl     String?
  documentType    String?
  issuedBy        String?
  issuedByCRM     String?
  issuedAt        DateTime?
  expiresAt       DateTime?
  isActive        Boolean
  isConfidential  Boolean
  createdAt       DateTime
  updatedAt       DateTime
}
```

## Componentes React

### AppointmentsPanel
**Arquivo:** `src/components/assinante/AppointmentsPanel.tsx`

Painel para visualização e gerenciamento de consultas agendadas.

**Props:** Nenhuma (usa contexto de autenticação)

**Features:**
- Lista de agendamentos
- Filtros e paginação
- Status coloridos
- Botão para novo agendamento
- Links para consultas virtuais

### MedicalRecordsPanel
**Arquivo:** `src/components/assinante/MedicalRecordsPanel.tsx`

Painel para visualização do histórico médico.

**Props:** Nenhuma (usa contexto de autenticação)

**Features:**
- Lista de registros médicos
- Filtros por tipo
- Informações do médico emissor
- Datas de emissão e validade
- Botões para visualizar/baixar documentos
- Indicador de documentos confidenciais

## Páginas

### /area-assinante/consultas
Página dedicada ao gerenciamento de consultas.

**Features:**
- Header com navegação de volta
- Integração com AppointmentsPanel
- Design responsivo

### /area-assinante/historico-medico
Página dedicada ao histórico médico.

**Features:**
- Header com navegação de volta
- Integração com MedicalRecordsPanel
- Design responsivo

## Segurança

### Autenticação e Autorização
- ✅ Todas as APIs verificam token Firebase
- ✅ Usuários só podem acessar seus próprios dados
- ✅ Rate limiting implementado
- ✅ CSRF protection em operações de escrita

### Rate Limiting
- Leitura: 200 requisições em 15 minutos
- Escrita: 50 requisições em 15 minutos

### Validação de Dados
- ✅ Zod schemas para validação de entrada
- ✅ Validação de tipos de enum
- ✅ Sanitização de dados sensíveis

### Privacidade (LGPD)
- ✅ Dados médicos marcados como confidenciais
- ✅ Logs de acesso a dados sensíveis
- ✅ Consentimento registrado
- ✅ Possibilidade de download/exclusão de dados

## Integração com Dashboard

O dashboard principal foi atualizado para incluir acesso rápido às novas funcionalidades:

**Quick Actions:**
1. **Minhas Consultas** - Verde - Acesso direto à página de consultas
2. **Histórico Médico** - Azul - Acesso direto ao histórico médico
3. **Meus Pedidos** - Padrão - Histórico de pedidos de lentes
4. Outros botões de ação rápida existentes

## Próximos Passos

### Pendente de Implementação:
- [ ] Modal para criação de novos agendamentos (atualmente apenas API)
- [ ] Sistema de notificações por email/SMS para lembretes
- [ ] Upload de documentos médicos pelo cliente
- [ ] Integração com Google Calendar
- [ ] Chat com médico via telemedicina
- [ ] Sistema de avaliação de consultas

### Testes Necessários:
- [ ] Testes unitários dos componentes React
- [ ] Testes de integração das APIs
- [ ] Testes E2E do fluxo completo
- [ ] Testes de acessibilidade

### Migração de Banco de Dados:
```bash
# Execute após revisar o schema
npx prisma migrate dev --name add_appointments_and_medical_records
```

## Suporte e Manutenção

**Contato Técnico:**
- Email: saraivavision@gmail.com
- WhatsApp: +55 33 99898-026

**Monitoramento:**
- Verificar logs de erro nas APIs
- Monitorar rate limiting
- Acompanhar métricas de uso

**Conformidade:**
- LGPD: Dados médicos são confidenciais
- CFM: Prescrições requerem CRM do médico
- ANVISA: Lentes requerem prescrição válida

## Changelog

### v1.0.0 (2025-10-21)
- ✅ Implementado sistema de agendamento de consultas
- ✅ Implementado histórico médico
- ✅ Melhorada validação de senha com medidor de força
- ✅ Adicionadas APIs RESTful para appointments e medical records
- ✅ Criados componentes React para visualização
- ✅ Atualizado dashboard com quick actions
- ✅ Adicionadas páginas dedicadas para consultas e histórico

## Licença

© 2025 SV Lentes - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
