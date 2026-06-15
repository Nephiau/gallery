import { useState, useEffect } from 'react'

// Custom hook that returns true/false based on a CSS media query string.
// Re-evaluates reactively whenever the viewport crosses the query breakpoint.
// Usage: const isMobile = useMediaQuery('(max-width: 768px)')
export default function useMediaQuery(query) {
  // Initialize with the current match state to avoid a flash on first render
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = e => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}
