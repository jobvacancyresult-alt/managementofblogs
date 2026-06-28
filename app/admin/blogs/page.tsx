'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Pencil, Trash2, Eye, Plus } from 'lucide-react'
import { getSiteLabel } from '@/lib/sites'

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    const res = await fetch('/api/blogs?limit=0')
    const data = await res.json()
    setBlogs(data.blogs || [])
    setTotalPosts(data.pagination?.total ?? data.blogs?.length ?? 0)
    setLoading(false)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    setDeleting(id)
    const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBlogs(blogs.filter((b) => b.id !== id))
    }
    setDeleting(null)
  }

  const handlePublishToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/blogs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setBlogs(blogs.map((b) => b.id === id ? { ...b, status: newStatus } : b))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Posts</h1>
          <p className="text-gray-500 mt-1 text-sm">{totalPosts} total posts</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          <span className="hidden sm:block">New Post</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Title</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Site</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Views</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p className="text-gray-400 mb-3">No posts yet</p>
                  <Link href="/admin/blogs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                    Create your first post
                  </Link>
                </td>
              </tr>
            ) : (
              blogs.map((blog: any) => (
                <tr key={blog.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{blog.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/blog/{blog.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {getSiteLabel(blog.site?.slug)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handlePublishToggle(blog.id, blog.status)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors ${
                        blog.status === 'published'
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      }`}
                    >
                      {blog.status === 'published' ? '✅ Published' : '📝 Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{blog.views || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/blogs/${blog.id}/edit`} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <Pencil size={12} /> Edit
                      </Link>
                      <Link href={`/blog/${blog.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                        <Eye size={12} /> View
                      </Link>
                      <button
                        onClick={() => handleDelete(blog.id, blog.title)}
                        disabled={deleting === blog.id}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                        {deleting === blog.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {blogs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-3">No posts yet</p>
            <Link href="/admin/blogs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              Create your first post
            </Link>
          </div>
        ) : (
              blogs.map((blog: any) => (
            <div key={blog.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{blog.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">/blog/{blog.slug}</p>
                </div>
                <button
                  onClick={() => handlePublishToggle(blog.id, blog.status)}
                  className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                    blog.status === 'published'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {blog.status === 'published' ? '✅' : '📝'}
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                <span className="font-semibold text-gray-600">{getSiteLabel(blog.site?.slug)}</span>
                <span>•</span>
                <span>{blog.views || 0} views</span>
                <span>•</span>
                <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <Link
                  href={`/admin/blogs/${blog.id}/edit`}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium"
                >
                  <Pencil size={12} /> Edit
                </Link>
                <Link
                  href={`/blog/${blog.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-gray-400"
                >
                  <Eye size={12} /> View
                </Link>
                <button
                  onClick={() => handleDelete(blog.id, blog.title)}
                  disabled={deleting === blog.id}
                  className="flex items-center gap-1 text-xs text-red-400 ml-auto"
                >
                  <Trash2 size={12} />
                  {deleting === blog.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}