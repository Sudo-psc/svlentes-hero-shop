#!/bin/bash

echo "🔄 Restaurando workflows do n8n..."
echo ""

DB_PATH="/root/approuter/n8n/data/database.sqlite"

echo "📋 Criando workflow: Deployment Notification"
cat > /tmp/deployment.sql << 'SQLEOF'
INSERT INTO workflow_entity (
  name, 
  active, 
  nodes, 
  connections, 
  settings,
  staticData,
  tags,
  triggerCount,
  versionId,
  createdAt,
  updatedAt
) VALUES (
  'Deployment Notification Workflow',
  1,
  '[{"parameters":{"httpMethod":"POST","path":"staging-deployment","responseMode":"onReceived","options":{}},"name":"Webhook - Staging Deployment","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300],"webhookId":"staging-deployment-webhook"},{"parameters":{"httpMethod":"POST","path":"production-deployment","responseMode":"onReceived","options":{}},"name":"Webhook - Production Deployment","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,500],"webhookId":"production-deployment-webhook"}]',
  '{"Webhook - Staging Deployment":{"main":[[{"node":"Check Status - Staging","type":"main","index":0}]]},"Webhook - Production Deployment":{"main":[[{"node":"Check Status - Production","type":"main","index":0}]]}}',
  '{"executionOrder":"v1"}',
  NULL,
  '[]',
  2,
  '1',
  datetime('now'),
  datetime('now')
);
SQLEOF

echo "📋 Criando workflow: Production Monitoring & Alerts"  
cat > /tmp/monitoring.sql << 'SQLEOF'
INSERT INTO workflow_entity (
  name,
  active,
  nodes,
  connections,
  settings,
  staticData,
  tags,
  triggerCount,
  versionId,
  createdAt,
  updatedAt
) VALUES (
  'Production Monitoring & Alerts',
  1,
  '[{"parameters":{"rule":{"interval":[{"field":"minutes","minutesInterval":5}]}},"name":"Schedule - Every 5 Minutes","type":"n8n-nodes-base.scheduleTrigger","typeVersion":1,"position":[250,300]},{"parameters":{"url":"https://svlentes.shop/api/health-check","options":{"timeout":10000}},"name":"Health Check - Production","type":"n8n-nodes-base.httpRequest","typeVersion":3,"position":[450,300]}]',
  '{"Schedule - Every 5 Minutes":{"main":[[{"node":"Health Check - Production","type":"main","index":0}]]}}',
  '{"executionOrder":"v1"}',
  NULL,
  '[]',
  1,
  '1',
  datetime('now'),
  datetime('now')
);
SQLEOF

echo "💾 Inserindo workflows no banco de dados..."
sqlite3 "$DB_PATH" < /tmp/deployment.sql
sqlite3 "$DB_PATH" < /tmp/monitoring.sql

echo ""
echo "✅ Workflows restaurados com sucesso!"
echo ""
echo "📊 Status:"
sqlite3 "$DB_PATH" "SELECT id, name, active, triggerCount FROM workflow_entity;"

echo ""
echo "🔄 Reiniciando container n8n para aplicar mudanças..."
docker restart n8n

sleep 5

echo ""
echo "✅ Restauração completa!"
echo ""
echo "🌐 Acesse: http://localhost:5678"

rm -f /tmp/deployment.sql /tmp/monitoring.sql
