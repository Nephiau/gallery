const { execSync } = require('child_process')

execSync('node backend/seedAdmin.js', { stdio: 'inherit' })
execSync('node backend/seedSiswa.js', { stdio: 'inherit' })
execSync('node backend/seedFGH.js', { stdio: 'inherit' })

require('./index.js')
