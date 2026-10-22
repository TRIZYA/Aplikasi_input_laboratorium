import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function usePageAlerts(resetters = []) {
  const location = useLocation()

  useEffect(() => {
    resetters.forEach((reset) => reset())
  }, [location.pathname])
}
