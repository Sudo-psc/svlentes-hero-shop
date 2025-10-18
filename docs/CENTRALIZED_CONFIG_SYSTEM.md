# Centralized Configuration System

## Overview
The centralized configuration stack moves critical content and UI metadata out of scattered TypeScript files into a single source of truth. Configuration is defined in YAML, validated with Zod, and consumed via a singleton loader that guarantees server-side safety.

```
src/config/
├── base.yaml   # Authoritative configuration values
├── schema.ts   # Zod schema + AppConfig typings
└── loader.ts   # ConfigService singleton with caching + helpers
```

* `base.yaml` stores site metadata, menus, copy, pricing, SEO, medical info, analytics, privacy, and feature flags.【F:src/config/base.yaml†L1-L702】
* `schema.ts` validates the YAML file and exports the `AppConfig` type for strong typing across the app.【F:src/config/schema.ts†L1-L466】
* `loader.ts` exposes `config.load()`, `config.get()`, `config.getMenu()`, and `config.isFeatureEnabled()` helpers. The loader caches results, logs validation errors, and rejects client-side usage to avoid leaking secrets or bundling YAML into the browser.【F:src/config/loader.ts†L1-L108】

## Usage Guidelines
1. **Load on the server only.** `ConfigService.load()` throws if executed in the browser. Call it inside server components, API routes, or data utilities before requesting data.【F:src/config/loader.ts†L32-L45】
2. **Reuse the singleton.** The first `config.load()` call parses and caches the YAML file. Subsequent calls reuse the in-memory copy for fast access.【F:src/config/loader.ts†L41-L58】
3. **Access structured data through helpers.**
   ```ts
   import { config } from '@/config/loader'

   const appConfig = config.load()
   const headerMenu = config.getMenu('pt-BR', 'header')
   const centralizedPricing = config.isFeatureEnabled('useCentralizedPricing')
   ```
4. **Respect feature flags.** Toggle adoption per area while keeping legacy fallbacks. For example, pricing wrappers read `useCentralizedPricing` and revert to hardcoded plans if the flag is false or loading fails.【F:src/data/pricing-plans.ts†L12-L72】
5. **Handle failures gracefully.** Catch loader errors to fall back on defaults when centralization is unavailable (as demonstrated in pricing and other data modules).【F:src/data/pricing-plans.ts†L20-L36】

## Feature Flags
The configuration exposes staged rollout switches that allow partial adoption without breaking production flows.【F:src/config/base.yaml†L666-L702】

| Flag | Purpose |
| --- | --- |
| `useCentralizedConfig` | Enables header/footer menus from YAML instead of hardcoded arrays. |
| `useCentralizedCopy` | Serves hero/how-it-works copy from centralized content (Phase 2). |
| `useCentralizedPricing` | Supplies pricing plans, feature comparisons, and benefits (Phase 3). |
| `useCentralizedSEO` | Provides SEO metadata (titles, descriptions, Open Graph). |
| `useCentralizedMedical` | Centralizes doctor bios, clinic information, and compliance notices. |
| `useCentralizedAnalytics` | Manages analytics IDs and sampling thresholds. |
| `useCentralizedPrivacy` | Powers LGPD privacy options (consent categories, retention). |

## Editing Workflow
1. Update `src/config/base.yaml` with the new values.
2. If you introduce new keys, extend the matching schema section in `src/config/schema.ts` so the loader remains type-safe.
3. Run `npm run lint` to catch typing or import issues (schema changes can surface in TypeScript consumers).
4. Deploy after verifying that the relevant feature flag is enabled and that dependent modules (pricing, trust indicators, etc.) continue to work.

## Future Enhancements
The loader is currently MVP-level (phase 1). Upcoming phases will add environment overrides, hot reload, and richer helper methods as described in the implementation notes inside `loader.ts` comments.【F:src/config/loader.ts†L5-L12】
