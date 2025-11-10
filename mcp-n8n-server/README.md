# MCP Server para n8n

Este é um servidor MCP (Model Context Protocol) que permite interagir com o n8n através do Claude Desktop e outras ferramentas compatíveis com MCP.

## 🚀 Funcionalidades

- ✅ Listar workflows do n8n
- ✅ Obter detalhes de workflows específicos
- ✅ Executar workflows com dados personalizados
- ✅ Listar execuções de workflows
- ✅ Obter detalhes de execuções específicas
- ✅ Ativar/Desativar workflows
- ✅ Verificar status do servidor n8n

## 📦 Instalação

```bash
cd mcp-n8n-server
npm install
npm run build
```

## ⚙️ Configuração

1. Copie o arquivo `.env` e configure suas credenciais:

```bash
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=sua_chave_api_aqui
```

2. Se o n8n requer autenticação básica:

```bash
N8N_USERNAME=seu_usuario
N8N_PASSWORD=sua_senha
```

## 🔧 Configurar no Claude Desktop

Adicione ao arquivo `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) ou `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": [
        "/root/svlentes-hero-shop/mcp-n8n-server/dist/index.js"
      ],
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "sua_chave_aqui"
      }
    }
  }
}
```

## 🛠️ Ferramentas Disponíveis

### 1. `n8n_list_workflows`
Lista todos os workflows disponíveis no n8n.

**Exemplo:**
```
Liste todos os workflows do n8n
```

### 2. `n8n_get_workflow`
Obtém detalhes de um workflow específico.

**Parâmetros:**
- `workflow_id`: ID do workflow

**Exemplo:**
```
Mostre detalhes do workflow ID 123
```

### 3. `n8n_execute_workflow`
Executa um workflow com dados opcionais.

**Parâmetros:**
- `workflow_id`: ID do workflow
- `data` (opcional): Dados para passar ao workflow

**Exemplo:**
```
Execute o workflow 123 com os dados {"name": "John", "email": "john@example.com"}
```

### 4. `n8n_get_executions`
Lista execuções de workflows.

**Parâmetros:**
- `workflow_id` (opcional): ID do workflow

**Exemplo:**
```
Liste todas as execuções do workflow 123
```

### 5. `n8n_get_execution`
Obtém detalhes de uma execução específica.

**Parâmetros:**
- `execution_id`: ID da execução

**Exemplo:**
```
Mostre detalhes da execução 456
```

### 6. `n8n_activate_workflow`
Ativa um workflow.

**Parâmetros:**
- `workflow_id`: ID do workflow

**Exemplo:**
```
Ative o workflow 123
```

### 7. `n8n_deactivate_workflow`
Desativa um workflow.

**Parâmetros:**
- `workflow_id`: ID do workflow

**Exemplo:**
```
Desative o workflow 123
```

### 8. `n8n_health_check`
Verifica o status de saúde do servidor n8n.

**Exemplo:**
```
Verifique o status do n8n
```

## 🧪 Testar Conexão

```bash
cd mcp-n8n-server
npm run dev
```

Ou teste diretamente:

```bash
curl http://localhost:5678/healthz
```

## 📝 Notas

- O n8n está rodando no Docker na porta 5678
- O servidor MCP se comunica via stdio (stdin/stdout)
- Certifique-se de que o n8n está acessível em `http://localhost:5678`

## 🔍 Debug

Para ver logs detalhados, execute:

```bash
N8N_BASE_URL=http://localhost:5678 node dist/index.js
```

## 📚 Documentação

- [n8n API Documentation](https://docs.n8n.io/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop MCP](https://claude.ai/docs/desktop/mcp)

## ✅ Status

- ✅ Build: Sucesso
- ✅ n8n: Rodando na porta 5678
- ✅ Health Check: OK
