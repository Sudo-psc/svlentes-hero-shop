/**
 * Feature Flags System
 *
 * Sistema robusto de feature flags com:
 * - Cache local com atualização periódica (5 minutos)
 * - Rollout percentual para testes A/B
 * - Targeting por usuário específico
 * - Logs detalhados para auditoria
 * - Suporte a múltiplos ambientes
 */

import { PrismaClient, FeatureFlagStatus, FeatureFlagEnvironment } from '@prisma/client';

// Types
export interface FeatureFlagConfig {
  name: string;
  key: string;
  description: string;
  status?: FeatureFlagStatus;
  rolloutPercentage?: number;
  targetUserIds?: string[];
  targetEnvironments?: FeatureFlagEnvironment[];
  metadata?: Record<string, any>;
  owner?: string;
  tags?: string[];
}

export interface FeatureFlagEvaluationResult {
  enabled: boolean;
  reason: string;
  metadata?: Record<string, any>;
}

export interface FeatureFlagCache {
  flags: Map<string, any>;
  lastUpdated: Date;
}

// Constants
const CACHE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_ENVIRONMENT = process.env.NODE_ENV as FeatureFlagEnvironment || FeatureFlagEnvironment.DEVELOPMENT;

// Global cache instance
const flagCache: FeatureFlagCache = {
  flags: new Map(),
  lastUpdated: new Date(0), // Force initial load
};

// Singleton Prisma instance for feature flags
let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 */
function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Hash function for consistent user bucketing
 * Uses simple hash for rollout percentage calculation
 */
