import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedAuthCacheManager } from '@/lib/auth/enhanced-cache-manager'
import type { FallbackSession, CachedUserSnapshot } from '@/lib/auth/types'

describe('EnhancedAuthCacheManager', () => {
    let cacheManager: EnhancedAuthCacheManager
    let mockStorage: Storage

    beforeEach(() => {
        // Mock localStorage
        const store: Record<string, string> = {}
        mockStorage = {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key]
            }),
            clear: vi.fn(() => {
                Object.keys(store).forEach(key => delete store[key])
            }),
            get lengthValue() { return 0 },
            key: vi.fn(() => ''),
            get lengthKey() { return '' }
        } as Storage

        // Mock IndexedDB
        vi.mock('idb', () => ({
            openDB: vi.fn().mockRejectedValue(new Error('IndexedDB not available'))
        }))

        cacheManager = new EnhancedAuthCacheManager('test-secret')
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.clearAllMocks()
    })

    describe('saveSession', () => {
        it('deve salvar sessão com sucesso', async () => {
            const userSnapshot: CachedUserSnapshot = {
                uid: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                photoURL: null,
                phoneNumber: null,
                providerId: 'password',
                metadata: {
                    creationTime: '2023-01-01T00:00:00Z',
                    lastSignInTime: '2023-01-01T00:00:00Z'
                }
            }

            const payload = {
                user: userSnapshot,
                token: 'test-token',
                refreshToken: 'refresh-token',
                expiresAt: Date.now() + 3600000, // 1 hora
                cachedAt: Date.now()
            }

            await expect(cacheManager.saveSession(payload)).resolves.not.toThrow()
        })

        it('deve lançar erro em caso de falha', async () => {
            // Simular falha no storage
            vi.spyOn(mockStorage, 'setItem').mockImplementationOnce(() => {
                throw new Error('Storage error')
            })

            const payload = {
                user: {
                    uid: 'user-123',
                    email: 'test@example.com'
                } as CachedUserSnapshot,
                token: 'test-token',
                expiresAt: Date.now() + 3600000,
                cachedAt: Date.now()
            }

            await expect(cacheManager.saveSession(payload)).rejects.toThrow('Storage error')
        })
    })

    describe('getSession', () => {
        it('deve recuperar sessão válida', async () => {
            const userSnapshot: CachedUserSnapshot = {
                uid: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                photoURL: null,
                phoneNumber: null,
                providerId: 'password',
                metadata: {
                    creationTime: '2023-01-01T00:00:00Z',
                    lastSignInTime: '2023-01-01T00:00:00Z'
                }
            }

            const payload = {
                user: userSnapshot,
                token: 'test-token',
                refreshToken: 'refresh-token',
                expiresAt: Date.now() + 3600000,
                cachedAt: Date.now()
            }

            await cacheManager.saveSession(payload)
            const session = await cacheManager.getSession()

            expect(session).toBeTruthy()
            expect(session!.type).toBe('offline-cache')
            expect(session!.user).toEqual(userSnapshot)
            expect(session!.token).toBe('test-token')
            expect(session!.refreshToken).toBe('refresh-token')
            expect(session!.scope).toBe('full')
            expect(session!.source).toBe('cache')
        })

        it('deve retornar null para sessão expirada', async () => {
            const payload = {
                user: {
                    uid: 'user-123',
                    email: 'test@example.com'
                } as CachedUserSnapshot,
                token: 'test-token',
                expiresAt: Date.now() - 1000, // Expirada
                cachedAt: Date.now()
            }

            await cacheManager.saveSession(payload)
            const session = await cacheManager.getSession()

            expect(session).toBeNull()
        })

        it('deve retornar null para sessão corrompida', async () => {
            // Simular dado corrompido no storage
            mockStorage.setItem('svlentes.auth.session.enhanced', 'corrupted-data')

            const session = await cacheManager.getSession()
            expect(session).toBeNull()
        })

        it('deve retornar null quando não há sessão', async () => {
            const session = await cacheManager.getSession()
            expect(session).toBeNull()
        })
    })

    describe('clearSession', () => {
        it('deve limpar sessão com sucesso', async () => {
            const payload = {
                user: {
                    uid: 'user-123',
                    email: 'test@example.com'
                } as CachedUserSnapshot,
                token: 'test-token',
                expiresAt: Date.now() + 3600000,
                cachedAt: Date.now()
            }

            await cacheManager.saveSession(payload)
            await expect(cacheManager.clearSession()).resolves.not.toThrow()

            const session = await cacheManager.getSession()
            expect(session).toBeNull()
        })
    })

    describe('queueOperation', () => {
        it('deve adicionar operação na fila', async () => {
            const operation = {
                type: 'sign-in' as const,
                payload: { email: 'test@example.com', password: 'password123' },
                priority: 'high' as const,
                maxRetries: 3
            }

            await expect(cacheManager.queueOperation(operation)).resolves.not.toThrow()
        })

        it('deve priorizar operações críticas', async () => {
            const criticalOp = {
                type: 'sign-in' as const,
                payload: { email: 'critical@example.com', password: 'password123' },
                priority: 'critical' as const,
                maxRetries: 1
            }

            const normalOp = {
                type: 'profile-sync' as const,
                payload: { userId: 'user-123' },
                priority: 'low' as const,
                maxRetries: 3
            }

            await cacheManager.queueOperation(criticalOp)
            await cacheManager.queueOperation(normalOp)

            const operations = await cacheManager.consumeQueuedOperations()

            // Operação crítica deve vir primeiro
            expect(operations[0].priority).toBe('critical')
            expect(operations[1].priority).toBe('low')
        })
    })

    describe('consumeQueuedOperations', () => {
        it('deve consumir operações prontas', async () => {
            const operation = {
                type: 'sign-in' as const,
                payload: { email: 'test@example.com', password: 'password123' },
                priority: 'medium' as const,
                maxRetries: 3
            }

            await cacheManager.queueOperation(operation)
            const operations = await cacheManager.consumeQueuedOperations()

            expect(operations).toHaveLength(1)
            expect(operations[0].type).toBe('sign-in')
            expect(operations[0].payload).toEqual({ email: 'test@example.com', password: 'password123' })
        })

        it('deve retornar array vazio quando não há operações', async () => {
            const operations = await cacheManager.consumeQueuedOperations()
            expect(operations).toHaveLength(0)
        })
    })

    describe('getCacheStats', () => {
        it('deve retornar estatísticas corretas', async () => {
            const payload = {
                user: {
                    uid: 'user-123',
                    email: 'test@example.com',
                    displayName: 'Test User'
                } as CachedUserSnapshot,
                token: 'test-token',
                expiresAt: Date.now() + 3600000,
                cachedAt: Date.now()
            }

            await cacheManager.saveSession(payload)

            const operation = {
                type: 'sign-in' as const,
                payload: { email: 'test@example.com', password: 'password123' },
                priority: 'high' as const,
                maxRetries: 3
            }
            await cacheManager.queueOperation(operation)

            const stats = await cacheManager.getCacheStats()

            expect(stats.sessionExists).toBe(true)
            expect(stats.pendingOperations).toBe(1)
            expect(stats.operationsByPriority.high).toBe(1)
            expect(stats.deviceInfo.deviceId).toBeTruthy()
            expect(stats.deviceInfo.userAgent).toBeTruthy()
        })
    })

    describe('cleanupExpiredData', () => {
        it('deve limpar operações expiradas', async () => {
            const oldOperation = {
                type: 'sign-in' as const,
                payload: { email: 'old@example.com', password: 'password123' },
                priority: 'low' as const,
                maxRetries: 3
            }

            await cacheManager.queueOperation(oldOperation)

            // Simular que a operação expirou (mock do tempo)
            const originalDateNow = Date.now
            Date.now = vi.fn(() => originalDateNow() + 25 * 60 * 60 * 1000) // 25 horas no futuro

            await cacheManager.cleanupExpiredData()

            const operations = await cacheManager.consumeQueuedOperations()
            expect(operations).toHaveLength(0)

            // Restaurar Date.now
            Date.now = originalDateNow
        })
    })

    describe('integrity checks', () => {
        it('deve detectar violação de integridade', async () => {
            const payload = {
                user: {
                    uid: 'user-123',
                    email: 'test@example.com'
                } as CachedUserSnapshot,
                token: 'test-token',
                expiresAt: Date.now() + 3600000,
                cachedAt: Date.now()
            }

            await cacheManager.saveSession(payload)

            // Simular corrupção dos dados
            mockStorage.setItem('svlentes.auth.session.enhanced', 'corrupted-data')

            const session = await cacheManager.getSession()
            expect(session).toBeNull()
        })

        it('deve verificar device binding', async () => {
            const payload = {
                user: {
                    uid: 'user-123',
                    email: 'test@example.com'
                } as CachedUserSnapshot,
                token: 'test-token',
                expiresAt: Date.now() + 3600000,
                cachedAt: Date.now()
            }

            // Criar cache manager com device ID diferente
            const differentCacheManager = new EnhancedAuthCacheManager('different-secret')

            await cacheManager.saveSession(payload)
            const session = await differentCacheManager.getSession()

            // Não deve conseguir ler sessão de outro device
            expect(session).toBeNull()
        })
    })
})
