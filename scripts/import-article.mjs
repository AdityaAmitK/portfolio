#!/usr/bin/env node
// Trusted local writer: the coordinator must verify the exact merged article tree before --publish.
import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import sharp from 'sharp'

const MAX_IMAGE = 8 * 1024 * 1024
const MAX_BODY = 2 * 1024 * 1024
const ORIGIN = 'https://adityakinjawadekar.com'
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const reserved = new Set(['finance', 'series', 'admin', 'api', 'preview', 'uploads', 'writing', 'feed', 'rss', 'sitemap', 'new', 'edit', 'tags'])
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

class ImportError extends Error {}
function fail(message) { throw new ImportError(message) }

function readRegular(folder, name, limit) {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' || name.includes('/') || name.includes('\\') || name.includes('\0')) fail('Article files must be direct children of the article folder.')
  const filename = path.join(folder, name)
  if (!fs.lstatSync(filename).isFile()) fail('Article inputs must be regular files, without symlinks.')
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW)
  try {
    const stat = fs.fstatSync(fd)
    if (!stat.isFile() || stat.size === 0 || stat.size > limit) fail('Article input is empty or exceeds its size limit.')
    const bytes = fs.readFileSync(fd)
    if (bytes.length > limit) fail('Article input exceeds its size limit.')
    return bytes
  } finally { fs.closeSync(fd) }
}

function textField(metadata, key, max) {
  const value = metadata[key]
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\0')) fail(`Invalid metadata field: ${key}.`)
  return value.trim()
}

function checkOwner(db, slug, financeId, publish, revision) {
  const post = db.prepare('SELECT id, series_id, published, source_revision FROM posts WHERE slug = ?').get(slug)
  if (post && post.series_id !== financeId) fail('Slug belongs to a post outside the Finance series.')
  if (post?.published && !publish) fail('Draft import cannot change an existing published post. Use a new slug or the authorized publish workflow.')
  return { post, unchanged: Boolean(publish && post?.published && post.source_revision === revision) }
}