function hashUserIdToBucket(userId: string, flagKey: string): number {
  const combined = `${userId}:${flagKey}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash % 100);
}

/**
 * Refresh feature flags cache from database
 */
async function refreshCache(): Promise<void> {
  const now = new Date();
  const timeSinceLastUpdate = now.getTime() - flagCache.lastUpdated.getTime();

  // Only refresh if cache is stale
  if (timeSinceLastUpdate < CACHE_REFRESH_INTERVAL) {
    return;
  }

  try {
    const client = getPrismaClient();
    const flags = await client.featureFlag.findMany({
      where: {
        status: {
          not: FeatureFlagStatus.ARCHIVED,
        },
      },
    });

    // Update cache
    flagCache.flags.clear();
    flags.forEach(flag => {
      flagCache.flags.set(flag.key, flag);
    });

    flagCache.lastUpdated = now;

    console.log(`[FeatureFlags] Cache refreshed: ${flags.length} flags loaded`);
  } catch (error) {
    console.error('[FeatureFlags] Failed to refresh cache:', error);
    // Keep using stale cache on error
  }
}

/**
 * Get feature flag from cache (with auto-refresh)
 */
async function getFlagFromCache(flagKey: string): Promise<any | null> {
  await refreshCache();
  return flagCache.flags.get(flagKey) || null;
}

/**
 * Log feature flag evaluation
 */
async function logEvaluation(
  flagId: string,
  result: boolean,
  reason: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.featureFlagEvaluation.create({
      data: {
        flagId,
        userId: userId || null,
        result,
        reason,
        environment: DEFAULT_ENVIRONMENT,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    // Log errors but don't fail evaluation
    console.error('[FeatureFlags] Failed to log evaluation:', error);
  }
}

/**
 * Check if feature is enabled for a specific user
 *
 * @param flagKey - Unique key identifying the feature flag
 * @param userId - Optional user ID for targeted rollouts
 * @param options - Additional evaluation options
 * @returns Promise<boolean> - Whether the feature is enabled
 *
 * @example
 * const isEnabled = await isFeatureEnabled('new_checkout_flow', user.id);
 * if (isEnabled) {
 *   // Show new checkout UI
 * }
 */
export async function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  options?: {
    environment?: FeatureFlagEnvironment;
    skipLogging?: boolean;
  }
): Promise<boolean> {
  const result = await evaluateFeatureFlag(flagKey, userId, options);
  return result.enabled;
}

/**
 * Evaluate feature flag with detailed result
 *
 * @param flagKey - Unique key identifying the feature flag
 * @param userId - Optional user ID for targeted rollouts
 * @param options - Additional evaluation options
 * @returns Promise<FeatureFlagEvaluationResult> - Detailed evaluation result
 */
export async function evaluateFeatureFlag(
  flagKey: string,
  userId?: string,
  options?: {
    environment?: FeatureFlagEnvironment;
    skipLogging?: boolean;
  }
): Promise<FeatureFlagEvaluationResult> {
  try {
    const flag = await getFlagFromCache(flagKey);

    // Flag doesn't exist
    if (!flag) {
      const result = {
        enabled: false,
        reason: 'flag_not_found',
        metadata: { flagKey },
      };

      return result;
    }

    // Flag is inactive
    if (flag.status !== FeatureFlagStatus.ACTIVE) {
      const result = {
        enabled: false,
        reason: 'flag_inactive',
        metadata: { status: flag.status },
      };

      if (!options?.skipLogging) {
        await logEvaluation(flag.id, false, result.reason, userId, result.metadata);
      }

      return result;
    }

    // Check environment targeting
    const targetEnv = options?.environment || DEFAULT_ENVIRONMENT;
    const isEnvironmentMatch =
      flag.targetEnvironments.includes(FeatureFlagEnvironment.ALL) ||
      flag.targetEnvironments.includes(targetEnv);

    if (!isEnvironmentMatch) {
      const result = {
        enabled: false,
        reason: 'environment_mismatch',
        metadata: {
          currentEnv: targetEnv,
          targetEnvs: flag.targetEnvironments,
        },
      };

      if (!options?.skipLogging) {
        await logEvaluation(flag.id, false, result.reason, userId, result.metadata);
      }

      return result;
    }

    // Check if user is explicitly targeted
    if (userId && flag.targetUserIds && flag.targetUserIds.length > 0) {
      if (flag.targetUserIds.includes(userId)) {
        const result = {
          enabled: true,
          reason: 'target_user',
          metadata: { userId },
        };

        if (!options?.skipLogging) {
          await logEvaluation(flag.id, true, result.reason, userId, result.metadata);
        }

        return result;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage === 100) {
      const result = {
        enabled: true,
        reason: 'full_rollout',
        metadata: { rolloutPercentage: 100 },
      };

      if (!options?.skipLogging) {
        await logEvaluation(flag.id, true, result.reason, userId, result.metadata);
      }

      return result;
    }

    if (flag.rolloutPercentage === 0) {
      const result = {
        enabled: false,
        reason: 'zero_rollout',
        metadata: { rolloutPercentage: 0 },
      };

      if (!options?.skipLogging) {
        await logEvaluation(flag.id, false, result.reason, userId, result.metadata);
      }

      return result;
    }

    // Percentage-based rollout (requires userId for consistent bucketing)
    if (userId && flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100) {
      const bucket = hashUserIdToBucket(userId, flagKey);
      const enabled = bucket < flag.rolloutPercentage;

      const result = {
        enabled,
        reason: 'percentage_rollout',
        metadata: {
          rolloutPercentage: flag.rolloutPercentage,
          userBucket: bucket,
          userId,
        },
      };

      if (!options?.skipLogging) {
        await logEvaluation(flag.id, enabled, result.reason, userId, result.metadata);
      }

      return result;
    }

    // Default: disabled if no userId provided for percentage rollout
    const result = {
      enabled: false,
      reason: 'no_user_id_for_rollout',
      metadata: {
        rolloutPercentage: flag.rolloutPercentage,
        requiresUserId: true,
      },
    };

    if (!options?.skipLogging) {
      await logEvaluation(flag.id, false, result.reason, userId, result.metadata);
    }

    return result;

  } catch (error) {
    console.error('[FeatureFlags] Evaluation error:', error);

    // Fail closed: disable feature on error
    return {
      enabled: false,
      reason: 'evaluation_error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Create or update a feature flag
 */
export async function upsertFeatureFlag(config: FeatureFlagConfig): Promise<any> {
  const client = getPrismaClient();

  const flag = await client.featureFlag.upsert({
    where: { key: config.key },
    create: {
      name: config.name,
      key: config.key,
      description: config.description,
      status: config.status || FeatureFlagStatus.INACTIVE,
      rolloutPercentage: config.rolloutPercentage || 0,
      targetUserIds: config.targetUserIds || [],
      targetEnvironments: config.targetEnvironments || [FeatureFlagEnvironment.ALL],
      metadata: config.metadata || null,
      owner: config.owner || null,
      tags: config.tags || [],
    },
    update: {
      name: config.name,
      description: config.description,
      status: config.status,
      rolloutPercentage: config.rolloutPercentage,
      targetUserIds: config.targetUserIds,
      targetEnvironments: config.targetEnvironments,
      metadata: config.metadata,
      owner: config.owner,
      tags: config.tags,
    },
  });

  // Invalidate cache
  flagCache.lastUpdated = new Date(0);

  return flag;
}

/**
 * Activate a feature flag
 */
export async function activateFeatureFlag(
  flagKey: string,
  changedBy?: string,
  reason?: string
): Promise<void> {
  const client = getPrismaClient();

  const flag = await client.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    throw new Error(`Feature flag not found: ${flagKey}`);
  }

  await client.featureFlag.update({
    where: { key: flagKey },
    data: {
      status: FeatureFlagStatus.ACTIVE,
      activatedAt: new Date(),
    },
  });

  // Log the change
  await client.featureFlagLog.create({
    data: {
      flagId: flag.id,
      action: 'activated',
      previousValue: { status: flag.status },
      newValue: { status: FeatureFlagStatus.ACTIVE },
      changedBy: changedBy || null,
      reason: reason || null,
    },
  });

  // Invalidate cache
  flagCache.lastUpdated = new Date(0);
}

/**
 * Deactivate a feature flag
 */
export async function deactivateFeatureFlag(
  flagKey: string,
  changedBy?: string,
  reason?: string
): Promise<void> {
  const client = getPrismaClient();

  const flag = await client.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    throw new Error(`Feature flag not found: ${flagKey}`);
  }

  await client.featureFlag.update({
    where: { key: flagKey },
    data: {
      status: FeatureFlagStatus.INACTIVE,
      deactivatedAt: new Date(),
    },
  });

  // Log the change
  await client.featureFlagLog.create({
    data: {
      flagId: flag.id,
      action: 'deactivated',
      previousValue: { status: flag.status },
      newValue: { status: FeatureFlagStatus.INACTIVE },
      changedBy: changedBy || null,
      reason: reason || null,
    },
  });

  // Invalidate cache
  flagCache.lastUpdated = new Date(0);
}

/**
 * Update feature flag rollout percentage
 */
export async function updateRolloutPercentage(
  flagKey: string,
  percentage: number,
  changedBy?: string,
  reason?: string
): Promise<void> {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Rollout percentage must be between 0 and 100');
  }

  const client = getPrismaClient();

  const flag = await client.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    throw new Error(`Feature flag not found: ${flagKey}`);
  }

  await client.featureFlag.update({
    where: { key: flagKey },
    data: {
      rolloutPercentage: percentage,
    },
  });

  // Log the change
  await client.featureFlagLog.create({
    data: {
      flagId: flag.id,
      action: 'updated',
      previousValue: { rolloutPercentage: flag.rolloutPercentage },
      newValue: { rolloutPercentage: percentage },
      changedBy: changedBy || null,
      reason: reason || null,
    },
  });

  // Invalidate cache
  flagCache.lastUpdated = new Date(0);
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<any[]> {
  const client = getPrismaClient();
  return client.featureFlag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          logs: true,
          evaluations: true,
        },
      },
    },
  });
}

/**
 * Get feature flag logs
 */
export async function getFeatureFlagLogs(
  flagKey: string,
  limit: number = 50
): Promise<any[]> {
  const client = getPrismaClient();

  const flag = await client.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    throw new Error(`Feature flag not found: ${flagKey}`);
  }

  return client.featureFlagLog.findMany({
    where: { flagId: flag.id },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get feature flag evaluation statistics
 */
export async function getFeatureFlagStats(
  flagKey: string,
  since?: Date
): Promise<{
  totalEvaluations: number;
  enabledCount: number;
  disabledCount: number;
  enabledPercentage: number;
  reasonBreakdown: Record<string, number>;
}> {
  const client = getPrismaClient();

  const flag = await client.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    throw new Error(`Feature flag not found: ${flagKey}`);
  }

  const whereClause: any = { flagId: flag.id };
  if (since) {
    whereClause.timestamp = { gte: since };
  }

  const evaluations = await client.featureFlagEvaluation.findMany({
    where: whereClause,
  });

  const enabledCount = evaluations.filter(e => e.result).length;
  const disabledCount = evaluations.filter(e => !e.result).length;
  const totalEvaluations = evaluations.length;

  const reasonBreakdown: Record<string, number> = {};
  evaluations.forEach(e => {
    reasonBreakdown[e.reason] = (reasonBreakdown[e.reason] || 0) + 1;
  });

  return {
    totalEvaluations,
    enabledCount,
    disabledCount,
    enabledPercentage: totalEvaluations > 0 ? (enabledCount / totalEvaluations) * 100 : 0,
    reasonBreakdown,
  };
}

/**
 * Clean up old evaluation logs (for maintenance)
 */
export async function cleanupOldEvaluations(daysToKeep: number = 30): Promise<number> {
  const client = getPrismaClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await client.featureFlagEvaluation.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`[FeatureFlags] Cleaned up ${result.count} old evaluations`);
  return result.count;
}
