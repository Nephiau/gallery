import { useEffect, useState } from 'react'
import CardGrid from '../components/CardGrid'
import ScrollUpButton from '../components/ScrollUpButton'
import useMediaQuery from '../useMediaQuery'

// Teacher gallery page with name/subject search.
export default function Guru() {
  const [data, setData] = useState([])
  const [query, setQuery] = useState('')
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Load all teachers on mount
  useEffect(() => {
    fetch('/api/guru').then(r => r.json()).then(setData).catch(() => {})
  }, [])

  // Filter by name or subject (className stores the subject for Guru)
  const filtered = data.filter(d =>
    d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.className.toLowerCase().includes(query.toLowerCase())
  )

  // Delete a single teacher and remove from local state
  const handleDelete = async id => {
    await fetch(`/api/guru/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    setData(prev => prev.filter(d => d._id !== id))
  }

  // Bulk delete selected teachers
  const handleBulkDelete = async (ids) => {
    const res = await fetch('/api/admin/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ collection: 'Guru', ids }),
    })
    if (res.ok) setData(prev => prev.filter(d => !ids.includes(d._id)))
  }

  return (
    <div style={{ paddingTop: '5rem', padding: isMobile ? '5rem 1rem 3rem' : '5rem 3rem 4rem', background: 'var(--background)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '2rem' : '3rem', color: 'var(--sage-deep)', marginBottom: '1.5rem' }}>Guru</h2>

      {/* Search by name or mata pelajaran */}
      <input
        type="text" placeholder="Cari nama atau mata pelajaran..."
        value={query} onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', maxWidth: '360px', padding: '0.6rem 1rem',
          marginBottom: '2rem', borderRadius: '6px',
          border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
          color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
          outline: 'none', boxSizing: 'border-box',
        }}
      />

      <CardGrid data={filtered} collection="Guru" onDelete={handleDelete} onBulkDelete={handleBulkDelete}
        onUpdate={updated => setData(prev => prev.map(d => d._id === updated._id ? updated : d))} />
      <ScrollUpButton />
    </div>
  )
}
