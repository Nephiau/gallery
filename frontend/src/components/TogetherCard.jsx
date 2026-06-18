import { useState } from 'react'

export default function TogetherCard({ image, name, className, _id, onClick, onEdit, onDelete, selected, onToggleSelect, isAlbum }) {
  const isSelectable = !!onToggleSelect
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div style={{ width: '100%' }}>
      <div className="card-wrap" onClick={onClick} style={{
        borderRadius: '8px', overflow: 'hidden',
        border: selected ? '2px solid var(--sage-deep)' : '1px solid var(--border)',
        background: 'rgba(255,255,255,0.85)',
        fontFamily: 'var(--font-body)', cursor: 'pointer',
        transition: 'box-shadow 400ms ease',
        boxShadow: selected ? '0 0 0 3px rgba(74,106,74,0.2)' : 'none',
        position: 'relative',
      }}
      onMouseEnter={e => { const img = e.currentTarget.querySelector('img'); if (img) img.style.transform = 'scale(1.08)' }}
      onMouseLeave={e => { const img = e.currentTarget.querySelector('img'); if (img) img.style.transform = 'scale(1)' }}
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

        {/* Photo — natural ratio in album mode, 1:1 square otherwise */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: isAlbum ? 'unset' : '1/1', minHeight: imgLoaded ? 'unset' : '120px' }}>
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
            style={{ width: '100%', aspectRatio: isAlbum ? 'unset' : '1/1', objectFit: 'cover', display: 'block', transition: 'transform 400ms ease, opacity 300ms ease', opacity: imgLoaded ? 1 : 0 }} />
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