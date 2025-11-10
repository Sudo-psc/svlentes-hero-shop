# Firebase OAuth Configuration Issue - Diagnosis

## Error Summary
- **Error Code**: `auth/internal-error`
- **Error Message**: `Firebase: Error (auth/internal-error)`
- **Status Codes**: 503 errors on Firebase SDK resources (v3, api.js)

## Root Cause
The `auth/internal-error` typically occurs when:

1. **OAuth Client ID Misconfiguration**: The OAuth Client ID in the environment doesn't match Google Cloud Console
2. **Missing Authorized Redirect URIs**: The domain isn't authorized in Google Cloud Console
3. **Firebase Authentication API not enabled**: The Identity Toolkit API isn't enabled in Google Cloud

## Current Configuration
- **OAuth Client ID**: `541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com`
- **Firebase Project**: `svlentes`
- **Auth Domain**: `svlentes.firebaseapp.com`

## Required Actions

### 1. Verify Google Cloud Console OAuth Configuration

Go to: https://console.cloud.google.com/apis/credentials?project=svlentes

Check the OAuth 2.0 Client ID configuration and ensure:

#### Required Authorized JavaScript origins:
```
http://localhost:3000
http://localhost:5000
https://svlentes.com
https://www.svlentes.com
https://svlentes.firebaseapp.com
```

#### Required Authorized redirect URIs:
```
http://localhost:3000/__/auth/handler
http://localhost:5000/__/auth/handler
https://svlentes.com/__/auth/handler
https://www.svlentes.com/__/auth/handler
https://svlentes.firebaseapp.com/__/auth/handler
```

### 2. Verify Firebase Console Configuration

Go to: https://console.firebase.google.com/project/svlentes/authentication/providers

Ensure:
- ✅ Google Sign-In provider is **ENABLED**
- ✅ Web SDK configuration shows the correct OAuth Client ID
- ✅ Authorized domains include:
  - `localhost`
  - `svlentes.com`
  - `www.svlentes.com`
  - `svlentes.firebaseapp.com`

### 3. Enable Required APIs

Go to: https://console.cloud.google.com/apis/library?project=svlentes

Ensure these APIs are enabled:
- ✅ Identity Toolkit API
- ✅ Identity Platform
- ✅ Google Sign-In API

### 4. Test Configuration

After making the above changes:

1. Clear browser cache and cookies
2. Try logging in with Google again
3. Check browser console for detailed error messages
4. Verify no more 503 errors on Firebase SDK resources

## Additional Notes

The 503 errors on `v3` and `api.js` suggest that Firebase SDK is unable to reach authentication services, which is consistent with misconfigured OAuth settings or blocked API access.

## Quick Fix Command

If using Firebase CLI:
```bash
firebase login
firebase projects:list
firebase auth:export users.json --project svlentes
```

This will verify you have proper access to the Firebase project.
