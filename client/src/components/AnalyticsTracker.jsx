import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { recordEvent } from '../lib/api'

export default function AnalyticsTracker() {
  const location = useLocation()
  const lastPath = useRef(null)

  useEffect(() => {
    const pagePath = location.pathname.slice(0, 256)
    if (lastPath.current === pagePath) return
    lastPath.current = pagePath

    const params = new URLSearchParams(location.search)
    const referrer = document.referrer
    let referrerHost = ''
    try {
      if (referrer) referrerHost = new URL(referrer).hostname
    } catch {
      referrerHost = ''
    }
    const source = params.get('utm_source') || referrerHost || 'direct'
    const medium = params.get('utm_medium') || (referrerHost ? 'referral' : 'none')
    recordEvent({ eventName: 'page_view', pagePath, source, medium })
  }, [location.pathname, location.search])

  return null
}
