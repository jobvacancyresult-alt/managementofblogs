'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React, { useState, useRef, useCallback } from 'react'

const parseCards = (cards: any) => {
  if (!cards) return [{ value: '100+', label: 'Clients', description: 'Happy customers', bg: '#eff6ff', color: '#2563eb' }]
  if (typeof cards === 'string') {
    try { cards = JSON.parse(cards) } catch { return [{ value: '100+', label: 'Clients', description: 'Happy customers', bg: '#eff6ff', color: '#2563eb' }] }
  }
  if (!Array.isArray(cards) || cards.length === 0) return [{ value: '100+', label: 'Clients', description: 'Happy customers', bg: '#eff6ff', color: '#2563eb' }]
  return cards
}

const HOVER_EFFECTS = ['lift', 'glow', 'scale', 'border', 'none']
const CARD_STYLES = ['flat', 'shadow', 'outline', 'gradient']

const getCardBaseStyle = (card: any, cardStyle: string): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRadius: '12px', padding: '20px', minWidth: '140px',
    textAlign: 'center', position: 'relative', flex: '1',
    transition: 'all 0.22s ease',
  }
  if (cardStyle === 'shadow') {
    base.background = card.bg || '#eff6ff'
    base.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'
  } else if (cardStyle === 'outline') {
    base.background = '#ffffff'
    base.border = `2px solid ${card.color || '#2563eb'}`
  } else if (cardStyle === 'gradient') {
    base.background = `linear-gradient(135deg, ${card.bg || '#eff6ff'} 0%, ${card.color || '#2563eb'}22 100%)`
  } else {
    base.background = card.bg || '#eff6ff'
  }
  return base
}

const getCardHoverStyle = (card: any, hoverEffect: string): React.CSSProperties => {
  if (hoverEffect === 'lift') return { transform: 'translateY(-6px)', boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }
  if (hoverEffect === 'glow') return { boxShadow: `0 0 22px ${card.color || '#2563eb'}55` }
  if (hoverEffect === 'scale') return { transform: 'scale(1.05)' }
  if (hoverEffect === 'border') return { border: `2px solid ${card.color || '#2563eb'}`, boxShadow: `0 4px 16px ${card.color || '#2563eb'}33` }
  return {}
}


const StatsCardComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 })

  const cards = parseCards(node.attrs.cards)
  const hoverEffect = node.attrs.hoverEffect || 'lift'
  const cardStyle = node.attrs.cardStyle || 'flat'

  const updateCard = (index: number, field: string, value: string) => {
    const newCards = [...cards]
    newCards[index] = { ...newCards[index], [field]: value }
    updateAttributes({ cards: newCards })
  }

  const addCard = () => {
    updateAttributes({
      cards: [...cards, { value: 'New', label: 'Label', description: 'Description', bg: '#f0fdf4', color: '#16a34a' }]
    })
  }

  const removeCard = (index: number) => {
    const newCards = cards.filter((_: any, i: number) => i !== index)
    updateAttributes({ cards: newCards })
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'LABEL' ||
      target.isContentEditable ||
      target.closest('button') ||
      target.closest('label') ||
      target.closest('[contenteditable]')
    ) return

    e.preventDefault()
    isDragging.current = true
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      left: node.attrs.left || 0,
      top: node.attrs.top || 0,
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      updateAttributes({
        left: dragStart.current.left + (e.clientX - dragStart.current.x),
        top: dragStart.current.top + (e.clientY - dragStart.current.y),
      })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [node.attrs.left, node.attrs.top, updateAttributes])

  const startResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = node.attrs.width || 600
    const startHeight = node.attrs.height || 150

    const onMouseMove = (e: MouseEvent) => {
      if (direction === 'right') updateAttributes({ width: Math.max(200, startWidth + (e.clientX - startX)) })
      if (direction === 'bottom') updateAttributes({ height: Math.max(100, startHeight + (e.clientY - startY)) })
      if (direction === 'corner') {
        updateAttributes({
          width: Math.max(200, startWidth + (e.clientX - startX)),
          height: Math.max(100, startHeight + (e.clientY - startY)),
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

  return (
    <NodeViewWrapper style={{ display: 'block', position: 'relative', margin: '16px 0' }}>
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`,
          gap: '16px',
          width: node.attrs.width ? `${node.attrs.width}px` : '100%',
          minHeight: node.attrs.height ? `${node.attrs.height}px` : 'auto',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          padding: '8px',
          border: isHovered ? '2px dashed #2563eb' : '2px dashed transparent',
          borderRadius: '12px',
          userSelect: 'none',
        }}
      >
        {cards.map((card: any, index: number) => (
          <div key={index}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ ...getCardBaseStyle(card, cardStyle), ...(hoveredCard === index ? getCardHoverStyle(card, hoverEffect) : {}) }}>
            {isHovered && (
              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => removeCard(index)}
                style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, background: '#ef4444', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', zIndex: 10 }}>×</button>
            )}
            <div contentEditable suppressContentEditableWarning onMouseDown={(e) => e.stopPropagation()}
              onBlur={(e) => updateCard(index, 'value', e.currentTarget.textContent || '')}
              style={{ fontSize: '2rem', fontWeight: '700', color: card.color || '#2563eb', margin: '0', outline: 'none' }}>{card.value}</div>
            <div contentEditable suppressContentEditableWarning onMouseDown={(e) => e.stopPropagation()}
              onBlur={(e) => updateCard(index, 'label', e.currentTarget.textContent || '')}
              style={{ fontWeight: '600', margin: '4px 0', outline: 'none', color: card.color || '#2563eb' }}>{card.label}</div>
            <div contentEditable suppressContentEditableWarning onMouseDown={(e) => e.stopPropagation()}
              onBlur={(e) => updateCard(index, 'description', e.currentTarget.textContent || '')}
              style={{ color: card.color || '#2563eb', fontSize: '0.875rem', outline: 'none', opacity: 0.75 }}>{card.description}</div>
            {isHovered && (
              <div onMouseDown={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  BG<input type="color" value={card.bg || '#eff6ff'} onChange={(e) => updateCard(index, 'bg', e.target.value)} style={{ width: '24px', height: '20px', cursor: 'pointer', border: 'none' }} />
                </label>
                <label style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Text<input type="color" value={card.color || '#2563eb'} onChange={(e) => updateCard(index, 'color', e.target.value)} style={{ width: '24px', height: '20px', cursor: 'pointer', border: 'none' }} />
                </label>
              </div>
            )}
            {isHovered && index === 0 && (
              <div onMouseDown={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                <select value={cardStyle} onChange={(e) => updateAttributes({ cardStyle: e.target.value })}
                  style={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  {CARD_STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <select value={hoverEffect} onChange={(e) => updateAttributes({ hoverEffect: e.target.value })}
                  style={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  {HOVER_EFFECTS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}

        {isHovered && (
          <button onMouseDown={(e) => e.stopPropagation()} onClick={addCard}
            style={{ minWidth: '60px', minHeight: '120px', border: '2px dashed #2563eb', borderRadius: '12px', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontSize: '24px' }}>+</button>
        )}
        {isHovered && (
          <div onMouseDown={(e) => e.stopPropagation()} onClick={deleteNode}
            style={{ position: 'absolute', top: -10, right: -10, width: 24, height: 24, background: '#ef4444', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', zIndex: 20 }}>×</div>
        )}
        {isHovered && (
          <>
            <div onMouseDown={(e) => startResize(e, 'right')} style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 40, background: '#2563eb', borderRadius: 3, cursor: 'ew-resize', zIndex: 10 }} />
            <div onMouseDown={(e) => startResize(e, 'bottom')} style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 40, height: 10, background: '#2563eb', borderRadius: 3, cursor: 'ns-resize', zIndex: 10 }} />
            <div onMouseDown={(e) => startResize(e, 'corner')} style={{ position: 'absolute', bottom: -5, right: -5, width: 14, height: 14, background: '#2563eb', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10 }} />
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const ResizableStatsCard = Node.create({
  name: 'resizableStatsCard',
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      cards: {
        default: [{ value: '100+', label: 'Clients', description: 'Happy customers', bg: '#eff6ff', color: '#2563eb' }],
        parseHTML: (element) => {
          const data = element.getAttribute('data-cards')
          if (data) { try { return JSON.parse(data) } catch { } }
          return [{ value: '100+', label: 'Clients', description: 'Happy customers', bg: '#eff6ff', color: '#2563eb' }]
        },
        renderHTML: (attrs) => {
          return { 'data-cards': JSON.stringify(attrs.cards) }
        },
      },
      width: { default: null },
      height: { default: null },
      left: { default: 0 },
      top: { default: 0 },
      hoverEffect: {
        default: 'lift',
        parseHTML: (element) => element.getAttribute('data-hover-effect') || 'lift',
        renderHTML: (attrs) => ({ 'data-hover-effect': attrs.hoverEffect }),
      },
      cardStyle: {
        default: 'flat',
        parseHTML: (element) => element.getAttribute('data-card-style') || 'flat',
        renderHTML: (attrs) => ({ 'data-card-style': attrs.cardStyle }),
      },
    }
  },

  parseHTML() { return [{ tag: 'div[data-type="resizable-stats-card"]' }] },

  renderHTML({ HTMLAttributes, node }: any) {
    const cards = parseCards(node.attrs.cards)
    const hoverEffect = node.attrs.hoverEffect || 'lift'
    const cardStyle = node.attrs.cardStyle || 'flat'
    const count = cards.length

    const getBgStyle = (card: any) => {
      if (cardStyle === 'shadow') return `background:${card.bg || '#eff6ff'};box-shadow:0 2px 8px rgba(0,0,0,0.07);`
      if (cardStyle === 'outline') return `background:#ffffff;border:2px solid ${card.color || '#2563eb'};`
      if (cardStyle === 'gradient') return `background:linear-gradient(135deg,${card.bg || '#eff6ff'} 0%,${card.color || '#2563eb'}22 100%);`
      return `background:${card.bg || '#eff6ff'};`
    }

    const getHoverJS = (card: any, baseStyle: string) => {
      if (hoverEffect === 'none') return {}
      const color = card.color || '#2563eb'
      const hoverExtra = hoverEffect === 'lift'
        ? 'transform:translateY(-6px);box-shadow:0 12px 32px rgba(0,0,0,0.14);'
        : hoverEffect === 'scale'
        ? 'transform:scale(1.05);'
        : hoverEffect === 'glow'
        ? `box-shadow:0 0 24px ${color}99;`
        : hoverEffect === 'border'
        ? `border:2px solid ${color};box-shadow:0 4px 16px ${color}44;`
        : ''
      const hoverStyle = baseStyle + hoverExtra
      return {
        onmouseover: `this.setAttribute('data-base',this.style.cssText);this.style.cssText="${hoverStyle.replace(/"/g, "'")}"`,
        onmouseout: `this.style.cssText="${baseStyle.replace(/"/g, "'")}"`,
      }
    }

    // Fixed width per card based on count — no auto-fit stretching
    const cols = Math.min(count, 4)
    const colWidth = `repeat(${cols}, 1fr)`

    const cardNodes = cards.map((card: any) => {
      const baseStyle = `${getBgStyle(card)}border-radius:12px;padding:20px;text-align:center;box-sizing:border-box;transition:all 0.22s ease;`
      const hoverAttrs = getHoverJS(card, baseStyle)
      return [
        'div',
        { style: baseStyle, ...hoverAttrs },
        ['p', { style: `font-size:2rem;font-weight:700;color:${card.color || '#2563eb'};margin:0` }, card.value],
        ['p', { style: `font-weight:600;margin:4px 0;color:${card.color || '#2563eb'}` }, card.label],
        ['p', { style: `color:${card.color || '#2563eb'};font-size:0.875rem;margin:0;` }, card.description],
      ]
    })

    const cardsHtml = cardNodes.map((node: any) => {
      const [tag, attrs, ...children] = node
      const styleStr = attrs.style || ''
      const onOver = attrs.onmouseover ? ` onmouseover="${attrs.onmouseover}"` : ''
      const onOut = attrs.onmouseout ? ` onmouseout="${attrs.onmouseout}"` : ''
      const childHtml = children.map((child: any) => {
        const [ctag, cattrs, ctext] = child
        return `<${ctag} style="${cattrs.style || ''}">${ctext}</${ctag}>`
      }).join('')
      return `<div style="${styleStr}"${onOver}${onOut}>${childHtml}</div>`
    }).join('')

    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'resizable-stats-card',
      'data-cards': JSON.stringify(cards),
      'data-hover-effect': hoverEffect,
      'data-card-style': cardStyle,
      style: 'margin:24px 0;',
      innerHTML: `<div style="display:grid;grid-template-columns:${colWidth};gap:16px;width:100%;">${cardsHtml}</div>`,
    })]
  },
  addNodeView() { return ReactNodeViewRenderer(StatsCardComponent) },
})