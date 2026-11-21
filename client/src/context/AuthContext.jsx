import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, post } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const data = await api('/auth/me')
      setUser(data.user)
      return data.user
    } catch (error) {
      if (error.status === 401) setUser(null)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser().catch(() => {})
  }, [refreshUser])

  const login = useCallback(async (credentials) => {
    const data = await post('/auth/login', credentials)
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (payload) => {
    const data = await post('/auth/signup', payload)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout', {})
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, signup, logout, refreshUser }), [
    user, loading, login, signup, logout, refreshUser,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
