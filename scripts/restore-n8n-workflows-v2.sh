#!/bin/bash

echo "🔄 Restaurando workflows do n8n (v2)..."
echo ""

DB_PATH="/root/approuter/n8n/data/database.sqlite"

echo "📋 Criando workflow: Deployment Notification"
sqlite3 "$DB_PATH" << 'SQLEOF'
INSERT INTO workflow_entity (
  id,
  name, 
  active, 
  nodes, 
  connections, 
  settings,
  staticData,
  pinData,
  triggerCount,
  versionId,
  meta,
  createdAt,
  updatedAt
) VALUES (
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  'Deployment Notification Workflow',
  1,
  '[{"parameters":{"httpMethod":"POST","path":"staging-deployment","responseMode":"onReceived"},"name":"Webhook - Staging","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"httpMethod":"POST","path":"production-deployment","responseMode":"onReceived"},"name":"Webhook - Production","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,500]}]',
  '{"Webhook - Staging":{"main":[[{"node":"Webhook - Production","type":"main","index":0}]]}}',
  '{}',
  NULL,
  NULL,
  2,
  NULL,
  NULL,
  datetime('now'),
  datetime('now')
);
SQLEOF

echo "📋 Criando workflow: Production Monitoring"  
sqlite3 "$DB_PATH" << 'SQLEOF'
INSERT INTO workflow_entity (
  id,
  name,
  active,
  nodes,
  connections,
  settings,
  staticData,
  pinData,
  triggerCount,
  versionId,
  meta,
  createdAt,
  updatedAt
) VALUES (
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  'Production Monitoring & Alerts',
  1,
  '[{"parameters":{"rule":{"interval":[{"field":"minutes","minutesInterval":5}]}},"name":"Schedule - Every 5 Minutes","type":"n8n-nodes-base.scheduleTrigger","typeVersion":1,"position":[250,300]},{"parameters":{"url":"https://svlentes.shop/api/health-check"},"name":"Health Check","type":"n8n-nodes-base.httpRequest","typeVersion":3,"position":[450,300]}]',
  '{"Schedule - Every 5 Minutes":{"main":[[{"node":"Health Check","type":"main","index":0}]]}}',
  '{}',
  NULL,
  NULL,
  1,
  NULL,
  NULL,
  datetime('now'),
  datetime('now')
);
SQLEOF

echo ""
echo "✅ Workflows inseridos no banco de dados!"
echo ""
echo "📊 Status dos workflows:"
sqlite3 "$DB_PATH" "SELECT substr(id,1,8) as id, name, active, triggerCount FROM workflow_entity;"

echo ""
echo "🔄 Reiniciando container n8n..."
docker restart n8n > /dev/null 2>&1

echo ""
sleep 5

echo "✅ n8n reiniciado!"
echo ""
echo "🌐 Acesse: http://localhost:5678"
echo ""
echo "📝 Próximos passos:"
echo "   1. Acesse a interface do n8n"
echo "   2. Configure credenciais (WhatsApp, PostgreSQL)"
echo "   3. Ative os workflows"
echo "   4. Configure webhooks no GitHub Actions"
