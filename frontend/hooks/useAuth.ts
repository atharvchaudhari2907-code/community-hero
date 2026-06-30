'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken, clearToken, extractErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { User, APIResponse } from '@/types'

interface TokenResponse {
  access_token: string
  user: User
}

export function useAuth() {
  const router = useRouter()
  const { user, setUser, logout: clearStore } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.post<APIResponse<TokenResponse>>('/auth/login', { email, password })
      setToken(res.data.data.access_token)
      setUser(res.data.data.user)
      const role = res.data.data.user.role
      router.push(role === 'citizen' ? '/citizen/dashboard' : role === 'worker' ? '/worker/dashboard' : '/admin/dashboard')
      return res.data.data.user
    } catch (e) {
      const msg = extractErrorMessage(e)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [router, setUser])

  const register = useCallback(async (payload: {
    name: string; email: string; password: string; phone: string; ward: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.post<APIResponse<TokenResponse>>('/auth/register', {
        ...payload, role: 'citizen',
      })
      setToken(res.data.data.access_token)
      setUser(res.data.data.user)
      router.push('/citizen/dashboard')
      return res.data.data.user
    } catch (e) {
      const msg = extractErrorMessage(e)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [router, setUser])

  const logout = useCallback(() => {
    clearToken()
    clearStore()
    router.push('/')
  }, [router, clearStore])

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<APIResponse<User>>('/auth/me')
      setUser(res.data.data)
      return res.data.data
    } catch {
      clearToken()
      clearStore()
      return null
    }
  }, [setUser, clearStore])

  return { user, login, register, logout, refreshUser, isLoading, error }
}

/** Redirects to /login if no user is in the store, refetching once on mount. */
export function useRequireAuth(allowedRoles?: Array<User['role']>) {
  const router = useRouter()
  const { user } = useAppStore()
  const { refreshUser } = useAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    (async () => {
      if (!user) {
        const fresh = await refreshUser()
        if (!fresh) {
          router.push('/login')
          return
        }
      }
      setChecked(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (checked && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/')
    }
  }, [checked, user, allowedRoles, router])

  return { user, isChecking: !checked }
}
