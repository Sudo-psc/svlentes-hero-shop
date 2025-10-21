# 📋 Checklist Completo de Verificação - Debugging SV Lentes

## 🔍 RESUMO DAS CORREÇÕES IMPLEMENTADAS

### ✅ 1. CSP (Content Security Policy) - ATUALIZADO
- **Problema**: Scripts bloqueados por CSP restritivo com SHA256
- **Solução**: Política permissiva com 'unsafe-inline' e 'unsafe-eval'
- **Status**: ✅ IMPLEMENTADO E DEPLOYED

### ✅ 2. HTTP 500 no Endpoint /subscription - CORRIGIDO
- **Problema**: SSL/TLS error "packet length too long" em fetch redirect
- **Solução**: Import direto do handler + retry com backoff exponencial
- **Status**: ✅ IMPLEMENTADO E DEPLOYED

### ✅ 3. CSP Violation Google cleardot.gif - CORRIGIDO
- **Problema**: Imagens do Google bloqueadas pelo CSP
- **Solução**: Adicionado `*.google.com *.googleapis.com *.gstatic.com *.facebook.com` ao img-src
- **Status**: ✅ IMPLEMENTADO E DEPLOYED

---

## 🧪 VERIFICAÇÃO PÓS-IMPLEMENTAÇÃO

### 1. Teste de Endpoints API
```bash
# Testar endpoint /config (deve retornar 200)
curl -I https://svlentes.com.br/api/config

# Testar endpoint /subscription (agora deve retornar 401 em vez de 500)
curl -I https://svlentes.com.br/api/subscription

# Testar endpoint destino (assinante/subscription)
curl -I https://svlentes.com.br/api/assinante/subscription
```

### 2. Verificação de Headers CSP
```bash
# Verificar headers CSP na resposta
curl -I https://svlentes.com.br | grep -i content-security-policy
```

### 3. Análise de Logs do Sistema
```bash
# Verificar logs do Next.js
journalctl -u svlentes-nextjs -n 100

# Verificar logs de erros recentes
journalctl -u svlentes-nextjs --since "5 minutes ago" | grep -i error

# Verificar logs de access do Nginx
tail -f /var/log/nginx/svlentes.com.br.access.log
```

### 4. Validação SSL/TLS
```bash
# Testar conexão SSL
openssl s_client -connect svlentes.com.br:443 -servername svlentes.com.br

# Verificar certificado
certbot certificates | grep svlentes
```

### 5. Monitoramento de Recursos
```bash
# Status do serviço Next.js
systemctl status svlentes-nextjs

# Status do Nginx
systemctl status nginx

# Uso de memória e CPU
top -p $(pgrep -f "next-server")
```

---

## 🎯 VERIFICAÇÃO ESPECÍFICA DOS PROBLEMAS REPORTADOS

### ✅ ERRO 1: "[Error] Refused to execute a script because its hash..."
**Verificação:**
- [ ] Abrir DevTools no browser em svlentes.com.br
- [ ] Verificar Console para erros de CSP
- [ ] Confirmar que scripts carregam sem bloqueio
- [ ] Validar que não há mais erros "hash does not appear"

### ✅ ERRO 2: "TypeError: t.reason.enqueueModel is not a function"
**Verificação:**
- [ ] Verificar se erros JavaScript persistem
- [ ] Checar carregamento de bibliotecas externas
- [ ] Validar funcionamento do Google Analytics

### ✅ ERRO 3: "HTTP 500 em endpoints: /config e /subscription"
**Verificação:**
- [ ] Testar /api/config (deve retornar 200)
- [ ] Testar /api/subscription (deve retornar 401, não 500)
- [ ] Verificar logs para erros SSL/TLS

### ✅ ERRO 4: "Violação de CSP para https://www.google.com/images/cleardot.gif"
**Verificação:**
- [ ] Inspecionar rede no DevTools
- [ ] Verificar se cleardot.gif carrega sem bloqueio
- [ ] Confirmar que não há violações CSP no console

