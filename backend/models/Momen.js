const { Schema, model } = require('mongoose')

const momenSchema = new Schema({
  name:        { type: String, required: true },
  className:   { type: String, required: true }, // year: "2023" | "2024" | "2025" | "2026"
  indexNumber: { type: String, default: '' },
  image:       { type: String, default: '' },
  quote:       { type: String, default: '' },
}, { timestamps: true })

module.exports = model('Momen', momenSchema)
