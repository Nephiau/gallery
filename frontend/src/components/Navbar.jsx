import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'

const links = [
  { label: 'Siswa', to: '/siswa' },
  { label: 'Guru', to: '/guru' },
  { label: 'Momen', to: '/momen' },
]

export default function Navbar({ logoOpacity = 1, taglineGone = false }) {
  const showTagline = taglineGone || localStorage.getItem('taglineSeen') === '1'
  if (taglineGone) localStorage.setItem('taglineSeen', '1')
  const role = localStorage.getItem('role')
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobile, setMobile] = useState(window.innerWidth < 1200)

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 1200)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/')
  }

  // Desktop nav
  if (!mobile) {
    return (
      <>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 3rem',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(200,180,230,0.3)',
          boxShadow: '0 2px 24px rgba(144,200,160,0.10)',
          fontFamily: 'var(--font-body)',
        }}>
          <Link to="/" style={{
            fontSize: '1rem', letterSpacing: '0.3em', fontWeight: 600,
            color: 'var(--ink)', textDecoration: 'none',
          }}>
            ASHATARA
          </Link>

          <span style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            fontSize: '0.8rem', letterSpacing: '0.25em',
            color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)',
            opacity: showTagline ? 1 : 0,
            transition: 'opacity 800ms ease',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            SATU HARAPAN SATU ASHATARA
          </span>
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            {links.map(({ label, to }) => (
              <Link key={to} to={to}
                style={{ fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', transition: 'color 300ms, letter-spacing 300ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--sage-deep)'; e.currentTarget.style.letterSpacing = '0.2em' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.letterSpacing = '0.1em' }}
              >{label}</Link>
            ))}
            {token && role !== 'admin' && (
              <Link to="/upload"
                style={{ fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', transition: 'color 300ms, letter-spacing 300ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--sage-deep)'; e.currentTarget.style.letterSpacing = '0.2em' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.letterSpacing = '0.1em' }}
              >Upload</Link>
            )}
            {token && role === 'admin' && (
              <>
                <Link to="/admin/bulk-upload"
                  style={{ fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', transition: 'color 300ms, letter-spacing 300ms' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--sage-deep)'; e.currentTarget.style.letterSpacing = '0.2em' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.letterSpacing = '0.1em' }}
                >Upload</Link>
                <Link to="/admin/mailbox"
                  style={{ fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', transition: 'color 300ms, letter-spacing 300ms' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--sage-deep)'; e.currentTarget.style.letterSpacing = '0.2em' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.letterSpacing = '0.1em' }}
                >Mailbox</Link>
              </>
            )}
          </div>
        </div>
        {token && role === 'admin' && (
          <button onClick={logout} style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 200,
            padding: '0.6rem 1.4rem', borderRadius: '6px', cursor: 'pointer',
            background: 'var(--sage-deep)', color: '#fff', border: 'none',
            fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '0.1em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>LOGOUT</button>
        )}
      </>
    )
  }

  // Mobile nav
  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 1rem',
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-body)',
      }}>
        <Link to="/" style={{
          fontSize: '0.85rem', letterSpacing: '0.3em', fontWeight: 600,
          color: 'var(--ink)', textDecoration: 'none',
        }}>
          ASHATARA
        </Link>

        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0.25rem', color: 'var(--ink)', fontSize: '1.5rem',
          lineHeight: 1,
        }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && createPortal(
        <div style={{
          position: 'fixed', top: '3rem', left: 0, right: 0, zIndex: 99998,
          background: '#ffffff',
          borderBottom: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          padding: '1rem',
          fontFamily: 'var(--font-body)',
        }}>
          {links.map(({ label, to }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              style={{ fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}
            >{label}</Link>
          ))}
          {token && role !== 'admin' && (
            <Link to="/upload" onClick={() => setMenuOpen(false)}
              style={{ fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}
            >Upload</Link>
          )}
          {token && role === 'admin' && (
            <>
              <Link to="/admin/bulk-upload" onClick={() => setMenuOpen(false)}
                style={{ fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}
              >Upload</Link>
              <Link to="/admin/mailbox" onClick={() => setMenuOpen(false)}
                style={{ fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}
              >Mailbox</Link>
            </>
          )}
          {token && role === 'admin' && (
            <button onClick={() => { logout(); setMenuOpen(false) }} style={{
              padding: '0.5rem', borderRadius: '6px', cursor: 'pointer',
              background: 'var(--sage-deep)', color: '#fff', border: 'none',
              fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '0.1em',
              marginTop: '0.5rem',
            }}>LOGOUT</button>
          )}
        </div>,
        document.body
      )}
    </>
  )
}