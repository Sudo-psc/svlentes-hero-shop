# Firebase Authentication Error - Resolution Summary

## Issue
Google Sign-In was failing with `auth/internal-error` and 503 errors on Firebase SDK resources (v3, api.js).

## Root Cause Analysis
The `auth/internal-error` occurs when Firebase Authentication cannot properly communicate with Google OAuth services. This is typically caused by:

1. **OAuth Client ID misconfiguration** - The Client ID in environment variables doesn't match Google Cloud Console
2. **Missing authorized domains** - Production domains not added to Firebase authorized domains list
3. **Missing redirect URIs** - OAuth redirect URIs not configured in Google Cloud Console
4. **Disabled APIs** - Required Google Cloud APIs (Identity Toolkit, Identity Platform) not enabled

## Code Fixes Applied ✅

### 1. Enhanced Firebase Initialization (`src/lib/firebase.ts`)
```typescript
// Added measurementId to config
const firebaseConfig = {
  // ... existing config
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Added error handling and logging
try {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  
  console.log('[FIREBASE] Initialized successfully', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  })
  
  return { app, auth }
} catch (error: any) {
  console.error('[FIREBASE] Initialization failed:', {
    message: error?.message,
    code: error?.code,
  })
  throw error
}
```

### 2. Improved Error Handling (`src/contexts/AuthContext.tsx`)
```typescript
if (error.code === 'auth/internal-error') {
  console.error('[GOOGLE_AUTH] Internal error details:', {
    error,
    stack: error.stack,
    customData: error.customData,
  })
  throw new Error('Erro interno do Firebase. Verifique se o OAuth está configurado corretamente no Google Cloud Console e se os domínios autorizados incluem este site.')
}
```

### 3. Updated OAuth Error Helper (`src/components/auth/OAuthErrorHelper.tsx`)
- Added detection for `auth/internal-error`
- Provided specific troubleshooting instructions
- Enhanced user feedback with actionable steps

## Configuration Required ⚠️

### Step 1: Google Cloud Console - OAuth 2.0 Client ID

**URL**: https://console.cloud.google.com/apis/credentials?project=svlentes

**Client ID**: `541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com`

#### Add Authorized JavaScript Origins:
```
http://localhost:3000
http://localhost:5000
https://svlentes.com.br
https://www.svlentes.com.br
https://svlentes.firebaseapp.com
```

#### Add Authorized Redirect URIs:
```
http://localhost:3000/__/auth/handler
http://localhost:5000/__/auth/handler
https://svlentes.com.br/__/auth/handler
https://www.svlentes.com.br/__/auth/handler
https://svlentes.firebaseapp.com/__/auth/handler
```

### Step 2: Enable Google Cloud APIs

**URL**: https://console.cloud.google.com/apis/library?project=svlentes

Enable:
- ✅ **Identity Toolkit API**
- ✅ **Identity Platform API**
- ✅ **Google+ API** (for user profile info)

### Step 3: Firebase Console - Google Sign-In Provider

**URL**: https://console.firebase.google.com/project/svlentes/authentication/providers

1. Click on **Google** provider
2. Ensure **Status** is **Enabled**
3. Verify **Web SDK configuration**:
   - Web Client ID: `541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com`
   - Web Client Secret: (should be populated)
4. Click **Save**

### Step 4: Firebase Console - Authorized Domains

**URL**: https://console.firebase.google.com/project/svlentes/authentication/settings

Add these domains to the authorized list:
```
localhost
svlentes.com.br
www.svlentes.com.br
svlentes.firebaseapp.com
```

## Testing Checklist

After completing the configuration steps:

1. **Clear Browser Data**:
   - Open DevTools → Application → Storage → Clear site data
   - Or use Incognito/Private browsing

2. **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

3. **Attempt Google Sign-In**

4. **Check Browser Console** for:
   ```
   ✅ [FIREBASE] Initialized successfully
   ✅ [GOOGLE_AUTH] google-signin-success
   ```

5. **Verify No Errors**:
   - No 503 status codes
   - No `auth/internal-error`
   - No CORS errors

## Environment Variables

Current configuration in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyD8Xh1t9l5X2Y7W3v0U9I8O7P5N3M1K4Q2"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="svlentes.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="svlentes"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="svlentes.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="541878793409"
NEXT_PUBLIC_FIREBASE_APP_ID="1:541878793409:web:44dd7e75c1ca4d93b8d040"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-TR3217ED6S"
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID="541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com"
NEXT_PUBLIC_APP_URL="https://svlentes.com.br"
```

## Status

- ✅ **Code fixes deployed**: Changes made to Firebase initialization and error handling
- ✅ **Build successful**: App rebuilt with fixes
- ✅ **Server running**: Next.js running on port 5000
- ⚠️ **Configuration pending**: Manual steps in Google Cloud Console and Firebase Console required

## Next Steps

1. **Complete manual configuration** (Steps 1-4 above)
2. **Test Google Sign-In** after configuration
3. **Monitor for errors** in browser console
4. **Verify successful authentication** with test user

## Files Modified

- ✅ `src/lib/firebase.ts` - Enhanced initialization and error handling
- ✅ `src/contexts/AuthContext.tsx` - Improved error handling for internal errors
- ✅ `src/components/auth/OAuthErrorHelper.tsx` - Added internal error detection

## Documentation Created

- ✅ `FIREBASE_AUTH_FIX.md` - Detailed fix instructions
- ✅ `diagnose-oauth-issue.md` - OAuth diagnostic guide
- ✅ `FIREBASE_AUTH_ERROR_RESOLUTION.md` - This summary

## Support Resources

- [Firebase Auth Troubleshooting](https://firebase.google.com/docs/auth/web/google-signin#handle_the_sign-in_flow_with_the_firebase_sdk)
- [Google OAuth 2.0 Setup](https://support.google.com/cloud/answer/6158849)
- [Firebase Console](https://console.firebase.google.com/project/svlentes)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=svlentes)

---

**Last Updated**: 2025-11-09
**Status**: Code fixes complete, configuration required
**Server**: Running on port 5000
