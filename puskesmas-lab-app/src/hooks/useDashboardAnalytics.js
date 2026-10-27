import { useEffect, useState } from 'react'
import { buildApiUrl } from '../utils/api'
import { getStoredAuth } from '../utils/auth'

export function useDashboardAnalytics(enabled) {
  const token = getStoredAuth()?.token
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled || !token) return undefined

    let active = true
    Promise.resolve()
      .then(() => {
        if (active) setLoading(true)
        const headers = { Authorization: `Bearer ${token}` }
        return fetch(buildApiUrl('/api/dashboard/analytics'), { headers })
      })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.message || 'Analytics tidak dapat dimuat.')
        if (active) {
          setData(result.data)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [enabled, token])

  return { data, loading, error }
}