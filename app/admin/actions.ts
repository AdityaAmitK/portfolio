'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSession, destroySession, isAuthenticated, passwordsMatch } from '@/lib/auth'
import { deletePost, deleteTag as deleteTagRecord, saveManagedContent, savePost, saveTag as saveTagRecord } from '@/lib/db'
import type { ManagedContent } from '@/lib/content'

export async function login(formData: FormData) {
  const password = String(formData.get('password') || '')
  if (!passwordsMatch(password)) redirect('/admin/login?error=1')
  await createSession()
  redirect('/admin')
}

export async function logout() {
  await destroySession()
  redirect('/admin/login')
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function upsertPost(formData: FormData) {
  if (!(await isAuthenticated())) redirect('/admin/login')
  const title = String(formData.get('title') || '').trim()
  const slug = slugify(String(formData.get('slug') || title))
  if (!title || !slug) redirect('/admin/posts/new?error=required')
  const idValue = Number(formData.get('id'))
  const id = savePost({
    id: Number.isFinite(idValue) && idValue > 0 ? idValue : undefined,
    title,
    slug,
    description: String(formData.get('description') || '').trim(),
    tagIds: formData.getAll('tags').map(Number).filter(tagId => Number.isInteger(tagId) && tagId > 0),
    body: String(formData.get('body') || ''),
    cover_image: String(formData.get('coverImage') || '').trim(),
    cover_alt: String(formData.get('coverAlt') || '').trim(),
    published: formData.get('published') === 'on' ? 1 : 0,
  })
  revalidatePath('/')
  revalidatePath('/writing')
  revalidatePath(`/writing/${slug}`)
  redirect(`/admin/posts/${id}?saved=1`)
}

export async function upsertTag(formData: FormData) {
  if (!(await isAuthenticated())) redirect('/admin/login')
  const idValue = Number(formData.get('id'))
  saveTagRecord(Number.isInteger(idValue) && idValue > 0 ? idValue : undefined, String(formData.get('name') || ''))
  revalidatePath('/admin/tags')
  revalidatePath('/writing')
  redirect('/admin/tags?saved=1')
}

export async function removeTag(formData: FormData) {
  if (!(await isAuthenticated())) redirect('/admin/login')
  deleteTagRecord(Number(formData.get('id')))
  revalidatePath('/admin')
  revalidatePath('/admin/tags')
  revalidatePath('/writing')
  redirect('/admin/tags')
}

export async function removePost(formData: FormData) {
  if (!(await isAuthenticated())) redirect('/admin/login')
  deletePost(Number(formData.get('id')))
  revalidatePath('/')
  revalidatePath('/writing')
  redirect('/admin')
}

export async function updateContent(formData: FormData) {
  if (!(await isAuthenticated())) redirect('/admin/login')
  const raw = String(formData.get('content') || '')
  const content = JSON.parse(raw) as ManagedContent
  if (!Array.isArray(content.projects) || !Array.isArray(content.tools) || !Array.isArray(content.skills) || !content.about || typeof content.about.headline !== 'string' || typeof content.about.body !== 'string') throw new Error('Invalid content')
  saveManagedContent(content)
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/tools')
  redirect('/admin/content?saved=1')
}
