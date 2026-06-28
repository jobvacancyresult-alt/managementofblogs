'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ResizableImage } from './ResizableImage'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/core'
import { useState, useEffect } from 'react'
import { ResizableStatsCard } from './ResizableStatsCard'
import { FontSize } from './FontSize'
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model'
import MediaLibrary from '@/components/MediaLibrary'

const ColorPreserver = Extension.create({
  name: 'colorPreserver',
  addGlobalAttributes() {
    return [
      {
        types: ['bold', 'italic', 'underline'],
        attributes: {
          color: {
            default: null,
            parseHTML: element => element.style.color || null,
            renderHTML: attributes => {
              if (!attributes.color) return {}
              return { style: `color: ${attributes.color}` }
            },
          },
        },
      },
    ]
  },
})

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72]

interface BlogEditorProps {
  content: string
  onChange: (content: string) => void
  postId: string   
}

const normalizeDraftContent = (value: string) => {
  let current = value

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

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6], HTMLAttributes: {} },
  }),
  ResizableImage,
  Underline,
  Highlight,
  Color.configure({ types: ['textStyle'] }),
  TextStyle,
  FontSize,
  ColorPreserver,
  Link.configure({ openOnClick: false }),
  Placeholder.configure({ placeholder: 'Start writing your blog post...' }),
  Youtube.configure({ controls: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: element => element.getAttribute('data-background-color'),
          renderHTML: attributes => {
            if (!attributes.backgroundColor) return {}
            return {
              'data-background-color': attributes.backgroundColor,
              style: `background-color: ${attributes.backgroundColor}`,
            }
          },
        },
      }
    },
  }),
  ResizableStatsCard,
]

