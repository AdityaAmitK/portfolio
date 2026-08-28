import { getTags } from '@/lib/db'
import { removeTag, upsertTag } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default async function TagsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  const tags = getTags()
  return (
    <main className="admin-shell admin-main">
      <p className="eyebrow">Publishing desk</p>
      <h1>Tags</h1>
      {saved && <p style={{ color: 'var(--signal)' }}>Tags saved.</p>}
      <form action={upsertTag} className="tag-create"><div className="field"><label htmlFor="new-tag">New tag</label><input id="new-tag" name="name" required placeholder="e.g. Test cricket" /></div><button className="admin-button" type="submit">Add tag</button></form>
      <div className="tag-manager">
        {tags.map(tag => <div className="tag-manager__row" key={tag.id}><form action={upsertTag}><input type="hidden" name="id" value={tag.id} /><div className="field"><label htmlFor={`tag-${tag.id}`}>Name</label><input id={`tag-${tag.id}`} name="name" defaultValue={tag.name} required /></div><span className="mono muted">/{tag.slug}</span><button className="admin-button admin-button--secondary" type="submit">Rename</button></form><form action={removeTag}><input type="hidden" name="id" value={tag.id} /><button className="admin-button admin-button--danger" type="submit">Delete</button></form></div>)}
      </div>
    </main>
  )
}
