import { useState } from 'react'
import Card from './Card'
import TogetherCard from './TogetherCard'
import Modal from './Modal'
import Lightbox from './Lightbox'
import useMediaQuery from '../useMediaQuery'

// Renders a masonry grid of student/teacher/moment cards.
// Splits data into 'together' (group photos) and 'single' (individual) sections.
// Admins can select multiple cards for bulk deletion.
export default function CardGrid({ data, onDelete, collection, onBulkDelete, onUpdate, isAlbum }) {
  const [selected, setSelected] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const isAdmin = token && role === 'admin'

  const isMobile = useMediaQuery('(max-width: 768px)')
  const cols = isMobile ? '2' : '4'
  const albumCols = isMobile ? '2' : '3' // wider columns for natural-ratio album photos

  // Separate group photos from individual portraits
  const together = data.filter(d => d.type === 'together')
  const singles = data.filter(d => d.type !== 'together')

  // Toggle a card's selection state for bulk delete
  const toggleSelect = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    const name = selectedIds.length === 1 ? '1 item' : `${selectedIds.length} item`
    if (!window.confirm(`Hapus ${name}? Tindakan ini tidak bisa dibatalkan.`)) return
    onBulkDelete(selectedIds)
    setSelectedIds([])
  }

  return (
    <>
      {/* Sticky bulk-delete toolbar — only shown when items are selected */}
      {isAdmin && selectedIds.length > 0 && (
        <div style={{
          position: 'sticky', top: '5rem', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.25rem', marginBottom: '1rem',
          background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)',
          borderRadius: '8px', backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600 }}>
            {selectedIds.length} item dipilih
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setSelectedIds([])} style={{
              padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
              color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
            }}>Batal</button>
            <button onClick={handleBulkDelete} style={{
              padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer',
              border: 'none', background: '#c0392b', color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: '0.8rem',
            }}>Hapus {selectedIds.length}</button>
          </div>
        </div>
      )}

      {/* Group/together photos — natural ratio in album mode, 1:1 otherwise */}
      {together.length > 0 && (
        <div style={{ columns: isAlbum ? albumCols : cols, columnGap: '1rem', marginBottom: '2.5rem' }}>
          {together.map(d => (
            <div key={d._id || d.name} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
              <TogetherCard {...d}
                onClick={() => setSelected(d)}
                onDelete={isAdmin && onDelete ? (id) => onDelete(id) : undefined}
                selected={selectedIds.includes(d._id)}
                onToggleSelect={isAdmin ? toggleSelect : undefined}
                isAlbum={isAlbum}
              />
            </div>
          ))}
        </div>
      )}

      {/* Individual/single portrait cards */}
      {singles.length > 0 && (
        <div style={{ columns: cols, columnGap: '1rem' }}>
          {singles.map(d => (
            <div key={d._id || d.name} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
              <Card {...d}
                onClick={() => setSelected(d)}
                onDelete={isAdmin && onDelete ? (id) => onDelete(id) : undefined}
                selected={selectedIds.includes(d._id)}
                onToggleSelect={isAdmin ? toggleSelect : undefined}
                isAlbum={isAlbum}
                collection={collection}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail/edit modal — suppressed in album mode or for together cards (lightbox is used instead) */}
      <Modal card={(isAlbum || selected?.type === 'together') ? null : selected} onClose={() => setSelected(null)} collection={collection} onUpdate={onUpdate} />

      {/* Lightbox — photo-only overlay for album mode or together cards */}
      {(isAlbum || selected?.type === 'together') && (
        <Lightbox photo={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
