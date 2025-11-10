# 🔥 Firebase Project Setup Guide for SVLentes

This guide walks you through setting up the "svlentes" Firebase project correctly to enable authentication functionality.

## 📋 Current Configuration Status

✅ **Configured:**
- Firebase project ID: `svlentes`
- Service account key: Available
- Environment variables: Present
- Domain: `svlentes.firebaseapp.com`

❌ **Issue Identified:**
- Firebase project accessible: **NO** (Returns 404)
- Project may not exist in Firebase Console

## 🚀 Step-by-Step Setup

### 1. Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Sign in with your Google account
3. Click "Add project" or select existing project

### 2. Create "svlentes" Project

**Option A: Create New Project**
1. Click "Add project"
2. Project name: `svlentes`
3. **IMPORTANT**: Do not enable Google Analytics for now
4. Click "Create project"
5. Wait for project to be created (takes 1-2 minutes)

**Option B: Use Existing Project**
1. Check if "svlentes" project already exists
2. Select it from project dropdown

### 3. Enable Authentication

1. In your project dashboard, go to **Authentication** (left sidebar)
2. Click **"Get started"**
3. Select **"Email/Password"** provider
4. Enable it and click **"Save"**
5. Select **"Google"** provider
6. Enable it and click **"Save"**

### 4. Configure Google Sign-In

1. Go to **Authentication → Sign-in method**
2. Under **Google**, click the settings icon
3. Add your authorized domains:
   - `svlentes.com.br` (production)
   - `localhost` (development)
4. **IMPORTANT**: Add OAuth Client ID from environment variables
   - Client ID: `541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com`

### 5. Add Web App Configuration

1. Go to Project Settings (gear icon)
2. Click **"Add app"**
3. Select **"Web"**
4. App nickname: `SVLentes Landing Page`
5. Hosting: Check "Also set up Firebase Hosting"
6. Register app
7. **CRITICAL**: Your authDomain will be automatically generated
8. **Update** `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` if different from `svlentes.firebaseapp.com`

### 6. Generate New API Keys (If Needed)

1. Go to **Project Settings → General**
2. Under **"Your apps"**, find your web app
3. Click the Firebase config snippet
4. **Copy the new configuration** if different from current

### 7. Update Environment Variables

After Firebase setup, verify your `.env.local` file:

```bash
# Should match Firebase Console exactly
NEXT_PUBLIC_FIREBASE_PROJECT_ID="svlentes"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="svlentes.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_API_KEY="your-actual-api-key"
NEXT_PUBLIC_FIREBASE_APP_ID="your-actual-app-id"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-actual-sender-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="svlentes.firebasestorage.app"
```

## 🔍 Verification Steps

### 1. Test Firebase Configuration

```bash
cd /root/svlentes-hero-shop
node scripts/fix-firebase-config.js
```

Expected output:
```
✅ Firebase project is accessible via Google APIs
✅ Firebase auth domain is reachable
✅ Configuration validation passed
```

### 2. Test Authentication in Browser

1. Navigate to: `https://svlentes.com.br/area-assinante/login`
2. Open browser developer tools
3. Check console for Firebase initialization:
   - Should see: `[FIREBASE] Initialized successfully`
   - Should NOT see initialization errors

### 3. Test User Registration

1. Try creating a new account
2. Check email verification
3. Test password reset

## 🛠️ Common Issues & Solutions

### Issue 1: "Project does not exist" (404 Error)

**Cause**: Firebase project "svlentes" doesn't exist or is not accessible
**Solution**: Follow steps 1-2 above to create the project

### Issue 2: "auth/unauthorized-domain"

**Cause**: Domain not authorized in Firebase Console
**Solution**:
1. Go to Authentication → Sign-in method → Google
2. Add `svlentes.com.br` to authorized domains

### Issue 3: "API key not valid"

**Cause**: Using wrong API key or key restrictions
**Solution**:
1. Generate new API key from Firebase Console
2. Ensure no IP restrictions for testing

### Issue 4: Google Sign-In fails

**Cause**: OAuth client ID mismatch
**Solution**:
1. Update OAuth client ID in Firebase Console
2. Ensure client ID matches environment variable

## 🔧 Firebase Admin SDK Setup

The service account key is already configured in `.env.local`. To verify:

1. Go to **Project Settings → Service accounts**
2. Generate new service account key if needed
3. Replace `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`

## 📱 Testing Checklist

After setup completion, test:

- [ ] Firebase initializes without errors
- [ ] User can register new account
- [ ] Email verification works
- [ ] User can sign in with email/password
- [ ] User can sign in with Google
- [ ] Password reset works
- [ ] Protected routes redirect to login
- [ ] Session persistence works

## 🚨 Security Notes

1. **NEVER commit actual API keys** to version control
2. **Use different keys** for development and production
3. **Enable app verification** in Google Cloud Console
4. **Monitor Firebase usage** in console
5. **Set up alerts** for suspicious activity

## 📞 Support Resources

- Firebase Documentation: https://firebase.google.com/docs
- Authentication Guide: https://firebase.google.com/docs/auth
- Firebase Support: https://firebase.google.com/support

---

**Next Steps:**
1. Complete Firebase Console setup
2. Test configuration script
3. Verify login functionality
4. Deploy and test in production