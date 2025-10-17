# n8n Workflow Automation Templates

This directory contains n8n workflow templates for CI/CD automation and production monitoring.

## Workflows

### 1. deployment-notification.json
**Purpose**: Automated deployment notifications and logging

**Triggers:**
- Webhook from GitHub Actions staging deployment
- Webhook from GitHub Actions production deployment

**Actions:**
- Check deployment status (success/failure)
- Send WhatsApp notifications to operations team
- Verify post-deployment health checks
- Log deployment history to PostgreSQL database

**Setup:**
1. Import workflow into n8n
2. Note the webhook URLs generated
3. Add webhook URLs to GitHub Actions secrets:
   - `N8N_WEBHOOK_URL` - Base URL for n8n instance
4. Configure WhatsApp integration (phone: 553399898026)
5. Set up PostgreSQL connection for deployment logging

### 2. monitoring-alerts.json
**Purpose**: Continuous production monitoring and alerting

**Schedule**: Runs every 5 minutes

**Monitors:**
- `/api/health-check` - Application health status
- `/api/monitoring/performance` - Response time metrics
- `/api/monitoring/errors` - Error count tracking

**Alert Thresholds:**
- Health check failure → Critical alert
- Response time > 3000ms → Performance warning
- Error count > 10 → High error alert

**Actions:**
- WhatsApp alerts to operations team
- Metrics logging to PostgreSQL
- Automated incident tracking

**Setup:**
1. Import workflow into n8n
2. Configure schedule trigger (default: 5 minutes)
3. Set up WhatsApp integration
4. Configure PostgreSQL connection
5. Adjust thresholds based on SLAs

## Database Schema

### deployment_log
```sql
CREATE TABLE deployment_log (
  id SERIAL PRIMARY KEY,
  environment VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  commit VARCHAR(100),
  actor VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### monitoring_log
```sql
CREATE TABLE monitoring_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  health_status INTEGER,
  response_time INTEGER,
  error_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### WhatsApp Integration
- Operations phone: +55 33 99898-026
- Update phone number in workflow nodes if needed
- Requires WhatsApp Business API access

### PostgreSQL Connection
- Host: localhost (within Docker network)
- Database: n8ndb
- User: n8nuser
- Connection configured in n8n credentials

### GitHub Actions Integration
Workflows receive webhooks from:
- `/.github/workflows/deploy-staging.yml`
- `/.github/workflows/deploy-production.yml`

## Webhook URLs
After importing workflows, copy webhook URLs and add to GitHub secrets:

```bash
# Example webhook URLs (replace with actual)
https://saraivavision-n8n.cloud/webhook/staging-deployment
https://saraivavision-n8n.cloud/webhook/production-deployment
```

## Testing

### Test Deployment Notification
```bash
curl -X POST https://saraivavision-n8n.cloud/webhook/staging-deployment \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "environment": "staging",
    "commit": "abc123",
    "actor": "developer",
    "timestamp": "2025-01-17T00:00:00Z",
    "url": "https://staging.svlentes.shop"
  }'
```

### Test Monitoring (Manual Trigger)
1. Open n8n workflow editor
2. Select "monitoring-alerts.json" workflow
3. Click "Execute Workflow" button
4. Verify alerts triggered correctly

## Maintenance

### Monitoring Logs Cleanup
```sql
-- Keep only last 30 days of monitoring logs
DELETE FROM monitoring_log WHERE timestamp < NOW() - INTERVAL '30 days';

-- Keep only last 90 days of deployment logs
DELETE FROM deployment_log WHERE timestamp < NOW() - INTERVAL '90 days';
```

### Alert Threshold Tuning
Adjust thresholds in workflow nodes based on:
- Historical performance metrics
- SLA requirements
- Alert fatigue considerations

## Troubleshooting

**Webhooks Not Triggering:**
- Verify webhook URLs in GitHub secrets
- Check n8n workflow is active (not paused)
- Review n8n execution logs

**Alerts Not Sending:**
- Verify WhatsApp integration configuration
- Check phone number format
- Review n8n credentials

**Database Connection Errors:**
- Verify PostgreSQL container is running
- Check n8n database credentials
- Ensure database schema exists
