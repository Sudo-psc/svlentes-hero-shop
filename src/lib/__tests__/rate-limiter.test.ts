/**
 * Rate Limiter Tests
 *
 * Tests for rate limiting functionality
 */

import {
  selectRateLimiter,
  getRateLimitIdentifier,
  formatRetryAfter,
} from '../rate-limiter';

describe('Rate Limiter', () => {
  describe('selectRateLimiter', () => {
    it('should select subscriber rate limiter for /api/assinante/* routes', () => {
      const limiter = selectRateLimiter('/api/assinante/subscription');
      expect(limiter).toBeDefined();
      expect(limiter).not.toBeNull();
    });

    it('should select webhook rate limiter for /api/webhooks/* routes', () => {
      const limiter = selectRateLimiter('/api/webhooks/asaas');
      expect(limiter).toBeDefined();
      expect(limiter).not.toBeNull();
    });

    it('should select payment rate limiter for /api/asaas/* routes', () => {
      const limiter = selectRateLimiter('/api/asaas/create-payment');
      expect(limiter).toBeDefined();
      expect(limiter).not.toBeNull();
    });

    it('should select default rate limiter for other API routes', () => {
      const limiter = selectRateLimiter('/api/health-check');
      expect(limiter).toBeDefined();
      expect(limiter).not.toBeNull();
    });

    it('should return null for non-API routes', () => {
      const limiter = selectRateLimiter('/');
      expect(limiter).toBeNull();
    });
  });

  describe('getRateLimitIdentifier', () => {
    it('should use user ID for subscriber routes when available', () => {
      const identifier = getRateLimitIdentifier(
        '/api/assinante/subscription',
        '192.168.1.1',
        'user123'
      );
      expect(identifier).toBe('user:user123');
    });

    it('should use webhook token for webhook routes when available', () => {
      const identifier = getRateLimitIdentifier(
        '/api/webhooks/asaas',
        '192.168.1.1',
        undefined,
        'webhook-token-123'
      );
      expect(identifier).toBe('webhook:webhook-token-123');
    });

    it('should use IP address when no user ID or webhook token available', () => {
      const identifier = getRateLimitIdentifier(
        '/api/health-check',
        '192.168.1.1'
      );
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should prefer IP over user ID for non-subscriber routes', () => {
      const identifier = getRateLimitIdentifier(
        '/api/health-check',
        '192.168.1.1',
        'user123'
      );
      expect(identifier).toBe('ip:192.168.1.1');
    });
  });

  describe('formatRetryAfter', () => {
    it('should format seconds until reset correctly', () => {
      const resetTimestamp = Date.now() + 60000; // 60 seconds from now
      const retryAfter = formatRetryAfter(resetTimestamp);
      const seconds = parseInt(retryAfter);
      expect(seconds).toBeGreaterThanOrEqual(59);
      expect(seconds).toBeLessThanOrEqual(60);
    });

    it('should return 0 for past timestamps', () => {
      const resetTimestamp = Date.now() - 10000; // 10 seconds ago
      const retryAfter = formatRetryAfter(resetTimestamp);
      expect(retryAfter).toBe('0');
    });

    it('should round up to nearest second', () => {
      const resetTimestamp = Date.now() + 1500; // 1.5 seconds from now
      const retryAfter = formatRetryAfter(resetTimestamp);
      const seconds = parseInt(retryAfter);
      expect(seconds).toBeGreaterThanOrEqual(1);
      expect(seconds).toBeLessThanOrEqual(2);
    });
  });
});
