import { useEffect, useRef } from 'react'

const CHECK_INTERVAL_MS = 10 * 60 * 1000

export default function useVersionCheck(onUpdateAvailable) {
  const notifiedRef = useRef(false)

  useEffect(() => {
    const checkVersion = async () => {
      if (notifiedRef.current) return
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { version } = await res.json()
        if (version && version !== __APP_VERSION__) {
          notifiedRef.current = true
          onUpdateAvailable()
        }
      } catch {
        // Ignore network errors; this is a best-effort check.
      }
    }

    const intervalId = setInterval(checkVersion, CHECK_INTERVAL_MS)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion()
    }
    window.addEventListener('focus', checkVersion)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', checkVersion)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [onUpdateAvailable])
}
