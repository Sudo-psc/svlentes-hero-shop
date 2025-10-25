# Sanity CMS Integration

## Overview

The project includes Sanity Studio for content management, accessible at `/y` and `/yes` routes.

## Current Status

⚠️ **Expected Browser Console Error**:
```
Failed to load resource: the server responded with a status of 403 (getProjectConfig)
```

This error is **expected and non-critical** when:
- Accessing Sanity Studio routes (`/y` or `/yes`)
- The Sanity project is not fully configured with authentication tokens
- The error does NOT affect the main application functionality

## Environment Variables

Required variables in `.env.local`:

```bash
# Sanity CMS Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=io3qj4rn
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-10-24
```

## Setup Instructions

### Option 1: Keep Sanity Studio (Requires Sanity Account)

1. **Create a Sanity account**: https://www.sanity.io
2. **Login to your project**:
   ```bash
   npx sanity login
   ```
3. **Configure the project** with proper authentication tokens
4. **Add API token** to environment variables if needed

### Option 2: Remove Sanity Studio (If Not Needed)

If Sanity CMS is not required for your use case:

1. **Remove Sanity routes**:
   ```bash
   rm -rf src/app/y src/app/yes
   ```

2. **Remove Sanity configuration**:
   ```bash
   rm sanity.config.ts sanity.cli.ts
   rm -rf src/sanity
   ```

3. **Remove Sanity dependencies** from `package.json`:
   ```bash
   npm uninstall sanity next-sanity @sanity/vision
   ```

4. **Remove environment variables** from `.env.local`:
   - Remove `NEXT_PUBLIC_SANITY_*` variables

## Routes

- **Studio Interface**: `/y` or `/yes`
- **Main Application**: Unaffected by Sanity errors

## Error Resolution

The 403 error for `getProjectConfig` is typically resolved by:

1. **Proper Authentication**: Login with `npx sanity login`
2. **Valid Project ID**: Ensure the project exists in your Sanity account
3. **CORS Configuration**: Add your domain to Sanity CORS settings
4. **API Permissions**: Configure proper read/write permissions

## Impact on Production

- ❌ **Does NOT affect**: Main application, landing pages, subscription flows
- ⚠️ **Only affects**: Sanity Studio admin interface at `/y` and `/yes`
- ✅ **Safe to ignore**: If you don't need the CMS functionality

## Related Files

- Configuration: `sanity.config.ts`
- Environment: `src/sanity/env.ts`
- Schema: `src/sanity/schemaTypes/index.ts`
- Client: `src/sanity/lib/client.ts`

---

**Last Updated**: 2025-10-25
**Status**: Development - Not configured for production use
