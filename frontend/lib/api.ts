import axios from 'axios'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

const TOKEN_KEY = 'community_hero_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearToken()
    }
    return Promise.reject(error)
  }
)

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail || error.response?.data?.message
    if (typeof detail === 'string') return detail
    if (!error.response) return 'Could not reach the server. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}
