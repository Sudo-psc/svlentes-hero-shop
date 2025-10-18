# Task Completion Checklist - SV Lentes

## Before Starting Any Task
- [ ] Read relevant CLAUDE.md sections
- [ ] Check existing patterns in codebase
- [ ] Verify environment variables are configured
- [ ] Understand LGPD implications if handling data

## During Development
- [ ] Follow TypeScript strict mode requirements
- [ ] Use path aliases (@/ prefixes)
- [ ] Apply Tailwind classes with cn() utility
- [ ] Add proper TypeScript types (no `any`)
- [ ] Handle errors with try-catch blocks
- [ ] Validate inputs with Zod schemas
- [ ] Include loading and error states for UI

## Before Committing Code
- [ ] Run `npm run lint` (should pass)
- [ ] Run `npm run test` (should pass)
- [ ] Run `npm run build` (should succeed)
- [ ] Test locally in dev mode
- [ ] Review changes for sensitive data exposure
- [ ] Verify LGPD compliance if touching user data
- [ ] Check that medical information displays correctly

## Production Deployment Checklist
- [ ] All tests passing
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Asaas production keys active
- [ ] SendPulse integration configured
- [ ] SSL certificates valid
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Health check endpoint responding
- [ ] Database migrations applied
- [ ] Clear Next.js build cache if needed
- [ ] Restart systemd service: `systemctl restart svlentes-nextjs`
- [ ] Verify deployment: `curl -I https://svlentes.shop`
- [ ] Monitor logs: `journalctl -u svlentes-nextjs -f`

## Healthcare Compliance Verification
- [ ] Prescription validation enforced
- [ ] Emergency contact information visible
- [ ] Dr. Philipe's CRM displayed
- [ ] LGPD consent properly tracked
- [ ] No PHI (Protected Health Information) in client code
- [ ] Audit trail for sensitive operations

## Testing Requirements
- [ ] Unit tests for business logic
- [ ] E2E tests for critical flows (subscription, payment, scheduling)
- [ ] Accessibility tests (Playwright axe integration)
- [ ] Performance tests (Lighthouse CI)
- [ ] Mobile responsiveness verified

## Security Checklist
- [ ] No API keys in client-side code
- [ ] Webhook tokens validated
- [ ] CORS properly configured
- [ ] Rate limiting on sensitive endpoints
- [ ] Input sanitization implemented
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this, but verify)