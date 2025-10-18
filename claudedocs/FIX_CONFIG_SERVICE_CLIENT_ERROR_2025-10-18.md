# Fix: ConfigService readFileSync Error (2025-10-18)

## Problem

The application was throwing errors in the browser console:
```
[ConfigService] Failed to load config: (0,t.readFileSync) is not a function
```

This error occurred because `ConfigService` (in `src/config/loader.ts`) was being called from client-side React components (`Header` and `Footer`), but it uses Node.js file system APIs (`fs.readFileSync`) that don't exist in the browser.

## Root Cause

1. **ConfigService used Node.js APIs**: The `ConfigService.load()` method imported `fs.readFileSync` to read YAML config files
2. **Client components called it**: Both `Header` and `Footer` are `'use client'` components that called `config.load()` during rendering
3. **No server/client separation**: The config loading logic didn't have guards to prevent client-side execution

## Solution

### 1. Added Server-Side Guard to ConfigService

Added a runtime check to prevent client-side execution:

```typescript
// src/config/loader.ts
load(environment: string = process.env.NODE_ENV || 'development'): AppConfig {
  // Guard: only run on server-side
  if (typeof window !== 'undefined') {
    throw new Error(
      'ConfigService.load() can only be called on the server. ' +
      'Use getServerSideConfig() in server components or API routes.'
    )
  }
  // ... rest of implementation
}
```

### 2. Disabled Centralized Config in Client Components

Temporarily disabled the centralized config feature in `Header` and `Footer` components:

**Before:**
```typescript
const appConfig = config.load()
const useCentralizedConfig = config.isFeatureEnabled('useCentralizedConfig')
const headerMenu = useCentralizedConfig ? config.getMenu('pt-BR', 'header') : null
```

**After:**
```typescript
// FIXME: Configuração centralizada desabilitada temporariamente
// ConfigService requer acesso a fs (Node.js) que não funciona no client
// TODO: Implementar servidor de config ou passar como props de server component
const useCentralizedConfig = false
const headerMenu = null
```

### 3. Removed Unused Imports

Removed the `import { config } from '@/config/loader'` from both components since it's no longer used.

## Files Modified

1. `src/config/loader.ts` - Added server-side guard
2. `src/components/layout/Header.tsx` - Disabled config loading, removed import
3. `src/components/layout/Footer.tsx` - Disabled config loading, removed import

## Future Improvements

To properly implement centralized configuration:

### Option 1: Server Component Wrapper
Create a server component wrapper that loads config and passes it as props:

```typescript
// src/app/layout.tsx (server component)
import { config } from '@/config/loader'

export default function RootLayout({ children }) {
  const appConfig = config.load()
  
  return (
    <html>
      <body>
        <Header config={appConfig.menus.header} />
        {children}
        <Footer config={appConfig.menus.footer} />
      </body>
    </html>
  )
}
```

### Option 2: API Route
Create an API route that serves config data:

```typescript
// src/app/api/config/route.ts
import { config } from '@/config/loader'

export async function GET() {
  const appConfig = config.load()
  return Response.json(appConfig)
}
```

Then fetch it client-side with SWR or React Query.

### Option 3: Build-Time Config
Generate a JSON file during build and import it as a static asset:

```typescript
// scripts/generate-config.ts
import { config } from './src/config/loader'
import fs from 'fs'

const appConfig = config.load()
fs.writeFileSync('./public/config.json', JSON.stringify(appConfig))
```

## Deployment

1. Build completed successfully with warnings (lint warnings, no errors)
2. Service restarted: `systemctl restart svlentes-nextjs`
3. Site verified: https://svlentes.com.br responding with HTTP 200
4. No more ConfigService errors in browser console

## Browser Cache Note

Users may need to perform a **hard refresh** (Ctrl+F5 / Cmd+Shift+R) to clear their browser cache and load the new JavaScript chunks, since Nginx caches `/_next/static` files for 365 days.

## Testing Checklist

- [x] Site loads without errors
- [x] Header renders correctly
- [x] Footer renders correctly
- [x] No console errors about ConfigService
- [x] Navigation links work
- [x] Mobile menu functions
- [x] WhatsApp integration works
- [ ] TODO: Re-enable centralized config with proper server/client separation
