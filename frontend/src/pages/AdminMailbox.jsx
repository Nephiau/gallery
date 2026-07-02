import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../components/LoadingSkeleton'

// Overlay shown on a card after approve (✓) or reject (✗)
function ResultOverlay({ type }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: '10px',
      background: type === 'approve' ? 'rgba(46,125,50,0.82)' : 'rgba(192,57,43,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeInOverlay 300ms ease forwards',
      zIndex: 2,
    }}>
      <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}>
        {type === 'approve' ? '✓' : '✕'}
      </span>
    </div>
  )
}

export default function AdminMailbox() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role  = localStorage.getItem('role')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  // Map of id → 'approve' | 'reject' | 'loading-approve' | 'loading-reject'
  const [states, setStates] = useState({})

  useEffect(() => {
    if (!token || role !== 'admin') return navigate('/')
    fetch('/api/requests/pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      })
      .then(data => { setRequests(data); setLoading(false) })
      .catch(() => { setLoading(false); navigate('/login') })
  }, [])

  const action = async (id, type) => {
    setStates(s => ({ ...s, [id]: `loading-${type}` }))
    const res = await fetch(`/api/requests/${id}/${type}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setStates(s => ({ ...s, [id]: type }))
      // Remove card after animation completes
      setTimeout(() => setRequests(prev => prev.filter(r => r._id !== id)), 900)
    } else {
      setStates(s => ({ ...s, [id]: undefined }))
    }
  }

  const isSiswaCategory = cat => !['Guru', '2023', '2024', '2025', '2026'].includes(cat)

  return (
    <div style={{ padding: 'clamp(4rem,8vw,6rem) clamp(1rem,4vw,3rem) 4rem', background: 'var(--background)', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        .mailbox-grid { columns: 3; column-gap: 1.25rem; }
        .mailbox-card { position: relative; break-inside: avoid; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.6); backdrop-filter: blur(6px); display: inline-flex; flex-direction: column; width: 100%; margin-bottom: 1.25rem; transition: box-shadow 200ms; }
        .mailbox-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .mailbox-card img { width: 100%; height: auto; display: block; }
        .card-meta { padding: 0.85rem 1rem 0.75rem; }
        .card-actions { display: flex; gap: 0.5rem; padding: 0 1rem 1rem; }
        .btn-approve { padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; border: none; background: var(--sage-deep); color: #fff; font-family: var(--font-body); font-size: 0.8rem; transition: opacity 200ms; }
        .btn-reject  { padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; border: 1px solid var(--border); background: transparent; color: #c0392b; font-family: var(--font-body); font-size: 0.8rem; transition: opacity 200ms; }
        .btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 480px) { .mailbox-grid { columns: 1; } }
        @media (min-width: 481px) and (max-width: 768px) { .mailbox-grid { columns: 2; } }
      `}</style>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,5vw,3rem)', color: 'var(--sage-deep)', marginBottom: '2rem' }}>
        Mailbox Admin
      </h2>

      {loading
        ? <LoadingSkeleton count={6} />
        : requests.length === 0
        ? <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Tidak ada permintaan masuk.</p>
        : <div className="mailbox-grid">
            {requests.map(r => {
              const st = states[r._id]
              const busy = st === 'loading-approve' || st === 'loading-reject'
              const done = st === 'approve' || st === 'reject'
              const cat = r.category || r.className
              return (
                <div key={r._id} className="mailbox-card">
                  {done && <ResultOverlay type={st} />}
                  {r.image && <img src={r.image} alt="" />}
                  <div className="card-meta">
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.25rem' }}>{r.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.className}{r.indexNumber ? ` · #${r.indexNumber}` : ''}</p>
                    {r.quote && <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.2rem', fontStyle: 'italic' }}>{r.quote}</p>}
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.2rem' }}>dari: {r.submittedBy}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
                      Kategori: <strong>{cat}</strong>
                      {r.type && isSiswaCategory(cat) && <> · <strong>{r.type === 'single' ? 'Perorangan' : 'Bersama'}</strong></>}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button className="btn-approve" disabled={busy || done} onClick={() => action(r._id, 'approve')}>
                      {st === 'loading-approve' ? '...' : 'Setujui'}
                    </button>
                    <button className="btn-reject" disabled={busy || done} onClick={() => action(r._id, 'reject')}>
                      {st === 'loading-reject' ? '...' : 'Tolak'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}
