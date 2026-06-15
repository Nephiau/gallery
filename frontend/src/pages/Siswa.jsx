import { useEffect, useState } from 'react'
import CardGrid from '../components/CardGrid'
import ScrollUpButton from '../components/ScrollUpButton'
import useMediaQuery from '../useMediaQuery'

// Available class filter options
const classes = ['Semua', 'XII A', 'XII B', 'XII C', 'XII D', 'XII E', 'XII F', 'XII G', 'XII H']
const ALBUM = 'Album' // special category for group/together photos

// Student gallery page with class filter, album view, and search.
export default function Siswa() {
  const [data, setData] = useState([])       // students for the active class filter
  const [allData, setAllData] = useState([]) // all together/album photos (fetched once)
  const [query, setQuery] = useState('')
  const [activeClass, setActiveClass] = useState('Semua')
  const [modalOpen, setModalOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Fetch students when the active class changes.
  // Album tab fetches all siswa and filters client-side for type='together'.
  useEffect(() => {
    if (activeClass === ALBUM) {
      fetch('/api/siswa?type=together').then(r => r.json()).then(setAllData).catch(() => {})
    } else {
      const url = activeClass === 'Semua' ? '/api/siswa' : `/api/siswa?class=${encodeURIComponent(activeClass)}`
      fetch(url).then(r => r.json()).then(setData).catch(() => {})
    }
  }, [activeClass])

  // Use the correct data source depending on the active tab
  const source = activeClass === ALBUM ? allData : data

  // Filter by search query — matches name, nickname, or Instagram
  const filtered = source.filter(d => {
    const q = query.toLowerCase()
    return (d.name || '').toLowerCase().includes(q) ||
           (d.nickname || '').toLowerCase().includes(q) ||
           (d.instagram || '').toLowerCase().includes(q)
  })

  // Remove one student from both data stores after deletion
  const handleDelete = async id => {
    await fetch(`/api/siswa/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    setData(prev => prev.filter(d => d._id !== id))
    setAllData(prev => prev.filter(d => d._id !== id))
  }

  // Bulk delete multiple students at once
  const handleBulkDelete = async (ids) => {
    const res = await fetch('/api/admin/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ collection: 'Siswa', ids }),
    })
    if (res.ok) {
      setData(prev => prev.filter(d => !ids.includes(d._id)))
      setAllData(prev => prev.filter(d => !ids.includes(d._id)))
    }
  }

  // Sync an edited student back into both data stores
  const handleUpdate = updated => {
    setData(prev => prev.map(d => d._id === updated._id ? updated : d))
    setAllData(prev => prev.map(d => d._id === updated._id ? updated : d))
  }

  return (
    <div style={{ paddingTop: '5rem', padding: isMobile ? '5rem 1rem 3rem' : '5rem 3rem 4rem', background: 'var(--background)' }}>
      <h2 style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? '2rem' : '3rem', color: 'var(--sage-deep)', marginBottom: '0.25rem' }}>Siswa</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--muted-foreground)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Shataver 26</p>

      {/* Class filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {classes.map(c => (
          <button key={c} onClick={() => setActiveClass(c)} style={{
            padding: '0.4rem 1rem', borderRadius: '999px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '0.05em',
            background: activeClass === c ? 'linear-gradient(135deg, rgba(210,185,235,0.75) 0%, rgba(180,235,235,0.55) 100%)' : 'rgba(255,255,255,0.35)',
            color: activeClass === c ? '#3d1f5c' : 'var(--muted-foreground)',
            backdropFilter: 'blur(8px)',
            border: activeClass === c ? '1px solid rgba(210,185,235,0.7)' : '1px solid var(--border)',
            transition: 'background 250ms, color 250ms',
          }}>{c}</button>
        ))}

        {/* Divider between class filters and album button */}
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Album tab — shows all together/group photos */}
        <button onClick={() => setActiveClass(ALBUM)} style={{
          padding: '0.4rem 1rem', borderRadius: '999px', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: '0.8rem', letterSpacing: '0.05em',
          background: activeClass === ALBUM ? 'linear-gradient(135deg, rgba(210,185,235,0.75) 0%, rgba(180,235,235,0.55) 100%)' : 'rgba(255,255,255,0.35)',
          color: activeClass === ALBUM ? '#3d1f5c' : 'var(--muted-foreground)',
          backdropFilter: 'blur(8px)',
          border: activeClass === ALBUM ? '1px solid rgba(210,185,235,0.7)' : '1px solid var(--border)',
          transition: 'background 250ms, color 250ms',
        }}>📸 Album</button>
      </div>

      {/* Name search input */}
      <input
        type="text" placeholder="Cari nama..."
        value={query} onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', maxWidth: '360px', padding: '0.6rem 1rem',
          marginBottom: '2rem', borderRadius: '6px',
          border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
          color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
          outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Card grid — passes isAlbum so together photos render at natural aspect ratio */}
      <CardGrid data={filtered} collection="Siswa" onDelete={handleDelete} onBulkDelete={handleBulkDelete}
        onUpdate={handleUpdate} isAlbum={activeClass === ALBUM} onModalChange={setModalOpen} />
      <ScrollUpButton hidden={modalOpen} />
    </div>
  )
}
