'use client'

import { useState, useEffect } from 'react'

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    const res = await fetch('/api/media')
    const data = await res.json()
    setMedia(data.media || [])
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        await fetchMedia()
      }
    }

    setUploading(false)
  }

  const handleDelete = async (publicId: string, id: string) => {
    if (!confirm('Delete this image?')) return
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, id }),
    })
    setMedia(media.filter((m) => m.id !== id))
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-500 mt-1">{media.length} files</p>
        </div>
        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors">
          {uploading ? 'Uploading...' : '+ Upload Files'}
          <input
            type="file"
            multiple
           accept="image/*,video/*,audio/*,.svg,.ico,.mp3,.wav,.ogg"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 mb-2">No files uploaded yet</p>
          <p className="text-gray-300 text-sm">Upload images, icons, or videos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <div key={item.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                <img
                  src={item.url}
                  alt={item.filename || 'media'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">{item.filename || 'file'}</p>
                {item.size && (
                  <p className="text-xs text-gray-400">{(item.size / 1024).toFixed(1)} KB</p>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <button
                  onClick={() => handleOpenUrl(item.url)}
                  className="w-full py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900"
                >
                  Open URL
                </button>
                <button
                  onClick={() => copyUrl(item.url)}
                  className="w-full py-1.5 bg-white text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-100"
                >
                  {copied === item.url ? '✓ Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={() => handleDelete(item.publicId, item.id)}
                  className="w-full py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

