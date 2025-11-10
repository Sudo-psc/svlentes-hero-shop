# Firebase Authentication Error Fix - auth/internal-error

## Issue Summary
**Error**: `auth/internal-error` during Google Sign-In with 503 errors on Firebase SDK resources

## Root Cause
The error occurs when Firebase cannot properly communicate with Google OAuth services, typically due to:
1. OAuth Client ID misconfiguration
2. Missing authorized domains
3. Disabled Firebase Authentication APIs

## Immediate Fixes Applied

### 1. Enhanced Firebase Initialization (`src/lib/firebase.ts`)
- ✅ Added `measurementId` to Firebase config
- ✅ Added error handling and logging for initialization failures
- ✅ Added detailed console logs for debugging

### 2. Improved Error Handling (`src/contexts/AuthContext.tsx`)
- ✅ Added specific handler for `auth/internal-error`
- ✅ Enhanced error logging with stack traces
- ✅ Provided clearer error messages to users

### 3. Updated OAuth Error Helper (`src/components/auth/OAuthErrorHelper.tsx`)
- ✅ Added detection for `auth/internal-error`
- ✅ Provided specific instructions for resolving internal errors
- ✅ Enhanced retry functionality

## Required Manual Configuration

### Step 1: Google Cloud Console - OAuth Configuration

1. Go to: https://console.cloud.google.com/apis/credentials?project=svlentes

2. Find or create the OAuth 2.0 Client ID: `541878793409-a4v5619865slilel2ssi4r7qhfd4255q`

3. Add these **Authorized JavaScript origins**:
```
http://localhost:3000
http://localhost:5000
https://svlentes.com
https://www.svlentes.com
https://svlentes.shop
https://www.svlentes.shop
https://svlentes.com.br
https://www.svlentes.com.br
https://svlentes.firebaseapp.com
```

4. Add these **Authorized redirect URIs**:
```
http://localhost:3000/__/auth/handler
http://localhost:5000/__/auth/handler
https://svlentes.com/__/auth/handler
https://www.svlentes.com/__/auth/handler
https://svlentes.shop/__/auth/handler
https://www.svlentes.shop/__/auth/handler
https://svlentes.com.br/__/auth/handler
https://www.svlentes.com.br/__/auth/handler
https://svlentes.firebaseapp.com/__/auth/handler
```

### Step 2: Enable Required APIs

Go to: https://console.cloud.google.com/apis/library?project=svlentes

Enable these APIs:
- ✅ Identity Toolkit API
- ✅ Identity Platform API
- ✅ Google+ API (for user info)

### Step 3: Firebase Console - Authentication Settings

1. Go to: https://console.firebase.google.com/project/svlentes/authentication/providers

2. Click on **Google** provider

3. Ensure it's **Enabled**

4. Verify the **Web SDK configuration** section shows:
   - Web Client ID: `541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com`
   - Web Client Secret: (should be filled)

5. Click **Save**

### Step 4: Firebase Console - Authorized Domains

1. Go to: https://console.firebase.google.com/project/svlentes/authentication/settings

2. Scroll to **Authorized domains**

3. Add these domains:
```
localhost
svlentes.com
svlentes.shop
svlentes.com.br
www.svlentes.com
www.svlentes.shop
www.svlentes.com.br
```

## Testing the Fix

1. **Clear browser cache and cookies**:
   - Chrome: DevTools → Application → Clear Storage → Clear site data
   - Firefox: DevTools → Storage → Clear All

2. **Hard refresh the page**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

3. **Try Google Sign-In again**

4. **Check browser console** for these success messages:
   ```
   [FIREBASE] Initialized successfully
   [GOOGLE_AUTH] google-signin-success
   ```

## If Error Persists

### Check Browser Console for Details
Look for:
- Network errors (503 status codes)
- CORS errors
- Any error messages from Firebase SDK

### Verify Environment Variables
Ensure `.env.local` contains:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyD8Xh1t9l5X2Y7W3v0U9I8O7P5N3M1K4Q2"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="svlentes.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="svlentes"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="svlentes.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="541878793409"
NEXT_PUBLIC_FIREBASE_APP_ID="1:541878793409:web:44dd7e75c1ca4d93b8d040"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-TR3217ED6S"
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID="541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com"
```

### Restart the Development Server
```bash
# Kill existing process
pkill -f "next"

# Start fresh
npm run dev
# or
next start -p 5000 -H 0.0.0.0
```

## Additional Notes

- The 503 errors on `v3` and `api.js` indicate Firebase SDK is blocked from accessing authentication services
- This is almost always due to OAuth configuration mismatches
- Once properly configured, the error should resolve immediately without code changes

## Contact Support
If issues persist after following all steps, contact Firebase Support with:
- Project ID: `svlentes`
- Error code: `auth/internal-error`
- Browser console logs
- Network tab showing 503 errors
