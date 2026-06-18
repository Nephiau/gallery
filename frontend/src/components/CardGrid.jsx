import { useState } from 'react'
import Card from './Card'
import TogetherCard from './TogetherCard'
import Modal from './Modal'
import Lightbox from './Lightbox'
import useMediaQuery from '../useMediaQuery'

// Renders a masonry grid of student/teacher/moment cards.
// Splits data into 'together' (group photos) and 'single' (individual) sections.
// Admins can select multiple cards for bulk deletion, or click edit on a card to open the modal in edit mode.
export default function CardGrid({ data, onDelete, collection, onBulkDelete, onUpdate, isAlbum, onModalChange }) {
  const [selected, setSelected] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const setSelectedWithCallback = (val) => {
    setSelected(val)
    setEditMode(false)
    if (onModalChange) onModalChange(!!val)
  }
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
    setConfirmDelete(true)
  }

  const confirmAndDelete = () => {
    setConfirmDelete(false)
    onBulkDelete(selectedIds)
    setSelectedIds([])
  }

  // Edit handler: find the card by id and open the modal with editing mode enabled
  const handleEdit = (id) => {
    const card = data.find(d => d._id === id)
    if (card) {
      setSelected(card)
      setEditMode(true)
      if (onModalChange) onModalChange(true)
    }
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
                onClick={() => setSelectedWithCallback(d)}
                onEdit={isAdmin ? () => handleEdit(d._id) : undefined}
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
                onClick={() => setSelectedWithCallback(d)}
                onEdit={isAdmin ? () => handleEdit(d._id) : undefined}
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
      <Modal card={(isAlbum || selected?.type === 'together') ? null : selected}
        onClose={() => setSelectedWithCallback(null)}
        collection={collection} onUpdate={onUpdate}
        startEditing={editMode} />

      {/* Lightbox — photo-only overlay for album mode or together cards */}
      {(isAlbum || selected?.type === 'together') && (
        <Lightbox photo={selected} onClose={() => setSelectedWithCallback(null)} />
      )}

      {/* Custom bulk-delete confirmation dialog */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '2rem', maxWidth: '320px', width: '90%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', fontFamily: 'var(--font-body)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗑️</p>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>Hapus {selectedIds.length} item?</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>Tindakan ini tidak bisa dibatalkan.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Batal</button>
              <button onClick={confirmAndDelete} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', border: 'none', background: '#c0392b', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}