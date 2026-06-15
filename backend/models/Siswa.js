const { Schema, model } = require('mongoose')

const siswaSchema = new Schema({
  nomorAbsen:  { type: Number, default: null },
  name:        { type: String, required: true },        // Nama Lengkap
  nickname:    { type: String, default: '' },            // Nama Panggilan
  className:   { type: String, required: true },         // e.g. "XII A"
  birthPlace:  { type: String, default: '' },            // Tempat Lahir
  birthDate:   { type: Date, default: null },            // Gabungan Tanggal/Bulan/Tahun Lahir
  instagram:   { type: String, default: '' },            // ID INSTAGRAM
  image:       { type: String, default: '' },
  quote:       { type: String, default: '' },
  type:        { type: String, enum: ['single', 'together'], default: 'single' },
}, { timestamps: true })

// Only require quote when type is 'single'
siswaSchema.pre('validate', function() {
  if (this.type === 'single' && !this.quote) {
    this.invalidate('quote', 'Quote is required for single siswa')
  }
})

module.exports = model('Siswa', siswaSchema)
