# 🤖 Chatbot WhatsApp - Documentação Completa

## 📚 Visão Geral

Sistema de chatbot inteligente para WhatsApp utilizando **LangChain**, **LangGraph** e **GPT-5**, com memória persistente de conversas em **Qdrant** (banco de dados vetorial). Este sistema foi projetado para automatizar o atendimento ao cliente da SV Lentes, incluindo vendas, suporte técnico, agendamento de consultas e qualificação de leads.

## 📁 Documentação Disponível

### 1. [Requisitos Funcionais](./CHATBOT_WHATSAPP_REQUIREMENTS.md)
Documento completo com todos os requisitos funcionais e não-funcionais do chatbot:
- ✅ Objetivos e KPIs do sistema
- ✅ Arquitetura geral (diagrams)
- ✅ Integração WhatsApp Business API
- ✅ Configuração LangChain + LangGraph
- ✅ Setup Qdrant Vector Database
- ✅ Agentes especializados (Sales, Support, Scheduling)
- ✅ Fluxos de conversação (mermaid diagrams)
- ✅ 12 Requisitos Funcionais detalhados (RF01-RF12)
- ✅ 6 Requisitos Não-Funcionais (RNF01-RNF06)
- ✅ Estrutura de dados (PostgreSQL + Qdrant)
- ✅ Métricas de sucesso
- ✅ Roadmap de desenvolvimento (4 fases)

### 2. [Arquitetura Técnica](./CHATBOT_TECHNICAL_ARCHITECTURE.md)
Documento técnico com implementação detalhada:
- ✅ Decisões arquiteturais (ADRs)
- ✅ Diagramas de componentes
- ✅ Implementação do Webhook Handler (Next.js)
- ✅ Sistema de filas (BullMQ + Redis)
- ✅ LangGraph workflow completo (código)
- ✅ Qdrant Memory Service (código)
- ✅ Message Processor principal
- ✅ Configuração Docker Compose
- ✅ Monitoring e métricas (Prometheus)
- ✅ Estratégia de testes

## 🎯 Quick Start

### Leitura Recomendada por Perfil

#### 👨‍💼 Product Manager / Stakeholder
1. Leia: [Requisitos Funcionais](./CHATBOT_WHATSAPP_REQUIREMENTS.md)
   - Foque em: Objetivos, KPIs, Funcionalidades (RF01-RF12), Roadmap
   - Tempo estimado: 30 minutos

#### 👨‍💻 Desenvolvedor / Arquiteto
1. Leia: [Requisitos Funcionais](./CHATBOT_WHATSAPP_REQUIREMENTS.md) (visão geral)
2. Leia: [Arquitetura Técnica](./CHATBOT_TECHNICAL_ARCHITECTURE.md) (implementação)
3. Veja: Exemplos de código nos documentos
   - Tempo estimado: 1-2 horas

#### 🎨 UX Designer / Conversational Designer
1. Leia: [Requisitos Funcionais](./CHATBOT_WHATSAPP_REQUIREMENTS.md)
   - Foque em: Agentes especializados, Fluxos de conversação, Mensagens pré-definidas
   - Tempo estimado: 45 minutos

#### 🔧 DevOps / SRE
1. Leia: [Arquitetura Técnica](./CHATBOT_TECHNICAL_ARCHITECTURE.md)
   - Foque em: Configuração, Docker Compose, Monitoring, Deploy
   - Tempo estimado: 30 minutos

## 🏗️ Stack Tecnológico

### Core Technologies
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **LangChain** | 0.2+ | Framework para LLM applications |
| **LangGraph** | Latest | Orquestração de agentes e fluxos |
| **GPT-5** | Latest | Modelo de linguagem (OpenAI) |
| **Qdrant** | Latest | Banco de dados vetorial (memória) |
| **Next.js** | 15+ | Backend (API Routes + Webhooks) |
| **TypeScript** | 5+ | Linguagem de programação |

### Integrações
- **WhatsApp Business API** (Meta Cloud API)
- **PostgreSQL** (dados estruturados)
- **Redis** (cache e filas)
- **BullMQ** (message queue)
- **Asaas API** (pagamentos)
- **Google Calendar** (agendamentos)

## 📊 Funcionalidades Principais

### 🤝 Agentes Especializados

#### 1. Sales Agent (Vendas)
- Apresentação de planos (Mensal, Trimestral, Semestral)
- Cálculo de economia
- Qualificação de leads
- Geração de links de pagamento
- Upselling e cross-selling

#### 2. Support Agent (Suporte Técnico)
- Base de conhecimento (50+ FAQs)
- Resolução de problemas comuns
- Detecção de emergências médicas
- Escalação para humanos quando necessário
- Tutoriais e guias

#### 3. Scheduling Agent (Agendamento)
- Consulta de disponibilidade
- Agendamento de consultas
- Confirmação via WhatsApp interativo
- Lembretes automáticos
- Reagendamento e cancelamento

#### 4. Information Agent (Informações)
- Responder perguntas frequentes
- Informações sobre o serviço
- Localização e contato
- Políticas e termos

### 🧠 Capacidades Inteligentes

- **Memória de Longo Prazo**: Todas as conversas salvas no Qdrant
- **Busca Semântica**: Recuperação contextual de conversas anteriores
- **Classificação de Intenção**: Detecta automaticamente o objetivo do usuário
- **Extração de Entidades**: Identifica planos, datas, problemas mencionados
- **Análise de Sentimento**: Detecta satisfação/insatisfação do cliente
- **Handoff Inteligente**: Transfere para humano quando necessário
- **Contextualização**: Adapta respostas baseado no histórico

