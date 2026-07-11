'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import BlogEditor from '@/components/editor/BlogEditor'
import PublishSiteButtons from '@/components/admin/PublishSiteButtons'
import { slugify, generateReadTime } from '@/lib/slugify'
import type { SiteSlug } from '@/lib/sites'

export default function EditBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [blogId, setBlogId] = useState('')
  const titleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<string>('')

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    featuredImage: '',
    featuredImageAlt: '',
    titleColor: '',
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    status: 'draft',
    site: 'coi' as SiteSlug,
    audioUrl: '',
    audioTitle: '',
    audioDuration: '',
  })

  useEffect(() => {
    fetch(`/api/blogs/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.blog) {
          setBlogId(data.blog.id)
          setForm({
            title: data.blog.title || '',
            slug: data.blog.slug || '',
            description: data.blog.description || '',
            content: data.blog.content || '',
            featuredImage: data.blog.featuredImage || '',
            featuredImageAlt: data.blog.featuredImageAlt || '',
            titleColor: data.blog.titleColor || '',
            category: data.blog.category || '',
            tags: data.blog.tags?.join(', ') || '',
            metaTitle: data.blog.metaTitle || '',
            metaDescription: data.blog.metaDescription || '',
            canonicalUrl: data.blog.canonicalUrl || '',
            status: data.blog.status || 'draft',
            site: (data.blog.site?.slug || 'coi') as SiteSlug,
            audioUrl: data.blog.audioUrl || '',
            audioTitle: data.blog.audioTitle || '',
            audioDuration: data.blog.audioDuration || '',
          })
          contentRef.current = data.blog.content || ''
          if (titleRef.current) {
            titleRef.current.innerHTML = data.blog.titleHtml || data.blog.title || ''
          }
        }
        setFetching(false)
      })
  }, [slug])

  const applyTitleColor = (color: string) => {
    if (titleRef.current) {
      titleRef.current.focus()
      document.execCommand('foreColor', false, color)
    }
  }

  const handleSubmit = async (status: string, site: SiteSlug = form.site) => {
    setLoading(true)
    setError('')
    try {
      const titleHtml = titleRef.current?.innerHTML || ''
      const res = await fetch(`/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          site,
          content: contentRef.current || form.content,
          title: titleRef.current?.innerText || form.title,
          titleHtml,
          status,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          readTime: generateReadTime(contentRef.current || form.content),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        router.push('/admin/blogs')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading blog...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <a href="/admin/blogs" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Posts</a>
            <span className="text-gray-200">|</span>
            <span className="text-sm font-medium text-gray-700">Edit: {form.title || 'Untitled'}</span>
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-red-500 text-sm">{error}</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <textarea
                placeholder="Short description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full text-gray-700 border-none outline-none bg-transparent resize-none placeholder-gray-300"
              />
            </div>
           {!fetching && (
  <BlogEditor
    content={form.content}
    onChange={(newContent) => {
      contentRef.current = newContent
      setForm((prev) => ({ ...prev, content: newContent }))
    }}
    postId={slug}   
  />
)}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Title Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Title</h3>
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  const text = e.currentTarget.innerText
                  setForm({ ...form, title: text, slug: slugify(text), metaTitle: text })
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-400"
                style={{ whiteSpace: 'pre-wrap', minHeight: '60px', fontSize: '40px', fontWeight: '700', lineHeight: '1.3' }}
              />
              <div className="flex items-center gap-3 mt-3">
                <label className="text-xs text-gray-500">Selected Text Color:</label>
                <input
                  type="color"
                  defaultValue="#000000"
                  onChange={(e) => applyTitleColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-gray-200"
                />
                <button
                  onClick={() => {
                    if (titleRef.current) {
                      titleRef.current.focus()
                      document.execCommand('removeFormat')
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Text select karo phir color choose karo</p>
            </div>

            {/* Slug */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">URL Slug</h3>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            {/* Publish destination */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <PublishSiteButtons
                variant="light"
                selectedSite={form.site}
                onSiteChange={(site) => setForm({ ...form, site })}
                onSaveDraft={() => handleSubmit('draft', form.site)}
                onPublish={(site) => {
                  setForm((prev) => ({ ...prev, site }))
                  handleSubmit('published', site)
                }}
                loading={loading}
              />
            </div>

            {/* Publish Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Publish Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Featured Image</h3>
              <input type="text" placeholder="Image URL..." value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none" />
              <input type="text" placeholder="Image Alt Text (SEO)" value={form.featuredImageAlt} onChange={(e) => setForm({ ...form, featuredImageAlt: e.target.value })} className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none mt-2" />
              {form.featuredImage && (
                <img src={form.featuredImage} alt="featured" className="mt-3 w-full rounded-lg object-cover h-32" />
              )}
            </div>

            {/* Category & Keywords */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Category & Keywords</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Marketing, AI, Case Study"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Keywords / Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. SEO, Growth, Marketing"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">SEO Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Meta Title</label>
                  <input type="text" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Meta Description</label>
                  <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={3} className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Canonical URL (optional)</label>
                  <input type="text" value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} placeholder="https://cultureofinternet.com/blog-slug" className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                </div>
              </div>
            </div>

            {/* Audio Player */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">🎵 Audio Player</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Audio Title</label>
                  <input type="text" value={form.audioTitle} onChange={(e) => setForm({ ...form, audioTitle: e.target.value })} placeholder="Listen: Blog Title" className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Audio URL (.mp3)</label>
                  <input type="text" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="https://..." className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Duration (e.g. 4:43)</label>
                  <input type="text" value={form.audioDuration} onChange={(e) => setForm({ ...form, audioDuration: e.target.value })} placeholder="4:43" className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}