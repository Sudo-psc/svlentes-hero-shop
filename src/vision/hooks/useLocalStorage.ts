'use client'

import { useCallback, useEffect, useState } from 'react'

type Serializer<T> = (value: T) => string

type Deserializer<T> = (value: string | null) => T

const defaultSerializer: Serializer<unknown> = value => JSON.stringify(value)

function defaultDeserializer<T>(value: string | null, fallback: T): T {
    if (!value) {
        return fallback
    }
    try {
        return JSON.parse(value) as T
    } catch (error) {
        console.error('Erro ao carregar dado do armazenamento local', error)
        return fallback
    }
}

export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    serializer: Serializer<T> = defaultSerializer as Serializer<T>,
    deserializer: Deserializer<T> = value => defaultDeserializer<T>(value, initialValue)
) {
    const [storedValue, setStoredValue] = useState<T>(initialValue)

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }
        const item = window.localStorage.getItem(key)
        setStoredValue(deserializer(item))
    }, [key, deserializer])

    const setValue = useCallback(
        (value: T | ((current: T) => T)) => {
            setStoredValue(prev => {
                const newValue = value instanceof Function ? value(prev) : value
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, serializer(newValue))
                }
                return newValue
            })
        },
        [key, serializer]
    )

    const clear = useCallback(() => {
        if (typeof window === 'undefined') {
            return
        }
        window.localStorage.removeItem(key)
        setStoredValue(initialValue)
    }, [initialValue, key])

    return { value: storedValue, setValue, clear }
}
