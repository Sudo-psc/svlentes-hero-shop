# Firebase Admin SDK Setup Guide

## Current Status
Firebase Admin SDK is **not configured** in production. The subscriber authentication endpoints return graceful 503 errors.

## Required Credentials

Firebase Admin SDK requires a service account key to authenticate server-side operations. There are two methods:

### Method 1: Service Account JSON (Recommended)
Download the complete service account key from Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/project/svlentes/settings/serviceaccounts/adminsdk)
2. Click **Project Settings** > **Service Accounts**
3. Click **Generate New Private Key**
4. Save the JSON file securely

Then add to `.env.local`:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"svlentes","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@svlentes.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

### Method 2: Individual Fields (Alternative)
Extract these fields from the downloaded JSON:

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID="svlentes"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@svlentes.iam.gserviceaccount.com"
```

**Note**: The `private_key` must include literal `\n` characters for line breaks.

## Deployment Steps

### 1. Add Credentials to Environment
```bash
cd /root/svlentes-hero-shop
nano .env.local
# Add Firebase credentials using one of the methods above
```

### 2. Rebuild Application
```bash
npm run build
```

### 3. Restart Service
```bash
systemctl restart svlentes-nextjs
journalctl -u svlentes-nextjs -f
```

### 4. Test Authentication
```bash
# Should return 401 (unauthorized) instead of 503 (unavailable)
curl -I https://svlentes.com.br/api/assinante/subscription
```

## Affected Endpoints

These endpoints require Firebase Admin SDK:
- `GET /api/assinante/subscription` - Get user subscription
- `PUT /api/assinante/subscription` - Update subscription
- `GET /api/assinante/orders` - Get user orders
- `GET /api/assinante/invoices` - Get user invoices

## Security Notes

- **Never commit** service account keys to version control
- Store credentials in `.env.local` (gitignored)
- For production, use environment variables injected by deployment platform
- Rotate keys periodically for security

## Troubleshooting

### Error: "Firebase Admin não configurado"
- Check if credentials are in `.env.local`
- Verify JSON is properly escaped (no newlines in the string)
- Ensure service is restarted after adding credentials

### Error: "Invalid token"
- Check that private key includes `\n` for line breaks
- Verify client email matches the service account
- Ensure project ID is correct

## Current Configuration
```
Firebase Client: ✅ Configured (public keys in .env.local)
Firebase Admin:  ❌ Not configured (service account missing)
Fallback Mode:   ✅ Enabled (returns 503 gracefully)
```
