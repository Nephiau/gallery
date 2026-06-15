import { useEffect, useState } from 'react'
import useMediaQuery from '../useMediaQuery'

// Floating "↑ TOP" button that appears after the user has scrolled down.
// Optionally accepts a triggerRef — if provided, shows only when that element
// has scrolled above the viewport top; otherwise shows after 300px of scroll.
export default function ScrollUpButton({ triggerRef, hidden }) {
  const [visible, setVisible] = useState(false)
  const isWide = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    const onScroll = () => {
      if (!triggerRef?.current) {
        // No ref provided — show after 300px of page scroll
        setVisible(window.scrollY > 300)
        return
      }
      // Show when the referenced element has scrolled past the top of the viewport
      const rect = triggerRef.current.getBoundingClientRect()
      setVisible(rect.top < 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [triggerRef])

  if (!visible || hidden) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed',
        top: '4.5rem',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 200,
        background: 'linear-gradient(135deg, rgba(175,120,220,0.92) 0%, rgba(100,210,220,0.85) 100%)',
        color: '#fff',
        border: '1px solid rgba(200,160,240,0.9)',
        borderRadius: '999px',
        padding: '0.45rem 1.1rem',
        fontFamily: 'var(--font-body)',
        fontSize: '0.78rem',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 16px rgba(107,45,110,0.25)',
        transition: 'opacity 300ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}
    >
      ↑ TOP
    </button>
  )
}
