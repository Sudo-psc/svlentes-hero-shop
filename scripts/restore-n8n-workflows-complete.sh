#!/bin/bash

echo "🔄 Restaurando workflows completos do n8n..."
echo ""

DB_PATH="/root/approuter/n8n/data/database.sqlite"

# Deletar workflows existentes (exceto "My workflow" do usuário)
echo "🗑️  Removendo workflows antigos..."
sqlite3 "$DB_PATH" "DELETE FROM workflow_entity WHERE name IN ('Deployment Notification Workflow', 'Production Monitoring & Alerts');"

echo "📋 Criando workflow completo: Deployment Notification"
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
  '[
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "staging-deployment",
        "responseMode": "onReceived",
        "options": {}
      },
      "name": "Webhook - Staging Deployment",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "staging-deployment-webhook"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "production-deployment",
        "responseMode": "onReceived",
        "options": {}
      },
      "name": "Webhook - Production Deployment",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 500],
      "webhookId": "production-deployment-webhook"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json[\"status\"]}}",
              "operation": "equals",
              "value2": "success"
            }
          ]
        }
      },
      "name": "Check Status - Staging",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json[\"status\"]}}",
              "operation": "equals",
              "value2": "success"
            }
          ]
        }
      },
      "name": "Check Status - Production",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 500]
    },
    {
      "parameters": {
        "url": "https://api.whatsapp.com/send",
        "options": {
          "bodyParametersUi": {
            "parameter": [
              {
                "name": "phone",
                "value": "553399898026"
              },
              {
                "name": "text",
                "value": "✅ Deployment SUCCESS\n\nEnvironment: {{$json[\"environment\"]}}\nCommit: {{$json[\"commit\"]}}\nActor: {{$json[\"actor\"]}}\nTimestamp: {{$json[\"timestamp\"]}}"
              }
            ]
          }
        }
      },
      "name": "WhatsApp Success Notification",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [650, 250]
    },
    {
      "parameters": {
        "url": "https://api.whatsapp.com/send",
        "options": {
          "bodyParametersUi": {
            "parameter": [
              {
                "name": "phone",
                "value": "553399898026"
              },
              {
                "name": "text",
                "value": "⚠️ Deployment FAILED\n\nEnvironment: {{$json[\"environment\"]}}\nCommit: {{$json[\"commit\"]}}\nActor: {{$json[\"actor\"]}}\nError: {{$json[\"error\"]}}\n\nAction Required!"
              }
            ]
          }
        }
      },
      "name": "WhatsApp Failure Notification",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [650, 450]
    },
    {
      "parameters": {
        "url": "={{$json[\"url\"]}}/api/health-check",
        "options": {
          "timeout": 10000
        }
      },
      "name": "Health Check After Deployment",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [850, 250]
    }
  ]',
  '{
    "Webhook - Staging Deployment": {
      "main": [
        [
          {
            "node": "Check Status - Staging",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Webhook - Production Deployment": {
      "main": [
        [
          {
            "node": "Check Status - Production",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Status - Staging": {
      "main": [
        [
          {
            "node": "WhatsApp Success Notification",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "WhatsApp Failure Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Status - Production": {
      "main": [
        [
          {
            "node": "WhatsApp Success Notification",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "WhatsApp Failure Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "WhatsApp Success Notification": {
      "main": [
        [
          {
            "node": "Health Check After Deployment",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }',
  '{"executionOrder":"v1"}',
  NULL,
  NULL,
  2,
  NULL,
  NULL,
  datetime('now'),
  datetime('now')
);
SQLEOF

echo "📋 Criando workflow completo: Production Monitoring"  
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
  '[
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "name": "Schedule - Every 5 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "https://svlentes.shop/api/health-check",
        "options": {
          "timeout": 10000
        }
      },
      "name": "Health Check - Production",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "https://svlentes.shop/api/monitoring/performance",
        "options": {
          "timeout": 10000
        }
      },
      "name": "Performance Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 450]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json[\"responseCode\"]}}",
              "operation": "notEqual",
              "value2": 200
            }
          ]
        }
      },
      "name": "Check Health Status",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json[\"responseTime\"]}}",
              "operation": "larger",
              "value2": 3000
            }
          ]
        }
      },
      "name": "Check Response Time",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 450]
    },
    {
      "parameters": {
        "url": "https://api.whatsapp.com/send",
        "options": {
          "bodyParametersUi": {
            "parameter": [
              {
                "name": "phone",
                "value": "553399898026"
              },
              {
                "name": "text",
                "value": "🚨 CRITICAL ALERT\n\nProduction health check FAILED\nURL: https://svlentes.shop\nStatus: {{$json[\"responseCode\"]}}\n\nImmediate action required!"
              }
            ]
          }
        }
      },
      "name": "Alert - Health Check Failed",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [850, 250]
    },
    {
      "parameters": {
        "url": "https://api.whatsapp.com/send",
        "options": {
          "bodyParametersUi": {
            "parameter": [
              {
                "name": "phone",
                "value": "553399898026"
              },
              {
                "name": "text",
                "value": "⚠️ PERFORMANCE ALERT\n\nSlow response time detected\nCurrent: {{$json[\"responseTime\"]}}ms\nThreshold: 3000ms\n\nCheck server resources"
              }
            ]
          }
        }
      },
      "name": "Alert - Slow Performance",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [850, 400]
    }
  ]',
  '{
    "Schedule - Every 5 Minutes": {
      "main": [
        [
          {
            "node": "Health Check - Production",
            "type": "main",
            "index": 0
          },
          {
            "node": "Performance Metrics",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Health Check - Production": {
      "main": [
        [
          {
            "node": "Check Health Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Performance Metrics": {
      "main": [
        [
          {
            "node": "Check Response Time",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Health Status": {
      "main": [
        [
          {
            "node": "Alert - Health Check Failed",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
    "Check Response Time": {
      "main": [
        [
          {
            "node": "Alert - Slow Performance",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    }
  }',
  '{"executionOrder":"v1"}',
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
echo "✅ Workflows completos inseridos no banco de dados!"
echo ""
echo "📊 Status dos workflows:"
sqlite3 "$DB_PATH" "SELECT substr(id,1,8) as id, name, active, triggerCount FROM workflow_entity WHERE name != 'My workflow';"

echo ""
echo "🔄 Reiniciando container n8n para ativar workflows..."
docker restart n8n > /dev/null 2>&1

sleep 8

echo ""
echo "✅ n8n reiniciado!"
echo ""
echo "🌐 Acesse: https://saraivavision-n8n.cloud"
echo ""
echo "📝 Workflows disponíveis:"
echo "   1. Deployment Notification Workflow (7 nodes completos)"
echo "   2. Production Monitoring & Alerts (7 nodes completos)"
