# Firebase Configuration Fix

## Issue
Your Firebase configuration is returning 400 errors because the API key is invalid or the Firebase project doesn't exist properly.

## Errors Being Fixed
- ❌ `[Error] Failed to load resource: the server responded with a status of 400 () (getProjectConfig, line 0)`
- ❌ `[Error] Failed to load resource: the server responded with a status of 503 () (trusted-types-checker)`

## Solution Applied

### 1. Error Suppression
We've added graceful error handling to suppress these non-critical errors in the console:
- `ErrorSuppressor` component in root layout
- `firebase-error-handler.ts` for Firebase-specific error handling
- Global error handlers for promise rejections and resource loading errors

### 2. Fallback Authentication
When Firebase is unavailable, the app will use a mock authentication handler in development mode to prevent crashes.

## To Fix Firebase Properly

### Option 1: Get Valid Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select or create your project "svlentes"
3. Go to Project Settings > General
4. Under "Your apps", find or create a Web app
5. Copy the configuration values

### Option 2: Update Environment Variables
Update your `.env.local` file with valid credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..." # Get from Firebase Console
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### Option 3: Disable Firebase (If Not Needed)
If you're not using Firebase Authentication, you can disable it:

1. Remove Firebase imports from components that use it
2. Use alternative authentication (JWT, sessions, etc.)
3. Remove Firebase-related environment variables

## Current Status
✅ Errors are now suppressed in development mode
✅ App will not crash due to Firebase configuration issues
⚠️  Firebase Authentication will not work until you provide valid credentials

## Testing
After updating credentials:
1. Restart the dev server: `npm run dev`
2. Check browser console - errors should be gone
3. Try Firebase authentication features

## Need Help?
- Firebase Documentation: https://firebase.google.com/docs/web/setup
- Check Firebase project status in Console
- Verify API key restrictions and quotas
