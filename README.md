# SVlentes - Landing Page

Landing page para assinatura de lentes de contato com acompanhamento médico especializado.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Stripe** - Processamento de pagamentos recorrentes
- **Zod** - Validação de schemas
- **React Hook Form** - Gerenciamento de formulários

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Stripe (para pagamentos)

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

4. Edite o arquivo `.env.local` com suas chaves do Stripe e outras configurações

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

- [x] Estrutura base Next.js 14
- [x] Configuração Tailwind CSS
- [x] Tipagem TypeScript completa
- [ ] Hero Section com formulário de leads
- [ ] Seção de planos e preços
- [ ] Integração com Stripe
- [ ] Calculadora de economia
- [ ] FAQ interativo
- [ ] Formulário de agendamento
- [ ] Analytics e tracking

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção
- `npm run lint` - Executa linting

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