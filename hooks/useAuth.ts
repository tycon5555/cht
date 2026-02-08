import { useState, useCallback } from 'react'
import { useApi } from './useApi'

interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string
}

interface AuthResponse {
  user: User
  token: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const register = useCallback(
    async (email: string, username: string, displayName: string, password: string) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
            displayName,
            password,
          }),
        })

        const data: AuthResponse = await response.json()

        setUser(data.user)
        setToken(data.token)
        setIsAuthenticated(true)

        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        console.log('[v0] User registered:', data.user)
        return data
      } catch (error) {
        console.error('[v0] Registration error:', error)
        throw error
      }
    },
    []
  )

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data: AuthResponse = await response.json()

        setUser(data.user)
        setToken(data.token)
        setIsAuthenticated(true)

        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        console.log('[v0] User logged in:', data.user)
        return data
      } catch (error) {
        console.error('[v0] Login error:', error)
        throw error
      }
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    console.log('[v0] User logged out')
  }, [])

  const verifyToken = useCallback(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
      return true
    }

    return false
  }, [])

  return {
    user,
    token,
    isAuthenticated,
    register,
    login,
    logout,
    verifyToken,
  }
}
