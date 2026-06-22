import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CardGrid from '../components/CardGrid'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ScrollUpButton from '../components/ScrollUpButton'
import useMediaQuery from '../useMediaQuery'

// Year categories for filtering moment photos
const categories = ['Semua', '2023', '2024', '2025', '2026']

// Moment/event gallery page — photos grouped by year.
export default function Momen() {
  const navigate = useNavigate()
  const isAdmin = localStorage.getItem('role') === 'admin'
  const token = localStorage.getItem('token')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Load all moment photos on mount
  useEffect(() => {
    setLoading(true)
    fetch('/api/momen')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Delete a single moment photo
  const handleDelete = async id => {
    await fetch(`/api/momen/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setData(prev => prev.filter(d => d._id !== id))
  }

  // Bulk delete selected moment photos
  const handleBulkDelete = async (ids) => {
    const res = await fetch('/api/admin/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ collection: 'Momen', ids }),
    })
    if (res.ok) setData(prev => prev.filter(d => !ids.includes(d._id)))
  }

  // Filter by year category and name search
  const filtered = data.filter(d =>
    (activeCategory === 'Semua' || d.className === activeCategory) &&
    d.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ paddingTop: '5rem', padding: isMobile ? '5rem 1rem 3rem' : '5rem 3rem 4rem', background: 'var(--background)' }}>
      {/* Header with upload shortcut button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem', position: isMobile ? 'static' : 'relative' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '2rem' : '3rem', color: 'var(--sage-deep)' }}>Momen</h2>
        <button onClick={() => navigate('/upload')} style={{
          position: isMobile ? 'static' : 'absolute', right: 0,
          padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer',
          background: 'var(--sage-deep)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '0.1em',
        }}>+ UPLOAD FOTO</button>
      </div>

      {/* Year filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', justifyContent: 'center' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)} style={{
            padding: '0.4rem 1rem', borderRadius: '999px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '0.05em',
            background: activeCategory === c ? 'linear-gradient(135deg, rgba(210,185,235,0.75) 0%, rgba(180,235,235,0.55) 100%)' : 'rgba(255,255,255,0.35)',
            color: activeCategory === c ? '#3d1f5c' : 'var(--muted-foreground)',
            backdropFilter: 'blur(8px)',
            border: activeCategory === c ? '1px solid rgba(210,185,235,0.7)' : '1px solid var(--border)',
            transition: 'background 250ms, color 250ms',
          }}>{c}</button>
        ))}
      </div>

      {/* Name search input */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <input
          type="text" placeholder="Cari momen..."
          value={query} onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', maxWidth: '360px', padding: '0.6rem 1rem',
            marginBottom: '2rem', borderRadius: '6px',
            border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
            color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Loading skeleton or card grid */}
      {loading ? (
        <LoadingSkeleton count={12} isAlbum />
      ) : (
        <CardGrid data={filtered} collection="Momen" onBulkDelete={handleBulkDelete} onDelete={isAdmin ? handleDelete : undefined}
          onUpdate={updated => setData(prev => prev.map(d => d._id === updated._id ? updated : d))} isAlbum />
      )}
      <ScrollUpButton />
    </div>
  )
}
