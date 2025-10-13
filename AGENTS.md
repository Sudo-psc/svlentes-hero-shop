# AGENTS.md - Quick Reference for AI Coding Agents

## Build, Lint & Test Commands
```bash
npm run build                    # Production build (verify before deploy)
npm run lint                     # ESLint checks (run after changes)
npm run test                     # All Jest unit tests
npm run test -- validations      # Single test file matching "validations"
npm run test:watch               # Watch mode for TDD
npm run test:coverage            # Jest with coverage report
npm run test:e2e                 # Playwright E2E tests
npm run test:e2e:ui              # Playwright with UI mode
npm run test:e2e:debug          # Debug single E2E test
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
- Unit tests for business logic (calculator, validation functions)
- Component tests for complex UI with user interactions
- Test files colocated: `src/**/__tests__/ComponentName.test.tsx`
- Use `@testing-library/react` for component tests, Jest for unit tests
- Test files should import from parent: `import { func } from '../validations'`

## Critical Rules
1. **Healthcare compliance**: LGPD data protection, prescription validation mandatory
2. **NO COMMENTS unless requested** - code should be self-documenting
3. **Security**: No API keys in client code, validate webhook signatures
4. **Asaas payment gateway** (Brazilian) - primary, Stripe is legacy backup
5. **Run tests after changes**: `npm run test && npm run build` before considering done
6. **kluster verification**: Run `kluster_code_review_auto` after ANY file change

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