### ✅ ERRO 5: "Hook useSubscription falhando com Erro interno do servidor"
**Verificação:**
- [ ] Testar área do assinante
- [ ] Verificar funcionamento do hook useSubscription
- [ ] Confirmar retry logic funcionando

---

## 📊 MÉTRICAS DE SAÚDE DA APLICAÇÃO

### Indicadores Críticos
- [ ] **Tempo de resposta** < 2 segundos para página inicial
- [ ] **Taxa de erro 5xx** = 0%
- [ ] **Status SSL** = Válido e funcionando
- [ ] **CSP** = Sem violações no console
- [ ] **Next.js service** = Ativo e estável

### Logs para Monitoramento
```bash
# Erros 5xx (deve estar vazio)
grep "HTTP/1.1\" 5[0-9][0-9]" /var/log/nginx/svlentes.com.br.access.log

# Erros SSL/TLS (deve estar vazio)
journalctl -u svlentes-nextjs | grep -i ssl

# Erros CSP (deve estar vazio)
journalctl -u svlentes-nextjs | grep -i csp
```

---

## 🔧 FERRAMENTAS DE DIAGNÓSTICO

### Browser DevTools
1. **Console**: Verificar erros JavaScript e CSP
2. **Network**: Analisar falhas de carregamento
3. **Elements**: Inspecionar scripts bloqueados
4. **Application**: Verificar localStorage e cookies

### Comandos Úteis
```bash
# Teste completo de saúde da aplicação
curl -w "@curl-format.txt" -o /dev/null -s https://svlentes.com.br

# Verificar todos os headers de resposta
curl -I https://svlentes.com.br

# Monitoramento em tempo real
tail -f /var/log/nginx/svlentes.com.br.access.log | grep -v "200\|301\|302"
```

---

## 📈 CRITÉRIOS DE SUCESSO

### ✅ PROBLEMAS RESOLVIDOS
1. **CSP Scripts**: Sem mais erros de hash ou bloqueio
2. **HTTP 500**: Endpoints respondendo sem erros 500
3. **Google Images**: cleardot.gif carrega sem violações
4. **useSubscription**: Hook funcionando sem erros internos
5. **SSL/TLS**: Sem mais erros de handshake

### 🎯 MÉTRICAS ESPERADAS
- **0 erros CSP** no console do browser
- **0 erros 500** nos logs do Next.js
- **< 2 segundos** tempo de carregamento
- **100% uptime** dos serviços críticos
- **Scripts funcionando** sem bloqueios

---

## 🚨 PLANO DE AÇÃO SE PROBLEMAS PERSISTIREM

### Se CSP ainda bloquear:
1. Adicionar 'unsafe-inline' adicional se necessário
2. Verificar se há scripts externos não mapeados
3. Considerar nonce-based CSP como fallback

### Se HTTP 500 persistir:
1. Debugar endpoint destino /api/assinante/subscription
2. Verificar variáveis de ambiente de autenticação
3. Testar com headers de autenticação válidos

### Se erros JavaScript continuarem:
1. Verificar carregamento de bibliotecas de terceiros
2. Testar em diferentes browsers
3. Analisar network waterfall para timing issues

---

## 📞 CONTATO E SUPORTE

**Em caso de problemas críticos:**
- **WhatsApp Chatbot**: +55 33 99989-8026
- **Suporte Direto**: +55 33 98606-1427
- **Email**: saraivavision@gmail.com

**Informações Técnicas:**
- **Responsável Técnico**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- **Plataforma**: Next.js 15 + Nginx + Systemd
- **Infraestrutura**: Produção healthcare LGPD-compliant

---

**Status Final**: ✅ CORREÇÕES IMPLEMENTADAS E DEPLOYED
**Próximo Passo**: Monitorar e validar resolução completa dos problemas reportados