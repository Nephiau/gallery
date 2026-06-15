import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './components/Navbar'
import Siswa from './pages/Siswa'
import Guru from './pages/Guru'
import Momen from './pages/Momen'
import Login from './pages/Login'
import Register from './pages/Register'
import UploadRequest from './pages/UploadRequest'
import AdminMailbox from './pages/AdminMailbox'
import BulkUpload from './pages/BulkUpload'

gsap.registerPlugin(ScrollTrigger)

// Single photo card in the masonry grid.
// Fades + slides in when it enters the viewport via IntersectionObserver.
// Uses a varied aspect ratio based on its position to create a natural masonry feel.
function FadePhoto({ src, delay, span, onClick }) {
  const ref = useRef(null)
  const ratios = ['4/3', '3/4', '1/1', '16/9', '3/5']
  const ratio = ratios[Math.floor(delay / 80 + span) % ratios.length]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      el.style.opacity = entry.isIntersecting ? '1' : '0'
      el.style.transform = entry.isIntersecting ? 'translateY(0)' : 'translateY(28px)'
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} onClick={onClick} style={{
      overflow: 'hidden', borderRadius: '4px', marginBottom: '1rem',
      breakInside: 'avoid', cursor: 'pointer',
      opacity: 0, transform: 'translateY(28px)',
      transition: `opacity 800ms ease ${delay}ms, transform 800ms ease ${delay}ms`,
    }}>
      <img src={src} alt="" loading="lazy"
        style={{ width: '100%', aspectRatio: ratio, objectFit: 'cover', display: 'block', transition: 'transform 700ms ease-out' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      />
    </div>
  )
}

// Full-screen image overlay shown when user clicks a photo.
// Closes on backdrop click or Escape key.
function Lightbox({ photo, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!photo) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      cursor: 'zoom-out',
    }}>
      <img src={photo.image} alt={photo.name || ''} style={{
        maxWidth: '90vw', maxHeight: '90vh',
        objectFit: 'contain', borderRadius: '8px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }} />
      <button onClick={onClose} style={{
        position: 'fixed', top: '1.5rem', right: '2rem',
        background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
        borderRadius: '50%', width: '44px', height: '44px',
        fontSize: '1.5rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)', fontFamily: 'var(--font-body)',
      }}>✕</button>
    </div>
  )
}

// One letter of the hero "ASHATARA" title.
// Each letter animates in with a staggered GSAP delay.
function HeroLetter({ ch, index }) {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.5 + index * 0.12 }
    )
  }, [index])
  return <span ref={ref} style={{ display: 'inline-block', opacity: 0 }}>{ch}</span>
}

// One word of the tagline section.
// Animates in (slide up + fade) when it scrolls into view via ScrollTrigger.
function WordReveal({ word, delay }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          delay: delay * 0.15,
          scrollTrigger: { trigger: el, start: 'top 60%', toggleActions: 'play none none none' },
        }
      )
    })
    return () => ctx.revert()
  }, [delay])
  return (
    <span ref={ref} style={{ display: 'inline-block', opacity: 0, marginRight: '0.3em' }}>
      {word}
    </span>
  )
}

