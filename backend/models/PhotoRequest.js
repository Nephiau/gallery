const { Schema, model } = require('mongoose')

const photoRequestSchema = new Schema({
  submittedBy: { type: String, required: true },        // username
  name:        { type: String, required: true },
  className:   { type: String, required: true },
  indexNumber: { type: String, default: '' },
  image:       { type: String, required: true },
  quote:       { type: String, default: '' },
  category:    { type: String, default: '2025' },       // matches admin bulk upload (e.g. '2025', 'XII A', 'Guru')
  type:        { type: String, enum: ['single', 'together'], default: 'single' }, // only for Siswa
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true })

module.exports = model('PhotoRequest', photoRequestSchema)
