import { useEffect, useState } from 'react'
import { fetchCardThemes } from '../services/courseService'

// Themes are static on the backend, so fetch once per session and share.
let cachedThemes = null
let pending = null

export function useCardThemes() {
  const [themes, setThemes] = useState(cachedThemes ?? [])

  useEffect(() => {
    if (cachedThemes) return
    pending ??= fetchCardThemes()
      .then(data => { cachedThemes = data; return data })
      .catch(() => { pending = null; return [] })
    let active = true
    pending.then(data => { if (active) setThemes(data) })
    return () => { active = false }
  }, [])

  return themes
}

export const themeGradient = (theme) =>
  theme ? `linear-gradient(135deg, ${theme.start}, ${theme.end})` : '#6366f1'
