import 'server-only'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { about, projects, skills, tools, type ManagedContent } from './content'

export type Tag = { id: number; name: string; slug: string }
export type Post = {
  id: number
  slug: string
  title: string
  description: string
  body: string
  tags: Tag[]
  published: number
  published_at: string | null
  created_at: string
  updated_at: string
}

type PostRow = Omit<Post, 'tags'> & { category: string }
type PostInput = Pick<Post, 'slug' | 'title' | 'description' | 'body' | 'published'> & { id?: number; tagIds: number[] }

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'portfolio.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })

const db = new Database(databasePath)
db.pragma('busy_timeout = 5000')
db.pragma('foreign_keys = ON')
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
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    slug TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const tagSchemaVersion = Number((db.prepare('SELECT value FROM settings WHERE key = ?').get('tag-schema-version') as { value: string } | undefined)?.value || 0)
if (tagSchemaVersion < 1) {
  const migrateTags = db.transaction(() => {
    const names = new Set(['Sport', 'Cricket', 'Football', 'Software', 'Trading', 'Life'])
    for (const row of db.prepare("SELECT DISTINCT category FROM posts WHERE TRIM(category) <> ''").all() as { category: string }[]) names.add(row.category.trim())
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)')
    for (const name of names) insertTag.run(name, slugify(name))
    db.prepare(`INSERT OR IGNORE INTO post_tags (post_id, tag_id)
      SELECT posts.id, tags.id FROM posts JOIN tags ON tags.name = posts.category COLLATE NOCASE
      WHERE TRIM(posts.category) <> ''`).run()
    db.prepare(`INSERT INTO settings (key, value) VALUES ('tag-schema-version', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
  })
  migrateTags()
}

const initialContent: ManagedContent = { projects, tools, skills, about }
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('managed-content', JSON.stringify(initialContent))

const contentVersion = Number((db.prepare('SELECT value FROM settings WHERE key = ?').get('content-version') as { value: string } | undefined)?.value || 0)
if (contentVersion < 2) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  parsedContent.projects = parsedContent.projects
    .filter(project => project.slug !== 'cricket-player-cluster')
    .map(project => {
      if (project.slug === 'algodesk') return { ...project, summary: projects.find(item => item.slug === 'algodesk')!.summary }
      if (project.slug === 'rupee-ledger') return { ...project, href: undefined, linkLabel: undefined }
      if (project.slug === 'secure-face-recognition') return { ...project, href: projects.find(item => item.slug === 'secure-face-recognition')!.href, linkLabel: 'read the publication' }
      return project
    })
  parsedContent.tools = tools
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '2') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 3) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  const dcprProject = projects.find(project => project.slug === 'dcpr-ai')!
  if (!parsedContent.projects.some(project => project.slug === dcprProject.slug)) parsedContent.projects.push(dcprProject)
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '3') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 4) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as Partial<ManagedContent>
  parsedContent.about = about
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '4') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

function tagsForPost(postId: number) {
  return db.prepare(`SELECT tags.id, tags.name, tags.slug FROM tags JOIN post_tags ON post_tags.tag_id = tags.id WHERE post_tags.post_id = ? ORDER BY tags.name COLLATE NOCASE`).all(postId) as Tag[]
}

function hydratePost(row: PostRow | undefined) {
  if (!row) return undefined
  const { category: _category, ...post } = row
  void _category
  return { ...post, tags: tagsForPost(row.id) } as Post
}

function hydratePosts(rows: PostRow[]) {
  return rows.map(row => hydratePost(row)!)
}

export function getPublishedPosts(filters: { query?: string; tag?: string } = {}) {
  const query = filters.query?.trim() || ''
  const tag = filters.tag?.trim() || ''
  const rows = db.prepare(`SELECT posts.* FROM posts
    WHERE published = 1
      AND (@query = '' OR title LIKE @pattern OR description LIKE @pattern OR body LIKE @pattern)
      AND (@tag = '' OR EXISTS (
        SELECT 1 FROM post_tags JOIN tags ON tags.id = post_tags.tag_id
        WHERE post_tags.post_id = posts.id AND tags.slug = @tag
      ))
    ORDER BY published_at DESC, created_at DESC`).all({ query, pattern: `%${query}%`, tag }) as PostRow[]
  return hydratePosts(rows)
}

export function getAllPosts() {
  return hydratePosts(db.prepare('SELECT * FROM posts ORDER BY updated_at DESC').all() as PostRow[])
}

export function getPostBySlug(slug: string, includeDrafts = false) {
  return hydratePost(db.prepare(`SELECT * FROM posts WHERE slug = ? ${includeDrafts ? '' : 'AND published = 1'}`).get(slug) as PostRow | undefined)
}

export function getPostById(id: number) {
  return hydratePost(db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostRow | undefined)
}

export const savePost = db.transaction((input: PostInput) => {
  const publishedAt = input.published ? new Date().toISOString() : null
  let id = input.id
  if (id) {
    db.prepare(`UPDATE posts SET slug=@slug,title=@title,description=@description,body=@body,published=@published,published_at=COALESCE(published_at,@publishedAt),updated_at=CURRENT_TIMESTAMP WHERE id=@id`).run({ ...input, publishedAt })
  } else {
    id = Number(db.prepare(`INSERT INTO posts (slug,title,description,body,category,published,published_at) VALUES (@slug,@title,@description,@body,'',@published,@publishedAt)`).run({ ...input, publishedAt }).lastInsertRowid)
  }
  db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(id)
  const attachTag = db.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag_id) SELECT ?, id FROM tags WHERE id = ?')
  for (const tagId of [...new Set(input.tagIds)]) attachTag.run(id, tagId)
  return id
})

export function deletePost(id: number) {
  db.prepare('DELETE FROM posts WHERE id = ?').run(id)
}

export function getTags(publishedOnly = false) {
  if (!publishedOnly) return db.prepare('SELECT id, name, slug FROM tags ORDER BY name COLLATE NOCASE').all() as Tag[]
  return db.prepare(`SELECT DISTINCT tags.id, tags.name, tags.slug FROM tags
    JOIN post_tags ON post_tags.tag_id = tags.id JOIN posts ON posts.id = post_tags.post_id
    WHERE posts.published = 1 ORDER BY tags.name COLLATE NOCASE`).all() as Tag[]
}

export function saveTag(id: number | undefined, name: string) {
  const cleanName = name.trim()
  const slug = slugify(cleanName)
  if (!cleanName || !slug) throw new Error('Tag name is required')
  if (id) db.prepare('UPDATE tags SET name = ?, slug = ? WHERE id = ?').run(cleanName, slug, id)
  else db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)').run(cleanName, slug)
}

export function deleteTag(id: number) {
  db.prepare('DELETE FROM tags WHERE id = ?').run(id)
}

export function getManagedContent(): ManagedContent {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  return JSON.parse(row.value) as ManagedContent
}

export function saveManagedContent(content: ManagedContent) {
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(content), 'managed-content')
}
