'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Skill {
  id: string
  name: string
  description: string | null
  content: string
  category: string | null
  updated_at: string
}

interface Node {
  id: string
  label: string
  type: 'center' | 'category' | 'skill'
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  category: string
  skill?: Skill
}

interface Edge {
  source: string
  target: string
  color: string
  width: number
}

const CATEGORY_COLORS: Record<string, string> = {
  analytics: '#3B82F6',
  content: '#8B5CF6',
  research: '#10B981',
  video: '#F59E0B',
  dev: '#EAB308',
  ops: '#6B7280',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function getCategoryColor(category: string | null): string {
  if (!category) return '#6366F1'
  return CATEGORY_COLORS[category.toLowerCase()] ?? '#6366F1'
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Graph state in refs to avoid re-renders in animation loop
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const dragRef = useRef<{ nodeId: string | null; startX: number; startY: number; nodeStartX: number; nodeStartY: number; isPan: boolean }>({
    nodeId: null, startX: 0, startY: 0, nodeStartX: 0, nodeStartY: 0, isPan: false
  })
  const highlightCategoryRef = useRef<string | null>(null)
  const hoveredNodeRef = useRef<string | null>(null)
  const pulseRef = useRef(0)
  const simTicksRef = useRef(0)
  const rafRef = useRef<number>(0)
  const tooltipRef = useRef<{ text: string; x: number; y: number } | null>(null)

  const buildGraph = useCallback((skillList: Skill[], canvasW: number, canvasH: number) => {
    const cx = canvasW / 2
    const cy = canvasH / 2
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Center node
    nodes.push({
      id: 'center',
      label: 'EDDIE',
      type: 'center',
      x: cx, y: cy,
      vx: 0, vy: 0,
      radius: 52,
      color: '#6366F1',
      category: 'center',
    })

    // Determine which categories actually have skills
    const usedCategories = CATEGORIES.filter(cat =>
      skillList.some(s => (s.category ?? '').toLowerCase() === cat)
    )
    if (usedCategories.length === 0) return { nodes, edges }

    const catRadius = 220
    usedCategories.forEach((cat, i) => {
      const angle = (i / usedCategories.length) * Math.PI * 2 - Math.PI / 2
      const nx = cx + Math.cos(angle) * catRadius
      const ny = cy + Math.sin(angle) * catRadius
      const color = CATEGORY_COLORS[cat]

      nodes.push({
        id: `cat_${cat}`,
        label: cat.toUpperCase(),
        type: 'category',
        x: nx, y: ny,
        vx: 0, vy: 0,
        radius: 36,
        color,
        category: cat,
      })

      edges.push({
        source: 'center',
        target: `cat_${cat}`,
        color,
        width: 1.5,
      })

      const catSkills = skillList.filter(s => (s.category ?? '').toLowerCase() === cat)
      const skillRadius = 160
      catSkills.forEach((skill, j) => {
        const spread = Math.min((catSkills.length - 1) * 0.4, Math.PI * 0.85)
        const baseAngle = angle
        const skillAngle = catSkills.length === 1
          ? baseAngle
          : baseAngle - spread / 2 + (j / (catSkills.length - 1)) * spread

        nodes.push({
          id: `skill_${skill.id}`,
          label: skill.name,
          type: 'skill',
          x: nx + Math.cos(skillAngle) * skillRadius,
          y: ny + Math.sin(skillAngle) * skillRadius,
          vx: 0, vy: 0,
          radius: 22,
          color,
          category: cat,
          skill,
        })

        edges.push({
          source: `cat_${cat}`,
          target: `skill_${skill.id}`,
          color,
          width: 1,
        })
      })
    })

    return { nodes, edges }
  }, [])

  useEffect(() => {
    setIsEditing(false)
    setSaveStatus('idle')
  }, [selectedSkill?.id])

  useEffect(() => {
    fetch('/api/skills')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSkills(data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return

    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)

      if (nodesRef.current.length === 0 || simTicksRef.current === 0) {
        const { nodes, edges } = buildGraph(skills, window.innerWidth, window.innerHeight)
        nodesRef.current = nodes
        edgesRef.current = edges
        simTicksRef.current = 0
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [loading, skills, buildGraph])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return
    const dpr = window.devicePixelRatio || 1

    const getNodeById = (id: string) => nodesRef.current.find(n => n.id === id)

    const runSimulation = () => {
      if (simTicksRef.current >= 180) return
      simTicksRef.current++
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const alpha = Math.max(0, 1 - simTicksRef.current / 180)

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          if (a.type === 'center' || b.type === 'center') continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const minDist = a.radius + b.radius + 40
          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.3 * alpha
            a.vx -= dx * force
            a.vy -= dy * force
            b.vx += dx * force
            b.vy += dy * force
          }
        }
      }

      // Spring attraction along edges
      for (const edge of edges) {
        const s = getNodeById(edge.source)
        const t = getNodeById(edge.target)
        if (!s || !t) continue
        if (s.type === 'center' || t.type === 'center') continue
        const dx = t.x - s.x
        const dy = t.y - s.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const targetDist = s.type === 'category' ? 220 : 160
        const force = (dist - targetDist) / dist * 0.08 * alpha
        s.vx += dx * force
        s.vy += dy * force
        t.vx -= dx * force
        t.vy -= dy * force
      }

      // Integrate
      const damping = 0.85
      for (const node of nodes) {
        if (node.type === 'center') continue
        node.vx *= damping
        node.vy *= damping
        node.x += node.vx
        node.y += node.vy
      }
    }

    const drawGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, intensity: number) => {
      const [cr, cg, cb] = hexToRgb(color)
      const grd = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.5)
      grd.addColorStop(0, `rgba(${cr},${cg},${cb},${intensity * 0.6})`)
      grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
      ctx.beginPath()
      ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
    }

    const drawNode = (ctx: CanvasRenderingContext2D, node: Node, hovered: boolean, dimmed: boolean, pulse: number) => {
      const [cr, cg, cb] = hexToRgb(node.color)
      let glowIntensity = node.type === 'center' ? 0.5 : node.type === 'category' ? 0.35 : 0.2
      let r = node.radius

      if (node.type === 'center') {
        const pulseFactor = 1 + Math.sin(pulse * 0.05) * 0.06
        r = node.radius * pulseFactor
        glowIntensity = 0.55 + Math.sin(pulse * 0.05) * 0.15
      }

      if (hovered) { glowIntensity += 0.25; r *= 1.08 }
      if (dimmed) glowIntensity *= 0.2

      // Glow
      drawGlow(ctx, node.x, node.y, r, node.color, glowIntensity)

      // Circle fill
      const alpha = dimmed ? 0.3 : 1
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
      const fill = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r)
      fill.addColorStop(0, `rgba(${Math.min(255,cr+60)},${Math.min(255,cg+60)},${Math.min(255,cb+60)},${alpha})`)
      fill.addColorStop(1, `rgba(${cr},${cg},${cb},${alpha})`)
      ctx.fillStyle = fill
      ctx.fill()

      // Border
      ctx.strokeStyle = `rgba(255,255,255,${dimmed ? 0.05 : 0.2})`
      ctx.lineWidth = 1
      ctx.stroke()

      // Label
      if (!dimmed || node.type !== 'skill') {
        ctx.save()
        ctx.globalAlpha = dimmed ? 0.2 : 1
        const fontSize = node.type === 'center' ? 16 : node.type === 'category' ? 13 : 11
        const fontWeight = node.type === 'skill' ? 'normal' : 'bold'
        ctx.font = `${fontWeight} ${fontSize}px -apple-system, system-ui, sans-serif`
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const labelY = node.y + r + 6
        const maxWidth = node.type === 'skill' ? 90 : 120
        const text = node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label
        ctx.fillText(text, node.x, labelY, maxWidth)
        ctx.restore()
      }
    }

    const drawEdge = (ctx: CanvasRenderingContext2D, edge: Edge, dimmed: boolean) => {
      const s = getNodeById(edge.source)
      const t = getNodeById(edge.target)
      if (!s || !t) return

      const [cr, cg, cb] = hexToRgb(edge.color)
      const alpha = dimmed ? 0.05 : 0.3

      ctx.beginPath()
      const mx = (s.x + t.x) / 2
      const my = (s.y + t.y) / 2
      const offset = 30
      const dx = t.x - s.x
      const dy = t.y - s.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const cpx = mx - dy / len * offset
      const cpy = my + dx / len * offset

      ctx.moveTo(s.x, s.y)
      ctx.quadraticCurveTo(cpx, cpy, t.x, t.y)
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`
      ctx.lineWidth = edge.width
      ctx.stroke()
    }

    const render = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W = window.innerWidth
      const H = window.innerHeight
      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Background
      ctx.fillStyle = '#080B14'
      ctx.fillRect(0, 0, W, H)

      // Stars
      ctx.save()
      for (let i = 0; i < 120; i++) {
        const sx = ((i * 137.5 + 30) % W)
        const sy = ((i * 97.3 + 50) % H)
        const sr = (i % 3 === 0) ? 1.2 : 0.6
        const sa = 0.1 + (i % 5) * 0.05
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${sa})`
        ctx.fill()
      }
      ctx.restore()

      const { x: tx, y: ty, scale } = transformRef.current

      ctx.save()
      ctx.translate(tx, ty)
      ctx.scale(scale, scale)

      if (loading) {
        // Loading pulse rings
        const cx = W / 2, cy = H / 2
        for (let i = 0; i < 3; i++) {
          const t2 = ((pulseRef.current * 0.02 + i * 0.33) % 1)
          ctx.beginPath()
          ctx.arc(cx, cy, t2 * 200, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(99,102,241,${(1 - t2) * 0.6})`
          ctx.lineWidth = 2
          ctx.stroke()
        }
      } else {
        runSimulation()

        const highlightCat = highlightCategoryRef.current
        const hoveredId = hoveredNodeRef.current

        // Draw edges first
        for (const edge of edgesRef.current) {
          const target = getNodeById(edge.target)
          const dimmed = highlightCat !== null && target?.category !== highlightCat
          drawEdge(ctx, edge, dimmed)
        }

        // Draw nodes
        for (const node of nodesRef.current) {
          const hovered = hoveredId === node.id
          const dimmed = highlightCat !== null && node.type !== 'center' && node.category !== highlightCat
          drawNode(ctx, node, hovered, dimmed, pulseRef.current)
        }

        // Tooltip
        if (tooltipRef.current) {
          const { text, x, y } = tooltipRef.current
          ctx.save()
          ctx.font = '12px -apple-system, system-ui, sans-serif'
          const tw = ctx.measureText(text).width
          const px = 10, py = 6
          const bx = x + 12
          const by = y - 20
          ctx.fillStyle = 'rgba(10,14,25,0.92)'
          ctx.strokeStyle = 'rgba(99,102,241,0.5)'
          ctx.lineWidth = 1
          roundRect(ctx, bx, by - py, tw + px * 2, 24, 6)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = '#e2e8f0'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(text, bx + px, by + 12 - py)
          ctx.restore()
        }
      }

      ctx.restore()

      // Header overlay
      ctx.save()
      ctx.font = 'bold 13px -apple-system, system-ui, sans-serif'
      ctx.letterSpacing = '3px'
      ctx.fillStyle = 'rgba(99,102,241,0.9)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.shadowColor = '#6366F1'
      ctx.shadowBlur = 12
      ctx.fillText('EDDIE BRAIN', W / 2, 20)
      ctx.shadowBlur = 0

      if (!loading) {
        const badge = `${skills.length} skills`
        ctx.font = '11px -apple-system, system-ui, sans-serif'
        ctx.letterSpacing = '0px'
        const bw = ctx.measureText(badge).width + 16
        const bx = W / 2 + 75
        ctx.fillStyle = 'rgba(99,102,241,0.2)'
        roundRect(ctx, bx, 17, bw, 18, 9)
        ctx.fill()
        ctx.fillStyle = 'rgba(165,180,252,0.9)'
        ctx.textAlign = 'left'
        ctx.fillText(badge, bx + 8, 20)
      }
      ctx.restore()

      pulseRef.current++
    }

    const loop = () => {
      render()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [loading, skills, buildGraph])

  // Mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const toWorld = (clientX: number, clientY: number) => {
      const { x, y, scale } = transformRef.current
      return {
        wx: (clientX - x) / scale,
        wy: (clientY - y) / scale,
      }
    }

    const hitTest = (wx: number, wy: number): Node | null => {
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i]
        const dx = wx - n.x, dy = wy - n.y
        if (dx * dx + dy * dy <= (n.radius + 8) ** 2) return n
      }
      return null
    }

    const onMouseMove = (e: MouseEvent) => {
      const { wx, wy } = toWorld(e.clientX, e.clientY)
      const drag = dragRef.current

      if (drag.nodeId) {
        const node = nodesRef.current.find(n => n.id === drag.nodeId)
        if (node) {
          node.x = drag.nodeStartX + (wx - drag.startX)
          node.y = drag.nodeStartY + (wy - drag.startY)
          node.vx = 0; node.vy = 0
        }
        return
      }

      if (drag.isPan) {
        transformRef.current.x = drag.nodeStartX + (e.clientX - drag.startX)
        transformRef.current.y = drag.nodeStartY + (e.clientY - drag.startY)
        return
      }

      const hit = hitTest(wx, wy)
      hoveredNodeRef.current = hit?.id ?? null
      canvas.style.cursor = hit ? 'pointer' : 'default'

      if (hit && hit.type === 'skill' && hit.skill?.description) {
        tooltipRef.current = { text: hit.skill.description.slice(0, 60), x: wx, y: wy }
      } else {
        tooltipRef.current = null
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      const { wx, wy } = toWorld(e.clientX, e.clientY)
      const hit = hitTest(wx, wy)
      if (hit) {
        dragRef.current = {
          nodeId: hit.id,
          startX: wx, startY: wy,
          nodeStartX: hit.x, nodeStartY: hit.y,
          isPan: false,
        }
      } else {
        dragRef.current = {
          nodeId: null,
          startX: e.clientX, startY: e.clientY,
          nodeStartX: transformRef.current.x,
          nodeStartY: transformRef.current.y,
          isPan: true,
        }
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      const drag = dragRef.current
      const { wx, wy } = toWorld(e.clientX, e.clientY)

      // Click (didn't move much)
      if (drag.nodeId) {
        const dx = wx - drag.startX, dy = wy - drag.startY
        if (Math.sqrt(dx * dx + dy * dy) < 5) {
          const node = nodesRef.current.find(n => n.id === drag.nodeId)
          if (node) {
            if (node.type === 'skill' && node.skill) {
              setSelectedSkill(node.skill)
              setPanelVisible(true)
            } else if (node.type === 'category') {
              highlightCategoryRef.current = highlightCategoryRef.current === node.category ? null : node.category
            } else if (node.type === 'center') {
              highlightCategoryRef.current = null
              setSelectedSkill(null)
              setPanelVisible(false)
            }
          }
        }
      }

      dragRef.current = { nodeId: null, startX: 0, startY: 0, nodeStartX: 0, nodeStartY: 0, isPan: false }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const { x, y, scale } = transformRef.current
      const newScale = Math.max(0.3, Math.min(3, scale * delta))
      // Zoom toward cursor
      const cx = e.clientX, cy = e.clientY
      transformRef.current = {
        scale: newScale,
        x: cx - (cx - x) * (newScale / scale),
        y: cy - (cy - y) * (newScale / scale),
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080B14', position: 'relative' }}>
      <style>{`@keyframes fadeOut { 0%,60%{opacity:1} 100%{opacity:0} }`}</style>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Side Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: panelVisible && selectedSkill ? 0 : -440,
        width: 420,
        height: '100vh',
        background: 'rgba(10,14,25,0.95)',
        borderLeft: '1px solid rgba(99,102,241,0.3)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        {selectedSkill && (
          <>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div>
                {selectedSkill.category && (
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: `${getCategoryColor(selectedSkill.category)}22`,
                    color: getCategoryColor(selectedSkill.category),
                    border: `1px solid ${getCategoryColor(selectedSkill.category)}44`,
                    marginBottom: 8,
                  }}>
                    {selectedSkill.category}
                  </div>
                )}
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: getCategoryColor(selectedSkill.category),
                  lineHeight: 1.2,
                }}>
                  {selectedSkill.name}
                </div>
                {selectedSkill.description && (
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
                    {selectedSkill.description}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                {!isEditing && (
                  <button
                    onClick={() => { setEditContent(selectedSkill.content); setIsEditing(true); setSaveStatus('idle') }}
                    style={{
                      background: `${getCategoryColor(selectedSkill.category)}22`,
                      border: `1px solid ${getCategoryColor(selectedSkill.category)}44`,
                      color: getCategoryColor(selectedSkill.category),
                      height: 32,
                      padding: '0 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${getCategoryColor(selectedSkill.category)}44` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${getCategoryColor(selectedSkill.category)}22` }}
                  >
                    ✏ Edit
                  </button>
                )}
                <button
                  onClick={() => { setIsEditing(false); setSaveStatus('idle'); setPanelVisible(false); setTimeout(() => setSelectedSkill(null), 350) }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
                >
                  ×
                </button>
              </div>
            </div>
            {isEditing ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: 12 }}>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0d1117',
                    border: `1px solid ${getCategoryColor(selectedSkill.category)}66`,
                    borderRadius: 8,
                    color: '#e5e7eb',
                    fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                    fontSize: 13,
                    lineHeight: 1.7,
                    padding: 16,
                    resize: 'none',
                    outline: 'none',
                    transition: 'box-shadow 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${getCategoryColor(selectedSkill.category)}55` }}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true)
                      setSaveStatus('idle')
                      const updated: Skill = { ...selectedSkill, content: editContent, updated_at: new Date().toISOString() }
                      try {
                        const res = await fetch('/api/sync-skills', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ skills: [{ name: updated.name, description: updated.description, content: updated.content, category: updated.category, updated_at: updated.updated_at }] }),
                        })
                        if (!res.ok) throw new Error('failed')
                        setSkills(prev => prev.map(s => s.id === selectedSkill.id ? updated : s))
                        setSelectedSkill(updated)
                        setIsEditing(false)
                        setSaveStatus('saved')
                        setTimeout(() => setSaveStatus('idle'), 2000)
                      } catch {
                        setSaveStatus('error')
                      } finally {
                        setIsSaving(false)
                      }
                    }}
                    style={{
                      background: getCategoryColor(selectedSkill.category),
                      border: 'none',
                      color: '#fff',
                      height: 34,
                      padding: '0 18px',
                      borderRadius: 8,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: isSaving ? 0.7 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setSaveStatus('idle') }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'all 0.15s',
                    }}
                  >
                    Cancel
                  </button>
                  {saveStatus === 'error' && (
                    <span style={{ fontSize: 12, color: '#ef4444' }}>Error saving</span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99,102,241,0.3) transparent',
              }}>
                {saveStatus === 'saved' && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10B981',
                    borderRadius: 20,
                    padding: '2px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                    animation: 'fadeOut 2s forwards',
                  }}>
                    Saved ✓
                  </div>
                )}
                <pre style={{
                  fontSize: 13,
                  color: '#cbd5e1',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {selectedSkill.content}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