## 🎯 Casos de Uso

### Caso 1: Lead Qualification
```
Usuário: "Olá, quanto custa?"
Bot: "Olá! 👋 Obrigado pelo interesse na SV Lentes..."
     [Apresenta planos e coleta informações]
Resultado: Lead qualificado salvo no CRM
```

### Caso 2: Agendamento de Consulta
```
Usuário: "Quero agendar consulta"
Bot: "Ótimo! Vou te ajudar a agendar..."
     [Oferece horários disponíveis]
Resultado: Consulta agendada + confirmação + lembrete
```

### Caso 3: Suporte Técnico
```
Usuário: "Minhas lentes estão incomodando"
Bot: "Sinto muito pelo desconforto..."
     [Faz perguntas diagnósticas]
     [Oferece soluções ou escala para médico]
Resultado: Problema resolvido ou escalado
```

### Caso 4: Emergência Médica
```
Usuário: "Meu olho está doendo muito!"
Bot: "⚠️ Detectei uma situação urgente..."
     [Transfere imediatamente para humano]
     [Notifica equipe médica]
Resultado: Atendimento emergencial garantido
```

## 📈 Métricas de Sucesso

### KPIs Definidos
- ✅ Taxa de Resolução Automática: > 70%
- ✅ Tempo Médio de Resposta: < 3 segundos
- ✅ CSAT (Satisfação): > 4.5/5
- ✅ Taxa de Conversão de Leads: > 15%
- ✅ Uptime: > 99.5%

### Métricas de Negócio
- Leads qualificados/dia
- Agendamentos realizados/semana
- Receita gerada via chatbot
- Redução de custo operacional
- NPS do canal WhatsApp

## 🚀 Roadmap de Implementação

### ✅ Fase 1: MVP (4-6 semanas) - Documentado
- [x] Documentação de requisitos completa
- [x] Arquitetura técnica detalhada
- [ ] Setup infraestrutura
- [ ] Integração WhatsApp
- [ ] LangChain + GPT-5 setup
- [ ] Intent classifier
- [ ] Sales Agent básico
- [ ] Memória básica Qdrant

### 🔄 Fase 2: Funcionalidades Avançadas (4-6 semanas)
- [ ] LangGraph workflow completo
- [ ] Todos os agentes especializados
- [ ] Scheduling + integração agenda
- [ ] Handoff para humano
- [ ] Analytics dashboard
- [ ] Links de pagamento Asaas

### 🎯 Fase 3: Otimização (4-6 semanas)
- [ ] Prompt engineering
- [ ] Cache de respostas
- [ ] Sistema de feedback
- [ ] A/B testing
- [ ] Performance tuning
- [ ] Lançamento público

### 🌟 Fase 4: Expansão (Futuro)
- [ ] Multicanal (Instagram, Telegram, site)
- [ ] Transcrição de áudios
- [ ] Análise de imagens (prescrição)
- [ ] Follow-ups proativos
- [ ] Personalização com ML

## 💾 Estrutura de Dados

### PostgreSQL (Dados Estruturados)
- `whatsapp_contacts` - Usuários/contatos
- `conversations` - Sessões de conversa
- `messages` - Mensagens individuais
- `appointments` - Agendamentos
- `leads` - Leads qualificados

### Qdrant (Memória Vetorial)
- Collection: `svlentes_conversations`
- Embeddings: text-embedding-3-large (3072 dims)
- Indexes: userId, timestamp, intent
- Busca semântica + filtros

## 🔐 Segurança e Compliance

### Segurança
- ✅ Autenticação de webhook (signature verification)
- ✅ Rate limiting (100 msg/min por usuário)
- ✅ Criptografia em repouso e trânsito
- ✅ Sanitização de entrada
- ✅ Detecção de spam/abuse

### LGPD Compliance
- ✅ Consentimento explícito
- ✅ Direito ao esquecimento (delete user data)
- ✅ Anonimização após 2 anos
- ✅ Logs de acesso a dados
- ✅ Política de privacidade clara

## 📞 Contato e Suporte

### Equipe Técnica
- **Email**: saraivavision@gmail.com
- **WhatsApp**: +55 33 99860-1427

### Médico Responsável
- **Dr. Philipe Saraiva Cruz**
- **CRM**: 65.870
- **Especialidade**: Oftalmologia

## 🔗 Links Úteis

### Documentação Externa
- [LangChain JS Docs](https://js.langchain.com/docs/)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/)

### Ferramentas
- [Qdrant Cloud](https://cloud.qdrant.io/)
- [OpenAI Platform](https://platform.openai.com/)
- [Meta for Developers](https://developers.facebook.com/)
- [Asaas API](https://docs.asaas.com/)

## 📝 Changelog

### v1.0 - Outubro 2025
- ✅ Criação da documentação completa de requisitos
- ✅ Definição da arquitetura técnica
- ✅ Especificação de 12 requisitos funcionais
- ✅ Especificação de 6 requisitos não-funcionais
- ✅ Roadmap de 4 fases de desenvolvimento
- ✅ Exemplos de código para implementação

---

**Status**: 📖 Documentação Completa - Pronto para Implementação  
**Versão**: 1.0  
**Última Atualização**: Outubro 2025  
**Licença**: Propriedade da SV Lentes
