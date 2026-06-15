import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useMediaQuery from '../useMediaQuery'

// Admin-only page for reviewing pending photo upload requests.
// Approve: uploads image to Cloudinary and creates/updates the DB record.
// Reject: marks the request as rejected with no image upload.
export default function AdminMailbox() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role  = localStorage.getItem('role')
  const [requests, setRequests] = useState([])
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Redirect non-admins away immediately; fetch pending requests for admins
  useEffect(() => {
    if (!token || role !== 'admin') return navigate('/')
    fetch('/api/requests/pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setRequests).catch(() => {})
  }, [])

  // Call approve or reject endpoint, then remove the card from the list on success
  const action = async (id, type) => {
    const res = await fetch(`/api/requests/${id}/${type}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setRequests(prev => prev.filter(r => r._id !== id))
  }

  return (
    <div style={{ padding: isMobile ? '5rem 1rem 3rem' : '6rem 3rem 4rem', background: 'var(--background)', minHeight: '100vh' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '2rem' : '3rem', color: 'var(--sage-deep)', marginBottom: '2rem' }}>Mailbox Admin</h2>

      {requests.length === 0
        ? <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Tidak ada permintaan masuk.</p>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '560px' }}>
            {requests.map(r => (
              <div key={r._id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px' }}>
                {/* Request preview — photo thumbnail + metadata */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  {r.image && <img src={r.image} alt="" style={{ width: '280px', height: 'auto', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 600 }}>{r.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.className} · #{r.indexNumber}</p>
                    {r.quote && <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem', fontStyle: 'italic' }}>{r.quote}</p>}
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>dari: {r.submittedBy}</p>
                    {/* Show category and type info to help admin route the photo correctly */}
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
                      Kategori: <strong>{r.category || r.className}</strong>
                      {r.type && r.category && !['Guru', '2023', '2024', '2025', '2026'].includes(r.category) && <> · Tipe: <strong>{r.type === 'single' ? 'Perorangan' : 'Bersama'}</strong></>}
                    </p>
                  </div>
                </div>

                {/* Approve / Reject action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => action(r._id, 'approve')} style={{
                    padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', border: 'none',
                    background: 'var(--sage-deep)', color: '#fff',
                    fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                  }}>Setujui</button>
                  <button onClick={() => action(r._id, 'reject')} style={{
                    padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: '#c0392b', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                  }}>Tolak</button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
