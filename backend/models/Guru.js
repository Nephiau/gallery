const { Schema, model } = require('mongoose')

const guruSchema = new Schema({
  name:        { type: String, required: true },
  className:   { type: String, required: true }, // subject/mata pelajaran
  indexNumber: { type: String, default: '' },
  image:       { type: String, default: '' },
  quote:       { type: String, default: '' },
}, { timestamps: true })

module.exports = model('Guru', guruSchema)
