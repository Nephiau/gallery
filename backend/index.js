require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const Siswa = require('./models/Siswa')
const Guru = require('./models/Guru')
const Momen = require('./models/Momen')
const User = require('./models/User')
const PhotoRequest = require('./models/PhotoRequest')

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

// --- Cloudinary setup ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer: buffer files in memory instead of disk.
// We upload to Cloudinary manually after reading req.body,
// avoiding a race condition where disk-based storage runs before body is parsed.
const memStorage = multer.memoryStorage()
const upload = multer({ storage: memStorage, limits: { fileSize: 50 * 1024 * 1024 } })

// Upload a buffer or base64 string to Cloudinary and return the secure URL.
// Images are capped at 1200×1200 and auto-quality compressed.
const uploadToCloudinary = (input, folder, publicId) => {
  const options = {
    folder: `ashatara/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  }
  if (publicId) options.public_id = publicId
  if (typeof input === 'string') {
    return new Promise((resolve, reject) =>
      cloudinary.uploader.upload(input, options, (err, result) =>
        err ? reject(err) : resolve(result.secure_url)))
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) =>
      err ? reject(err) : resolve(result.secure_url))
    stream.end(input)
  })
}

// Parse the Cloudinary public_id out of a full secure URL.
// Needed to delete images — Cloudinary's destroy() requires the public_id, not the URL.
// Example URL: https://res.cloudinary.com/{cloud}/image/upload/v1234/ashatara/guru/filename.jpg
const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null
  try {
    const parts = url.split('/')
    const uploadIdx = parts.indexOf('upload')
    if (uploadIdx === -1) return null
    const afterUpload = parts.slice(uploadIdx + 2) // skip 'upload' and the version segment '/v123456'
    return afterUpload.join('/').replace(/\.[^.]+$/, '') // strip file extension
  } catch { return null }
}

// Delete an image from Cloudinary by its URL.
const deleteCloudinaryImage = async (url) => {
  const publicId = getCloudinaryPublicId(url)
  if (!publicId) return
  return new Promise((resolve) => {
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) console.warn('Cloudinary delete warning:', err.message)
      resolve(result)
    })
  })
}

// Verify JWT from Authorization header and attach decoded user to req.user
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Invalid token' }) }
}

// Gate a route to admin-role users only
const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' })

// --- App setup ---
const app = express()
app.use(cors())
app.use(express.json({ limit: '25mb' }))

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000, socketTimeoutMS: 8000 })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

app.get('/api/ping', (req, res) => res.json({ ok: true }))

// ============================================================
// SISWA routes — student records
// GET supports ?class=XII A and/or ?type=together to filter
app.get('/api/siswa', async (req, res) => {
  try {
    const { class: cls, type } = req.query
    const filter = {}
    if (cls) filter.className = cls
    if (type) filter.type = type
    res.json(await Siswa.find(filter))
  } catch (err) {
    console.error('GET /api/siswa error:', err.message)
    res.status(500).json({ error: err.message })
  }
})
app.post('/api/siswa', authMiddleware, adminOnly, async (req, res) => {
  res.status(201).json(await Siswa.create(req.body))
})
app.put('/api/siswa/:id', authMiddleware, adminOnly, async (req, res) => {
  res.json(await Siswa.findByIdAndUpdate(req.params.id, req.body, { new: true }))
})
app.delete('/api/siswa/:id', authMiddleware, adminOnly, async (req, res) => {
  const doc = await Siswa.findById(req.params.id)
  if (doc?.image) await deleteCloudinaryImage(doc.image) // clean up Cloudinary before DB delete
  await Siswa.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

// ============================================================
// GURU routes — teacher records, sorted by indexNumber
// ============================================================
app.get('/api/guru', async (req, res) => {
  const gurus = await Guru.find().sort('indexNumber')
  res.json(gurus.map(g => {
    const clean = g.name.replace(/^\d+[\.\s]+/, '').replace(/\s+IDZ\d+.*$/i, '').trim()
    return clean !== g.name ? { ...g.toObject(), name: clean } : g
  }))
})
app.post('/api/guru', authMiddleware, adminOnly, async (req, res) => {
  res.status(201).json(await Guru.create(req.body))
})
app.put('/api/guru/:id', authMiddleware, adminOnly, async (req, res) => {
  res.json(await Guru.findByIdAndUpdate(req.params.id, req.body, { new: true }))
})
app.delete('/api/guru/:id', authMiddleware, adminOnly, async (req, res) => {
  const doc = await Guru.findById(req.params.id)
  if (doc?.image) await deleteCloudinaryImage(doc.image)
  await Guru.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

// ============================================================
// MOMEN routes — event/moment photos grouped by year
// ============================================================
app.get('/api/momen', async (req, res) => {
  res.json(await Momen.find().sort('indexNumber'))
})
app.post('/api/momen', authMiddleware, adminOnly, async (req, res) => {
  res.status(201).json(await Momen.create(req.body))
})
app.put('/api/momen/:id', authMiddleware, adminOnly, async (req, res) => {
  res.json(await Momen.findByIdAndUpdate(req.params.id, req.body, { new: true }))
})
app.delete('/api/momen/:id', authMiddleware, adminOnly, async (req, res) => {
  const doc = await Momen.findById(req.params.id)
  if (doc?.image) await deleteCloudinaryImage(doc.image)
  await Momen.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

// ============================================================
// AUTH routes — register and login
// ============================================================

// Register a new user account (role defaults to 'user')
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  if (await User.findOne({ username })) return res.status(409).json({ error: 'Username already taken' })
  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ username, password: hashed })
  res.status(201).json({ message: 'Account created', username: user.username, role: user.role })
})

// Login — returns a signed JWT valid for 7 days
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, username: user.username, role: user.role })
})

// ============================================================
// PHOTO REQUESTS — user-submitted photo upload requests
// Admin reviews them in the mailbox and approves or rejects.
// ============================================================

// Submit a photo request. Auth is optional — logged-in users are identified by token,
// guests are recorded as 'guest'.
app.post('/api/requests', async (req, res) => {
  let submittedBy = 'guest'
  const token = req.headers.authorization?.split(' ')[1]
  if (token) {
    try { submittedBy = jwt.verify(token, JWT_SECRET).username } catch {}
  }
  const doc = await PhotoRequest.create({ ...req.body, submittedBy })
  res.status(201).json(doc)
})

// Get the logged-in user's own submitted requests
app.get('/api/requests/mine', authMiddleware, async (req, res) => {
  res.json(await PhotoRequest.find({ submittedBy: req.user.username }).sort('-createdAt'))
})

// Admin: list all pending requests
app.get('/api/requests/pending', authMiddleware, adminOnly, async (req, res) => {
  res.json(await PhotoRequest.find({ status: 'pending' }).sort('-createdAt'))
})

// Admin: approve a request.
// Uploads the base64 image to Cloudinary, then:
// - For Siswa: fuzzy-matches by name and updates the existing record if found, else creates new.
// - For Guru/Momen: always creates a new record.
app.post('/api/requests/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const pr = await PhotoRequest.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
    if (!pr) return res.status(404).json({ error: 'Not found' })

    // Route to the correct collection and Cloudinary folder based on category
    const cat = pr.category || '2025'
    let Model, className, folder
    if (cat === 'Guru') {
      Model = Guru; className = 'Guru'; folder = 'guru'
    } else if (['2023', '2024', '2025', '2026'].includes(cat)) {
      Model = Momen; className = cat; folder = 'momen'
    } else {
      Model = Siswa; className = cat; folder = `siswa/${pr.type || 'single'}`
    }

    const imageUrl = await uploadToCloudinary(pr.image, folder)

    // Siswa: try substring name match to update an existing student rather than duplicate
    if (Model === Siswa) {
      const searchName = (pr.name || '').toLowerCase().trim()
      const allStudents = await Model.find({ className })
      const existing = allStudents.find(s => {
        const sName = s.name.toLowerCase()
        return sName.includes(searchName) || searchName.includes(sName)
      })
      if (existing) {
        await Model.findByIdAndUpdate(existing._id, { image: imageUrl, quote: pr.quote || existing.quote })
        return res.json({ action: 'updated', student: existing })
      }
    }

    // No existing match — create a new record
    const docData = { name: pr.name, className, image: imageUrl, quote: pr.quote || '' }
    if (Model === Guru || Model === Momen) docData.indexNumber = pr.indexNumber || ''
    if (Model === Siswa) docData.type = pr.type || 'single'

    const created = await Model.create(docData)
    res.json({ action: 'created', [Model.modelName.toLowerCase()]: created })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin: reject a request (sets status to 'rejected', no image upload)
app.post('/api/requests/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  const pr = await PhotoRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true })
  if (!pr) return res.status(404).json({ error: 'Not found' })
  res.json(pr)
})

// Serve locally stored uploads (legacy fallback — main storage is Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Serve built frontend in production (Dockerfile builds frontend/dist)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))
  app.get('/{*path}', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')))
}

// ============================================================
// ADMIN: Bulk photo upload
// Accepts up to 50 photos, uploads to Cloudinary, then:
// - Siswa: extracts name from filename, score-matches to existing student, updates image.
// - Guru/Momen: creates new records.
// ============================================================
app.post('/api/admin/bulk-upload', authMiddleware, adminOnly, upload.any(), async (req, res) => {
  try {
    const { category, namePrefix, type } = req.body
    const files = req.files?.filter(f => f.fieldname === 'photos') || []
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' })

    // Determine target collection and Cloudinary folder from category
    let Model, className, folder
    const photoType = type || 'single'
    if (category === 'Guru') {
      Model = Guru; className = 'Guru'; folder = 'guru'
    } else if (['2023', '2024', '2025', '2026'].includes(category)) {
      Model = Momen; className = category; folder = 'momen'
    } else {
      Model = Siswa; className = category || 'XII A'; folder = `siswa/${photoType}`
    }

    // Upload files to Cloudinary sequentially to avoid overwhelming the connection
    const imageUrls = []
    for (const f of files) {
      const url = await uploadToCloudinary(f.buffer, folder, f.originalname.replace(/\.[^/.]+$/, ''))
      imageUrls.push(url)
    }

    // For Siswa, fetch all students in the class once — reused for every file match
    const allStudents = Model === Siswa ? await Siswa.find({ className }) : []

    const results = []

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const fileName = f.originalname.replace(/\.[^/.]+$/, '')
      const imageUrl = imageUrls[i]

      if (Model === Siswa) {
        // Extract a clean name from filenames like "01._Ahmad_Fatihul_IDZ06274":
        // 1. Strip leading number (e.g. "01.")
        // 2. Strip trailing photo ID code (e.g. "IDZ06274")
        // 3. Replace underscores with spaces
        const extractedName = fileName
          .replace(/^\d+[._\s]+/, '')
          .replace(/[_\s]+[A-Z]{2,}\d{4,}[^_]*$/, '')
          .replace(/_/g, ' ')
          .trim()
          .toLowerCase()

        // Score each student by how many words from the filename appear in their name
        const scored = allStudents.map(s => {
          const sName = s.name.toLowerCase()
          const words = extractedName.split(/\s+/).filter(Boolean)
          const score = words.filter(w => sName.includes(w)).length
          return { s, score }
        }).filter(x => x.score > 0)
        scored.sort((a, b) => b.score - a.score)
        const existing = scored[0]?.s

        if (existing) {
          const updateData = { image: imageUrl }
          if (req.body.quote && existing.type === 'single') updateData.quote = req.body.quote
          await Model.findByIdAndUpdate(existing._id, updateData)
          results.push({ action: 'updated', id: existing._id, name: existing.name })
        } else {
          results.push({ action: 'skipped', name: fileName, reason: 'No matching student found' })
        }
      } else {
        // Guru / Momen: always insert a new record.
        // For Guru filenames like "60. Siti Syarah Kautsar, S.Pd. IDZ07276",
        // strip the leading number and trailing IDZ photo ID to get just the name.
        let cleanName = namePrefix ? `${namePrefix} ${i + 1}` : fileName
        if (Model === Guru) {
          cleanName = fileName
            .replace(/^\d+[\.\s]+/, '')           // remove leading "60. " or "60 "
            .replace(/\s+IDZ\d+.*$/i, '')          // remove trailing " IDZ07276"
            .trim()
        }
        const doc = {
          name: cleanName,
          className, image: imageUrl, quote: '',
        }
        if (Model === Guru || Model === Momen) doc.indexNumber = ''
        const newDoc = await Model.create(doc)
        results.push({ action: 'created', id: newDoc._id, name: newDoc.name })
      }
    }

    res.status(201).json({ collection: Model.modelName, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================================
// ADMIN: Bulk delete
// Accepts an array of IDs and a collection name.
// Deletes images from Cloudinary first, then removes DB records.
// ============================================================
app.post('/api/admin/bulk-delete', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { collection, ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: 'No IDs provided' })

    let Model
    if (collection === 'Siswa') Model = Siswa
    else if (collection === 'Guru') Model = Guru
    else if (collection === 'Momen') Model = Momen
    else return res.status(400).json({ error: 'Invalid collection' })

    const docs = await Model.find({ _id: { $in: ids } })
    await Promise.all(docs.map(doc => doc?.image ? deleteCloudinaryImage(doc.image) : Promise.resolve()))
    const result = await Model.deleteMany({ _id: { $in: ids } })
    res.json({ deleted: result.deletedCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
