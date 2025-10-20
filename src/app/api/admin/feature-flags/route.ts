import { NextRequest, NextResponse } from 'next/server';
import {
  getAllFeatureFlags,
  upsertFeatureFlag,
  activateFeatureFlag,
  deactivateFeatureFlag,
  updateRolloutPercentage,
  getFeatureFlagLogs,
  getFeatureFlagStats,
} from '@/lib/feature-flags';
import { FeatureFlagStatus, FeatureFlagEnvironment } from '@prisma/client';
/**
 * GET /api/admin/feature-flags
 * List all feature flags
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const flagKey = searchParams.get('flagKey');
    // Get logs for specific flag
    if (action === 'logs' && flagKey) {
      const limit = parseInt(searchParams.get('limit') || '50');
      const logs = await getFeatureFlagLogs(flagKey, limit);
      return NextResponse.json({
        success: true,
        data: logs,
      });
    }
    // Get stats for specific flag
    if (action === 'stats' && flagKey) {
      const since = searchParams.get('since');
      const stats = await getFeatureFlagStats(
        flagKey,
        since ? new Date(since) : undefined
      );
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }
    // Get all flags
    const flags = await getAllFeatureFlags();
    return NextResponse.json({
      success: true,
      data: flags,
    });
  } catch (error) {
    console.error('[FeatureFlags API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch feature flags',
      },
      { status: 500 }
    );
  }
}
/**
 * POST /api/admin/feature-flags
 * Create or update a feature flag
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      key,
      description,
      status,
      rolloutPercentage,
      targetUserIds,
      targetEnvironments,
      metadata,
      owner,
      tags,
    } = body;
    // Validation
    if (!name || !key || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, key, description',
        },
        { status: 400 }
      );
    }
    // Validate rollout percentage
    if (rolloutPercentage !== undefined && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rollout percentage must be between 0 and 100',
        },
        { status: 400 }
      );
    }
    const flag = await upsertFeatureFlag({
      name,
      key,
      description,
      status: status as FeatureFlagStatus || FeatureFlagStatus.INACTIVE,
      rolloutPercentage: rolloutPercentage || 0,
      targetUserIds: targetUserIds || [],
      targetEnvironments: targetEnvironments || [FeatureFlagEnvironment.ALL],
      metadata: metadata || {},
      owner: owner || null,
      tags: tags || [],
    });
    return NextResponse.json({
      success: true,
      data: flag,
      message: 'Feature flag saved successfully',
    });
  } catch (error) {
    console.error('[FeatureFlags API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save feature flag',
      },
      { status: 500 }
    );
  }
}
/**
 * PATCH /api/admin/feature-flags
 * Update specific flag properties (activate, deactivate, rollout)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, flagKey, value, changedBy, reason } = body;
    if (!action || !flagKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: action, flagKey',
        },
        { status: 400 }
      );
    }
    switch (action) {
      case 'activate':
        await activateFeatureFlag(flagKey, changedBy, reason);
        return NextResponse.json({
          success: true,
          message: 'Feature flag activated',
        });
      case 'deactivate':
        await deactivateFeatureFlag(flagKey, changedBy, reason);
        return NextResponse.json({
          success: true,
          message: 'Feature flag deactivated',
        });
      case 'update_rollout':
        if (value === undefined || value < 0 || value > 100) {
          return NextResponse.json(
            {
              success: false,
              error: 'Rollout percentage must be between 0 and 100',
            },
            { status: 400 }
          );
        }
        await updateRolloutPercentage(flagKey, value, changedBy, reason);
        return NextResponse.json({
          success: true,
          message: 'Rollout percentage updated',
        });
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[FeatureFlags API] PATCH error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update feature flag',
      },
      { status: 500 }
    );
  }
}