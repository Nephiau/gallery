import { useEffect, useState } from 'react'
import useMediaQuery from '../useMediaQuery'

// Shared input style for the edit form fields
const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
  outline: 'none', boxSizing: 'border-box',
}

// Detail modal shown when a card is clicked.
// Displays the photo + full info. Admins also get an edit form to update the record in-place.
export default function Modal({ card, onClose, collection, onUpdate }) {
  const [visible, setVisible] = useState(false) // drives CSS enter animation
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', nickname: '', className: '', quote: '', birthPlace: '', instagram: '', birthDate: '' })
  const [saving, setSaving] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const isAdmin = token && role === 'admin'

  // When a card is passed in, trigger the enter animation and populate the form.
  // When cleared (null), trigger exit by setting visible = false.
  useEffect(() => {
    if (card) {
      requestAnimationFrame(() => setVisible(true)) // defer so CSS transition fires
      setForm({
        name: card.name || '', nickname: card.nickname || '', className: card.className || '',
        quote: card.quote || '', birthPlace: card.birthPlace || '', instagram: card.instagram || '',
        birthDate: card.birthDate ? new Date(card.birthDate).toISOString().split('T')[0] : '',
      })
      setEditing(false)
    } else {
      setVisible(false)
    }
  }, [card])

  // PUT updated form data to the API and notify parent via onUpdate
  const handleSave = async () => {
    if (!card) return
    setSaving(true)
    try {
      const res = await fetch(`/api/${collection.toLowerCase()}/${card._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setEditing(false)
        if (onUpdate) onUpdate({ ...card, ...form })
      }
    } catch {}
    setSaving(false)
  }

  if (!card) return null

  return (
    // Backdrop — click to close
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      transition: 'background 400ms ease',
    }}>
      {/* Modal panel — stop click propagation so backdrop click doesn't bubble */}
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(255,255,255,0.95)', borderRadius: '16px',
        overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        border: '1px solid var(--border)', fontFamily: 'var(--font-body)',
        maxWidth: isMobile ? '92%' : '1100px',
        width: isMobile ? '92%' : '92%',
        maxHeight: isMobile ? '85vh' : '90vh',
        overflowY: isMobile ? 'auto' : 'visible',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(24px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 450ms cubic-bezier(0.34,1.56,0.64,1), opacity 350ms ease',
        position: 'relative',
      }}>
        {/* Close button — always visible on mobile */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10,
          background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none',
          borderRadius: '50%', width: '32px', height: '32px',
          fontSize: '1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* Left side: photo */}
        <div style={{ flex: isMobile ? '0 0 auto' : '0 0 420px', maxHeight: isMobile ? '35vh' : 'none' }}>
          <img src={card.image} alt={card.name}
            style={{ width: '100%', height: '100%', maxHeight: isMobile ? '35vh' : 'none', objectFit: 'cover', display: 'block' }} />
        </div>

        {/* Right side: info or edit form */}
        <div style={{
          flex: 1, padding: isMobile ? '1rem' : '3.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          gap: '0.5rem', position: 'relative',
        }}>
          {/* Edit toggle button — admin only */}
          {isAdmin && !editing && (
            <button onClick={() => setEditing(true)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
              color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)', fontSize: '0.75rem',
            }}>Edit</button>
          )}

          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
            #{card.indexNumber || '-'}
          </p>

          {editing ? (
            /* Edit form — fields vary by collection type */
            <>
              <input style={inputStyle} placeholder="Nama Lengkap" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {collection === 'Siswa' && (
                <input style={inputStyle} placeholder="Nama Panggilan" value={form.nickname}
                  onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
              )}
              <input style={inputStyle} placeholder="Kelas" value={form.className}
                onChange={e => setForm(f => ({ ...f, className: e.target.value }))} />
              {collection === 'Siswa' && (
                <>
                  <input style={inputStyle} placeholder="Tempat Lahir" value={form.birthPlace}
                    onChange={e => setForm(f => ({ ...f, birthPlace: e.target.value }))} />
                  <input style={inputStyle} type="date" value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
                  <input style={inputStyle} placeholder="ID Instagram" value={form.instagram}
                    onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
                </>
              )}
              {/* Momen records don't have a quote field */}
              {collection !== 'Momen' && (
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Quote" value={form.quote}
                  onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={handleSave} disabled={saving} style={{
                  padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer',
                  border: 'none', background: 'var(--sage-deep)', color: '#fff',
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                {/* Cancel resets form back to original card data */}
                <button onClick={() => {
                  setEditing(false)
                  setForm({ name: card.name || '', nickname: card.nickname || '', className: card.className || '', quote: card.quote || '', birthPlace: card.birthPlace || '', instagram: card.instagram || '', birthDate: card.birthDate ? new Date(card.birthDate).toISOString().split('T')[0] : '' })
                }} style={{
                  padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                }}>Batal</button>
              </div>
            </>
          ) : (
            /* Read-only view */
            <>
              <p style={{ fontWeight: 600, fontSize: isMobile ? '1.25rem' : '2rem', color: 'var(--ink)' }}>{card.name}</p>
              {card.nickname && <p style={{ fontSize: '1rem', color: 'var(--sage-deep)', marginTop: '-0.25rem' }}>@{card.nickname}</p>}
              <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                {card.nomorAbsen && <>#{card.nomorAbsen} · </>}{card.className}
              </p>
              {card.quote && (
                <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', lineHeight: 1.8, marginBottom: '0.5rem' }}>
                  "{card.quote}"
                </p>
              )}
              {card.instagram && <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>📷 @{card.instagram}</p>}
              {card.birthPlace && card.birthDate && (
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  📍 {card.birthPlace}, {new Date(card.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
