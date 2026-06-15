import { useEffect } from 'react'

// Full-screen image overlay. Closes on backdrop click or Escape key.
export default function Lightbox({ photo, onClose }) {
  useEffect(() => {
    if (!photo) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [photo, onClose])

  if (!photo) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', cursor: 'zoom-out',
    }}>
      <img src={photo.image} alt={photo.name || ''} style={{
        maxWidth: '90vw', maxHeight: '90vh',
        objectFit: 'contain', borderRadius: '8px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }} />
      <button onClick={onClose} style={{
        position: 'fixed', top: '1.5rem', right: '2rem',
        background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
        borderRadius: '50%', width: '44px', height: '44px',
        fontSize: '1.5rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', fontFamily: 'var(--font-body)',
      }}>✕</button>
    </div>
  )
}
