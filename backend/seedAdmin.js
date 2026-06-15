require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  const password = await bcrypt.hash('nabil', 10)
  await User.findOneAndUpdate(
    { username: 'admin1' },
    { username: 'admin1', password, role: 'admin' },
    { upsert: true, new: true }
  )
  console.log('Admin user admin1 created/updated')
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
