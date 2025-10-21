'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  rolloutPercentage: number;
  targetUserIds: string[];
  targetEnvironments: string[];
  owner?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  deactivatedAt?: string;
  _count?: {
    logs: number;
    evaluations: number;
  };
}

interface FlagStats {
  totalEvaluations: number;
  enabledCount: number;
  disabledCount: number;
  enabledPercentage: number;
  reasonBreakdown: Record<string, number>;
}

export default function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [flagStats, setFlagStats] = useState<FlagStats | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    rolloutPercentage: 0,
    targetUserIds: '',
    owner: '',
    tags: '',
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feature-flags');
      const result = await response.json();

      if (result.success) {
        setFlags(result.data);
      }
    } catch (error) {
      console.error('Failed to load flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFlagStats = async (flagKey: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-flags?action=stats&flagKey=${flagKey}`
      );
      const result = await response.json();

      if (result.success) {
        setFlagStats(result.data);
        setShowStatsDialog(true);
      }
    } catch (error) {
      console.error('Failed to load flag stats:', error);
    }
  };

  const createFlag = async () => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          key: formData.key,
          description: formData.description,
          rolloutPercentage: formData.rolloutPercentage,
          targetUserIds: formData.targetUserIds
            .split(',')
            .map(id => id.trim())
            .filter(Boolean),
          owner: formData.owner || null,
          tags: formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateDialog(false);
        setFormData({
          name: '',
          key: '',
          description: '',
          rolloutPercentage: 0,
          targetUserIds: '',
          owner: '',
          tags: '',
        });
        await loadFlags();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to create flag:', error);
      alert('Failed to create flag');
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    const newStatus = flag.status === 'ACTIVE' ? 'deactivate' : 'activate';

    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newStatus,
          flagKey: flag.key,
          changedBy: 'admin',
          reason: `Manual ${newStatus} via admin UI`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadFlags();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      alert('Failed to toggle flag');
    }
  };

  const updateRollout = async (flag: FeatureFlag, percentage: number) => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_rollout',
          flagKey: flag.key,
          value: percentage,
          changedBy: 'admin',
          reason: `Rollout updated to ${percentage}% via admin UI`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadFlags();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to update rollout:', error);
      alert('Failed to update rollout');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'INACTIVE':
        return 'bg-gray-500';
      case 'ARCHIVED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="page-shell page-shell--centered page-shell--muted">
        <div className="page-shell-container page-shell-container--narrow">
          <div className="surface-panel text-center">
            <p className="text-sm text-slate-500">Carregando recursos dinâmicos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-shell--emphasis">
      <div className="page-shell-container">
        <div className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-glass-lg backdrop-blur-lg md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Feature Flags</h1>
            <p className="text-sm text-slate-600">Gerencie liberações graduais e experimentos com segurança.</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="rounded-full px-6">
            Create Feature Flag
          </Button>
        </div>

        <div className="grid gap-4">
          {flags.map(flag => (
            <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{flag.name}</CardTitle>
                    <Badge className={getStatusColor(flag.status)}>
                      {flag.status}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {flag.key}
                    </code>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={flag.status === 'ACTIVE' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleFlag(flag)}
                  >
                    {flag.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadFlagStats(flag.key)}
                  >
                    View Stats
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {flag.description}
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Rollout Percentage</Label>
                    <span className="text-sm font-medium">
                      {flag.rolloutPercentage}%
                    </span>
                  </div>
                  <Slider
                    value={[flag.rolloutPercentage]}
                    onValueChange={([value]) => updateRollout(flag, value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Owner</p>
                    <p className="font-medium">{flag.owner || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Environments</p>
                    <div className="flex gap-1 flex-wrap">
                      {flag.targetEnvironments.map(env => (
                        <Badge key={env} variant="outline" className="text-xs">
                          {env}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target Users</p>
                    <p className="font-medium">
                      {flag.targetUserIds.length > 0
                        ? `${flag.targetUserIds.length} users`
                        : 'All users'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Evaluations</p>
                    <p className="font-medium">
                      {flag._count?.evaluations || 0} total
                    </p>
                  </div>
                </div>

                {flag.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex gap-1 flex-wrap">
                      {flag.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Flag Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
            <DialogDescription>
              Add a new feature flag to control functionality rollout
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="New Checkout Flow"
              />
            </div>

            <div>
              <Label htmlFor="key">Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={e =>
                  setFormData({ ...formData, key: e.target.value.toLowerCase() })
                }
                placeholder="new_checkout_flow"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier (lowercase, underscores)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this feature flag controls..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="rolloutPercentage">
                Initial Rollout Percentage: {formData.rolloutPercentage}%
              </Label>
              <Slider
                value={[formData.rolloutPercentage]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, rolloutPercentage: value })
                }
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="targetUserIds">Target User IDs (comma-separated)</Label>
              <Input
                id="targetUserIds"
                value={formData.targetUserIds}
                onChange={e =>
                  setFormData({ ...formData, targetUserIds: e.target.value })
                }
                placeholder="user1,user2,user3"
              />
            </div>

            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={e => setFormData({ ...formData, owner: e.target.value })}
                placeholder="Engineering Team"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="checkout,payment,experimental"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createFlag}>Create Flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Flag Statistics</DialogTitle>
            <DialogDescription>
              Evaluation metrics and performance data
            </DialogDescription>
          </DialogHeader>

          {flagStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Evaluations</p>
                    <p className="text-2xl font-bold">{flagStats.totalEvaluations}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Enabled %</p>
                    <p className="text-2xl font-bold text-green-600">
                      {flagStats.enabledPercentage.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2">Evaluation Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(flagStats.reasonBreakdown).map(([reason, count]) => (
                    <div
                      key={reason}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{reason}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
