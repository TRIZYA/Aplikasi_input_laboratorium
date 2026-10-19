export const API_BASE_URL = (() => {
  if (import.meta.env?.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin.replace(/\/$/, '')
    }
  }

  return 'http://localhost:4000'
})()

export const buildApiUrl = (path = '') => {
  const safePath = String(path || '').replace(/^\//, '')
  return `${API_BASE_URL}/${safePath}`
}

export default {
  API_BASE_URL,
  buildApiUrl,
}
