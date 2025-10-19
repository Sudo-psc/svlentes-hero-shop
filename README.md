# SVlentes - Landing Page

Landing page para assinatura de lentes de contato com acompanhamento médico especializado.

**Domínio de Produção**: [svlentes.com.br](https://svlentes.com.br)  
**n8n Automation**: [saraivavision-n8n.cloud](https://saraivavision-n8n.cloud)  
**Reverse Proxy**: Caddy 2.10.2 (HTTPS automático)

## 🚀 Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Framework CSS utilitário
- **Asaas API v3** - Gateway de pagamento brasileiro (PIX, Boleto, Cartão de Crédito)
- **Zod** - Validação de schemas
- **React Hook Form** - Gerenciamento de formulários
- **Framer Motion** - Animações
- **Playwright** - Testes E2E

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Asaas (para pagamentos - [asaas.com](https://www.asaas.com))

## 🛠️ Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd svlentes-landing-page
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente
```bash
cp .env.local.example .env.local
```

4. Edite o arquivo `.env.local` com suas chaves do Asaas e outras configurações:
```bash
# Asaas Payment Gateway
ASAAS_ENV=sandbox
ASAAS_API_KEY_SANDBOX=$aact_hmlg_your_sandbox_key
ASAAS_API_KEY_PROD=$aact_prod_your_production_key

# Application URLs
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
NEXTAUTH_URL=https://svlentes.com.br
```

5. Execute o projeto em desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

6. Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
├── components/
│   ├── ui/                # Componentes base
│   ├── layout/            # Header, Footer, etc.
│   ├── sections/          # Seções da landing page
│   ├── forms/             # Formulários
│   └── trust/             # Elementos de confiança
├── lib/                   # Utilitários e configurações
├── data/                  # Dados estáticos
└── types/                 # Definições TypeScript
```

## 🎯 Funcionalidades

- [x] Estrutura base Next.js 15 com App Router
- [x] Configuração Tailwind CSS v4
- [x] Tipagem TypeScript completa
- [x] Hero Section com formulário de leads
- [x] Seção de planos e preços
- [x] Integração com Asaas (PIX, Boleto, Cartão)
- [x] Calculadora de economia
- [x] FAQ interativo
- [x] Sistema de testes (Jest + Playwright)
- [x] Animações com Framer Motion
- [x] LGPD compliance (política de privacidade)

## 🔧 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção
- `npm run lint` - Executa linting

### Testes
- `npm run test` - Executa testes unitários
- `npm run test:e2e` - Executa testes E2E
- `npm run test:coverage` - Gera relatório de cobertura

### Versionamento e Release
- `npm run commit` - Assistente interativo para commits (Commitizen)
- `npm run release` - Cria release automaticamente (executado via CI/CD)
- `npm run release:dry` - Simula release sem publicar

> 📚 **Guia de Versionamento:** Consulte [VERSIONING.md](./VERSIONING.md) para detalhes completos sobre conventional commits, releases automáticas e deploy

## 🤝 Como Contribuir

Este projeto utiliza **Conventional Commits** para versionamento automático.

### Fazendo Commits

Use o assistente interativo (recomendado):
```bash
npm run commit
```

Ou siga o formato manualmente:
```bash
git commit -m "feat: adiciona nova funcionalidade"
git commit -m "fix: corrige bug no formulário"
git commit -m "docs: atualiza documentação"
```

### Tipos de Commit

- `feat:` - Nova funcionalidade (incrementa versão MINOR)
- `fix:` - Correção de bug (incrementa versão PATCH)
- `docs:` - Apenas documentação (sem release)
- `style:` - Formatação de código (sem release)
- `refactor:` - Refatoração de código (incrementa PATCH)
- `perf:` - Melhoria de performance (incrementa PATCH)
- `test:` - Adição/correção de testes (sem release)
- `build:` - Mudanças no build (incrementa PATCH)
- `ci:` - Mudanças em CI/CD (sem release)
- `chore:` - Outras mudanças (sem release)

Breaking changes: Use `feat!:` ou adicione `BREAKING CHANGE:` no corpo do commit para incrementar versão MAJOR.

> 📖 **Documentação completa:** [VERSIONING.md](./VERSIONING.md) e [docs/RELEASE_MANAGEMENT.md](./docs/RELEASE_MANAGEMENT.md)

## 📝 Especificações

Este projeto segue as especificações detalhadas em:
- `.kiro/specs/landing-page-assinatura-lentes/requirements.md`
- `.kiro/specs/landing-page-assinatura-lentes/design.md`
- `.kiro/specs/landing-page-assinatura-lentes/tasks.md`

## 👨‍⚕️ Médico Responsável

**Dr. Philipe Saraiva Cruz**  
CRM: 65.870  
Especialidade: Oftalmologia

## 📞 Contato

- WhatsApp: +55 33 99860-1427
- Email: saraivavision@gmail.com
- Site: https://svlentes.shop

## 📄 Licença

Este projeto é propriedade privada da SVlentes.