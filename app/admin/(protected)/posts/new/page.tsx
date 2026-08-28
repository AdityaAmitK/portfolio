import { PostEditor } from '@/components/post-editor'
import { getTags } from '@/lib/db'

export default function NewPostPage() {
  return <main className="admin-shell admin-main"><p className="eyebrow">New draft</p><h1>Write a post</h1><PostEditor tags={getTags()} /></main>
}
