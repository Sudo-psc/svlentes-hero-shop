# Firebase Admin Setup Guide

## Problem
The subscription endpoint returns 503 error: **"Serviço de autenticação temporariamente indisponível"**

This happens because Firebase Admin SDK is not initialized - missing server-side credentials.

## Root Cause
File: `src/lib/firebase-admin.ts:5-7`
```typescript
const hasCredentials =
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
```

Currently `hasCredentials` is `false`, so `adminAuth` is `null` (line 28).

## Solution

### Option 1: Service Account JSON (Recommended)

1. **Generate Service Account Key** from Firebase Console:
   - Go to: https://console.firebase.google.com/project/svlentes/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Save the JSON file securely

2. **Add to .env.local** (single-line JSON):
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"svlentes","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@svlentes.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
   ```

### Option 2: Individual Environment Variables

Add these to `.env.local`:
```bash
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@svlentes.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Note**: The private key must include `\n` for newlines (literal backslash-n, not actual newlines).

## Verification

After adding credentials:

```bash
# Restart the service
systemctl restart svlentes-nextjs

# Check logs for successful initialization
journalctl -u svlentes-nextjs -n 50 | grep -i firebase

# Test the endpoint
curl -I http://localhost:5000/api/assinante/subscription
# Should return 401 (Unauthorized) instead of 503 (Service Unavailable)
```

## Security Notes

- **Never commit** `.env.local` to git (already in .gitignore)
- **Never expose** service account credentials publicly
- Store backup of credentials securely (password manager)
- Firebase service accounts have full admin access to your project

## Related Files

- `src/lib/firebase-admin.ts` - Admin SDK initialization
- `src/app/api/assinante/subscription/route.ts:19-30` - Error trigger location
- `.env.local` - Environment variables (gitignored)

## Alternative: Disable Firebase Temporarily

If you want to test without Firebase authentication:

1. Comment out authentication check in `route.ts:19-58`
2. Use mock user data for testing
3. **Not recommended for production** - authentication is critical for security
