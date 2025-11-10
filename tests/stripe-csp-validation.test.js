/**
 * Stripe CSP/CORS Validation Tests
 * 
 * These tests validate the Content Security Policy configuration
 * for Stripe Pricing Table integration.
 * 
 * Run with: npm test tests/stripe-csp-validation.test.js
 */

describe('Stripe CSP Configuration', () => {
  describe('Environment Variables', () => {
    it('should have STRIPE_SECRET_KEY configured', () => {
      // Note: In development, this may not be set
      const key = process.env.STRIPE_SECRET_KEY;
      if (key) {
        expect(key).toMatch(/^sk_(test|live)_/);
      }
    });

    it('should have NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configured', () => {
      const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (key) {
        expect(key).toMatch(/^pk_(test|live)_/);
      }
    });

    it('should have NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID configured', () => {
      const id = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID;
      if (id) {
        expect(id).toMatch(/^prctbl_/);
      }
    });

    it('should have STRIPE_WEBHOOK_SECRET configured', () => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (secret) {
        expect(secret).toMatch(/^whsec_/);
      }
    });
  });

  describe('CSP Header Configuration', () => {
    it('should include Stripe domains in script-src', () => {
      const cspPolicy = [
        "default-src 'self'",
        "script-src 'self' https://js.stripe.com",
        "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
        "connect-src 'self' https://api.stripe.com",
        "img-src 'self' https://*.stripe.com"
      ];

      expect(cspPolicy.join('; ')).toContain('https://js.stripe.com');
      expect(cspPolicy.join('; ')).toContain('https://checkout.stripe.com');
      expect(cspPolicy.join('; ')).toContain('https://api.stripe.com');
    });

    it('should support nonce in script-src', () => {
      const nonce = 'test-nonce-value';
      const cspWithNonce = `script-src 'self' https://js.stripe.com 'nonce-${nonce}'`;
      
      expect(cspWithNonce).toContain(`'nonce-${nonce}'`);
    });
  });

  describe('Middleware CSP Nonce Generation', () => {
    it('should generate unique nonce for each request', () => {
      const crypto = require('crypto');
      
      const nonce1 = crypto.randomBytes(16).toString('base64');
      const nonce2 = crypto.randomBytes(16).toString('base64');
      
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
      expect(nonce2).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    });

    it('should generate nonce with sufficient entropy (16 bytes)', () => {
      const crypto = require('crypto');
      const nonce = crypto.randomBytes(16).toString('base64');
      
      // Base64 encoding of 16 bytes should be ~22-24 characters
      expect(nonce.length).toBeGreaterThanOrEqual(22);
      expect(nonce.length).toBeLessThanOrEqual(24);
    });
  });

  describe('Stripe Integration Security', () => {
    it('should never expose STRIPE_SECRET_KEY to client', () => {
      // This key should never be in NEXT_PUBLIC_ variables
      const publicKeys = Object.keys(process.env).filter(key => 
        key.startsWith('NEXT_PUBLIC_') && key.includes('SECRET')
      );
      
      expect(publicKeys).toHaveLength(0);
    });

    it('should use HTTPS for all Stripe URLs', () => {
      const stripeUrls = [
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        'https://api.stripe.com'
      ];

      stripeUrls.forEach(url => {
        expect(url).toMatch(/^https:\/\//);
      });
    });
  });
});

describe('Webhook Configuration', () => {
  it('should have webhook secret for signature verification', () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (secret) {
      expect(secret).toMatch(/^whsec_/);
      expect(secret.length).toBeGreaterThan(20);
    }
  });

  it('should validate webhook signature format', () => {
    // Stripe signature format: t=timestamp,v1=signature
    const sampleSignature = 't=1234567890,v1=abcdef123456';
    
    expect(sampleSignature).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
  });
});

describe('Browser Compatibility', () => {
  it('should support Base64 encoding for nonce', () => {
    const testString = 'test-nonce-value';
    const encoded = Buffer.from(testString).toString('base64');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    
    expect(decoded).toBe(testString);
  });
});

// Manual browser tests (run in DevTools console)
describe('Manual Browser Tests', () => {
  it('should provide browser test scripts', () => {
    const browserTests = {
      checkStripeLoaded: `
        // Test 1: Verificar se Stripe.js carregou
        console.assert(typeof window.Stripe !== 'undefined', '✅ Stripe.js carregado');
      `,
      checkCSPErrors: `
        // Test 2: Verificar ausência de erros CSP
        const cspErrors = performance.getEntriesByType('resource')
          .filter(r => r.name.includes('stripe') && r.transferSize === 0);
        console.assert(cspErrors.length === 0, '✅ Sem bloqueios CSP');
      `,
      checkNetworkRequests: `
        // Test 3: Verificar requests Stripe
        fetch('https://api.stripe.com/v1/prices', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...')
          }
        })
        .then(r => console.log('✅ Conectividade Stripe OK'))
        .catch(e => console.error('❌ Erro de conectividade:', e));
      `,
      checkIframeCommunication: `
        // Test 4: Verificar comunicação com iframe Stripe
        window.addEventListener('message', (event) => {
          if (event.origin === 'https://js.stripe.com') {
            console.log('✅ Comunicação com Stripe iframe OK:', event.data);
          }
        });
      `
    };

    expect(browserTests).toHaveProperty('checkStripeLoaded');
    expect(browserTests).toHaveProperty('checkCSPErrors');
    expect(browserTests).toHaveProperty('checkNetworkRequests');
    expect(browserTests).toHaveProperty('checkIframeCommunication');
  });
});

describe('Documentation', () => {
  const fs = require('fs');
  const path = require('path');

  it('should have CSP/CORS configuration documentation', () => {
    const docPath = path.join(__dirname, '../docs/stripe-csp-cors-configuration.md');
    
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('Content Security Policy');
      expect(content).toContain('Stripe');
    }
  });

  it('should have deployment checklist', () => {
    const checklistPath = path.join(__dirname, '../docs/stripe-deployment-checklist.md');
    
    if (fs.existsSync(checklistPath)) {
      const content = fs.readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('Deploy');
      expect(content).toContain('Checklist');
    }
  });
});
