import { useState, useCallback } from 'react'

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  onError?: (error: string) => void
  onSuccess?: (data: any) => void
}

export function useApi<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (body?: any) => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        setData(result.data || result)

        options.onSuccess?.(result)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMsg)
        options.onError?.(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [url, options]
  )

  return {
    data,
    loading,
    error,
    execute,
  }
}
