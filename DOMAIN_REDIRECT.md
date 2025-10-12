# Configuração de Redirecionamento de Domínio

## Objetivo
Redirecionar `svlentes.com.br` e `www.svlentes.com.br` para `https://saraivavision.com.br/lentes`

## Métodos de Configuração

### Método 1: Vercel Dashboard (Recomendado)

Esta é a forma mais eficiente e não requer alterações no código.

1. **Acesse o Vercel Dashboard**
   - Vá para https://vercel.com/dashboard
   - Selecione o projeto `svlentes-hero-shop`

2. **Adicione o Domínio**
   - Clique em **Settings** > **Domains**
   - Adicione `svlentes.com.br` como domínio
   - Configure os registros DNS conforme solicitado

3. **Configure o Redirecionamento**
   - Após adicionar o domínio, clique nas configurações do domínio
   - Ative a opção **"Redirect to"**
   - Insira: `https://saraivavision.com.br/lentes`
   - Marque como **"Permanent"** (301)
   - Salve as alterações

4. **Teste o Redirecionamento**
   - Aguarde a propagação DNS (pode levar até 48h)
   - Acesse `http://svlentes.com.br` e `https://svlentes.com.br`
   - Verifique se ambos redirecionam para `https://saraivavision.com.br/lentes`

### Método 2: Configuração no Código (Backup)

Já foi adicionado no `vercel.json` uma regra de redirecionamento que funciona como backup:

```json
{
  "source": "/:path*",
  "has": [
    {
      "type": "host",
      "value": "svlentes.com.br"
    }
  ],
  "destination": "https://saraivavision.com.br/lentes",
  "permanent": true
}
```

Esta configuração:
- Captura todas as rotas (`/:path*`)
- Verifica se o host é `svlentes.com.br` ou `www.svlentes.com.br`
- Redireciona para `https://saraivavision.com.br/lentes` com status HTTP 301 (permanente)

### Método 3: Configuração no Registrador de Domínio

Se o domínio `svlentes.com.br` ainda não está apontando para o Vercel:

1. **Acesse o painel do seu registrador** (Registro.br, Hostinger, etc.)
2. **Configure os registros DNS**:
   ```
   Tipo: A
   Host: @
   Valor: 76.76.21.21 (IP do Vercel)

   Tipo: CNAME
   Host: www
   Valor: cname.vercel-dns.com
   ```
3. **Aguarde a propagação DNS** (até 48h)

## Verificação

Após configurar, verifique o redirecionamento com:

```bash
# Teste HTTP 301
curl -I http://svlentes.com.br
# Deve retornar: Location: https://saraivavision.com.br/lentes

# Teste HTTPS
curl -I https://svlentes.com.br
# Deve retornar: Location: https://saraivavision.com.br/lentes

# Teste com subdomínio
curl -I https://www.svlentes.com.br
# Deve retornar: Location: https://saraivavision.com.br/lentes
```

## Considerações de SEO

- **301 Redirect**: Permanente, transfere o "link juice" para o novo domínio
- **Canonical URL**: O Google reconhecerá `saraivavision.com.br/lentes` como URL principal
- **Tempo de propagação**: Pode levar algumas semanas para o Google atualizar os índices

## Monitoramento

Monitore o redirecionamento através do:
- **Google Search Console**: Verifique erros de rastreamento
- **Vercel Analytics**: Acompanhe o tráfego redirecionado
- **Logs do Vercel**: Verifique requisições e redirects

## Troubleshooting

### Redirecionamento não funciona
1. Verifique se o domínio está ativo no Vercel Dashboard
2. Confirme se os registros DNS estão corretos
3. Limpe o cache do navegador e tente novamente
4. Aguarde a propagação DNS completa (até 48h)

### Certificado SSL não funciona
1. O Vercel gera certificados SSL automaticamente
2. Aguarde até 24h após adicionar o domínio
3. Verifique se o domínio está validado no Vercel

### Loops de redirecionamento
1. Certifique-se de que `saraivavision.com.br` não está redirecionando de volta
2. Verifique se não há conflitos no `.htaccess` ou outras regras

## Suporte

Para mais informações:
- **Vercel Docs**: https://vercel.com/docs/concepts/projects/domains
- **DNS Checker**: https://dnschecker.org
- **SSL Checker**: https://www.ssllabs.com/ssltest/
