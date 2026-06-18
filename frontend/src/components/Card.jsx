import { useState } from 'react'

export default function Card({ image, name, nickname, className, quote, instagram, _id, onClick, onEdit, onDelete, selected, onToggleSelect, isAlbum, collection }) {
  const isSelectable = !!onToggleSelect
  const isGuru = collection === 'Guru'
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div style={{ width: '100%' }}>
      <div className="card-wrap" onClick={onClick} style={{
        borderRadius: '8px', overflow: 'hidden',
        border: selected ? '2px solid var(--sage-deep)' : '1px solid var(--border)',
        background: 'rgba(255,255,255,0.85)',
        fontFamily: 'var(--font-body)', cursor: 'pointer',
        transition: 'transform 400ms cubic-bezier(0.34,1.2,0.64,1), box-shadow 400ms ease',
        transformOrigin: 'center center',
        boxShadow: selected ? '0 0 0 3px rgba(74,106,74,0.2)' : 'none',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (isGuru) {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(180,210,240,0.6), 0 4px 24px rgba(180,200,255,0.5), 0 2px 12px rgba(210,185,235,0.4)'
          e.currentTarget.style.transform = 'scale(1.03)'
        } else {
          e.currentTarget.style.transform = 'scale(1.07)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = selected ? '0 0 0 3px rgba(74,106,74,0.2)' : 'none'
        e.currentTarget.style.transform = 'scale(1)'
      }}
      >
        {/* Decorative corner brackets (CSS hover effect) */}
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />

        {/* Bulk-select checkbox — admin only */}
        {isSelectable && (
          <div
            onClick={e => { e.stopPropagation(); onToggleSelect(_id) }}
            style={{
              position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10,
              width: '24px', height: '24px', borderRadius: '4px',
              background: selected ? 'var(--sage-deep)' : 'rgba(255,255,255,0.85)',
              border: selected ? '2px solid var(--sage-deep)' : '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 200ms, border-color 200ms',
              color: selected ? '#fff' : 'transparent',
              fontSize: '0.75rem', fontWeight: 700,
            }}
          >{selected ? '✓' : ''}</div>
        )}

        {/* Photo — falls back to placeholder if no image */}
        {image ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: isAlbum ? 'unset' : '1/1' }}>
            {!imgLoaded && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, rgba(200,200,200,0.15) 25%, rgba(200,200,200,0.3) 50%, rgba(200,200,200,0.15) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }} />
            )}
            <img src={image} alt={name} loading="lazy"
              onLoad={() => setImgLoaded(true)}
              style={{ width: '100%', aspectRatio: isAlbum ? 'unset' : '1/1', objectFit: 'cover', display: 'block', opacity: imgLoaded ? 1 : 0, transition: 'opacity 300ms ease' }} />
          </div>
        ) : (
          <div style={{
            width: '100%', aspectRatio: '1/1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(200,200,200,0.15)', color: 'var(--muted-foreground)',
            fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            No Photo
          </div>
        )}

        {/* Card info */}
        <div style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            {className}
          </p>
          <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.15rem' }}>{name}</p>
          {instagram && <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>IG: @{instagram}</p>}
          {quote && <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>"{quote}"</p>}
          
        </div>

        {/* Edit button — admin only, appears on hover. Opens modal in edit mode. */}
        {onEdit && (
          <button
            onClick={e => {
              e.stopPropagation()
              onEdit(_id)
            }}
            className="delete-btn"
            style={{
              position: 'absolute', top: '0.5rem', right: '0.5rem',
              background: 'var(--sage-deep)', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem',
              cursor: 'pointer', zIndex: 4,
              fontWeight: 600,
            }}
          >✎</button>
        )}
      </div>
    </div>
  )
}