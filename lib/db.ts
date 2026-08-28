import 'server-only'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { projects, skills, tools, type ManagedContent } from './content'

export type Post = {
  id: number
  slug: string
  title: string
  description: string
  body: string
  category: string
  published: number
  published_at: string | null
  created_at: string
  updated_at: string
}

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'portfolio.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })

const db = new Database(databasePath)
db.pragma('busy_timeout = 5000')
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Sport',
    published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

const initialContent: ManagedContent = { projects, tools, skills }
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('managed-content', JSON.stringify(initialContent))

const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
const parsedContent = JSON.parse(storedContent.value) as ManagedContent
if (parsedContent.projects.some(project => project.slug === 'cricket-player-cluster')) {
  parsedContent.projects = parsedContent.projects.filter(project => project.slug !== 'cricket-player-cluster')
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
}

export function getPublishedPosts() {
  return db.prepare('SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, created_at DESC').all() as Post[]
}

export function getAllPosts() {
  return db.prepare('SELECT * FROM posts ORDER BY updated_at DESC').all() as Post[]
}

export function getPostBySlug(slug: string, includeDrafts = false) {
  return db.prepare(`SELECT * FROM posts WHERE slug = ? ${includeDrafts ? '' : 'AND published = 1'}`).get(slug) as Post | undefined
}

export function getPostById(id: number) {
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as Post | undefined
}

export function savePost(input: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'published_at'> & { id?: number }) {
  const publishedAt = input.published ? new Date().toISOString() : null
  if (input.id) {
    db.prepare(`UPDATE posts SET slug=@slug,title=@title,description=@description,body=@body,category=@category,published=@published,published_at=COALESCE(published_at,@publishedAt),updated_at=CURRENT_TIMESTAMP WHERE id=@id`).run({ ...input, publishedAt })
    return input.id
  }
  return Number(db.prepare(`INSERT INTO posts (slug,title,description,body,category,published,published_at) VALUES (@slug,@title,@description,@body,@category,@published,@publishedAt)`).run({ ...input, publishedAt }).lastInsertRowid)
}

export function deletePost(id: number) {
  db.prepare('DELETE FROM posts WHERE id = ?').run(id)
}

export function getManagedContent(): ManagedContent {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  return JSON.parse(row.value) as ManagedContent
}

export function saveManagedContent(content: ManagedContent) {
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(content), 'managed-content')
}
