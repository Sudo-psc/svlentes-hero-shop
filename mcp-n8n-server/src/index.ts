#!/usr/bin/env node

/**
 * MCP Server for n8n Workflow Automation
 * 
 * This server provides tools to interact with n8n workflows via MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

/**
 * n8n API Client
 */
class N8nClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: N8N_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY }),
      },
    });
  }

  async getWorkflows() {
    const response = await this.client.get('/api/v1/workflows');
    return response.data;
  }

  async getWorkflow(id: string) {
    const response = await this.client.get(`/api/v1/workflows/${id}`);
    return response.data;
  }

  async executeWorkflow(id: string, data?: any) {
    const response = await this.client.post(`/api/v1/workflows/${id}/execute`, data);
    return response.data;
  }

  async getExecutions(workflowId?: string) {
    const url = workflowId 
      ? `/api/v1/executions?workflowId=${workflowId}`
      : '/api/v1/executions';
    const response = await this.client.get(url);
    return response.data;
  }

  async getExecution(id: string) {
    const response = await this.client.get(`/api/v1/executions/${id}`);
    return response.data;
  }

  async createWorkflow(workflow: any) {
    const response = await this.client.post('/api/v1/workflows', workflow);
    return response.data;
  }

  async updateWorkflow(id: string, workflow: any) {
    const response = await this.client.patch(`/api/v1/workflows/${id}`, workflow);
    return response.data;
  }

  async deleteWorkflow(id: string) {
    const response = await this.client.delete(`/api/v1/workflows/${id}`);
    return response.data;
  }

  async activateWorkflow(id: string) {
    const response = await this.client.patch(`/api/v1/workflows/${id}`, { active: true });
    return response.data;
  }

  async deactivateWorkflow(id: string) {
    const response = await this.client.patch(`/api/v1/workflows/${id}`, { active: false });
    return response.data;
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/healthz');
      return response.data;
    } catch (error) {
      return { status: 'error', error: String(error) };
    }
  }
}

/**
 * MCP Server Implementation
 */
class N8nMcpServer {
  private server: Server;
  private n8nClient: N8nClient;

  constructor() {
    this.server = new Server(
      {
        name: 'n8n-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.n8nClient = new N8nClient();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'n8n_list_workflows',
          description: 'Lista todos os workflows disponíveis no n8n',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'n8n_get_workflow',
          description: 'Obtém detalhes de um workflow específico',
          inputSchema: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'ID do workflow',
              },
            },
            required: ['workflow_id'],
          },
        },
        {
          name: 'n8n_execute_workflow',
          description: 'Executa um workflow do n8n com dados opcionais',
          inputSchema: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'ID do workflow a ser executado',
              },
              data: {
                type: 'object',
                description: 'Dados opcionais para passar ao workflow',
              },
            },
            required: ['workflow_id'],
          },
        },
        {
          name: 'n8n_get_executions',
          description: 'Lista execuções de workflows',
          inputSchema: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'ID do workflow (opcional - se não fornecido, lista todas as execuções)',
              },
            },
          },
        },
        {
          name: 'n8n_get_execution',
          description: 'Obtém detalhes de uma execução específica',
          inputSchema: {
            type: 'object',
            properties: {
              execution_id: {
                type: 'string',
                description: 'ID da execução',
              },
            },
            required: ['execution_id'],
          },
        },
        {
          name: 'n8n_activate_workflow',
          description: 'Ativa um workflow',
          inputSchema: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'ID do workflow',
              },
            },
            required: ['workflow_id'],
          },
        },
        {
          name: 'n8n_deactivate_workflow',
          description: 'Desativa um workflow',
          inputSchema: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'ID do workflow',
              },
            },
            required: ['workflow_id'],
          },
        },
        {
          name: 'n8n_health_check',
          description: 'Verifica o status de saúde do servidor n8n',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ];

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'n8n_list_workflows':
            const workflows = await this.n8nClient.getWorkflows();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(workflows, null, 2),
                },
              ],
            };

          case 'n8n_get_workflow':
            if (!args) throw new Error('Arguments required');
            const workflow = await this.n8nClient.getWorkflow(args.workflow_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(workflow, null, 2),
                },
              ],
            };

          case 'n8n_execute_workflow':
            if (!args) throw new Error('Arguments required');
            const execution = await this.n8nClient.executeWorkflow(
              args.workflow_id as string,
              args.data
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(execution, null, 2),
                },
              ],
            };

          case 'n8n_get_executions':
            const executions = await this.n8nClient.getExecutions(args?.workflow_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(executions, null, 2),
                },
              ],
            };

          case 'n8n_get_execution':
            if (!args) throw new Error('Arguments required');
            const executionDetail = await this.n8nClient.getExecution(
              args.execution_id as string
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(executionDetail, null, 2),
                },
              ],
            };

          case 'n8n_activate_workflow':
            if (!args) throw new Error('Arguments required');
            const activated = await this.n8nClient.activateWorkflow(
              args.workflow_id as string
            );
            return {
              content: [
                {
                  type: 'text',
                  text: `Workflow ativado com sucesso: ${JSON.stringify(activated, null, 2)}`,
                },
              ],
            };

          case 'n8n_deactivate_workflow':
            if (!args) throw new Error('Arguments required');
            const deactivated = await this.n8nClient.deactivateWorkflow(
              args.workflow_id as string
            );
            return {
              content: [
                {
                  type: 'text',
                  text: `Workflow desativado com sucesso: ${JSON.stringify(deactivated, null, 2)}`,
                },
              ],
            };

          case 'n8n_health_check':
            const health = await this.n8nClient.healthCheck();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(health, null, 2),
                },
              ],
            };

          default:
            throw new Error(`Tool desconhecido: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('✅ n8n MCP Server rodando...');
  }
}

// Start the server
const server = new N8nMcpServer();
server.run().catch(console.error);
