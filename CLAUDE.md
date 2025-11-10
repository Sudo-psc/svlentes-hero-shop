# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SVLentes Landing Page** is a Next.js 15 application for a contact lens subscription service based in Caratinga/MG, Brazil. The platform serves Saraiva Vision clinic and provides automated lens renewal subscriptions with medical follow-up scheduling.

**Technology Stack:**
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **State Management**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Authentication**: Firebase Auth + NextAuth
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest (unit), Vitest (integration), Playwright (E2E)
- **Payments**: Stripe integration
- **Deployments**: Production systemd service with Nginx reverse proxy

## Essential Commands

### Development Workflow
```bash
# Start development server
npm run dev                    # Runs on http://localhost:3000

# Build for production
npm run build                  # Includes post-build optimizations

# Start production server locally
npm run start                  # Runs on http://localhost:5000

# Code quality
npm run lint                   # ESLint (NEEDS CONFIGURATION - prompts for setup)
npm run lint:fix              # Auto-fix linting issues
```

### Testing Commands
```bash
# Unit tests
npm run test                   # Jest unit tests
npm run test:watch            # Jest in watch mode
npm run test:coverage         # Jest with coverage report

# Integration tests
npm run test:integration      # Vitest integration tests
npm run test:resilience       # Specific resilience tests

# E2E tests
npm run test:e2e              # Playwright E2E tests
npm run test:e2e:ui           # Playwright with UI mode
npm run test:e2e:headed       # Playwright with headed browser
npm run test:e2e:debug        # Playwright debug mode

# Run all tests
npm run test:all              # Resilience + E2E tests
```

### Database Operations
```bash
# Database seeding
npm run db:seed               # Seed production database
npm run db:seed:test          # Seed test database
npm run db:clear:test         # Clear test database
```

### Deployment & Production
```bash
# Deployment scripts (requires sudo)
sudo ./scripts/deploy.sh              # Full deployment with tests
sudo ./scripts/deploy.sh --skip-tests # Deploy without tests
sudo ./scripts/deploy.sh --dry-run    # Simulation mode

# Health checks
npm run health-check          # Test local application health

# Security audits
npm run security:audit        # Check for vulnerabilities
npm run security:deps-check   # Check outdated dependencies
```

## Architecture Overview

### Project Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/             # Authentication routes
│   ├── area-assinante/     # Subscriber dashboard area
│   ├── api/                # API routes
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                # shadcn/ui base components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database configuration
│   ├── email/             # Email services
│   ├── payment/           # Payment processing
│   └── utils/             # General utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── contexts/              # React contexts
```

### Key Integrations

**Firebase Authentication:**
- Configuration in `src/lib/firebase/`
- Admin SDK for server-side operations
- Custom claims for role-based access

**Stripe Payments:**
- Webhook handling at `/api/webhooks/stripe`
- Subscription management logic
- Pricing calculator with dynamic plans

**Prisma Database:**
- Schema at `prisma/schema.prisma`
- Migration system in place
- Connection pooling for production

**NextAuth.js:**
- Session management
- OAuth providers configuration
- Custom callbacks for Firebase integration

### Component Architecture

**UI Components:**
- Built with shadcn/ui design system
- Tailwind CSS for styling
- Radix UI primitives for accessibility
- Consistent `cn()` utility for class merging

**Form Handling:**
- React Hook Form with Zod schemas
- Server-side validation
- Error boundary integration
- Optimistic UI updates

**State Management:**
- React Context for global state
- Local state with useState/useReducer
- Server state via API calls
- Caching with React Query

## Configuration Files

### Build Configuration (`next.config.js`)
- TypeScript errors ignored during builds (temporary)
- ESLint errors ignored during builds (temporary)
- Security headers configured
- Static asset caching enabled
- CSP disabled temporarily (fixes 503 errors)

### Testing Configuration
- **Jest**: Unit testing with DOM environment
- **Vitest**: Integration testing with fast execution
- **Playwright**: E2E testing with multiple browsers
- Base URL: `http://localhost:5000` for production-like testing

### ESLint Configuration
- **CRITICAL**: Needs proper configuration setup
- Currently prompts for configuration when running `npm run lint`
- Blocks CI/CD pipeline until configured
- Recommended: Select "Strict (recommended)" when prompted

## Production Deployment

### Service Management
```bash
# Check service status
systemctl status svlentes-nextjs

# View service logs
journalctl -u svlentes-nextjs -f

# Restart service
systemctl restart svlentes-nextjs
```

### Nginx Configuration
- SSL/TLS termination with Let's Encrypt
- Reverse proxy to localhost:5000
- Security headers (HSTS, CSP, X-Frame-Options)
- Static asset caching

### Backup Strategy
- Automatic backups before deployments
- Stored in `/root/svlentes-hero-shop/backups/`
- Includes source, build artifacts, and configuration
- 7-day retention policy

## Environment Configuration

### Critical Environment Variables
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
FIREBASE_ADMIN_PROJECT_ID=

# Stripe Configuration
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Application
NEXT_PUBLIC_SITE_URL=https://svlentes.shop
NODE_ENV=production
```

### Environment Files
- `.env.local` - Local development (gitignored)
- `.env.production` - Production configuration
- `.env.example` - Template with required variables

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Prettier configuration for formatting
- Component files use `.tsx` extension
- Utility files use `.ts` extension

### Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% coverage target

### Security Considerations
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS protection with DOMPurify
- CSRF protection via NextAuth
- Rate limiting on API endpoints

## Troubleshooting

### Common Issues

**ESLint Configuration Missing:**
```bash
npm run lint
# Select "Strict (recommended)" when prompted
# Or configure manually in .eslintrc.js
```

**Build Failures:**
- Check TypeScript errors: `npx tsc --noEmit`
- Check environment variables: `cat .env.local`
- Verify dependencies: `npm ls`

**Service Not Starting:**
- Check logs: `journalctl -u svlentes-nextjs -n 50`
- Verify build: `npm run build`
- Check port conflicts: `lsof -i :5000`

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check PostgreSQL service: `systemctl status postgresql`
- Test connection: `npx prisma db push`

### Performance Monitoring
- Application logs: `journalctl -u svlentes-nextjs -f`
- Nginx logs: `/var/log/nginx/svlentes.shop.access.log`
- Error logs: `/var/log/nginx/error.log`
- Deploy logs: `/var/log/deploy-svlentes.log`

## Additional Resources

### Documentation
- `/root/svlentes-hero-shop/docs/` - Additional project documentation
- `/root/svlentes-hero-shop/scripts/README.md` - Deployment scripts guide
- Component documentation in respective `.md` files

### Health Endpoints
- Local: `http://localhost:3000/api/health-check`
- Production: `https://svlentes.shop/api/health-check`

### Database Management
- Prisma Studio: `npx prisma studio`
- Migrations: `npx prisma migrate dev`
- Schema validation: `npx prisma validate`

## Important Notes

- **Healthcare Application**: Handles medical data - comply with LGPD (Brazilian data protection law)
- **Production Environment**: All services are customer-facing - test thoroughly
- **ESLint Configuration**: Required before running linting - blocks workflow
- **Service Dependencies**: Nginx depends on Next.js service
- **Backup Strategy**: Automatic before deployments - verify regularly
- **SSL Certificates**: Auto-renewed via Certbot - monitor expiry dates