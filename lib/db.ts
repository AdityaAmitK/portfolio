import 'server-only'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { about, contactLinks, experiences, projects, skills, tools, type ManagedContent, type Project } from './content'

export type Series = { id: number; slug: string; title: string; description: string }
export type Tag = { id: number; name: string; slug: string }
export type Post = {
  id: number
  slug: string
  title: string
  description: string
  body: string
  cover_image: string
  cover_alt: string
  tags: Tag[]
  series?: Series | null
  series_id?: number | null
  preview_token_hash?: string
  preview_expires_at?: string | null
  source_revision?: string
  published: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export type AnalyticsEventInput = {
  sessionId: string
  type: 'pageview' | 'engaged' | 'scroll' | 'duration' | 'click'
  path: string
  referrer?: string
  source?: string
  medium?: string
  campaign?: string
  target?: string
  value?: number
  country?: string
  device?: string
}

export type Comment = {
  id: number
  post_id: number
  parent_id: number | null
  name: string
  body: string
  status: 'approved' | 'hidden'
  is_admin: number
  is_private: number
  created_at: string
  post_title?: string
  post_slug?: string
}

type PostRow = Omit<Post, 'tags'> & { category: string }
type PostInput = Pick<Post, 'slug' | 'title' | 'description' | 'body' | 'cover_image' | 'cover_alt' | 'published'> & { id?: number; tagIds: number[]; series_id?: number | null }

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'portfolio.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })

const db = new Database(databasePath)
db.pragma('busy_timeout = 5000')
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
  );
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
  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'direct',
    medium TEXT NOT NULL DEFAULT '',
    campaign TEXT NOT NULL DEFAULT '',
    target TEXT NOT NULL DEFAULT '',
    value INTEGER,
    country TEXT NOT NULL DEFAULT '',
    device TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS analytics_created_at ON analytics_events(created_at);
  CREATE INDEX IF NOT EXISTS analytics_path_created_at ON analytics_events(path, created_at);
  CREATE INDEX IF NOT EXISTS analytics_session_id ON analytics_events(session_id);
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('approved','hidden')),
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_private INTEGER NOT NULL DEFAULT 0,
    author_key TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS comments_post_status ON comments(post_id, status, created_at);
  CREATE INDEX IF NOT EXISTS comments_author_created ON comments(author_key, created_at);
  CREATE TABLE IF NOT EXISTS post_likes (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, visitor_id)
  );
`)

const postColumns = new Set((db.prepare('PRAGMA table_info(posts)').all() as { name: string }[]).map(column => column.name))
if (!postColumns.has('cover_image')) db.exec("ALTER TABLE posts ADD COLUMN cover_image TEXT NOT NULL DEFAULT ''")
if (!postColumns.has('cover_alt')) db.exec("ALTER TABLE posts ADD COLUMN cover_alt TEXT NOT NULL DEFAULT ''")
if (!postColumns.has('series_id')) db.exec('ALTER TABLE posts ADD COLUMN series_id INTEGER REFERENCES series(id)')
if (!postColumns.has('preview_token_hash')) db.exec("ALTER TABLE posts ADD COLUMN preview_token_hash TEXT NOT NULL DEFAULT ''")
if (!postColumns.has('preview_expires_at')) db.exec('ALTER TABLE posts ADD COLUMN preview_expires_at TEXT')
if (!postColumns.has('source_revision')) db.exec("ALTER TABLE posts ADD COLUMN source_revision TEXT NOT NULL DEFAULT ''")
const financeTitle = 'Figuring Out Money'
const financeDescription = 'A weekly series where I work through questions about money, share what I understand, and revisit what I get wrong. A place to learn, question, and grow along the way.'
db.prepare('INSERT OR IGNORE INTO series (slug, title, description) VALUES (?, ?, ?)').run(
  'finance', financeTitle, financeDescription,
)
db.transaction(() => {
  const version = Number((db.prepare('SELECT value FROM settings WHERE key = ?').get('finance-series-metadata-version') as { value: string } | undefined)?.value || 0)
  if (version >= 1) return
  db.prepare('UPDATE series SET title = ?, description = ? WHERE slug = ? AND title = ? AND description = ?').run(
    financeTitle, financeDescription, 'finance', 'Finance',
    'Making sense of money, one question at a time. Notes on finance as I learn, with examples from everyday life in India.',
  )
  db.prepare(`INSERT INTO settings (key, value) VALUES ('finance-series-metadata-version', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
})()
const commentColumns = new Set((db.prepare('PRAGMA table_info(comments)').all() as { name: string }[]).map(column => column.name))
if (!commentColumns.has('is_private')) db.exec('ALTER TABLE comments ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0')

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

