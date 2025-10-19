/**
 * Feature Flags System - Unit Tests
 *
 * Tests cover:
 * - Flag evaluation logic
 * - Rollout percentage calculation
 * - User targeting
 * - Environment targeting
 * - Cache functionality
 * - Logging and audit trail
 */

import {
  isFeatureEnabled,
  evaluateFeatureFlag,
  upsertFeatureFlag,
  activateFeatureFlag,
  deactivateFeatureFlag,
  updateRolloutPercentage,
  getFeatureFlagStats,
} from '../feature-flags';
import { PrismaClient, FeatureFlagStatus, FeatureFlagEnvironment } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    featureFlag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    featureFlagLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    featureFlagEvaluation: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    FeatureFlagStatus: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      ARCHIVED: 'ARCHIVED',
    },
    FeatureFlagEnvironment: {
      DEVELOPMENT: 'DEVELOPMENT',
      STAGING: 'STAGING',
      PRODUCTION: 'PRODUCTION',
      ALL: 'ALL',
    },
  };
});

describe('Feature Flags System', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('isFeatureEnabled', () => {
    it('should return false for non-existent flag', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([]);

      const result = await isFeatureEnabled('non_existent_flag');

      expect(result).toBe(false);
    });

    it('should return false for inactive flag', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.INACTIVE,
          rolloutPercentage: 100,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
        },
      ]);

      const result = await isFeatureEnabled('test_flag');

      expect(result).toBe(false);
    });

    it('should return true for active flag with 100% rollout', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 100,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: [],
        },
      ]);

      const result = await isFeatureEnabled('test_flag');

      expect(result).toBe(true);
    });

    it('should return false for active flag with 0% rollout', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 0,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: [],
        },
      ]);

      const result = await isFeatureEnabled('test_flag');

      expect(result).toBe(false);
    });

    it('should return true for targeted user', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 0,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: ['user-123', 'user-456'],
        },
      ]);

      const result = await isFeatureEnabled('test_flag', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false for non-targeted user with 0% rollout', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 0,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: ['user-456'],
        },
      ]);

      const result = await isFeatureEnabled('test_flag', 'user-123');

      expect(result).toBe(false);
    });

    it('should handle percentage-based rollout consistently', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 50,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: [],
        },
      ]);

      // Same user should always get same result
      const result1 = await isFeatureEnabled('test_flag', 'consistent-user');
      const result2 = await isFeatureEnabled('test_flag', 'consistent-user');

      expect(result1).toBe(result2);
    });

    it('should respect environment targeting', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 100,
          targetEnvironments: [FeatureFlagEnvironment.PRODUCTION],
          targetUserIds: [],
        },
      ]);

      const resultDev = await isFeatureEnabled('test_flag', undefined, {
        environment: FeatureFlagEnvironment.DEVELOPMENT,
      });

      const resultProd = await isFeatureEnabled('test_flag', undefined, {
        environment: FeatureFlagEnvironment.PRODUCTION,
      });

      expect(resultDev).toBe(false);
      expect(resultProd).toBe(true);
    });
  });

  describe('evaluateFeatureFlag', () => {
    it('should return detailed evaluation result', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 100,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: [],
        },
      ]);

      const result = await evaluateFeatureFlag('test_flag');

      expect(result).toMatchObject({
        enabled: true,
        reason: 'full_rollout',
        metadata: expect.objectContaining({
          rolloutPercentage: 100,
        }),
      });
    });

    it('should log evaluation by default', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 100,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: [],
        },
      ]);

      await evaluateFeatureFlag('test_flag', 'user-123');

      expect(prisma.featureFlagEvaluation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            flagId: 'flag-1',
            userId: 'user-123',
            result: true,
            reason: 'full_rollout',
          }),
        })
      );
    });

    it('should skip logging when requested', async () => {
      prisma.featureFlag.findMany.mockResolvedValue([
        {
          id: 'flag-1',
          key: 'test_flag',
          name: 'Test Flag',
          status: FeatureFlagStatus.ACTIVE,
          rolloutPercentage: 100,
          targetEnvironments: [FeatureFlagEnvironment.ALL],
          targetUserIds: [],
        },
      ]);

      await evaluateFeatureFlag('test_flag', 'user-123', { skipLogging: true });

      expect(prisma.featureFlagEvaluation.create).not.toHaveBeenCalled();
    });
  });

  describe('upsertFeatureFlag', () => {
    it('should create new flag', async () => {
      const mockFlag = {
        id: 'flag-1',
        key: 'new_flag',
        name: 'New Flag',
        description: 'A new feature flag',
        status: FeatureFlagStatus.INACTIVE,
        rolloutPercentage: 0,
      };

      prisma.featureFlag.upsert.mockResolvedValue(mockFlag);

      const result = await upsertFeatureFlag({
        name: 'New Flag',
        key: 'new_flag',
        description: 'A new feature flag',
      });

      expect(result).toMatchObject(mockFlag);
      expect(prisma.featureFlag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'new_flag' },
          create: expect.objectContaining({
            name: 'New Flag',
            key: 'new_flag',
            description: 'A new feature flag',
          }),
        })
      );
    });

    it('should update existing flag', async () => {
      const mockFlag = {
        id: 'flag-1',
        key: 'existing_flag',
        name: 'Updated Flag',
        description: 'Updated description',
      };

      prisma.featureFlag.upsert.mockResolvedValue(mockFlag);

      await upsertFeatureFlag({
        name: 'Updated Flag',
        key: 'existing_flag',
        description: 'Updated description',
        rolloutPercentage: 50,
      });

      expect(prisma.featureFlag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'existing_flag' },
          update: expect.objectContaining({
            name: 'Updated Flag',
            description: 'Updated description',
            rolloutPercentage: 50,
          }),
        })
      );
    });
  });

  describe('activateFeatureFlag', () => {
    it('should activate flag and create log', async () => {
      prisma.featureFlag.findUnique.mockResolvedValue({
        id: 'flag-1',
        key: 'test_flag',
        status: FeatureFlagStatus.INACTIVE,
      });

      await activateFeatureFlag('test_flag', 'admin@example.com', 'Enabling feature');

      expect(prisma.featureFlag.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'test_flag' },
          data: expect.objectContaining({
            status: FeatureFlagStatus.ACTIVE,
            activatedAt: expect.any(Date),
          }),
        })
      );

      expect(prisma.featureFlagLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            flagId: 'flag-1',
            action: 'activated',
            changedBy: 'admin@example.com',
            reason: 'Enabling feature',
          }),
        })
      );
    });

    it('should throw error for non-existent flag', async () => {
      prisma.featureFlag.findUnique.mockResolvedValue(null);

      await expect(activateFeatureFlag('non_existent')).rejects.toThrow(
        'Feature flag not found: non_existent'
      );
    });
  });

  describe('updateRolloutPercentage', () => {
    it('should update rollout percentage', async () => {
      prisma.featureFlag.findUnique.mockResolvedValue({
        id: 'flag-1',
        key: 'test_flag',
        rolloutPercentage: 0,
      });

      await updateRolloutPercentage('test_flag', 50, 'admin', 'Gradual rollout');

      expect(prisma.featureFlag.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'test_flag' },
          data: { rolloutPercentage: 50 },
        })
      );

      expect(prisma.featureFlagLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'updated',
            previousValue: { rolloutPercentage: 0 },
            newValue: { rolloutPercentage: 50 },
          }),
        })
      );
    });

    it('should reject invalid percentage', async () => {
      await expect(updateRolloutPercentage('test_flag', -10)).rejects.toThrow(
        'Rollout percentage must be between 0 and 100'
      );

      await expect(updateRolloutPercentage('test_flag', 150)).rejects.toThrow(
        'Rollout percentage must be between 0 and 100'
      );
    });
  });

  describe('getFeatureFlagStats', () => {
    it('should calculate statistics correctly', async () => {
      prisma.featureFlag.findUnique.mockResolvedValue({
        id: 'flag-1',
        key: 'test_flag',
      });

      prisma.featureFlagEvaluation.findMany.mockResolvedValue([
        { result: true, reason: 'full_rollout' },
        { result: true, reason: 'full_rollout' },
        { result: false, reason: 'inactive' },
        { result: true, reason: 'target_user' },
      ]);

      const stats = await getFeatureFlagStats('test_flag');

      expect(stats).toMatchObject({
        totalEvaluations: 4,
        enabledCount: 3,
        disabledCount: 1,
        enabledPercentage: 75,
        reasonBreakdown: {
          full_rollout: 2,
          inactive: 1,
          target_user: 1,
        },
      });
    });
  });
});
