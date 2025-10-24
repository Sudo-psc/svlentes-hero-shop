# AGENTS.md - Quick Reference for AI Coding Agents

## Build, Lint & Test Commands
```bash
npm run build                    # Production build (verify before deploy)
npm run lint                     # ESLint checks (run after changes)
npm run lint:fix                 # Auto-fix ESLint issues
npm run test                     # All Jest unit tests
npm run test -- validations      # Single test file matching "validations" pattern
npm run test:watch               # Watch mode for TDD
npm run test:coverage            # Jest with coverage report
npm run test:resilience          # Vitest resilience tests (offline, backup auth)
npm run test:integration         # Vitest integration tests
npm run test:e2e                 # Playwright E2E tests
npm run test:e2e:ui              # Playwright with UI mode
npm run test:e2e:debug          # Debug single E2E test
npm run test:all                 # Run all tests (resilience + E2E)
```

## Code Style Guidelines

### Imports & Path Aliases
- Use TypeScript path aliases: `@/components/*`, `@/lib/*`, `@/types/*`, `@/data/*`
- Import order: React → Next.js → External libraries → Local components → Utils → Types
- shadcn/ui components from `@/components/ui/*` (PascalCase filenames: `Button.tsx`)

### Naming Conventions
- **Components**: PascalCase files & exports (`HeroSection.tsx`, `export function HeroSection`)
- **Utils/libs**: camelCase files & exports (`calculator.ts`, `export function calculateEconomy`)
- **Types**: PascalCase interfaces (`CalculatorInput`, `LeadFormData`)
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for config objects

### TypeScript & Types
- **Strict mode enabled** - no implicit `any`, proper null checks required
- Define types in `src/types/*.ts` or colocate with complex components
- Use Zod schemas for validation (see `src/lib/validations.ts`)
- React Hook Form + Zod pattern for all forms
- Type imports: use `import { type TypeName }` syntax

### Component Structure
```typescript
'use client'  // For client components only

import { Button } from '@/components/ui/Button'
import { type ComponentProps } from '@/types'

export function MyComponent({ prop }: ComponentProps) {
  return <div className={cn("base-classes", conditionalClass)}>...</div>
}
```

### Styling & Design System
- **Tailwind CSS only** - no CSS modules, styled-components, or inline styles
- Use `cn()` from `@/lib/utils` for conditional classes
- Color scheme: Cyan primary (`bg-primary`, `text-cyan-500`), silver secondary
- Responsive: mobile-first, use `md:`, `lg:` breakpoints
- shadcn/ui components: customize via `variants` prop, not direct class overrides
- Icons: Use lucide-react (`Phone`, `MessageCircle`, etc.) or local `/public/icones/`

### Error Handling & Validation
- Zod schemas for all form validation (`leadFormSchema`, `calculatorSchema`)
- Try-catch for async operations (API calls, webhooks)
- Throw descriptive errors: `throw new Error('Padrão de uso ou tipo de lente inválido')`
- Never bypass medical authorization or prescription validation (healthcare compliance)

### Testing Requirements
- **Jest** for unit tests (business logic, validations)
- **Vitest** for resilience/integration tests (offline, backup auth)
- **Playwright** for E2E tests
- Test files colocated: `src/**/__tests__/ComponentName.test.tsx`
- Use `@testing-library/react` for component tests
- Test files should import from parent: `import { func } from '../validations'`
- Single test file: `npm run test -- <pattern>` (Jest) or `vitest <file-path>` (Vitest)

## Critical Rules
1. **Healthcare compliance**: LGPD data protection, prescription validation mandatory
2. **NO COMMENTS unless requested** - code should be self-documenting
3. **Security**: No API keys in client code, validate webhook signatures
4. **Asaas payment gateway** (Brazilian) - primary, Stripe is legacy backup
5. **Package manager**: Use **npm** (not pnpm/yarn) - project uses npm lock file
6. **Run tests after changes**: `npm run test && npm run build` before considering done
7. **kluster verification**: Run `npm run kluster_code_review_auto` after ANY file change

## LangChain & LangSmith Observability

### LangSmith Configuration
LangSmith provides observability for LangChain operations (support chatbot, AI agents).

**Environment Variables:**
```bash
LANGCHAIN_TRACING_V2=true                              # Enable tracing
LANGCHAIN_API_KEY="lsv2_pt_your_key_here"             # Get from smith.langchain.com
LANGCHAIN_PROJECT="svlentes-whatsapp-support"         # Project name
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"  # Default endpoint
OPENAI_API_KEY="sk-your_openai_key"                   # For LLM calls
```

**Key Files:**
- `/src/lib/langsmith-config.ts` - Configuration utilities
- `/src/lib/langchain-support-processor.ts` - Support chatbot with tracing
- `/docs/LANGSMITH_SETUP.md` - Complete setup guide

**Features:**
- ✅ Automatic tracing of all LLM calls
- ✅ Step-by-step execution tracking (intent, response, escalation)
- ✅ Rich metadata (user context, intent, sentiment, priority)
- ✅ Performance monitoring (latency, tokens, costs)
- ✅ Error tracking and debugging

**Quick Start:**
1. Sign up at https://smith.langchain.com/
2. Create API key and add to `.env`
3. Set `LANGCHAIN_TRACING_V2=true`
4. View traces at https://smith.langchain.com/

See `/docs/LANGSMITH_SETUP.md` for detailed documentation.

## Infrastructure & Deployment

### Reverse Proxy (Currently: Caddy) ✅ MIGRATED
- **Active:** Caddy 2.10.2 serving all domains
- **Migration completed:** 2025-10-13 16:17 UTC (SUCCESS)
- **Primary domain:** svlentes.com.br (production)
- **Redirect domain:** svlentes.shop → svlentes.com.br
- **SSL Certificates:** 6 certs acquired automatically via Let's Encrypt
- **Protocols:** HTTP/1.1, HTTP/2, HTTP/3 ✨

### Caddy Management
Located in `/root/svlentes-hero-shop/migration/`:
```bash
# View migration status and results
cat migration/STATUS.md

# Monitor logs in real-time
journalctl -u caddy -f

# Reload config (zero-downtime)
caddy reload --config /etc/caddy/Caddyfile

# Emergency rollback (if needed)
cd /root/svlentes-hero-shop/migration
sudo ./rollback-to-nginx.sh
```

**Migration Results:**
- ✅ 85% less configuration (101 vs 663 lines)
- ✅ Automatic SSL with zero maintenance
- ✅ HTTP/3 enabled for better mobile performance
- ✅ All endpoints validated
- ✅ Actual downtime: ~30 seconds
- ✅ Rollback tested and available

### Production Services
```bash
# Next.js app (port 5000)
systemctl status svlentes-nextjs
journalctl -u svlentes-nextjs -f

# Nginx (current - port 80/443)
systemctl status nginx
nginx -t

# Caddy (after migration - port 80/443)
systemctl status caddy
caddy validate --config /etc/caddy/Caddyfile
```
