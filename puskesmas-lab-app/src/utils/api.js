export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')

export const buildApiUrl = (path = '') => {
  const safePath = String(path || '').replace(/^\//, '')
  return `${API_BASE_URL}/${safePath}`
}

export default {
  API_BASE_URL,
  buildApiUrl,
}
