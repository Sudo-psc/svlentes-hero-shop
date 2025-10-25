# Clerk Authentication Integration

This document provides a quick reference for working with Clerk authentication in the SV Lentes application.

## Overview

Clerk has been integrated into the application alongside the existing Firebase authentication system. This allows for a gradual migration or the ability to use both systems in parallel.

## Getting Started

### 1. Sign up for Clerk

1. Visit [https://clerk.com](https://clerk.com) and create an account
2. Create a new application in the Clerk Dashboard
3. Copy your API keys from the dashboard

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

**Note:** When Clerk starts for the first time without keys configured, it will automatically generate development keys for you. However, for production use, you should obtain keys from the Clerk Dashboard.

### 3. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit the demo page:
   ```
   http://localhost:3000/clerk-demo
   ```

3. Try signing up and signing in using the Clerk components

## Implementation Details

### Protected Routes

The following routes are automatically protected by Clerk authentication:

- `/area-assinante/*` - Subscriber dashboard and related pages (except public endpoints)
- `/api/assinante/*` - Subscriber API endpoints (except public endpoints)

**Public Routes (excluded from protection):**
- `/area-assinante/login` - Login page
- `/area-assinante/register` - Registration page
- `/api/assinante/register` - Registration API endpoint
- `/clerk-demo` - Demo page for testing Clerk integration

Users must be authenticated to access protected routes. Unauthenticated users will be redirected to the sign-in page. Public routes remain accessible to all users for authentication flows.

### Available Components

Clerk provides several pre-built React components:

```tsx
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

// Sign-in button
<SignInButton mode="modal">
  <button>Sign In</button>
</SignInButton>

// Sign-up button
<SignUpButton mode="modal">
  <button>Sign Up</button>
</SignUpButton>

// User profile button (shows when authenticated)
<UserButton afterSignOutUrl="/" />

// Conditional rendering
<SignedIn>
  <p>This content is only visible to authenticated users</p>
</SignedIn>

<SignedOut>
  <p>This content is only visible to unauthenticated users</p>
</SignedOut>
```

### Server-Side Authentication

To access user data on the server (e.g., in API routes or Server Components):

```tsx
import { auth, currentUser } from '@clerk/nextjs/server'

// In an API route or Server Component
export default async function Page() {
  const { userId } = await auth()

  if (!userId) {
    return <div>Not authenticated</div>
  }

  const user = await currentUser()

  return <div>Hello {user?.firstName}</div>
}
```

### Middleware Integration

Clerk middleware has been integrated with the existing logging and monitoring middleware in `src/middleware.ts`. The integration:

1. Preserves all existing security headers
2. Maintains request/response logging
3. Adds Clerk authentication checks with error handling
4. Protects specified routes automatically (while excluding public authentication routes)
5. Logs authentication failures for monitoring and debugging

**Error Handling:**
The middleware includes try/catch blocks around authentication checks to:
- Log authentication failures with detailed context
- Prevent middleware crashes from blocking the application
- Allow Clerk to handle redirects appropriately for unauthorized access

## Customization

### Custom Sign-In/Sign-Up URLs

You can customize the authentication flow URLs by adding these to your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/area-assinante/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/area-assinante/dashboard
```

### Styling

Clerk components can be styled using the `appearance` prop:

```tsx
<UserButton
  appearance={{
    elements: {
      avatarBox: "w-12 h-12",
      userButtonPopoverCard: "bg-white shadow-lg"
    }
  }}
/>
```

## Migration Strategy

Since Firebase authentication is already in use, you have several migration options:

### Option 1: Parallel Systems
- Keep both Firebase and Clerk running
- Use Firebase for existing users
- Use Clerk for new features or new users

### Option 2: Gradual Migration
- Implement Clerk for new users only
- Migrate existing users gradually
- Eventually deprecate Firebase

### Option 3: Feature-Based
- Use Firebase for customer-facing features
- Use Clerk for admin/internal features
- Leverage each system's strengths

## Testing

The demo page at `/clerk-demo` includes:
- Sign-in and sign-up buttons
- Conditional content rendering
- User profile management
- Information about the integration

## Troubleshooting

### Build Errors

If you encounter build errors, ensure:
1. `@clerk/nextjs` is installed: `npm install @clerk/nextjs@latest`
2. Environment variables are set correctly
3. Middleware is properly configured

### Authentication Not Working

Check:
1. API keys are correct in `.env.local`
2. Protected routes are defined in `src/middleware.ts`
3. `ClerkProvider` wraps your app in `layout.tsx`

### Conflicts with Firebase

The integration is designed to work alongside Firebase. If you experience issues:
1. Check that both providers are properly wrapped in the layout
2. Ensure route protection doesn't conflict
3. Use different routes/components for each system

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [API Reference](https://clerk.com/docs/reference/nextjs/overview)

## Support

For issues specific to this integration:
1. Check the Clerk Dashboard for user activity
2. Review middleware logs for authentication errors
3. Test with the `/clerk-demo` page first
4. Consult the official Clerk documentation

For general authentication questions, refer to the main CLAUDE.md documentation.
