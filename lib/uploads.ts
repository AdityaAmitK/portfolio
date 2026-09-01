import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'portfolio.db')

export const uploadDirectory = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(path.dirname(databasePath), 'uploads')

fs.mkdirSync(uploadDirectory, { recursive: true })

export function socialImageFor(imageUrl: string) {
  const parsed = path.parse(path.basename(imageUrl))
  const filename = `${parsed.name}-social.jpg`
  return fs.existsSync(path.join(uploadDirectory, filename)) ? `/uploads/${filename}` : imageUrl
}