// Main landing page with hero, tagline, photo masonry, and CTA.
function Home() {
  const heroRef = useRef(null)       // wraps the pinned hero section
  const heroTextRef = useRef(null)   // the "ASHATARA" text that shrinks into navbar
  const taglineRef = useRef(null)    // the "SATU HARAPAN" tagline
  const photoRef = useRef(null)      // the masonry photo grid section

  const [logoOpacity, setLogoOpacity] = useState(0)   // drives navbar logo fade-in during scroll
  const [taglineGone, setTaglineGone] = useState(false) // true once tagline scrolls past navbar height
  const [momen, setMomen] = useState([])               // merged momen + album photos for the grid
  const [selectedPhoto, setSelectedPhoto] = useState(null) // photo currently open in lightbox
  const [showCta, setShowCta] = useState(false)        // whether "Cari Temanmu" button is visible

  // Fetch momen photos + siswa album (together) photos, then merge and shuffle
  useEffect(() => {
    Promise.all([
      fetch('/api/momen').then(r => r.json()),
      fetch('/api/siswa').then(r => r.json()).then(d => d.filter(s => s.type === 'together')),
    ]).then(([momenData, albumData]) => {
      const merged = [...momenData, ...albumData].sort(() => Math.random() - 0.5)
      setMomen(merged)
    }).catch(() => {})
  }, [])

  // Show/hide CTA button based on whether the photo section is in the viewport
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setShowCta(e.isIntersecting), { threshold: 0.05 })
    if (photoRef.current) obs.observe(photoRef.current)
    return () => obs.disconnect()
  }, [])

  // GSAP: pin the hero section, then fly "ASHATARA" text into the navbar on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=60%',
          pin: true, pinSpacing: true, scrub: 0.6,
          // fade in the navbar logo as the hero text disappears
          onUpdate: self => setLogoOpacity(Math.max(0, (self.progress - 0.6) / 0.4)),
        }
      })
      tl.to(heroTextRef.current, { duration: 0.6 }) // hold in place briefly
      tl.to(heroTextRef.current, {
        scale: 0.06,
        x: () => -(heroTextRef.current.getBoundingClientRect().left + heroTextRef.current.getBoundingClientRect().width / 2) + 80,
        y: () => -(heroTextRef.current.getBoundingClientRect().top + heroTextRef.current.getBoundingClientRect().height / 2) + 28,
        opacity: 0, ease: 'power4.in', duration: 0.4,
      })
    })
    return () => ctx.revert()
  }, [])

  // Track when the tagline element scrolls above the navbar (used to show navbar subtitle)
  useEffect(() => {
    const onScroll = () => {
      const el = taglineRef.current
      if (!el) return
      setTaglineGone(el.getBoundingClientRect().top < 80)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // GSAP: pin the tagline, hold it, then shrink it off-screen toward the top
  useEffect(() => {
    const el = taglineRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el, start: 'center center', end: '+=85%',
          pin: true, pinSpacing: true, scrub: true,
        }
      })
      tl.to(el, { duration: 0.6 }) // hold for ~60% of scroll travel
      tl.to(el, {
        scale: 0.05, opacity: 0,
        x: () => window.innerWidth / 2 - (el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2),
        y: -window.innerHeight,
        ease: 'power2.in', duration: 0.4,
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Navbar logoOpacity={logoOpacity} taglineGone={taglineGone} />

      {/* Hero section — full-viewport, pinned during scroll */}
      <div ref={heroRef} style={{ height: '100vh', position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* Animated "ASHATARA" title — each letter staggers in */}
          <div ref={heroTextRef} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            transformOrigin: 'center center',
          }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(4rem, 15vw, 14rem)',
              fontWeight: 600, color: 'var(--sage-deep)',
              letterSpacing: '-0.02em', lineHeight: 1,
              textAlign: 'center', cursor: 'default',
            }}>
              {'ASHATARA'.split('').map((ch, i) => (
                <HeroLetter key={i} ch={ch} index={i} />
              ))}
            </h1>
          </div>

          {/* "scroll down" hint — fades out as user scrolls */}
          <p style={{
            position: 'absolute', bottom: '3rem',
            fontFamily: 'var(--font-body)', fontSize: '0.7rem',
            letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
            opacity: Math.max(1 - logoOpacity * 5, 0),
          }}>scroll down</p>
        </div>
      </div>

      {/* Tagline section — "SATU HARAPAN SATU ASHATARA", pinned then exits */}
      <div style={{ textAlign: 'center', padding: '14rem 2rem 1.5rem', overflow: 'hidden' }}>
        <h2 ref={taglineRef} style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3rem, 10vw, 8rem)',
          fontWeight: 600, color: 'var(--sage-deep)',
          letterSpacing: '0.04em', lineHeight: 1.2, display: 'inline-block',
        }}>
          {[['SATU', 'HARAPAN'], ['SATU', 'ASHATARA']].map((line, li) => (
            <span key={li} style={{ display: 'block' }}>
              {line.map((word, wi) => (
                <WordReveal key={wi} word={word} delay={li * 2 + wi} />
              ))}
            </span>
          ))}
        </h2>
      </div>

      {/* Photo masonry grid — momen + album (together) photos, merged and shuffled */}
      <section ref={photoRef} style={{ padding: '0 3rem 6rem', columns: '3', columnGap: '1rem' }}>
        {momen.map((m, i) => (
          <FadePhoto key={m._id} src={m.image} delay={(i % 3) * 80} span={i % 5 === 0 ? 2 : 1} onClick={() => setSelectedPhoto(m)} />
        ))}
      </section>

      {/* Lightbox overlay for clicked photo */}
      <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />

      {/* "Cari Temanmu" CTA — fixed at bottom center, visible only while photo grid is in view */}
      <a href="/siswa" style={{
        position: 'fixed', bottom: '3.5rem', left: '50%',
        zIndex: 100,
        display: 'inline-block',
        padding: '0.85rem 2.25rem', borderRadius: '999px',
        fontFamily: 'var(--font-body)', fontSize: '0.85rem',
        letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none',
        background: 'linear-gradient(135deg, rgba(210,185,235,0.85) 0%, rgba(180,235,235,0.7) 100%)',
        color: 'var(--sage-deep)', border: '1px solid rgba(210,185,235,0.7)',
        backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        whiteSpace: 'nowrap',
        transform: showCta ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        opacity: showCta ? 1 : 0,
        pointerEvents: showCta ? 'auto' : 'none',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.2,0.64,1)',
      }}>
        Cari Temanmu
      </a>
    </div>
  )
}

// Root app — sets up client-side routing for all pages
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/siswa" element={<><Navbar /><Siswa /></>} />
        <Route path="/guru" element={<><Navbar /><Guru /></>} />
        <Route path="/momen" element={<><Navbar /><Momen /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<><Navbar /><UploadRequest /></>} />
        <Route path="/admin/mailbox" element={<><Navbar /><AdminMailbox /></>} />
        <Route path="/admin/bulk-upload" element={<><Navbar /><BulkUpload /></>} />
      </Routes>
    </BrowserRouter>
  )
}
