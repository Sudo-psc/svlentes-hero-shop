# Code Style and Conventions - SV Lentes

## TypeScript Configuration
- **Strict mode**: Enabled
- **Target**: ES5
- **Module**: ESNext with bundler resolution
- **Path aliases**: 
  - `@/*` → `./src/*`
  - `@/components/*` → `./src/components/*`
  - `@/lib/*` → `./src/lib/*`
  - `@/data/*` → `./src/data/*`

## Naming Conventions
- **Files/Folders**: kebab-case for routes, PascalCase for components
- **Components**: PascalCase (e.g., `HeroSection.tsx`)
- **Utilities**: camelCase (e.g., `calculator.ts`)
- **Types/Interfaces**: PascalCase (e.g., `PricingPlan`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **API Routes**: kebab-case folders with `route.ts`

## Component Structure
```typescript
// 1. Imports
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SomeType } from '@/types'

// 2. Types/Interfaces
interface ComponentProps {
  title: string
  optional?: boolean
}

// 3. Component
export function Component({ title, optional }: ComponentProps) {
  // hooks first
  const [state, setState] = useState()
  
  // handlers
  const handleAction = () => {}
  
  // render
  return <div>{title}</div>
}
```

## Styling Conventions
- **Primary approach**: Tailwind utility classes
- **Component variants**: Use `class-variance-authority` (CVA)
- **Class merging**: Always use `cn()` from `@/lib/utils`
- **Color scheme**: Cyan (primary), Silver (secondary), WhatsApp green
- **Fonts**: Inter (body), Poppins (headings)

## Data Files
- Location: `src/data/`
- Export named constants
- Include TypeScript types
- Examples: `pricing-plans.ts`, `doctor-info.ts`, `faq-data.ts`

## API Routes
- Location: `src/app/api/`
- File: `route.ts` (Next.js convention)
- Export: `GET`, `POST`, etc. as named exports
- Error handling: Use try-catch with proper HTTP status codes
- Validation: Zod schemas for request bodies

## Testing Conventions
- Unit tests: `__tests__/*.test.ts(x)` or `*.test.ts(x)` adjacent to source
- E2E tests: `e2e/*.spec.ts`
- Naming: Describe behavior, not implementation
- Coverage: Aim for >80% on critical paths

## Healthcare-Specific Rules
- **LGPD Compliance**: Always include consent tracking
- **Medical Data**: Never expose sensitive health data in client code
- **Prescription Validation**: Mandatory - never bypass
- **Emergency Contact**: Must be visible throughout application
- **CRM Display**: Always show Dr. Philipe's CRM-MG 69.870