# Guia de Configuração - MCP Server n8n

## ✅ Status Atual

- ✅ MCP Server compilado com sucesso
- ✅ n8n rodando no Docker (porta 5678)
- ⚠️ API Key necessária para autenticação

## 📋 Próximos Passos

### 1. Gerar API Key do n8n

Acesse a interface do n8n e gere uma API key:

**Opção A: Via Interface Web**
1. Abra http://localhost:5678 no navegador
2. Faça login no n8n
3. Vá em: Settings → API → Create API Key
4. Copie a chave gerada

**Opção B: Via Docker (se configurado)**
```bash
docker exec -it n8n n8n user:create --email=admin@svlentes.com --password=Admin123!
```

### 2. Configurar a API Key

Edite o arquivo `.env`:

```bash
cd /root/svlentes-hero-shop/mcp-n8n-server
nano .env
```

Adicione:
```
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=sua_chave_api_aqui
```

### 3. Testar Conexão

```bash
# Teste simples de health check
curl http://localhost:5678/healthz

# Teste com API key (substitua SUA_KEY)
curl -H "X-N8N-API-KEY: SUA_KEY" http://localhost:5678/api/v1/workflows
```

### 4. Integrar com Claude Desktop

**Para MacOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Para Linux:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

**Para Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Adicione esta configuração:**
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
        "N8N_API_KEY": "cole_sua_chave_aqui"
      }
    }
  }
}
```

### 5. Reiniciar Claude Desktop

Feche completamente o Claude Desktop e abra novamente para carregar o MCP server.

## 🧪 Como Testar

Após configurar, você pode usar o Claude Desktop com comandos como:

```
Liste todos os workflows do n8n
```

```
Execute o workflow com ID 123
```

```
Verifique o status do n8n
```

## 🔧 Alternativa: Usar sem API Key (Desenvolvimento)

Se você tem acesso ao Docker, pode desabilitar a autenticação temporariamente:

```bash
docker exec -it n8n sh -c "echo 'N8N_DISABLE_PRODUCTION_MAIN_PROCESS=true' >> .env"
docker restart n8n
```

⚠️ **Atenção:** Não recomendado para produção!

## 📊 Estrutura de Dados

### Exemplo de resposta ao listar workflows:

```json
{
  "data": [
    {
      "id": "1",
      "name": "Meu Workflow",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

### Exemplo de executar workflow:

```json
{
  "data": {
    "executionId": "abc123",
    "status": "success"
  }
}
```

## 🐛 Troubleshooting

### Erro: "X-N8N-API-KEY header required"
- Verifique se a API key está configurada no .env
- Certifique-se de que a key é válida

### Erro: "Connection refused"
- Verifique se o n8n está rodando: `docker ps | grep n8n`
- Verifique a porta: `curl http://localhost:5678/healthz`

### MCP não aparece no Claude
- Verifique o caminho do arquivo no config
- Reinicie o Claude Desktop completamente
- Verifique os logs: `cat ~/Library/Logs/Claude/mcp*.log`

## 📚 Recursos

- [n8n Documentation](https://docs.n8n.io)
- [n8n API Reference](https://docs.n8n.io/api/)
- [MCP Documentation](https://modelcontextprotocol.io)

## ✅ Checklist de Instalação

- [x] n8n instalado e rodando
- [x] MCP server compilado
- [ ] API key gerada no n8n
- [ ] API key configurada no .env
- [ ] Testado conexão com curl
- [ ] Configurado no Claude Desktop
- [ ] Claude Desktop reiniciado
- [ ] Testado comandos via Claude

---

**Próximo passo:** Gerar API key no n8n em http://localhost:5678
