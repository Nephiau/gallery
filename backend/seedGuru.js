require('dotenv').config()
const mongoose = require('mongoose')
const Guru = require('./models/Guru')
const data = require('../gallery.gurus.json')

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected')

  const docs = data.map(({ name, className, indexNumber, image, quote }) => ({
    name, className, indexNumber, image, quote,
  }))

  await Guru.deleteMany({})
  const result = await Guru.insertMany(docs)
  console.log(`Inserted ${result.length} guru records`)
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