const initialContent: ManagedContent = { projects, experiences, tools, skills, about, contactLinks }
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('managed-content', JSON.stringify(initialContent))

const contentVersion = Number((db.prepare('SELECT value FROM settings WHERE key = ?').get('content-version') as { value: string } | undefined)?.value || 0)
if (contentVersion < 2) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  parsedContent.projects = parsedContent.projects
    .filter(project => project.slug !== 'cricket-player-cluster')
    .map(project => {
      if (project.slug === 'algodesk') return { ...project, summary: projects.find(item => item.slug === 'algodesk')!.summary }
      if (project.slug === 'rupee-ledger') return { ...project, repoHref: undefined, demoHref: undefined, liveHref: undefined }
      if (project.slug === 'secure-face-recognition') return { ...project, liveHref: projects.find(item => item.slug === 'secure-face-recognition')!.liveHref }
      return project
    })
  parsedContent.tools = tools
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '2') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 3) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  const dcprProject = projects.find(project => project.slug === 'dcpr-ai')
  if (dcprProject && !parsedContent.projects.some(project => project.slug === dcprProject.slug)) parsedContent.projects.push(dcprProject)
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

if (contentVersion < 5) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  const canonicalProjects = new Map(projects.map(project => [project.slug, project]))
  parsedContent.projects = parsedContent.projects.map(project => {
    const legacy = project as Project & { href?: string; linkLabel?: string }
    const canonical = canonicalProjects.get(project.slug)
    const repoHref = canonical?.repoHref || (legacy.linkLabel?.includes('source') ? legacy.href : undefined)
    const liveHref = canonical?.liveHref || (legacy.href && !repoHref ? legacy.href : undefined)
    const { href: _href, linkLabel: _linkLabel, ...cleanProject } = legacy
    void _href
    void _linkLabel
    return { ...cleanProject, repoHref, demoHref: canonical?.demoHref, liveHref }
  })
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '5') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 6) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  const strideAndScale = projects.find(project => project.slug === 'stride-and-scale')!
  if (!parsedContent.projects.some(project => project.slug === strideAndScale.slug)) parsedContent.projects.unshift(strideAndScale)
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '6') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 7) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  const canonicalProjects = new Map(projects.map(project => [project.slug, project]))
  parsedContent.projects = parsedContent.projects.map(project => {
    const canonical = canonicalProjects.get(project.slug)
    return { ...project, marketplaceHref: canonical?.marketplaceHref, installCommand: canonical?.installCommand }
  })
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '7') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 8) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  parsedContent.experiences = experiences
  parsedContent.projects = parsedContent.projects.filter(project => project.slug !== 'dcpr-ai')
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '8') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 9) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as Partial<ManagedContent>
  parsedContent.contactLinks = contactLinks
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '9') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

