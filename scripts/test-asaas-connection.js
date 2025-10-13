#!/usr/bin/env node

/**
 * Script de Teste de Conexão com API Asaas
 *
 * Este script testa a conexão com a API do Asaas usando as credenciais configuradas.
 *
 * Uso:
 *   node scripts/test-asaas-connection.js
 */

const fs = require('fs')
const path = require('path')

// Carregar .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      if (key && value) {
        process.env[key] = value
      }
    }
  })
}

const ASAAS_ENV = process.env.ASAAS_ENV || 'sandbox'
const API_KEY = ASAAS_ENV === 'production'
  ? process.env.ASAAS_API_KEY_PROD
  : process.env.ASAAS_API_KEY_SANDBOX

const BASE_URL = ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

console.log('🔍 Testando Conexão com API Asaas\n')
console.log(`Ambiente: ${ASAAS_ENV}`)
console.log(`Base URL: ${BASE_URL}`)
console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`)
console.log('')

if (!API_KEY) {
  console.error('❌ ERRO: API Key não configurada!')
  console.error(`   Configure a variável ASAAS_API_KEY_${ASAAS_ENV === 'production' ? 'PROD' : 'SANDBOX'} no .env.local`)
  process.exit(1)
}

async function testConnection() {
  try {
    console.log('📡 Fazendo requisição de teste...\n')

    const response = await fetch(`${BASE_URL}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': API_KEY,
        'User-Agent': 'SVLentes/1.0.0'
      }
    })

    console.log(`Status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const error = await response.json()
      console.error('\n❌ ERRO na API:')
      console.error(JSON.stringify(error, null, 2))
      process.exit(1)
    }

    const data = await response.json()

    console.log('\n✅ CONEXÃO ESTABELECIDA COM SUCESSO!')
    console.log('\n📊 Informações da Conta:')
    console.log(`   Total de clientes: ${data.totalCount || 0}`)
    console.log(`   Clientes retornados: ${data.data?.length || 0}`)

    if (data.data && data.data.length > 0) {
      console.log('\n👤 Primeiro cliente (exemplo):')
      const customer = data.data[0]
      console.log(`   ID: ${customer.id}`)
      console.log(`   Nome: ${customer.name}`)
      console.log(`   Email: ${customer.email}`)
      console.log(`   CPF/CNPJ: ${customer.cpfCnpj || 'N/A'}`)
    }

    console.log('\n✅ Teste concluído com sucesso!')
    console.log('🎉 A API Asaas está configurada e funcionando corretamente.\n')

  } catch (error) {
    console.error('\n❌ ERRO ao conectar com API:')
    console.error(error.message)
    console.error('\nDetalhes:', error)
    process.exit(1)
  }
}

// Executar teste
testConnection()