async function main() {
  const args = process.argv.slice(2)
  const folderArg = args.shift()
  if (!folderArg || folderArg.startsWith('--')) fail('Usage: node scripts/import-article.mjs <folder> [--publish --revision <git-article-tree-oid>]')
  let publish = false
  let revision = ''
  while (args.length) {
    const arg = args.shift()
    if (arg === '--publish' && !publish) publish = true
    else if (arg === '--revision' && !revision && args.length) revision = args.shift()
    else fail('Unknown, duplicate, or incomplete argument.')
  }
  if (publish !== Boolean(revision) || (publish && !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(revision))) fail('--publish requires --revision with a full Git article tree OID; --revision requires --publish.')
  const folder = path.resolve(folderArg)
  if (!fs.lstatSync(folder).isDirectory() || fs.realpathSync(folder) !== folder) fail('Article folder must be a real directory without symlink components.')
  const metadata = JSON.parse(readRegular(folder, 'metadata.json', 64 * 1024).toString('utf8'))
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') fail('metadata.json must contain an object.')
  const title = textField(metadata, 'title', 300)
  const slug = textField(metadata, 'slug', 160)
  if (!slugPattern.test(slug) || reserved.has(slug)) fail('Invalid or reserved article slug.')
  if (metadata.series !== 'finance') fail('Only series: finance is supported.')
  const description = textField(metadata, 'description', 2000)
  const cover = textField(metadata, 'cover', 255)
  const coverAlt = textField(metadata, 'cover_alt', 1000)
  if (!Array.isArray(metadata.tags) || metadata.tags.length > 30 || metadata.tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 80 || tag.includes('\0'))) fail('tags must be an array of up to 30 nonempty strings.')
  const tags = [...new Set(metadata.tags.map(tag => tag.trim()))].map(name => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!slug) fail('Every tag must have a usable ASCII slug.')
    return { name, slug }
  })
  if (metadata.published_at !== undefined && (typeof metadata.published_at !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(metadata.published_at) || !Number.isFinite(Date.parse(metadata.published_at)))) fail('published_at must be an ISO date or UTC timestamp.')
  const bodyBytes = readRegular(folder, 'article.md', MAX_BODY)
  const body = bodyBytes.toString('utf8')
  if (!body.trim() || /^\s*---(?:\r?\n|$)/.test(body)) fail('article.md must contain body-only Markdown, without YAML front matter.')
  const extension = path.extname(cover).toLowerCase()
  const formats = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.gif': 'gif', '.webp': 'webp' }
  if (!Object.hasOwn(formats, extension)) fail('Cover must be PNG, JPEG, GIF, or WebP.')
  const image = readRegular(folder, cover, MAX_IMAGE)
  const imageInfo = await sharp(image).metadata()
  if (imageInfo.format !== formats[extension]) fail('Cover format does not match its extension.')

  const databasePath = path.resolve(process.env.DATABASE_PATH || '/opt/portfolio/data/portfolio.db')
  const db = new Database(databasePath, { fileMustExist: true })
  try {
    db.pragma('busy_timeout = 5000')
    db.pragma('foreign_keys = ON')
    const required = {
      posts: ['id', 'slug', 'title', 'description', 'body', 'category', 'cover_image', 'cover_alt', 'published', 'published_at', 'created_at', 'updated_at', 'series_id', 'preview_token_hash', 'preview_expires_at', 'source_revision'],
      series: ['id', 'slug', 'title', 'description'],
      tags: ['id', 'name', 'slug'],
      post_tags: ['post_id', 'tag_id'],
    }
    for (const [table, columns] of Object.entries(required)) {
      const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(column => column.name))
      if (columns.some(column => !existing.has(column))) fail('Database schema is not migrated. Apply the application migrations before importing.')
    }
    const finance = db.prepare("SELECT id FROM series WHERE slug = 'finance'").get()
    if (!finance) fail('Finance series is missing. Apply application migrations before importing.')
    const initial = checkOwner(db, slug, finance.id, publish, revision)
    const url = `${ORIGIN}/writing/${slug}`
    if (initial.unchanged) return { id: initial.post.id, slug, url, changed: false, revision }

    // Finish image processing and immutable file writes before changing publication state.
    const social = await sharp(image).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer()
    const assetHash = createHash('sha256').update(bodyBytes).update(image).digest('hex')
    const filename = `finance-${assetHash}${extension === '.jpeg' ? '.jpg' : extension}`
    const socialFilename = `finance-${assetHash}-social.jpg`
    const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || path.join(path.dirname(databasePath), 'uploads'))
    fs.mkdirSync(uploadDirectory, { recursive: true })
    for (const [name, bytes] of [[filename, image], [socialFilename, social]]) {
      try { fs.writeFileSync(path.join(uploadDirectory, name), bytes, { flag: 'wx' }) }
      catch (error) {
        if (error.code !== 'EEXIST') throw error
        // Never accept a conflicting file or a symlink under an immutable name.
        const stored = readRegular(uploadDirectory, name, Math.max(bytes.length, MAX_IMAGE))
        if (hash(stored) !== hash(bytes)) fail('Immutable upload conflicts with existing bytes.')
      }
    }
    const result = db.transaction(() => {
      const { post, unchanged } = checkOwner(db, slug, finance.id, publish, revision)
      if (unchanged) return { id: post.id, slug, url, changed: false, revision }
      const token = publish ? '' : randomBytes(32).toString('hex')
      const values = {
        slug, title, description, body, cover_image: `/uploads/${filename}`, cover_alt: coverAlt,
        series_id: finance.id, published: Number(publish), published_at: publish ? new Date().toISOString() : null,
        preview_token_hash: token ? hash(token) : '',
        preview_expires_at: token ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        source_revision: publish ? revision : '',
      }
      let id = post?.id
      if (id) {
        db.prepare(`UPDATE posts SET title=@title, description=@description, body=@body, cover_image=@cover_image,
          cover_alt=@cover_alt, published=@published, published_at=COALESCE(published_at,@published_at),
          preview_token_hash=@preview_token_hash, preview_expires_at=@preview_expires_at,
          source_revision=@source_revision, updated_at=CURRENT_TIMESTAMP WHERE id=@id`).run({ ...values, id })
      } else {
        id = Number(db.prepare(`INSERT INTO posts (slug,title,description,body,cover_image,cover_alt,category,series_id,
          published,published_at,preview_token_hash,preview_expires_at,source_revision)
          VALUES (@slug,@title,@description,@body,@cover_image,@cover_alt,'',@series_id,
          @published,@published_at,@preview_token_hash,@preview_expires_at,@source_revision)`).run(values).lastInsertRowid)
      }
      db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(id)
      for (const tag of tags) {
        db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)').run(tag.name, tag.slug)
        const row = db.prepare('SELECT id FROM tags WHERE slug = ? OR name = ? COLLATE NOCASE ORDER BY slug = ? DESC LIMIT 1').get(tag.slug, tag.name, tag.slug)
        if (!row) fail('Could not resolve article tag.')
        db.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)').run(id, row.id)
      }
      return publish ? { id, slug, url, changed: true, revision } : { id, slug, previewUrl: `${ORIGIN}/preview/${id}?token=${token}` }
    }).immediate()
    return result
  } finally { db.close() }
}

try {
  process.stdout.write(`${JSON.stringify(await main())}\n`)
} catch (error) {
  // Do not echo supplied metadata, filesystem paths, or bearer URLs in diagnostics.
  process.stderr.write(`${error instanceof ImportError ? error.message : 'Article import failed. Check readable inputs, valid JSON/image, existing database, and writable uploads.'}\n`)
  process.exitCode = 1
}
