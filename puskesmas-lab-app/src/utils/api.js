export const API_BASE_URL = (() => {
  if (import.meta.env?.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
  }

  return '/api'
})()

export const buildApiUrl = (path = '') => {
  const safePath = String(path || '').replace(/^\//, '')
  return safePath ? `${API_BASE_URL}/${safePath}` : API_BASE_URL
}

export default {
  API_BASE_URL,
  buildApiUrl,
}
