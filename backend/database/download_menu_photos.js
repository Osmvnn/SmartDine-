// One-off script: download the stock photos referenced by update_menu_photos.js
// to frontend/public/images/menu/<id>.jpg so the app can serve them itself
// instead of depending on an external image host.

const fs = require('fs')
const path = require('path')
const https = require('https')
const { photoKeywords } = require('./update_menu_photos')

const outDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images', 'menu')
fs.mkdirSync(outDir, { recursive: true })

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
        res.resume()
        const nextUrl = new URL(res.headers.location, url).toString()
        return download(nextUrl, dest, redirects + 1).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    }).on('error', reject)
  })
}

;(async () => {
  for (const [id, keywords] of Object.entries(photoKeywords)) {
    const url = `https://loremflickr.com/400/300/${keywords}?lock=${id}`
    const dest = path.join(outDir, `${id}.jpg`)
    try {
      await download(url, dest)
      console.log('OK   ', id, dest)
    } catch (err) {
      console.error('FAIL ', id, '-', err.message)
    }
  }
})()
