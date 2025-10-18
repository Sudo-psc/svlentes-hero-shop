# Suggested Commands - SV Lentes

## Development Workflow
```bash
npm run dev              # Start development server (port 3000)
npm run build           # Production build
npm run start           # Production server (port 5000)
npm run lint            # ESLint checking
npm run lint:fix        # Auto-fix linting issues
```

## Testing
```bash
npm run test            # Run Jest unit tests
npm run test:watch      # Jest watch mode
npm run test:coverage   # Jest with coverage
npm run test:e2e        # Playwright E2E tests
npm run test:e2e:ui     # Playwright UI mode
npm run test:e2e:debug  # Playwright debug mode
```

## Production Service Management (Systemd)
```bash
systemctl status svlentes-nextjs    # Check service status
systemctl restart svlentes-nextjs   # Restart after deployment
journalctl -u svlentes-nextjs -f    # View live logs
```

## Nginx Operations
```bash
systemctl status nginx              # Check Nginx status
nginx -t                            # Test configuration
systemctl reload nginx              # Reload without downtime
```

## Database Operations
```bash
npm run db:seed          # Seed database
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations (dev)
npx prisma studio        # Open Prisma Studio GUI
```

## Health Monitoring
```bash
npm run health-check     # Check application health
curl -f http://localhost:3000/api/health-check  # Manual health check
```

## Deployment Workflow
```bash
npm run build                     # Build production bundle
systemctl restart svlentes-nextjs # Deploy to production
curl -I https://svlentes.shop     # Verify deployment
```