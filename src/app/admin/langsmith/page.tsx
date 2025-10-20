'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
// Icon components (simplified)
const CheckIcon = () => <span className="text-green-500">✓</span>
const XIcon = () => <span className="text-red-500">✗</span>
const RefreshIcon = () => <span>↻</span>
const SearchIcon = () => <span>🔍</span>
interface LangSmithDiagnostics {
  configuration: {
    isConfigured: boolean
    connectionStatus: string
    config: {
      tracingEnabled: boolean
      endpoint: string
      projectName: string
      apiKeyConfigured: boolean
    }
  }
  connectivity: {
    apiTestResult: any
    endpointReachable: boolean
    lastChecked: string
  }
  systemStats: {
    processor: any
    memory: any
  }
  logs: {
    recentEntries: any[]
    totalEntries: number
  }
  recommendations: string[]
}
interface LogEntry {
  id: string
  timestamp: string
  level: string
  category: string
  message: string
  metadata: any
  source: string
  traceId?: string
}
export default function LangSmithAdminPage() {
  const [diagnostics, setDiagnostics] = useState<LangSmithDiagnostics | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  useEffect(() => {
    loadDiagnostics()
    loadLogs()
  }, [])
  const loadDiagnostics = async () => {
    try {
      const response = await fetch('/api/admin/langsmith/diagnostics')
      const data = await response.json()
      if (data.success) {
        setDiagnostics(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load diagnostics')
    }
  }
  const loadLogs = async () => {
    try {
      const response = await fetch('/api/admin/langsmith/logs')
      const data = await response.json()
      if (data.success) {
        setLogs(data.data.logs)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }
  const testConnection = async () => {
    try {
      const response = await fetch('/api/admin/langsmith/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'test-connection' })
      })
      const data = await response.json()
      if (data.success) {
        loadDiagnostics() // Refresh diagnostics
      }
    } catch (err) {
      setError('Failed to test connection')
    }
  }
  const searchLogs = async () => {
    try {
      const response = await fetch('/api/admin/langsmith/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          filters: {
            level: selectedLevel,
            category: selectedCategory,
            limit: 100
          }
        })
      })
      const data = await response.json()
      if (data.success) {
        setLogs(data.data.logs)
      }
    } catch (err) {
      setError('Failed to search logs')
    }
  }
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'destructive'
      case 'WARN': return 'secondary'
      case 'INFO': return 'default'
      case 'DEBUG': return 'outline'
      default: return 'default'
    }
  }
  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'connection_failed': return 'text-red-600'
      case 'api_error': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshIcon className="animate-spin" />
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LangSmith Admin</h1>
        <Button onClick={loadDiagnostics} variant="outline">
          <RefreshIcon className="mr-2" />
          Atualizar
        </Button>
      </div>
      {diagnostics && (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {diagnostics.configuration.isConfigured ? <CheckIcon /> : <XIcon />}
                  <span className="ml-2">Configuração</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tracing:</span>
                    <Badge variant={diagnostics.configuration.config.tracingEnabled ? 'default' : 'secondary'}>
                      {diagnostics.configuration.config.tracingEnabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>API Key:</span>
                    <Badge variant={diagnostics.configuration.config.apiKeyConfigured ? 'default' : 'secondary'}>
                      {diagnostics.configuration.config.apiKeyConfigured ? 'Configurada' : 'Não configurada'}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p>Projeto: {diagnostics.configuration.config.projectName}</p>
                    <p>Endpoint: {diagnostics.configuration.config.endpoint}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className={getConnectionStatusColor(diagnostics.connectivity.connectionStatus)}>
                    ●
                  </span>
                  <span className="ml-2">Conexão</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={diagnostics.connectivity.endpointReachable ? 'default' : 'destructive'}>
                      {diagnostics.connectivity.connectionStatus}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p>Verificado: {new Date(diagnostics.connectivity.lastChecked).toLocaleString('pt-BR')}</p>
                  </div>
                  <Button onClick={testConnection} size="sm" className="w-full">
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sessões Ativas:</span>
                    <span>{diagnostics.systemStats.memory?.activeSessions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interações Totais:</span>
                    <span>{diagnostics.systemStats.memory?.totalInteractions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logs Recentes:</span>
                    <span>{diagnostics.logs.totalEntries}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Recommendations */}
          {diagnostics.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diagnostics.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Logs Section */}
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="logs">
                <TabsList>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                  <TabsTrigger value="search">Busca</TabsTrigger>
                </TabsList>
                <TabsContent value="logs">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Buscar logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={searchLogs}>
                        <SearchIcon />
                      </Button>
                    </div>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {logs.map((log) => (
                          <div key={log.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant={getLevelColor(log.level)}>
                                  {log.level}
                                </Badge>
                                <Badge variant="outline">
                                  {log.category}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {log.source}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(log.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-sm">{log.message}</p>
                            {Object.keys(log.metadata).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-500 cursor-pointer">
                                  Metadata
                                </summary>
                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                            {log.traceId && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Trace ID: {log.traceId}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
                <TabsContent value="search">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nível
                        </label>
                        <select
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="all">Todos</option>
                          <option value="error">Erro</option>
                          <option value="warn">Aviso</option>
                          <option value="info">Info</option>
                          <option value="debug">Debug</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Categoria
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="all">Todas</option>
                          <option value="langchain">LangChain</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="memory">Memória</option>
                          <option value="processor">Processor</option>
                          <option value="application">Aplicação</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Busca
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Texto para buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={searchLogs}>
                            <SearchIcon />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-sm text-gray-600">
                      <p>Use a busca acima para filtrar os logs por texto, nível e categoria.</p>
                      <p>Os resultados aparecerão na aba "Logs" acima.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}