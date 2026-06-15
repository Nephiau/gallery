require('dotenv').config()
const mongoose = require('mongoose')
const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function extractName(publicId) {
  const base = publicId.split('/').pop()
  return base
    .replace(/^\d+[._\s]+/, '')
    .replace(/[_\s]+[A-Z]{2,}\d{4,}[^_]*$/, '')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
}

function levenshtein(a, b) {
  if (!a.length) return b.length
  if (!b.length) return a.length
  const m = []
  for (let i = 0; i <= b.length; i++) m[i] = [i]
  for (let j = 0; j <= a.length; j++) m[0][j] = j
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = b[i - 1] === a[j - 1] ? m[i - 1][j - 1] : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1)
  return m[b.length][a.length]
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI)
  const col = mongoose.connection.db.collection('siswas')

  const students = await col.find({ type: 'single', image: '' }).toArray()
  console.log('== Students WITHOUT images: ' + students.length + ' ==')
  students.forEach(s => console.log('  ' + s.className + ' | ' + s.name))

  let allImages = []
  let cursor = null
  do {
    const opts = { expression: 'folder:ashatara/siswa/single', max_results: 100 }
    if (cursor) opts.next_cursor = cursor
    const r = await new Promise((res, rej) => cloudinary.api.search(opts, (e, rr) => e ? rej(e) : res(rr)))
    allImages = allImages.concat(r.resources)
    cursor = r.next_cursor
  } while (cursor)

  console.log('\n== Matching with Levenshtein (threshold: 3) ==')
  let matched = 0

  for (const img of allImages) {
    const cn = extractName(img.public_id)
    if (!cn) continue

    let best = null, bestScore = 999
    for (const s of students) {
      const dist = levenshtein(s.name.toLowerCase(), cn)
      if (dist < bestScore) { bestScore = dist; best = s }
    }

    if (best && bestScore <= 3) {
      await col.updateOne({ _id: best._id }, { $set: { image: img.secure_url } })
      console.log('  ✅ ' + cn + ' → ' + best.name + ' (' + best.className + ') [d=' + bestScore + ']')
      matched++
    }
  }

  console.log('\nNewly matched: ' + matched)

  const remaining = await col.find({ type: 'single', image: '' }).toArray()
  console.log('Still without image: ' + remaining.length)
  remaining.forEach(s => console.log('  ⏭️ ' + s.className + ' | ' + s.name))

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })