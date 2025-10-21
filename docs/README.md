# SV Lentes - Documentation Hub

## 🏥 Project Overview

SV Lentes is a modern healthcare platform for contact lens subscription service, built with Next.js 15 and designed for the Brazilian market. This comprehensive documentation hub provides everything developers need to understand, maintain, and extend the platform.

### 🎯 Business Context

- **Company**: Saraiva Vision (Caratinga/MG, Brazil)
- **Responsible Physician**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- **Service**: Contact lens subscription with medical oversight
- **Compliance**: LGPD (Brazilian data protection law)
- **Payment**: Asaas API v3 (PIX, Boleto, Credit Card)
- **Support**: AI-powered WhatsApp customer service

### 🌐 Production URLs

- **Primary**: [svlentes.com.br](https://svlentes.com.br)
- **Alternative**: [svlentes.shop](https://svlentes.shop)
- **WhatsApp**: +55 (33) 99989-8026 (automated support)

---

## 📚 Documentation Structure

### 🏗️ [Project Structure](./PROJECT_STRUCTURE.md)
Complete overview of the codebase architecture, organization, and key components.

**What you'll find:**
- Technology stack details
- Directory structure breakdown
- Core business flows and integration points
- Security and compliance measures
- Performance optimizations
- Development workflow

**Best for:** Understanding overall architecture and project organization

---

### 🔌 [API Documentation](./API_DOCUMENTATION.md)
Comprehensive reference for all API endpoints in the platform.

**What you'll find:**
- 95+ API endpoints with request/response examples
- Authentication and security implementation
- Payment processing with Asaas
- WhatsApp integration with SendPulse
- User management and subscription handling
- LGPD compliance endpoints
- Error handling and status codes

**Best for:** API integration, backend development, and troubleshooting

---

### 🧠 [Knowledge Base](./KNOWLEDGE_BASE.md)
In-depth technical documentation and operational guidelines.

**What you'll find:**
- Business context and regulatory requirements
- Detailed technical architecture
- Component library documentation
- Database schema and relationships
- Integration guides with code examples
- Deployment and operations procedures
- Security best practices
- Development guidelines and standards

**Best for:** Deep technical understanding and implementation guidance

---

## 🚀 Quick Start Guide

### For New Developers

1. **Read Business Context** → Understand the healthcare domain
2. **Review Project Structure** → Get familiar with codebase organization
3. **Set Up Development Environment** → Follow local setup instructions
4. **Review API Documentation** → Understand integration points
5. **Run Tests** → Verify everything works correctly

### For API Integration

1. **Review API Documentation** → Find relevant endpoints
2. **Check Authentication Requirements** → Ensure proper access
3. **Test with Sandbox** → Use development environment first
4. **Review Webhook Handling** → Implement proper processing
5. **Validate with Production** → Final testing before launch

### For Operations & Maintenance

1. **Review Deployment Guide** → Understand production setup
2. **Monitor Health Endpoints** → Check system status
3. **Review Security Measures** → Ensure compliance
4. **Follow Troubleshooting Guide** → Handle common issues
5. **Stay Updated** → Monitor changes and updates

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ (recommend 20.x)
- **PostgreSQL** 14+
- **Git** for version control
- **ngrok** (for local webhook testing)

### Environment Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd svlentes-hero-shop

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# 4. Set up database
npx prisma migrate dev
npx prisma generate

# 5. Start development server
npm run dev
```

### Key Environment Variables

```bash
# Required for development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@localhost:5432/svlentes"

# Asaas (sandbox for development)
ASAAS_ENV=sandbox
ASAAS_API_KEY_SANDBOX=your_sandbox_key

# SendPulse (testing)
SENDPULSE_USER_ID=your_user_id
SENDPULSE_SECRET=your_secret

# OpenAI (for AI support)
OPENAI_API_KEY=your_openai_key
```

---

## 🔧 Common Tasks

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Database Operations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# View database in GUI
npx prisma studio

# Generate Prisma client
npx prisma generate
```

### Building & Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Check production build
npm run analyze

# Health check
curl http://localhost:3000/api/health-check
```

---

## 🔐 Security & Compliance

### LGPD Requirements

- ✅ **Explicit Consent**: Users must opt-in to data processing
- ✅ **Data Minimization**: Collect only necessary information
- ✅ **Right to Access**: Users can request their data
- ✅ **Right to Deletion**: Implement data erasure requests
- ✅ **Audit Trail**: All data access is logged

### Security Measures

- **Authentication**: Multi-provider auth (Google, Firebase)
- **Data Encryption**: Sensitive data encrypted at rest
- **API Security**: Rate limiting, input validation, CORS
- **HTTPS Only**: SSL/TLS enforcement with HSTS
- **Security Headers**: CSP, XSS protection, frame options

### Healthcare Compliance

- **Medical Oversight**: All prescriptions validated by licensed physician
- **Emergency Contacts**: Clear medical emergency information displayed
- **Professional Credentials**: CRM information prominently shown
- **Record Keeping**: Comprehensive audit trails for medical data

---

## 🔌 Integration Details

### Payment Processing (Asaas)

**Supported Methods:**
- **PIX**: Instant Brazilian payment system
- **Boleto**: Traditional bank slip payment
- **Credit Card**: Including installment options

**Key Features:**
- Recurring subscription billing
- Automatic payment retries
- Webhook-based status updates
- Comprehensive error handling

### WhatsApp Integration (SendPulse)

**Features:**
- AI-powered intent classification
- Automated response generation
- Human escalation for complex issues
- Subscription management via chat

**Commands Available:**
- `"minha assinatura"` - View subscription details
- `"pausar assinatura"` - Pause subscription
- `"reativar assinatura"` - Reactivate subscription
- `"próxima entrega"` - Check delivery status

### AI Support System

**Technology:**
- **LangChain**: Natural language processing
- **OpenAI GPT**: Response generation
- **Custom Models**: Healthcare-specific training

**Capabilities:**
- Multi-language support (Portuguese primary)
- Context-aware conversations
- Intent classification with confidence scoring
- Automatic ticket creation and escalation

---

## 📊 Monitoring & Analytics

### Health Monitoring

```bash
# Application health
curl https://svlentes.shop/api/health-check

# Performance metrics
curl https://svlentes.shop/api/monitoring/performance

# System status
curl https://svlentes.shop/api/config/status
```

### Key Metrics Tracked

- **Business Metrics**: Subscription growth, churn rate, revenue
- **Technical Metrics**: Response times, error rates, uptime
- **User Metrics**: Engagement, conversion funnels, support tickets
- **Compliance Metrics**: Consent tracking, data requests

---

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run lint
```

**Database Issues:**
```bash
# Check connection
npx prisma db pull

# Reset migrations
npx prisma migrate reset

# Generate client
npx prisma generate
```

**Payment Issues:**
```bash
# Test Asaas connectivity
curl -H "access_token: $ASAAS_API_KEY" \
     https://sandbox.asaas.com/v3/myAccount

# Check webhook logs
journalctl -u svlentes-nextjs -f | grep webhook
```

**WhatsApp Issues:**
```bash
# Test SendPulse auth
curl -X POST https://api.sendpulse.com/oauth/access_token \
     -H "Content-Type: application/json" \
     -d '{"grant_type":"client_credentials","client_id":"$SENDPULSE_USER_ID","client_secret":"$SENDPULSE_SECRET"}'

# Check webhook URL
curl -I https://svlentes.shop/api/webhooks/sendpulse
```

---

## 🤝 Contributing Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow defined rules and conventions
- **Prettier**: Consistent code formatting
- **Testing**: Maintain test coverage above 80%

### Git Workflow

```bash
# Feature branch naming
feature/description-of-feature

# Commit message format
type(scope): description

# Examples
feat(subscription): add pause functionality
fix(payment): resolve webhook validation
docs(api): update payment endpoints
```

### Pull Request Process

1. **Create feature branch** from main
2. **Write code** following standards
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Submit PR** with clear description
6. **Code review** by team members
7. **Merge** after approval

---

## 📞 Support & Contacts

### Development Team

- **Technical Lead**: Contact via GitHub issues
- **DevOps**: Infrastructure and deployment support
- **QA**: Testing and quality assurance

### Business Contacts

- **Clinical Operations**: Dr. Philipe Saraiva Cruz
- **Customer Support**: WhatsApp +55 (33) 98606-1427
- **General Inquiries**: saraivavision@gmail.com

### Emergency Procedures

**Production Issues:**
1. Check system status: `/api/health-check`
2. Review error logs: `journalctl -u svlentes-nextjs -f`
3. Contact on-call engineer via phone
4. Document incident and resolution

**Security Incidents:**
1. Immediately isolate affected systems
2. Contact security team
3. Document timeline and impact
4. Follow incident response protocol

---

## 📈 Roadmap & Updates

### Current Focus Areas

- **Enhanced AI Support**: Improved intent classification
- **Mobile App**: React Native development
- **Advanced Analytics**: Business intelligence dashboard
- **Telemedicine Integration**: Video consultation features

### Upcoming Releases

**v2.0 (Q1 2025):**
- Enhanced subscriber dashboard
- Advanced reporting features
- Improved mobile experience

**v2.1 (Q2 2025):**
- Video consultation integration
- Expanded payment methods
- Enhanced AI capabilities

### Documentation Updates

This documentation is actively maintained. For the most current information, always check the GitHub repository and project management tools.

---

## 📄 License & Legal

### Medical Disclaimer

This platform is intended for use by licensed healthcare professionals and patients under proper medical supervision. All subscription services require valid medical prescriptions and regular consultation with qualified ophthalmologists.

### Software License

This software is proprietary and confidential property of Saraiva Vision. Unauthorized reproduction, distribution, or modification is strictly prohibited.

### Compliance Certifications

- ✅ LGPD Compliant (Brazilian Data Protection Law)
- ✅ CFM/CRM Compliant (Medical Council Regulations)
- ✅ PCI DSS Compliant (Payment Card Industry)
- ✅ ISO 27001 Compliant (Information Security)

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainer**: SV Lentes Development Team

For questions, contributions, or support, please refer to the contacts section above or create an issue in the project repository.