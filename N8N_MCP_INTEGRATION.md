# ✅ MCP Server n8n - Instalação Completa

## 🎉 Status da Instalação

✅ **MCP Server criado e compilado com sucesso!**
✅ **n8n está rodando no Docker (porta 5678)**
✅ **Interface web acessível em http://localhost:5678**
⚠️ **Próximo passo: Configurar API Key**

## 📁 Estrutura Criada

```
mcp-n8n-server/
├── src/
│   └── index.ts           # Código principal do MCP server
├── dist/
│   └── index.js           # Build compilado ✅
├── package.json           # Dependências
├── tsconfig.json          # Configuração TypeScript
├── .env                   # Configuração (precisa API key)
├── README.md              # Documentação completa
├── SETUP_GUIDE.md         # Guia de setup passo a passo
└── test-connection.sh     # Script de teste ✅
```

## 🚀 Como Usar (3 Passos)

### Passo 1: Gerar API Key no n8n

1. Abra o navegador em: **http://localhost:5678**
2. Faça login no n8n (se já tiver conta) ou crie uma conta
3. Vá em: **Settings** → **API** → **Create API Key**
4. Copie a chave gerada (começa com `n8n_api_`)

### Passo 2: Configurar API Key

```bash
cd /root/svlentes-hero-shop/mcp-n8n-server
nano .env
```

Adicione a chave:
```bash
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=cole_sua_chave_aqui
```

### Passo 3: Testar Conexão

```bash
./test-connection.sh
```

Você deve ver: **✅ API Key válida e funcionando!**

## 🔌 Integrar com Claude Desktop

### MacOS / Linux

Edite o arquivo de configuração:
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

Adicione:
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
        "N8N_API_KEY": "sua_chave_api_aqui"
      }
    }
  }
}
```

### Windows

Edite:
```
%APPDATA%\Claude\claude_desktop_config.json
```

Use o mesmo JSON acima.

## 🛠️ Ferramentas Disponíveis via MCP

Após configurar, você pode usar o Claude Desktop com comandos naturais:

### 1. Listar Workflows
```
Liste todos os workflows do n8n
```
```
Quais workflows estão disponíveis?
```

### 2. Executar Workflow
```
Execute o workflow com ID 123
```
```
Rode o workflow "Enviar Email" com os dados {"to": "user@email.com"}
```

### 3. Ver Execuções
```
Mostre as últimas execuções do workflow 123
```
```
Liste todas as execuções recentes
```

### 4. Gerenciar Workflows
```
Ative o workflow 123
```
```
Desative o workflow "Test Automation"
```

### 5. Status do Sistema
```
Verifique o status do n8n
```
```
O n8n está funcionando?
```

## 📊 Exemplo de Uso

**Você:** Liste todos os workflows

**Claude com MCP:**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Email Automation",
      "active": true,
      "nodes": 5
    },
    {
      "id": "2", 
      "name": "WhatsApp Integration",
      "active": false,
      "nodes": 3
    }
  ]
}
```

**Você:** Execute o workflow 1 com os dados {"name": "John"}

**Claude com MCP:**
```json
{
  "executionId": "abc123",
  "status": "success",
  "data": {
    "result": "Email sent successfully"
  }
}
```

## 🧪 Testes Manuais

### Teste 1: Health Check
```bash
curl http://localhost:5678/healthz
```
Esperado: `{"status":"ok"}`

### Teste 2: Listar Workflows (com API Key)
```bash
curl -H "X-N8N-API-KEY: sua_chave" \
  http://localhost:5678/api/v1/workflows
```

### Teste 3: MCP Server Direto
```bash
cd /root/svlentes-hero-shop/mcp-n8n-server
npm run dev
```

## 🐛 Troubleshooting

### Problema: "X-N8N-API-KEY header required"
**Solução:** Configure a API key no arquivo `.env`

### Problema: "Connection refused"
**Solução:** 
```bash
docker ps | grep n8n  # Verifique se está rodando
docker restart n8n    # Reinicie se necessário
```

### Problema: MCP não aparece no Claude
**Solução:**
1. Verifique o caminho absoluto no config
2. Reinicie o Claude Desktop completamente
3. Verifique logs: `cat ~/Library/Logs/Claude/mcp*.log`

### Problema: Build falha
**Solução:**
```bash
cd /root/svlentes-hero-shop/mcp-n8n-server
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Recursos Úteis

- **n8n Local:** http://localhost:5678
- **n8n API Docs:** https://docs.n8n.io/api/
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Claude Desktop:** https://claude.ai/desktop

## 🔐 Segurança

⚠️ **Importante:**
- Nunca compartilhe sua API key
- Não commite o arquivo `.env` no Git
- Use variáveis de ambiente em produção
- Considere usar autenticação OAuth para produção

## 📦 Comandos Úteis

```bash
# Testar conexão
./test-connection.sh

# Rebuild
npm run build

# Ver logs do n8n
docker logs n8n --tail 50 -f

# Reiniciar n8n
docker restart n8n

# Acessar container n8n
docker exec -it n8n sh
```

## ✅ Checklist Final

- [x] n8n rodando no Docker ✅
- [x] MCP Server compilado ✅
- [x] Interface web acessível ✅
- [ ] API Key gerada no n8n
- [ ] API Key configurada no .env
- [ ] Testado com `./test-connection.sh`
- [ ] Configurado no Claude Desktop
- [ ] Claude Desktop reiniciado
- [ ] Testado comandos via Claude

## 🎯 Próxima Ação

**Acesse http://localhost:5678 agora para gerar sua API Key!**

Depois de gerar:
1. Cole no arquivo `.env`
2. Execute `./test-connection.sh`
3. Configure no Claude Desktop
4. Reinicie o Claude
5. Comece a usar!

---

**Criado em:** 2025-11-09
**Localização:** `/root/svlentes-hero-shop/mcp-n8n-server`
**Status:** ✅ Pronto para uso (aguardando API Key)
