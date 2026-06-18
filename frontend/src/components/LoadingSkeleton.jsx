import { useMemo } from 'react'
import useMediaQuery from '../useMediaQuery'

// Skeleton placeholder cards shown while data is loading.
// Matches the masonry grid layout of the actual cards (CardGrid columns).
export default function LoadingSkeleton({ count = 8, isAlbum = false }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const cols = isMobile ? '2' : isAlbum ? '3' : '4'

  // Generate stable random-looking aspect ratios so skeleton cards look varied like real masonry
  const items = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const ratios = ['4/3', '3/4', '1/1', '16/9', '3/5']
      const ratio = ratios[i % ratios.length]
      return { id: i, ratio }
    }),
    [count]
  )

  return (
    <div style={{ columns: cols, columnGap: '1rem' }}>
      {items.map(item => (
        <div key={item.id} style={{
          breakInside: 'avoid', marginBottom: '1rem',
          borderRadius: '8px', overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.85)',
        }}>
          {/* Skeleton image area */}
          <div style={{
            width: '100%',
            aspectRatio: isAlbum ? 'auto' : item.ratio,
            background: 'linear-gradient(90deg, rgba(200,200,200,0.12) 25%, rgba(200,200,200,0.25) 50%, rgba(200,200,200,0.12) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            minHeight: isAlbum ? '200px' : undefined,
          }} />

          {/* Skeleton text lines */}
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{
              height: '10px', width: '40%', borderRadius: '4px',
              background: 'rgba(200,200,200,0.2)',
              animation: 'pulse-skeleton 1.6s ease-in-out infinite',
            }} />
            <div style={{
              height: '14px', width: '70%', borderRadius: '4px',
              background: 'rgba(200,200,200,0.2)',
              animation: 'pulse-skeleton 1.6s ease-in-out infinite 0.2s',
            }} />
            <div style={{
              height: '12px', width: '55%', borderRadius: '4px',
              background: 'rgba(200,200,200,0.2)',
              animation: 'pulse-skeleton 1.6s ease-in-out infinite 0.4s',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}