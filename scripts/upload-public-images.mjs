import 'dotenv/config'
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const CLOUD = (process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '').trim()
const PRESET = (process.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim()
const ROOT = 'public'
const MAP_PATH = 'scripts/cloudinary-map.json'
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp'])

if (!CLOUD || !PRESET) {
  console.error('Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET.')
  process.exit(1)
}

const map = existsSync(MAP_PATH) ? JSON.parse(readFileSync(MAP_PATH, 'utf8')) : {}

const walk = (dir) => {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...walk(full))
    else if (ALLOWED.has(extname(name).toLowerCase())) out.push(full)
  }
  return out
}

const files = walk(ROOT).filter((file) => !map[file])
console.log(`${files.length} image(s) to upload (${Object.keys(map).length} already mapped).`)

const upload = async (file) => {
  const rel = relative(ROOT, file).replace(/\\/g, '/')
  const publicId = `anonymous-collectives/${rel.replace(/\.[^.]+$/, '')}`
  const form = new FormData()
  form.append('file', new Blob([readFileSync(file)]), rel.split('/').pop())
  form.append('upload_preset', PRESET)
  form.append('public_id', publicId)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const result = await response.json()
  if (!response.ok || !result.secure_url) {
    throw new Error(`${rel}: ${result.error?.message || response.status}`)
  }
  return { file, url: result.secure_url }
}

let index = 0
const workers = Array.from({ length: 4 }, async () => {
  while (index < files.length) {
    const file = files[index++]
    try {
      const { url } = await upload(file)
      map[file] = url
      writeFileSync(MAP_PATH, `${JSON.stringify(map, null, 2)}\n`)
      console.log(`uploaded ${file}`)
    } catch (error) {
      console.error(`FAILED ${file}: ${error.message}`)
    }
  }
})

await Promise.all(workers)

mkdirSync('scripts', { recursive: true })
writeFileSync(MAP_PATH, `${JSON.stringify(map, null, 2)}\n`)
console.log(`Done. ${Object.keys(map).length} image URL(s) in ${MAP_PATH}.`)
