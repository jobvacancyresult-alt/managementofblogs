'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BlogEditor from '@/components/editor/BlogEditor'
import PublishSiteButtons from '@/components/admin/PublishSiteButtons'
import { slugify, generateReadTime } from '@/lib/slugify'
import type { SiteSlug } from '@/lib/sites'
const normalizeDraftContent = (value: unknown) => {
  let current = typeof value === 'string' ? value : ''
  while (typeof current === 'string') {
    const trimmed = current.trim()
    if (!trimmed.startsWith('{')) break
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && 'content' in parsed && typeof parsed.content === 'string') {
        current = parsed.content
        continue
      }
    } catch {
      break
    }
    break
  }
  return current
}
const normalizeDraft = (draft: any) => {
  if (!draft || typeof draft !== 'object') return draft
  return {
    ...draft,
    content: normalizeDraftContent(draft.content),
    titleHtml: typeof draft.titleHtml === 'string' ? normalizeDraftContent(draft.titleHtml) : draft.titleHtml,
  }
}
export default function NewBlogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const titleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<string>('')
  const [postId, setPostId] = useState(Date.now().toString())
const DRAFT_KEY = `blog_draft_${postId}`
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
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (parsed.title || parsed.content) {
          const normalized = normalizeDraft(parsed)
          setForm(normalized)
          if (titleRef.current && normalized.titleHtml) {
            titleRef.current.innerHTML = normalized.titleHtml
          }
          localStorage.setItem(DRAFT_KEY, JSON.stringify(normalized))
        }
      } catch(e) {
        localStorage.removeItem(DRAFT_KEY)
      }
    }
  }, [DRAFT_KEY])
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.title || form.content || contentRef.current) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          ...form,
          content: contentRef.current || form.content,
          titleHtml: titleRef.current?.innerHTML || '',
        }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [form,DRAFT_KEY])

  const handleContentChange = (newContent: string) => {
    contentRef.current = newContent
    setForm((prev) => ({ ...prev, content: newContent }))
  }
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
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          site,
          title: titleRef.current?.innerText || form.title,
          titleHtml,
          status,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          content: contentRef.current || form.content,
          readTime: generateReadTime(contentRef.current || form.content),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        localStorage.removeItem(DRAFT_KEY)
        router.push('/admin/blogs')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }
 const clearDraft = () => {
  localStorage.removeItem(DRAFT_KEY)

  setPostId(Date.now().toString()) 

  if (titleRef.current) titleRef.current.innerHTML = ''

  setForm({
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
}
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Create New Blog</h1>
            {saved && (
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                ✓ Draft saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={clearDraft} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-400 transition-colors">
              Clear Draft
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-5">

            <div>
              <label className="block text-sm text-gray-400 mb-1">Slug (SEO URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <textarea
                placeholder="Short description of your blog..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

          <BlogEditor 
  content={form.content} 
  onChange={handleContentChange} 
  postId={postId}
/>
          </div>
          {/* Sidebar */}
          <div className="space-y-5">

            {/* Title Settings */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold mb-3">Title</h3>
              {/* Editable Title */}
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  const text = e.currentTarget.innerText
                  setForm({ ...form, title: text, slug: slugify(text), metaTitle: text })
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                style={{ whiteSpace: 'pre-wrap', minHeight: '60px', fontSize: '40px', fontWeight: '700', lineHeight: '1.3' }}
                data-placeholder="write blog.."
              />
              {/* Color Picker */}
              <div className="flex items-center gap-3 mt-3">
                <label className="text-xs text-gray-400">Selected Text Color</label>
                <input
                  type="color"
                  defaultValue="#ffffff"
                  onChange={(e) => applyTitleColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-gray-700"
                  title="Select text in title, then pick color"
                />
                <button
                  onClick={() => {
                    if (titleRef.current) {
                      titleRef.current.focus()
                      document.execCommand('removeFormat')
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1"></p>
            </div>
            {/* Featured Image */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Featured Image</h3>
              <input
                type="text"
                placeholder="Image URL"
                value={form.featuredImage}
                onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Image Alt Text (SEO)"
                value={form.featuredImageAlt}
                onChange={(e) => setForm({ ...form, featuredImageAlt: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 mt-2"
              />
              {form.featuredImage && (
                <img src={form.featuredImage} alt="preview" className="mt-3 w-full rounded-lg object-cover h-32" />
              )}
            </div>

            {/* Category & Keywords */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Category & Keywords</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Marketing, AI, Case Study"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Keywords / Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. SEO, Growth, Marketing"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Publish destination */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <PublishSiteButtons
                variant="dark"
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


            {/* SEO Settings */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold mb-4">SEO Settings</h3>
              <input
                type="text"
                placeholder="Meta Title"
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
              />
              <textarea
                placeholder="Meta Description"
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none mb-3"
              />
              <input
                type="text"
                placeholder="Canonical URL (optional)"
                value={form.canonicalUrl}
                onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            {/* Audio Player */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold mb-4">🎵 Audio Player</h3>
              <input
                type="text"
                placeholder="Audio Title"
                value={form.audioTitle}
                onChange={(e) => setForm({ ...form, audioTitle: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
              />
              <input
                type="text"
                placeholder="Audio URL (.mp3)"
                value={form.audioUrl}
                onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
              />
              <input
                type="text"
                placeholder="Duration (e.g. 4:43)"
                value={form.audioDuration}
                onChange={(e) => setForm({ ...form, audioDuration: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}