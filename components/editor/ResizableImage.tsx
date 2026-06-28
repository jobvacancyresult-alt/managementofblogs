'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React, { useState, useEffect, useRef } from 'react'

const ResizableImageComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as any)) {
        setIsSelected(false)
        setIsHovered(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const startResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = node.attrs.width || 300
    const startHeight = node.attrs.height || 200
    const onMouseMove = (e: MouseEvent) => {
      if (direction === 'right') {
        updateAttributes({ width: Math.max(20, startWidth + (e.clientX - startX)) })
      } else if (direction === 'bottom') {
        updateAttributes({ height: Math.max(20, startHeight + (e.clientY - startY)) })
      } else if (direction === 'corner') {
        updateAttributes({
          width: Math.max(20, startWidth + (e.clientX - startX)),
          height: Math.max(20, startHeight + (e.clientY - startY)),
        })
      }
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const display = node.attrs.display || 'block'
  const float = node.attrs.float || 'none'
  const showControls = isHovered || isSelected

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: display === 'inline' ? 'inline-block' : 'block',
    width: node.attrs.width ? `${node.attrs.width}px` : '300px',
    maxWidth: '100%',
    userSelect: 'none',
    float: float === 'left' ? 'left' : float === 'right' ? 'right' : 'none',
    marginRight: float === 'left' ? '12px' : '0px',
    marginLeft: float === 'right' ? '12px' : '0px',
    marginTop: '4px',
    marginBottom: '4px',
    verticalAlign: display === 'inline' ? 'middle' : 'top',
  }

  if (display === 'center') {
    wrapperStyle.float = 'none'
    wrapperStyle.margin = '16px auto'
    wrapperStyle.display = 'block'
  }

  return (
    <NodeViewWrapper
      style={{
        display: display === 'inline' ? 'inline' : 'block',
      }}
    >
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { if (!isSelected) setIsHovered(false) }}
        onClick={(e) => { e.stopPropagation(); setIsSelected(true) }}
        style={wrapperStyle}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.alt || ''}
          style={{
            width: '100%',
            height: node.attrs.height ? `${node.attrs.height}px` : 'auto',
            borderRadius: '8px',
            display: 'block',
            pointerEvents: 'none',
            border: showControls ? '2px solid #2563eb' : '2px solid transparent',
          }}
          draggable={false}
        />

        {/* Position Controls */}
        {showControls && (
          <div
            onMouseEnter={() => setIsHovered(true)}
            style={{
              position: 'absolute',
              top: -36,
              left: 0,
              display: 'flex',
              gap: '3px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '3px 5px',
              zIndex: 9999,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {[
              { label: '📝 Inline', d: 'inline', f: 'none' },
              { label: '⬅ Left', d: 'block', f: 'left' },
              { label: '↔ Center', d: 'center', f: 'none' },
              { label: '➡ Right', d: 'block', f: 'right' },
              { label: '🔲 Block', d: 'block', f: 'none' },
            ].map((opt) => (
              <button
                key={opt.label}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  updateAttributes({ display: opt.d, float: opt.f })
                  setIsSelected(true)
                }}
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: (node.attrs.display === opt.d && node.attrs.float === opt.f)
                    ? '#2563eb' : '#f1f5f9',
                  color: (node.attrs.display === opt.d && node.attrs.float === opt.f)
                    ? 'white' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Alt text */}
        {showControls && node.attrs.alt && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            maxWidth: '80%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}>
            alt: {node.attrs.alt}
          </div>
        )}

        {/* Delete button */}
        {showControls && (
          <div
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              deleteNode()
            }}
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              width: 24,
              height: 24,
              background: '#ef4444',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            ×
          </div>
        )}

        {/* Right resize */}
        {showControls && (
          <div
            onMouseDown={(e) => startResize(e, 'right')}
            style={{
              position: 'absolute', right: -5, top: '50%',
              transform: 'translateY(-50%)',
              width: 10, height: 40, background: '#2563eb',
              borderRadius: 3, cursor: 'ew-resize', zIndex: 10,
            }}
          />
        )}

        {/* Bottom resize */}
        {showControls && (
          <div
            onMouseDown={(e) => startResize(e, 'bottom')}
            style={{
              position: 'absolute', bottom: -5, left: '50%',
              transform: 'translateX(-50%)',
              width: 40, height: 10, background: '#2563eb',
              borderRadius: 3, cursor: 'ns-resize', zIndex: 10,
            }}
          />
        )}

        {/* Corner resize */}
        {showControls && (
          <div
            onMouseDown={(e) => startResize(e, 'corner')}
            style={{
              position: 'absolute', bottom: -5, right: -5,
              width: 14, height: 14, background: '#2563eb',
              borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10,
            }}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: el => el.getAttribute('src'),
      },
      alt: {
        default: '',
        parseHTML: el => el.getAttribute('alt') || '',
      },
      width: {
        default: 300,
        parseHTML: el => {
          const style = el.getAttribute('style') || ''
          const w = style.match(/width:\s*([\d.]+)px/)
          return w ? parseInt(w[1]) : (el.getAttribute('width') ? parseInt(el.getAttribute('width')!) : 300)
        },
      },
      height: {
        default: null,
        parseHTML: el => {
          const style = el.getAttribute('style') || ''
          const h = style.match(/height:\s*([\d.]+)px/)
          return h ? parseInt(h[1]) : null
        },
      },
      display: {
        default: 'block',
        parseHTML: el => {
          const style = el.getAttribute('style') || ''
          if (style.includes('margin: 16px auto') || style.includes('margin:16px auto')) return 'center'
          if (style.includes('inline-block')) return 'inline'
          return 'block'
        },
      },
      float: {
        default: 'none',
        parseHTML: el => {
          const style = el.getAttribute('style') || ''
          if (style.includes('float: left') || style.includes('float:left')) return 'left'
          if (style.includes('float: right') || style.includes('float:right')) return 'right'
          return 'none'
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'img[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { width, height, src, alt, display, float } = HTMLAttributes

    let style = `width: ${width || 300}px; height: ${height ? height + 'px' : 'auto'}; border-radius: 8px; max-width: 100%;`

    if (display === 'inline') {
      style += ' display: inline-block; vertical-align: middle;'
    } else if (display === 'center') {
      style += ' display: block; margin: 16px auto;'
    } else if (float === 'left') {
      style += ' float: left; margin-right: 12px; margin-bottom: 8px;'
    } else if (float === 'right') {
      style += ' float: right; margin-left: 12px; margin-bottom: 8px;'
    } else {
      style += ' display: block;'
    }

    return ['img', mergeAttributes({ src, alt: alt || '', style })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})