if (contentVersion < 10) {
  const storedContent = db.prepare('SELECT value FROM settings WHERE key = ?').get('managed-content') as { value: string }
  const parsedContent = JSON.parse(storedContent.value) as ManagedContent
  const projectTags: Record<string, string[]> = {
    'stride-and-scale': ['React', 'Express', 'PostgreSQL', 'Apple Health'],
    'oracle-desk': ['Client project', 'Business website', 'WhatsApp'],
    algodesk: ['Python', 'Next.js', 'PostgreSQL', 'Trading'],
    'iphone-mac-keyboard': ['Swift', 'iOS', 'macOS', 'Local networking'],
    'git-blocker': ['TypeScript', 'CLI', 'Git'],
    'strapi-service-navigation': ['TypeScript', 'VS Code', 'Strapi'],
    'next-sweep': ['Node.js', 'CLI', 'Next.js'],
    'secure-face-recognition': ['Python', 'Computer vision', 'Cryptography'],
    'helium-profile-swticher': ['Raycast', 'AppleScript', 'macOS'],
    'rupee-ledger': ['React', 'Express', 'SQLite', 'Personal finance'],
  }
  parsedContent.projects = parsedContent.projects.map(project => ({ ...project, tags: projectTags[project.slug] || project.tags }))
  parsedContent.experiences = parsedContent.experiences.map(experience => ({ ...experience, engagements: experience.engagements.map(engagement => engagement.name === 'Reco Social' ? { ...engagement, tags: ['TypeScript', 'Node.js', 'Strapi', 'PostgreSQL', 'Redis'] } : engagement) }))
  db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(JSON.stringify(parsedContent), 'managed-content')
  db.prepare(`INSERT INTO settings (key, value) VALUES ('content-version', '10') ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run()
}

function tagsForPost(postId: number) {
  return db.prepare(`SELECT tags.id, tags.name, tags.slug FROM tags JOIN post_tags ON post_tags.tag_id = tags.id WHERE post_tags.post_id = ? ORDER BY tags.name COLLATE NOCASE`).all(postId) as Tag[]
}

function hydratePost(row: PostRow | undefined) {
  if (!row) return undefined
  const { category: _category, ...post } = row
  void _category
  const series = row.series_id
    ? db.prepare('SELECT id, slug, title, description FROM series WHERE id = ?').get(row.series_id) as Series | undefined
    : undefined
  return { ...post, tags: tagsForPost(row.id), series: series ?? null } as Post
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

export function getSeries(slug: string): Series | undefined {
  return db.prepare('SELECT id, slug, title, description FROM series WHERE slug = ?').get(slug) as Series | undefined
}

export function setFinanceSeriesMetadata(title: string, description: string): boolean {
  return db.prepare("UPDATE series SET title = ?, description = ? WHERE slug = 'finance'").run(title, description).changes > 0
}

export function getAllSeries(): Series[] {
  return db.prepare('SELECT id, slug, title, description FROM series ORDER BY title COLLATE NOCASE').all() as Series[]
}

export function getPublishedPostsInSeries(slug: string): Post[] {
  return hydratePosts(db.prepare(`SELECT posts.* FROM posts JOIN series ON series.id = posts.series_id
    WHERE posts.published = 1 AND series.slug = ? ORDER BY posts.published_at DESC, posts.created_at DESC`).all(slug) as PostRow[])
}

export function getAllPosts() {
  return hydratePosts(db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all() as PostRow[])
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
    db.prepare(`UPDATE posts SET slug=@slug,title=@title,description=@description,body=@body,cover_image=@cover_image,cover_alt=@cover_alt,published=@published,published_at=COALESCE(published_at,@publishedAt),series_id=CASE WHEN @setSeries THEN @seriesId ELSE series_id END,preview_token_hash=CASE WHEN @published THEN '' ELSE preview_token_hash END,preview_expires_at=CASE WHEN @published THEN NULL ELSE preview_expires_at END,source_revision='',updated_at=CURRENT_TIMESTAMP WHERE id=@id`).run({ ...input, publishedAt, setSeries: Number(input.series_id !== undefined), seriesId: input.series_id ?? null })
  } else {
    id = Number(db.prepare(`INSERT INTO posts (slug,title,description,body,cover_image,cover_alt,category,published,published_at,series_id) VALUES (@slug,@title,@description,@body,@cover_image,@cover_alt,'',@published,@publishedAt,@seriesId)`).run({ ...input, publishedAt, seriesId: input.series_id ?? null }).lastInsertRowid)
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

export function ensureTags(names: string[]) {
  const ids: number[] = []
  const insert = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)')
  const find = db.prepare('SELECT id FROM tags WHERE slug = ?')
  for (const name of [...new Set(names.map(value => value.trim()).filter(Boolean))]) {
    const slug = slugify(name)
    if (!slug) continue
    insert.run(name, slug)
    const tag = find.get(slug) as { id: number } | undefined
    if (tag) ids.push(tag.id)
  }
  return ids
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

export function recordAnalyticsEvent(event: AnalyticsEventInput) {
  db.prepare(`INSERT INTO analytics_events
    (session_id,event_type,path,referrer,source,medium,campaign,target,value,country,device)
    VALUES (@sessionId,@type,@path,@referrer,@source,@medium,@campaign,@target,@value,@country,@device)`)
    .run({ referrer: '', source: 'direct', medium: '', campaign: '', target: '', value: null, country: '', device: '', ...event })
}

export function getAnalytics({ days = 30, path: selectedPath = '' }: { days?: number; path?: string } = {}) {
  const params = { since: `-${Math.max(1, Math.min(days, 365))} days`, path: selectedPath }
  const filter = `created_at >= datetime('now', @since) AND (@path = '' OR path = @path)`
  const overview = db.prepare(`SELECT
      SUM(event_type = 'pageview') AS views,
      COUNT(DISTINCT CASE WHEN event_type = 'pageview' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN event_type = 'engaged' THEN session_id END) AS engaged,
      COUNT(DISTINCT CASE WHEN event_type = 'scroll' AND value >= 90 THEN session_id END) AS completed,
      COALESCE(SUM(CASE WHEN event_type = 'duration' THEN value ELSE 0 END), 0) AS active_seconds
    FROM analytics_events WHERE ${filter}`).get(params) as { views: number; sessions: number; engaged: number; completed: number; active_seconds: number }
  const daily = db.prepare(`SELECT date(created_at, '+5 hours', '+30 minutes') AS day,
      SUM(event_type = 'pageview') AS views,
      COUNT(DISTINCT CASE WHEN event_type = 'pageview' THEN session_id END) AS sessions
    FROM analytics_events WHERE ${filter} GROUP BY day ORDER BY day`).all(params) as { day: string; views: number; sessions: number }[]
  const pages = db.prepare(`SELECT path,
      SUM(event_type = 'pageview') AS views,
      COUNT(DISTINCT CASE WHEN event_type = 'pageview' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN event_type = 'engaged' THEN session_id END) AS engaged,
      COUNT(DISTINCT CASE WHEN event_type = 'scroll' AND value >= 90 THEN session_id END) AS completed,
      COALESCE(SUM(CASE WHEN event_type = 'duration' THEN value ELSE 0 END), 0) AS active_seconds
    FROM analytics_events WHERE created_at >= datetime('now', @since) AND event_type IN ('pageview','engaged','scroll','duration')
    GROUP BY path ORDER BY views DESC LIMIT 50`).all(params) as { path: string; views: number; sessions: number; engaged: number; completed: number; active_seconds: number }[]
  const sources = db.prepare(`SELECT source, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM analytics_events WHERE ${filter} AND event_type = 'pageview'
    GROUP BY source ORDER BY views DESC LIMIT 20`).all(params) as { source: string; views: number; sessions: number }[]
  const clicks = db.prepare(`SELECT target, COUNT(*) AS clicks, COUNT(DISTINCT session_id) AS sessions
    FROM analytics_events WHERE ${filter} AND event_type = 'click' AND target <> ''
    GROUP BY target ORDER BY clicks DESC LIMIT 20`).all(params) as { target: string; clicks: number; sessions: number }[]
  const countries = db.prepare(`SELECT country, COUNT(DISTINCT session_id) AS sessions
    FROM analytics_events WHERE ${filter} AND event_type = 'pageview' AND country <> ''
    GROUP BY country ORDER BY sessions DESC LIMIT 20`).all(params) as { country: string; sessions: number }[]
  const devices = db.prepare(`SELECT device, COUNT(DISTINCT session_id) AS sessions
    FROM analytics_events WHERE ${filter} AND event_type = 'pageview' AND device <> ''
    GROUP BY device ORDER BY sessions DESC`).all(params) as { device: string; sessions: number }[]
  const journeys = db.prepare(`WITH matching_sessions AS (
      SELECT DISTINCT session_id FROM analytics_events WHERE ${filter}
    ), ordered_pages AS (
      SELECT events.session_id, events.path, events.source, events.created_at
      FROM analytics_events events JOIN matching_sessions USING (session_id)
      WHERE events.event_type = 'pageview' AND events.created_at >= datetime('now', @since)
      ORDER BY events.created_at
    )
    SELECT session_id, MIN(created_at) AS started_at, MAX(created_at) AS last_at,
      MIN(source) AS source, COUNT(*) AS pageviews, GROUP_CONCAT(path, ' → ') AS pages
    FROM ordered_pages GROUP BY session_id ORDER BY last_at DESC LIMIT 20`).all(params) as { session_id: string; started_at: string; last_at: string; source: string; pageviews: number; pages: string }[]
  return { overview, daily, pages, sources, clicks, countries, devices, journeys }
}

export function getApprovedComments(postId: number) {
  return db.prepare(`SELECT id,post_id,parent_id,name,body,status,is_admin,is_private,created_at FROM comments
    WHERE post_id = ? AND status = 'approved' AND is_private = 0 ORDER BY created_at`).all(postId) as Comment[]
}

export function createPublicComment(input: { postId: number; name: string; body: string; authorKey: string; isPrivate: boolean }) {
  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND published = 1').get(input.postId)
  if (!post) throw new Error('Post not found')
  const recent = Number((db.prepare(`SELECT COUNT(*) AS count FROM comments WHERE author_key = ? AND created_at >= datetime('now', '-1 hour')`).get(input.authorKey) as { count: number }).count)
  if (recent >= 3) throw new Error('Please wait before posting another comment.')
  const duplicate = db.prepare(`SELECT id FROM comments WHERE author_key = ? AND body = ? AND created_at >= datetime('now', '-1 day')`).get(input.authorKey, input.body)
  if (duplicate) throw new Error('That comment has already been posted.')
  return Number(db.prepare(`INSERT INTO comments (post_id,name,body,author_key,is_private) VALUES (?,?,?,?,?)`).run(input.postId, input.name, input.body, input.authorKey, Number(input.isPrivate)).lastInsertRowid)
}

export function getCommentsForAdmin() {
  return db.prepare(`SELECT comments.id,comments.post_id,comments.parent_id,comments.name,comments.body,comments.status,comments.is_admin,comments.is_private,comments.created_at,
      posts.title AS post_title, posts.slug AS post_slug
    FROM comments JOIN posts ON posts.id = comments.post_id
    ORDER BY comments.created_at DESC`).all() as Comment[]
}

export function moderateComment(id: number, status: Comment['status']) {
  db.prepare('UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id)
}

export function deleteComment(id: number) {
  db.prepare('DELETE FROM comments WHERE id = ?').run(id)
}

export function replyToComment(id: number, body: string) {
  const parent = db.prepare('SELECT id, post_id, is_private FROM comments WHERE id = ?').get(id) as { id: number; post_id: number; is_private: number } | undefined
  if (!parent) throw new Error('Comment not found')
  db.prepare(`INSERT INTO comments (post_id,parent_id,name,body,status,is_admin,is_private) VALUES (?,?,?,?,'approved',1,?)`).run(parent.post_id, parent.id, 'Aditya', body, parent.is_private)
  return parent.post_id
}

export function getPostLikeCount(postId: number) {
  return Number((db.prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?').get(postId) as { count: number }).count)
}

export function hasPostLike(postId: number, visitorId: string) {
  return Boolean(db.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND visitor_id = ?').get(postId, visitorId))
}

export function togglePostLike(postId: number, visitorId: string) {
  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND published = 1').get(postId)
  if (!post) throw new Error('Post not found')
  if (hasPostLike(postId, visitorId)) {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND visitor_id = ?').run(postId, visitorId)
    return { liked: false, count: getPostLikeCount(postId) }
  }
  db.prepare('INSERT INTO post_likes (post_id, visitor_id) VALUES (?, ?)').run(postId, visitorId)
  return { liked: true, count: getPostLikeCount(postId) }
}
