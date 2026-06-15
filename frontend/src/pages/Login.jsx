import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useMediaQuery from '../useMediaQuery'

// Shared input style used across auth forms
const inputStyle = {
  width: '100%', padding: '0.6rem 1rem', borderRadius: '6px',
  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
  outline: 'none', boxSizing: 'border-box',
}

// Login page — authenticates user and stores JWT + role in localStorage.
export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    // Persist auth state in localStorage so it survives page refreshes
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
    localStorage.setItem('role', data.role)
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: isMobile ? '1rem' : '0' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '360px', padding: isMobile ? '1.5rem' : '2.5rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--sage-deep)', marginBottom: '1.5rem' }}>Login</h2>

        {/* Inline error message */}
        {error && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <input style={inputStyle} placeholder="Username" value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          <input style={inputStyle} type="password" placeholder="Password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        </div>

        <button type="submit" style={{
          width: '100%', padding: '0.65rem', borderRadius: '6px', cursor: 'pointer',
          background: 'var(--sage-deep)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: '0.85rem', letterSpacing: '0.1em',
        }}>MASUK</button>

        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>
          Belum punya akun? <Link to="/register" style={{ color: 'var(--sage-deep)' }}>Daftar</Link>
        </p>
      </form>
    </div>
  )
}
