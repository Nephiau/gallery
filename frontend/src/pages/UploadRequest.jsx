import { useEffect, useState } from 'react'
import useMediaQuery from '../useMediaQuery'

const inputStyle = {
  width: '100%', padding: '0.6rem 1rem', borderRadius: '6px',
  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
  color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
  outline: 'none', boxSizing: 'border-box',
}

const categories = [
  { label: '📅 Tahun — Momen', group: 'tahun', options: ['2023', '2024', '2025', '2026'] },
  { label: '🎓 Kelas — Siswa', group: 'kelas', options: ['XII A', 'XII B', 'XII C', 'XII D', 'XII E', 'XII F', 'XII G', 'XII H'] },
  { label: '👨‍🏫 Guru', group: 'guru', options: ['Guru'] },
]

const isSiswaCategory = cat => !['Guru', '2023', '2024', '2025', '2026'].includes(cat)
const MAX_PHOTOS = 5

// Compress a File to a base64 JPEG (max 800px, 0.7 quality)
const compressToBase64 = (file) => new Promise(resolve => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    const MAX = 800
    const scale = Math.min(1, MAX / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    resolve(canvas.toDataURL('image/jpeg', 0.7))
  }
  img.src = url
})

export default function UploadRequest() {
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username') || 'guest'
  const isAdmin = localStorage.getItem('role') === 'admin'

  const visibleCategories = isAdmin ? categories : categories.filter(g => g.group === 'tahun')

  const [form, setForm] = useState({ name: '', quote: '' })
  const [category, setCategory] = useState('2025')
  const [photoType, setPhotoType] = useState('single')
  const [images, setImages] = useState([])   // array of base64 strings (max 5)
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isMobile = useMediaQuery('(max-width: 768px)')

  const isSiswa = isSiswaCategory(category)

  useEffect(() => {
    if (token) {
      fetch('/api/requests/mine', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setRequests).catch(() => {})
    } else {
      setRequests(JSON.parse(localStorage.getItem('guestRequests') || '[]'))
    }
  }, [])

  // Handle file selection — compress each file, enforce max 5
  const handleImages = async e => {
    const files = Array.from(e.target.files).slice(0, MAX_PHOTOS)
    const compressed = await Promise.all(files.map(compressToBase64))
    setImages(compressed)
  }

  // Remove a single image from the selection
  const removeImage = idx => setImages(prev => prev.filter((_, i) => i !== idx))

  // Submit one PhotoRequest per image
  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (images.length === 0) return setError('Pilih minimal 1 gambar')

    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const payload = {
      name: form.name, className: category, quote: form.quote,
      indexNumber: '', category, type: isSiswa ? photoType : 'single', submittedBy: username,
    }

    try {
      // Submit each image as a separate request
      await Promise.all(images.map(img =>
        fetch('/api/requests', { method: 'POST', headers, body: JSON.stringify({ ...payload, image: img }) })
      ))
    } catch {
      return setError('Gagal mengirim permintaan')
    }

    setSuccess('Permintaan berhasil dikirim!')
    setForm({ name: '', quote: '' })
    setImages([])
  }

  return (
    <div style={{ padding: isMobile ? '5rem 1rem 3rem' : '6rem 3rem 4rem', background: 'var(--background)', minHeight: '100vh' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '2rem' : '3rem', color: 'var(--sage-deep)', marginBottom: '2rem' }}>Upload Foto</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '3rem' }}>
        {error && <p style={{ color: '#c0392b', fontSize: '0.8rem' }}>{error}</p>}

        {/* Success popup for non-admins */}
        {success && (
          isAdmin
            ? <p style={{ color: '#2e7d32', fontSize: '0.8rem' }}>{success}</p>
            : (
              <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', maxWidth: '320px', width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', fontFamily: 'var(--font-body)' }}>
                  <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📬</p>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Permintaan Terkirim!</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>Menunggu persetujuan admin.</p>
                  <button type="button" onClick={() => setSuccess('')} style={{ padding: '0.6rem 1.5rem', borderRadius: '999px', cursor: 'pointer', background: 'var(--sage-deep)', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>OK</button>
                </div>
              </div>
            )
        )}

        <input style={inputStyle} placeholder="Nama" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />

        {/* Category picker */}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.3rem' }}>Kategori</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visibleCategories.map(group => (
              <fieldset key={group.group} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.6rem 0.8rem' }}>
                <legend style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', padding: '0 0.3rem' }}>{group.label}</legend>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {group.options.map(opt => (
                    <button key={opt} type="button" onClick={() => setCategory(opt)} style={{
                      padding: '0.3rem 0.8rem', borderRadius: '999px', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                      border: '1px solid var(--border)',
                      background: category === opt ? 'var(--sage-deep)' : 'rgba(255,255,255,0.75)',
                      color: category === opt ? '#fff' : 'var(--muted-foreground)',
                      transition: 'background 250ms, color 250ms',
                    }}>{opt}</button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        {/* Photo type — Siswa only */}
        {isSiswa && (
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.3rem' }}>Tipe Foto</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['single', 'together'].map(t => (
                <button key={t} type="button" onClick={() => setPhotoType(t)} style={{
                  padding: '0.3rem 0.8rem', borderRadius: '999px', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                  border: '1px solid var(--border)',
                  background: photoType === t ? 'var(--sage-deep)' : 'rgba(255,255,255,0.75)',
                  color: photoType === t ? '#fff' : 'var(--muted-foreground)',
                  transition: 'background 250ms, color 250ms',
                }}>{t === 'single' ? '👤 Perorangan' : '👥 Bersama'}</button>
              ))}
            </div>
          </div>
        )}

        {/* Multi-image picker — max 5 */}
        <div>
          <input id="file-input" type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} />
          <label htmlFor="file-input" style={{
            display: 'inline-block', padding: '0.6rem 1.25rem', borderRadius: '6px',
            border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)',
            color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)',
            fontSize: '0.85rem', cursor: 'pointer',
          }}>
            📎 {images.length > 0 ? `${images.length} foto dipilih` : `Pilih Foto (maks ${MAX_PHOTOS})`}
          </label>

          {/* Preview grid with remove buttons */}
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {images.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                  <button type="button" onClick={() => removeImage(i)} style={{
                    position: 'absolute', top: '2px', right: '2px',
                    background: 'rgba(192,57,43,0.85)', color: '#fff', border: 'none',
                    borderRadius: '4px', width: '20px', height: '20px',
                    fontSize: '0.65rem', cursor: 'pointer', lineHeight: 1,
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quote — required for single siswa */}
        <input style={inputStyle}
          placeholder={isSiswa && photoType === 'single' ? 'Quote / Kata-kata (wajib)' : 'Keterangan (opsional)'}
          value={form.quote} required={isSiswa && photoType === 'single'}
          onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />

        <button type="submit" style={{
          padding: '0.65rem', borderRadius: '6px', cursor: 'pointer',
          background: 'var(--sage-deep)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: '0.85rem', letterSpacing: '0.1em',
        }}>KIRIM PERMINTAAN</button>
      </form>

      {/* Riwayat — admin only */}
      {isAdmin && (
        <>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--sage-deep)', marginBottom: '1rem' }}>Riwayat Permintaan</h3>
          {requests.length === 0
            ? <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Belum ada permintaan.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '480px' }}>
                {requests.map(r => (
                  <div key={r._id} style={{ padding: '0.9rem 1rem', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {r.image && <img src={r.image} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink)' }}>{r.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.className}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2e7d32', textTransform: 'uppercase' }}>Terkirim</span>
                  </div>
                ))}
              </div>
          }
        </>
      )}
    </div>
  )
}
