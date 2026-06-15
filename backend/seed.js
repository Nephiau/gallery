require('dotenv').config()
const mongoose = require('mongoose')
const Momen = require('./models/Momen')

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  await Momen.deleteMany()
  console.log('✅ Cleared existing momen')

  await mongoose.disconnect()
  console.log('⚠️  Warning: This script only clears Momen. Siswa data is preserved.')
}

seed().catch(err => { console.error(err); process.exit(1) })
