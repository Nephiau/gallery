import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useMediaQuery from '../useMediaQuery'

// Category groups for the target collection selector
const categories = [
  { label: '📅 Tahun — Momen', group: 'tahun', options: ['2023', '2024', '2025', '2026'] },
  { label: '🎓 Kelas — Siswa', group: 'kelas', options: ['XII A', 'XII B', 'XII C', 'XII D', 'XII E', 'XII F', 'XII G', 'XII H'] },
  { label: '👨‍🏫 Guru', group: 'guru', options: ['Guru'] },
]

// Returns true if the selected category maps to Siswa (not Guru or Momen year)
const isSiswaCategory = cat => !['Guru', '2023', '2024', '2025', '2026'].includes(cat)

// Admin-only bulk photo upload page.
// Uploads up to 50 photos at once; backend matches filenames to student records for Siswa,
// or creates new records for Guru/Momen.
export default function BulkUpload() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const fileRef = useRef(null) // ref to reset the file input after upload

  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])   // object URLs for thumbnail preview grid
  const [category, setCategory] = useState('2026')
  const [photoType, setPhotoType] = useState('single') // 'single' | 'together'
  const [namePrefix, setNamePrefix] = useState('')     // optional name prefix for Guru/Momen
  const [quote, setQuote] = useState('')               // optional quote applied to all single siswa uploads
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const isSiswa = isSiswaCategory(category)

  // Redirect non-admins back to home
  if (!token || role !== 'admin') {
    navigate('/')
    return null
  }

  // Build preview thumbnails when files are selected
  const handleSelect = e => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviews(selected.map(f => URL.createObjectURL(f)))
  }

  // Send photos as multipart/form-data to the bulk-upload endpoint
  const handleUpload = async () => {
    if (files.length === 0) return setError('Pilih file terlebih dahulu')
    setError(''); setResult(null); setUploading(true)

    const formData = new FormData()
    files.forEach(f => formData.append('photos', f))
    formData.append('category', category)
    if (namePrefix.trim()) formData.append('namePrefix', namePrefix.trim())
    if (isSiswa) formData.append('type', photoType)
    // Quote is only relevant for single siswa uploads
    if (isSiswa && photoType === 'single' && quote.trim()) formData.append('quote', quote.trim())

    try {
      const res = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      // Read as text first — if server returns HTML (crash/404), show it clearly
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { throw new Error(`Server error (${res.status}): ${text.slice(0, 200)}`) }
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      // Reset file selection after successful upload
      setFiles([]); setPreviews([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
  }

  // Human-readable label for the target collection
  const targetLabel = (() => {
    if (category === 'Guru') return 'Guru'
    if (['2023','2024','2025','2026'].includes(category)) return 'Momen'
    return 'Siswa'
  })()

  return (
    <div style={{ padding: isMobile ? '5rem 1rem 3rem' : '6rem 3rem 4rem', background: 'var(--background)', minHeight: '100vh' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '2rem' : '3rem', color: 'var(--sage-deep)', marginBottom: '2rem' }}>
        Upload Foto Massal
      </h2>

      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</p>}
        {result && (
          <p style={{ color: '#2e7d32', fontSize: '0.85rem', background: 'rgba(46,125,50,0.08)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
            ✅ {result.count} foto berhasil ditambahkan ke <strong>{result.collection}</strong>!
          </p>
        )}

        {/* Multi-file picker */}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.3rem' }}>
            Pilih foto (bisa pilih banyak sekaligus)
          </label>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleSelect}
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink)' }} />
        </div>

        {/* Thumbnail preview grid — scrollable if many files are selected */}
        {previews.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px' }}>
            {previews.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} />
            ))}
          </div>
        )}

        {/* Target collection selector — determines where photos are stored */}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.3rem' }}>
            Kategori — Akan ditambahkan ke database <strong>{targetLabel}</strong>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.map(group => (
              <fieldset key={group.group} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.6rem 0.8rem' }}>
                <legend style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', padding: '0 0.3rem' }}>{group.label}</legend>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {group.options.map(opt => (
                    <button key={opt} type="button" onClick={() => setCategory(opt)} style={{
                      padding: '0.3rem 0.8rem', borderRadius: '999px', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '0.05em',
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

        {/* Photo type — only for Siswa; determines Cloudinary folder and DB type field */}
        {isSiswa && (
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.3rem' }}>
              Tipe Foto — akan disimpan ke folder <strong>siswa/{photoType}</strong> di Cloudinary
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['single', 'together'].map(t => (
                <button key={t} type="button" onClick={() => setPhotoType(t)} style={{
                  padding: '0.3rem 0.8rem', borderRadius: '999px', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '0.05em',
                  border: '1px solid var(--border)',
                  background: photoType === t ? 'var(--sage-deep)' : 'rgba(255,255,255,0.75)',
                  color: photoType === t ? '#fff' : 'var(--muted-foreground)',
                  transition: 'background 250ms, color 250ms',
                }}>{t === 'single' ? '👤 Perorangan' : '👥 Bersama'}</button>
              ))}
            </div>
          </div>
        )}

        {/* Name prefix — used as the record name for Guru/Momen; ignored for Siswa (filename used instead) */}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.3rem' }}>
            Nama (opsional — jika dikosongkan pakai nama file)
          </label>
          <input type="text" placeholder="Contoh: Andi Pratama" value={namePrefix} onChange={e => setNamePrefix(e.target.value)}
            style={{ width: '100%', maxWidth: '320px', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Quote — applied to all uploaded single siswa photos */}
        {isSiswa && photoType === 'single' && (
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.3rem' }}>
              Quote / Kata-kata (akan dipakai untuk semua foto)
            </label>
            <input type="text" placeholder="Contoh: Terima kasih untuk kenangan indah" value={quote} onChange={e => setQuote(e.target.value)}
              style={{ width: '100%', maxWidth: '320px', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* Upload button — disabled until files are selected */}
        <button onClick={handleUpload} disabled={uploading || files.length === 0} style={{
          padding: '0.65rem 2rem', borderRadius: '6px', cursor: files.length === 0 ? 'not-allowed' : 'pointer',
          background: uploading ? 'var(--sage-soft)' : 'var(--sage-deep)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: '0.85rem', letterSpacing: '0.1em',
          alignSelf: 'flex-start', opacity: files.length === 0 ? 0.5 : 1,
        }}>
          {uploading ? 'Mengupload...' : `UPLOAD ${files.length} FOTO KE ${targetLabel.toUpperCase()}`}
        </button>
      </div>
    </div>
  )
}
