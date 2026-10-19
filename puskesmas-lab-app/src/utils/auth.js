export const STORAGE_KEY = 'puskesmas_lab_auth'

export const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.token) return null

    const base64Payload = parsed.token.split('.')[1]
    if (!base64Payload) return null

    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized))

    return {
      ...parsed,
      user: {
        ...(parsed.user || {}),
        role: payload.role || parsed.user?.role || 'admin',
      },
    }
  } catch {
    return null
  }
}

export const getRoleLandingPath = (role) => {
  if (role === 'admin') return '/admin'
  if (role === 'analis') return '/analis'
  if (role === 'dokter') return '/dokter'
  return '/login'
}

const authUtils = {
  STORAGE_KEY,
  getStoredAuth,
  getRoleLandingPath,
}

export default authUtils
