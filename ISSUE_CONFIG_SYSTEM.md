# Implement centralized configuration system for client components

## Issue Overview
Multiple components (HeroSection, Header, Footer, translation.ts) are using hardcoded copy because the centralized configuration system is disabled on the client side.

## Problem
- Components contain `FIXME: Centralized config disabled - using hardcoded copy` comments
- Translation system fallbacks to key-based approach
- Maintenance overhead of updating text in multiple places
- Inconsistent messaging across components

## Files Affected
- `src/components/sections/HeroSection.tsx:14`
- `src/components/layout/Header.tsx:19`
- `src/components/layout/Footer.tsx:35`
- `src/lib/translation.ts:21,68`

## Solution Requirements
1. Implement server-side configuration loading
2. Pass configuration as props to client components
3. Update all affected components to use centralized config
4. Ensure configuration updates don't require redeployment

## Acceptance Criteria
- [ ] All hardcoded text replaced with centralized config
- [ ] Configuration updates reflected without code changes
- [ ] Components maintain existing functionality
- [ ] No performance degradation

## Priority
HIGH - Affects maintainability and consistency across the application

## Technical Notes
Related TODOs:
- `TODO: Implementar servidor de config ou passar como props de server component` (Header.tsx:21, Footer.tsx:37)
- `FIXME: Configuração centralizada desabilitada temporariamente` (multiple files)

## Labels
enhancement
configuration
tech-debt
component-updates