export default function BlogEditor({ content, onChange, postId }: BlogEditorProps) {
  const storageKey = `blog_editor_${postId}`
  const hasInitializedRef = (typeof window !== 'undefined') ? (require('react').useRef(false) as any) : null

  // If SSR ever happens here, fall back to a simple state ref.
  const safeHasInitializedRef = hasInitializedRef ?? (require('react').useRef(false) as any)

  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [showAudioInput, setShowAudioInput] = useState(false)
  const [showStatsInput, setShowStatsInput] = useState(false)
  const [initialContent, setInitialContent] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioTitle, setAudioTitle] = useState('')
  const [stats, setStats] = useState([{ value: '', label: '', description: '' }])
  const [fontSizeInput, setFontSizeInput] = useState('16')
  const [showMedia, setShowMedia] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  useEffect(() => {
    // Prevent looping: this effect must not re-run on every `content` update while user edits.
    if (safeHasInitializedRef.current) return

    const saved = localStorage.getItem(storageKey)

    if (saved) {
      setInitialContent(normalizeDraftContent(saved))
    } else if (content) {
      setInitialContent(normalizeDraftContent(content))
    } else {
      setInitialContent('')
    }

    safeHasInitializedRef.current = true
  }, [storageKey])


  const editor = useEditor({
    immediatelyRender: false,
    content: content,
   editorProps: {
    attributes: {
      class: 'prose max-w-none p-6 min-h-96 focus:outline-none text-gray-900',
    },

    handlePaste: (_view, event) => {
      const text = event.clipboardData?.getData('text/plain')
      if (!text) return false

      const lines = text.split('\n')
      const cleaned: string[] = []
      let prevBlank = false

      for (const line of lines) {
        const isBlank = line.trim() === ''
        if (isBlank) {
          if (!prevBlank) cleaned.push('')
          prevBlank = true
        } else {
          cleaned.push(line)
          prevBlank = false
        }
      }

      const result = cleaned.join('\n').trim()
      const { state, dispatch } = _view

      // Split into paragraphs and insert as HTML to preserve spacing
      const paragraphs = result.split(/\n\s*\n/).filter(p => p.trim())
      if (paragraphs.length > 1) {
        const html = paragraphs.map(p => '<p>' + p.trim().replace(/\n/g, '<br>') + '</p>').join('')
        const dom = new DOMParser().parseFromString(html, 'text/html')
        const pmParser = ProseMirrorDOMParser.fromSchema(state.schema)
        const slice = pmParser.parseSlice(dom.body)
        dispatch(state.tr.replaceSelection(slice))
      } else {
        dispatch(state.tr.insertText(result, state.selection.from, state.selection.to))
      }
      return true
    },
  },
  
  extensions: editorExtensions,
  
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    localStorage.setItem(storageKey, html)
    onChange(html.replace(/\n/g, '\n').replace(/\r/g, ''))
  },
    onSelectionUpdate: ({ editor }) => {
      const fontSize = editor.getAttributes('textStyle').fontSize
      if (!fontSize || isNaN(parseInt(fontSize))) {
        setFontSizeInput('16')
      } else {
        setFontSizeInput(String(parseInt(fontSize)))
      }
    },
  })
  useEffect(() => {
  if (editor && initialContent) {
    editor.commands.setContent(initialContent)
  }
}, [editor, initialContent])

  if (!editor) return null

  const applyColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
    const isBold = editor.isActive('bold')
    const isItalic = editor.isActive('italic')
    const isUnderline = editor.isActive('underline')
    if (isBold) editor.chain().focus().setBold().run()
    if (isItalic) editor.chain().focus().setItalic().run()
    if (isUnderline) editor.chain().focus().setUnderline().run()
  }

  const applyFontSize = (size: string) => {
    const num = parseInt(size)
    if (isNaN(num) || num < 1) return
    const clamped = Math.min(72, Math.max(8, num))
    ;(editor.chain().focus() as any).setFontSize(String(clamped)).run()
    setFontSizeInput(String(clamped))
  }

  const rawFontSize = editor.getAttributes('textStyle').fontSize
  const currentFontSize = (rawFontSize && !isNaN(parseInt(rawFontSize))) ? String(parseInt(rawFontSize)) : fontSizeInput
  const currentColor = editor.getAttributes('textStyle').color ?? '#111827'
  const currentCellColor = editor.getAttributes('tableCell').backgroundColor ?? '#ffffff'

  const addImage = () => {
    const url = prompt('Enter image URL:')
    if (!url) return
    const alt = prompt('Enter image alt text (for SEO):') || ''
    const sizeInput = prompt('Enter image width in pixels (e.g. 50, 200, 400):', '300')
    const width = parseInt(sizeInput || '300') || 300
    editor.chain().focus().insertContent({
      type: 'resizableImage',
      attrs: { src: url, alt: alt, width: width },
    }).run()
  }

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
    const match = url.match(regExp)
    return match ? `https://www.youtube.com/embed/${match[1]}` : url
  }

  const addYoutube = () => {
    if (youtubeUrl) {
      const embedUrl = getYoutubeEmbedUrl(youtubeUrl)
      editor.chain().focus().setYoutubeVideo({ src: embedUrl }).run()
      setYoutubeUrl('')
      setShowYoutubeInput(false)
    }
  }

  const addAudio = () => {
    if (audioUrl) {
      editor.chain().focus().insertContent(`
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="font-weight:600;margin:0 0 8px">${audioTitle || 'Audio'}</p>
          <audio controls style="width:100%">
            <source src="${audioUrl}" />
          </audio>
        </div>
      `).run()
      setAudioUrl('')
      setAudioTitle('')
      setShowAudioInput(false)
    }
  }

  const handleMediaSelect = ({ url, alt }: { url: string, alt: string }) => {
  editor.chain().focus().insertContent({
    type: 'resizableImage',
    attrs: {
      src: url,
      alt: alt || '',
      width: 300,
    },
  }).run()
  setShowMedia(false)
}
  const addStatsCards = () => {
    const cardsData = stats.map(s => ({
      value: s.value || '100+',
      label: s.label || 'Label',
      description: s.description || 'Description',
      bg: '#eff6ff',
      color: '#2563eb',
    }))
    editor.chain().focus().insertContent({
      type: 'resizableStatsCard',
      attrs: { cards: JSON.parse(JSON.stringify(cardsData)), width: null, height: null, left: 0, top: 0, hoverEffect: 'lift', cardStyle: 'flat' }
    }).run()
    setStats([{ value: '', label: '', description: '' }])
    setShowStatsInput(false)
  }

  const addButton = () => {
    const url = prompt('Enter button link:')
    const text = prompt('Enter button text:')
    if (url && text) {
      editor.chain().focus().insertContent(`
        <div style="text-align:center;margin:24px 0;">
          <a href="${url}" target="_blank" style="display:inline-block;background:#2563eb;color:white;padding:12px 32px;border-radius:8px;font-weight:600;text-decoration:none;">${text}</a>
        </div>
      `).run()
    }
  }
  const generatePreview = async () => {
  const res = await fetch('/api/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Preview Title',
      description: 'Preview description',
      content: editor.getHTML(),
    }),
  })

  const data = await res.json()
  setPreviewHtml(data.html)
}

  const addTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  const addTableRow = () => editor.chain().focus().addRowAfter().run()
  const addTableCol = () => editor.chain().focus().addColumnAfter().run()
  const deleteTableRow = () => editor.chain().focus().deleteRow().run()
  const deleteTableCol = () => editor.chain().focus().deleteColumn().run()
  const deleteTable = () => editor.chain().focus().deleteTable().run()
  const setCellBackground = (color: string) => editor.chain().focus().setCellAttribute('backgroundColor', color).run()
  
  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      {/* Toolbar */}
      <div className="sticky top-[56px] z-10 border-b border-gray-100 bg-gray-50 p-2 flex flex-wrap items-center gap-1 rounded-t-xl">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <button onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded text-sm font-bold ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded text-sm italic ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>I</button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 rounded text-sm underline ${editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>U</button>
          <button onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive('highlight') ? 'bg-blue-100 text-yellow-500' : 'hover:bg-gray-200 text-gray-600'}`}>🖊 Highlight</button>
        </div>
        {/* Font Size */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <button onClick={() => { const cur = parseInt(currentFontSize) || 16; applyFontSize(String(Math.max(8, cur - 1))) }}
            className="px-2 py-1 rounded text-sm hover:bg-gray-200 text-gray-600 font-bold">−</button>
          <select value={FONT_SIZES.includes(parseInt(currentFontSize)) ? currentFontSize : ''}
            onChange={(e) => applyFontSize(e.target.value)}
            className="w-14 px-1 py-1 border border-gray-200 rounded text-xs outline-none text-center">
            {!FONT_SIZES.includes(parseInt(currentFontSize)) && (
              <option value={currentFontSize}>{currentFontSize}</option>
            )}
            {FONT_SIZES.map(size => (
              <option key={size} value={String(size)}>{size}</option>
            ))}
          </select>
          <button onClick={() => { const cur = parseInt(currentFontSize) || 16; applyFontSize(String(Math.min(72, cur + 1))) }}
            className="px-2 py-1 rounded text-sm hover:bg-gray-200 text-gray-600 font-bold">+</button>
        </div>
        {/* Text Color */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <span className="text-xs text-gray-500">Color:</span>
          <input type="color" value={currentColor} onChange={(e) => applyColor(e.target.value)}
            title="Text Color" className="w-8 h-7 rounded cursor-pointer border border-gray-200 p-0.5" />
          <button onClick={() => editor.chain().focus().unsetColor().run()}
            className="px-2 py-1 rounded text-xs hover:bg-gray-200 text-gray-500 border border-gray-200">Reset</button>
        </div>
        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          {[1, 2, 3, 4].map((level) => (
            <button key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level: level as any }).run()}
              className={`px-2 py-1 rounded text-xs font-bold ${editor.isActive('heading', { level }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>
              H{level}
            </button>
          ))}
        </div>
        {/* Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-2 py-1 rounded text-xs ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>Left</button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-2 py-1 rounded text-xs ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>Center</button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-2 py-1 rounded text-xs ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>Right</button>
        </div>
        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <button onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded text-xs ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>• List</button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded text-xs ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>1. List</button>
          <button onClick={() => {
            const { from, to } = editor.state.selection
            const selectedText = editor.state.doc.textBetween(from, to, '\n')
            if (selectedText.trim()) {
              const lines = selectedText.split('\n').filter(l => l.trim())
              const html = `<div style="margin:1rem 0;">${lines.map(line =>
                `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;"><span style="color:#1e40af;font-weight:bold;flex-shrink:0;min-width:16px;margin-top:1px;">➤</span><span style="color:#111827;">${line.trim()}</span></div>`
              ).join('')}</div>`
              editor.chain().focus().deleteSelection().insertContent(html).run()
            } else {
              editor.chain().focus().insertContent(
                '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;"><span style="color:#1e40af;font-weight:bold;flex-shrink:0;min-width:16px;margin-top:1px;">➤</span><span style="color:#111827;">Your text here</span></div>'
              ).run()
            }
          }} className="px-2 py-1 rounded text-xs hover:bg-gray-200 text-gray-600">➤</button>
        </div>
        {/* Quote & Code */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 rounded text-xs ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>&quot; Quote</button>
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-2 py-1 rounded text-xs ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>Code</button>
        </div>
        {/* Undo Redo */}
        <div className="flex items-center gap-1">
          <button onClick={() => editor.chain().focus().undo().run()}
            className="px-2 py-1 rounded text-xs hover:bg-gray-200 text-gray-600">↩ Undo</button>
          <button onClick={() => editor.chain().focus().redo().run()}
            className="px-2 py-1 rounded text-xs hover:bg-gray-200 text-gray-600">↪ Redo</button>
        </div>
        {/* Table Controls */}
        {editor.isActive('table') && (
          <div className="w-full border-t border-gray-200 mt-1 pt-1 flex flex-wrap items-center gap-1">
            <span className="text-xs text-gray-400 font-medium">Table:</span>
            <button onClick={addTableRow} className="px-2 py-1 rounded text-xs bg-white border border-gray-200 hover:border-blue-400 text-gray-600">+ Row</button>
            <button onClick={addTableCol} className="px-2 py-1 rounded text-xs bg-white border border-gray-200 hover:border-blue-400 text-gray-600">+ Col</button>
            <button onClick={deleteTableRow} className="px-2 py-1 rounded text-xs bg-white border border-red-200 hover:border-red-400 text-red-500">- Row</button>
            <button onClick={deleteTableCol} className="px-2 py-1 rounded text-xs bg-white border border-red-200 hover:border-red-400 text-red-500">- Col</button>
            <button onClick={deleteTable} className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600">Delete Table</button>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-gray-400">Cell Color:</span>
              <input type="color" value={currentCellColor} onChange={(e) => setCellBackground(e.target.value)}
                className="w-8 h-7 rounded cursor-pointer border border-gray-200 p-0.5" />
            </div>
            
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
  <button
    onClick={generatePreview}
    className="px-3 py-1 bg-black text-white rounded"
  >
    Preview
  </button>
</div>
      {/* Editor Content */}
      <EditorContent editor={editor} className="prose max-w-none p-6 min-h-96 focus:outline-none text-gray-900 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6" />

      {/* Block Adder */}
      <div className="border-t border-gray-100 bg-gray-50 p-3">
        <p className="text-xs text-gray-400 mb-2 font-medium uppercase">Add Blocks</p>
        <div className="flex flex-wrap gap-2">
         <button onClick={() => setShowMedia(true)} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-xs text-gray-600 hover:text-blue-600 transition-colors">🖼️ Media</button>
          <button onClick={() => setShowYoutubeInput(!showYoutubeInput)} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-xs text-gray-600 hover:text-blue-600 transition-colors">🎬 Video</button>
          <button onClick={() => setShowAudioInput(!showAudioInput)} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-xs text-gray-600 hover:text-blue-600 transition-colors">🎵 Audio</button>
          <button onClick={() => setShowStatsInput(!showStatsInput)} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-xs text-gray-600 hover:text-blue-600 transition-colors">📊 Stats Cards</button>
          <button onClick={addTable} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-xs text-gray-600 hover:text-blue-600 transition-colors">📋 Table</button>
          <button onClick={addButton} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-xs text-gray-600 hover:text-blue-600 transition-colors">🎯 Button</button>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-xs text-gray-600 hover:text-blue-600 transition-colors">➖ Divider</button>
        </div>
        {showYoutubeInput && (
          <div className="mt-3 flex gap-2">
            <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            <button onClick={addYoutube} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
            <button onClick={() => setShowYoutubeInput(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Cancel</button>
          </div>
        )}
        {showAudioInput && (
          <div className="mt-3 space-y-2">
            <input type="text" value={audioTitle} onChange={(e) => setAudioTitle(e.target.value)}
              placeholder="Audio title..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            <div className="flex gap-2">
              <input type="text" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="Paste audio URL..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
              <button onClick={addAudio} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
              <button onClick={() => setShowAudioInput(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}
        {showStatsInput && (
          <div className="mt-3 space-y-2">
            {stats.map((stat, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={stat.value}
                  onChange={(e) => { const s = [...stats]; s[i].value = e.target.value; setStats(s) }}
                  placeholder="Value (e.g. 100+)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                <input type="text" value={stat.label}
                  onChange={(e) => { const s = [...stats]; s[i].label = e.target.value; setStats(s) }}
                  placeholder="Label" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                <input type="text" value={stat.description}
                  onChange={(e) => { const s = [...stats]; s[i].description = e.target.value; setStats(s) }}
                  placeholder="Description" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setStats([...stats, { value: '', label: '', description: '' }])}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">+ Add Stat</button>
              <button onClick={addStatsCards} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Insert</button>
              <button onClick={() => setShowStatsInput(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
      {showMedia && (
  <MediaLibrary
    onSelect={handleMediaSelect}
    onClose={() => setShowMedia(false)}
  />
)}
{previewHtml && (
  <div className="mt-6 border rounded-lg overflow-hidden">
    <iframe
      srcDoc={previewHtml}
      className="w-full h-[600px] bg-white"
    />
  </div>
)}
    </div>
  )
}