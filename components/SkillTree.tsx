'use client';

import { useEffect, useState, useCallback } from 'react';

const SUPABASE_URL = 'https://vpxncpcgokciivykhezc.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweG5jcGNnb2tjaWl2eWtoZXpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYxMDc4OCwiZXhwIjoyMDg5MTg2Nzg4fQ.MQUa3x80eny3FMSS1g4q5P3BLcdC5oWH6Okk3lY2_lM';

interface Skill { name: string; path: string; parent: string | null; category: string; description: string | null; }
interface SkillWithContent extends Skill { content?: string; }
interface TreeNode { label: string; fullPath: string; isLeaf: boolean; skill?: Skill; children: Map<string, TreeNode>; }

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  voices:   { icon: '🎙',  color: '#a855f7', label: 'Voices'   },
  research: { icon: '🔬',  color: '#14b8a6', label: 'Research' },
  formats:  { icon: '📋',  color: '#60a5fa', label: 'Formats'  },
  studio:   { icon: '🏗',  color: '#f59e0b', label: 'Studio'   },
  ops:      { icon: '⚙️', color: '#9ca3af', label: 'Ops'      },
};
const CATEGORY_ORDER = ['voices', 'research', 'formats', 'studio', 'ops'];

function buildTree(skills: Skill[]): Map<string, TreeNode> {
  const roots = new Map<string, TreeNode>();
  for (const skill of skills) {
    if (!skill.path) continue;
    const parts = skill.path.split('/').filter(Boolean);
    if (!parts.length) continue;
    let current = roots;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const fullPath = parts.slice(0, i + 1).join('/');
      if (!current.has(part)) current.set(part, { label: part, fullPath, isLeaf: false, children: new Map() });
      const node = current.get(part)!;
      if (i === parts.length - 1) { node.isLeaf = true; node.skill = skill; }
      current = node.children;
    }
  }
  return roots;
}

function countLeaves(node: TreeNode): number {
  if (node.isLeaf && !node.children.size) return 1;
  let c = node.isLeaf ? 1 : 0;
  for (const ch of node.children.values()) c += countLeaves(ch);
  return c;
}

function renderMd(md: string): string {
  let h = md
    .replace(/^### (.+)$/gm, '<h3 style="color:#e2e8f0;font-size:1rem;font-weight:700;margin:1.1em 0 0.3em">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#f1f5f9;font-size:1.1rem;font-weight:700;margin:1.3em 0 0.4em">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#fff;font-size:1.25rem;font-weight:800;margin:1.5em 0 0.5em">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f1f5f9">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#cbd5e1">$1</em>')
    .replace(/`([^`\n]+)`/g, '<code style="background:#1e293b;color:#7dd3fc;padding:1px 5px;border-radius:3px;font-size:0.86em">$1</code>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #1e293b;margin:0.9em 0"/>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin:0.2em 0;color:#94a3b8;list-style:disc;margin-left:1.2em">$1</li>');
  h = h.replace(/(<li[^>]*>.*<\/li>\n?)+/g, b => `<ul style="margin:0.4em 0;padding:0">${b}</ul>`);
  h = h.split(/\n{2,}/).map(b => {
    if (/^<[h1-6hlibu]/.test(b.trim()) || !b.trim()) return b;
    return `<p style="color:#94a3b8;margin:0.5em 0;line-height:1.7">${b.trim()}</p>`;
  }).join('\n');
  return h;
}

function nodeMatchesSq(node: TreeNode, sq: string): boolean {
  if (!sq) return true;
  if (node.label.toLowerCase().includes(sq)) return true;
  if ((node.skill?.description ?? '').toLowerCase().includes(sq)) return true;
  for (const child of node.children.values()) {
    if (nodeMatchesSq(child, sq)) return true;
  }
  return false;
}

function TreeNodeRow({ node, depth, accentColor, openPaths, togglePath, selectedPath, onSelectLeaf, onPin, sq = '' }: {
  node: TreeNode; depth: number; accentColor: string;
  openPaths: Set<string>; togglePath: (p: string) => void;
  selectedPath: string | null; onSelectLeaf: (s: Skill) => void; onPin: (s: Skill) => void;
  sq?: string;
}) {
  // When searching, hide nodes that don't match
  if (sq && !nodeMatchesSq(node, sq)) return null;

  const isOpen = !!sq || openPaths.has(node.fullPath);
  const isSelected = selectedPath === node.fullPath;
  const hasChildren = node.children.size > 0;
  const pl = 18 + depth * 15;
  const [hov, setHov] = useState(false);

  // Leaf only node
  if (node.isLeaf && !hasChildren) {
    return (
      <div style={{ position: 'relative' }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <button onClick={() => node.skill && onSelectLeaf(node.skill)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: `4px ${hov ? '52px' : '14px'} 4px ${pl}px`, background: isSelected ? `${accentColor}14` : hov ? 'rgba(99,102,241,0.04)' : 'transparent', border: 'none', borderLeft: isSelected ? `2px solid ${accentColor}` : '2px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}>
          <span style={{ color: '#1e293b', fontSize: '0.48rem', flexShrink: 0 }}>◆</span>
          <span style={{ fontSize: '0.7rem', color: isSelected ? accentColor : '#4b5563', fontWeight: isSelected ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.label}</span>
        </button>
        {hov && node.skill && (
          <button onClick={e => { e.stopPropagation(); node.skill && onPin(node.skill); }} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: `${accentColor}20`, border: `1px solid ${accentColor}40`, borderRadius: 4, color: accentColor, fontSize: '0.58rem', cursor: 'pointer', padding: '2px 5px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ add</button>
        )}
      </div>
    );
  }

  // Folder node — filter children by search
  const visibleChildren = Array.from(node.children.values())
    .filter(ch => !sq || nodeMatchesSq(ch, sq))
    .sort((a, b) => { const af = a.children.size > 0, bf = b.children.size > 0; if (af && !bf) return -1; if (!af && bf) return 1; return a.label.localeCompare(b.label); });

  if (sq && visibleChildren.length === 0 && !node.isLeaf) return null;

  const leafCount = visibleChildren.reduce((acc, ch) => {
    function countV(n: TreeNode): number {
      if (n.isLeaf && !n.children.size) return 1;
      let c = n.isLeaf ? 1 : 0;
      for (const child of n.children.values()) c += countV(child);
      return c;
    }
    return acc + countV(ch);
  }, node.isLeaf ? 1 : 0);

  return (
    <div>
      <button onClick={() => { togglePath(node.fullPath); if (node.isLeaf && node.skill) onSelectLeaf(node.skill); }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: `5px 14px 5px ${pl}px`, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <span style={{ color: '#374151', fontSize: '0.56rem', width: 10, flexShrink: 0 }}>{isOpen ? '▾' : '▸'}</span>
        <span style={{ fontSize: '0.56rem', flexShrink: 0 }}>{isOpen ? '📂' : '📁'}</span>
        <span style={{ fontSize: '0.7rem', color: isOpen ? '#94a3b8' : '#4b5563', fontWeight: 600, flex: 1 }}>{node.label}</span>
        <span style={{ fontSize: '0.58rem', color: '#374151', background: '#111827', padding: '1px 4px', borderRadius: 8, marginRight: 2 }}>{leafCount}</span>
      </button>
      {isOpen && visibleChildren.map(ch => (
        <TreeNodeRow key={ch.fullPath} node={ch} depth={depth + 1} accentColor={accentColor}
          openPaths={openPaths} togglePath={togglePath} selectedPath={selectedPath}
          onSelectLeaf={onSelectLeaf} onPin={onPin} sq={sq} />
      ))}
    </div>
  );
}

// ── Floating Prompt Builder Popup ──────────────────────────────────────────
function PromptBuilderPopup({ pinned, onRemove, onClear, onClose }: {
  pinned: SkillWithContent[]; onRemove: (p: string) => void; onClear: () => void; onClose: () => void;
}) {
  const [intent, setIntent] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 440, y: 80 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, px: 0, py: 0 });

  const onDragStart = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y });
  };
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => setPos({ x: dragStart.px + e.clientX - dragStart.mx, y: dragStart.py + e.clientY - dragStart.my });
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, dragStart]);

  const generate = async () => {
    if (!pinned.length && !intent.trim()) return;
    setLoading(true); setResult('');
    try {
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skills: pinned, intent }),
      });
      const data = await res.json();
      setResult(data.prompt || data.error || 'Error');
    } catch (e) { setResult('Error: ' + (e as Error).message); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, width: 400, zIndex: 9999, background: '#0d1117', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.7)', fontFamily: "'Courier New', Courier, monospace", display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
      {/* Drag header */}
      <div onMouseDown={onDragStart} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 10px', borderBottom: '1px solid rgba(99,102,241,0.12)', cursor: 'grab', userSelect: 'none', flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a5b4fc', letterSpacing: '0.08em' }}>⚡ PROMPT BUILDER</span>
          {pinned.length > 0 && <span style={{ marginLeft: 8, fontSize: '0.62rem', color: '#374151' }}>{pinned.length} skill{pinned.length > 1 ? 's' : ''} selected</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {pinned.length > 0 && <button onClick={onClear} style={{ background: 'transparent', border: '1px solid #1f2937', borderRadius: 5, color: '#374151', fontSize: '0.6rem', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit' }}>clear</button>}
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#374151', fontSize: '1rem', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.15) transparent' }}>
        {/* Skill chips */}
        <div>
          <div style={{ fontSize: '0.6rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>skill variables</div>
          {!pinned.length ? (
            <div style={{ fontSize: '0.68rem', color: '#1f2937', fontStyle: 'italic' }}>hover a skill → click "+ add"</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {pinned.map(s => {
                const cat = s.path?.split('/')?.[0] || 'ops';
                const col = CATEGORY_META[cat]?.color || '#6b7280';
                return (
                  <span key={s.path} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${col}15`, border: `1px solid ${col}30`, borderRadius: 20, padding: '3px 8px', fontSize: '0.65rem', color: col }}>
                    {s.name}
                    <button onClick={() => onRemove(s.path)} style={{ background: 'none', border: 'none', color: `${col}70`, cursor: 'pointer', fontSize: '0.7rem', padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Intent */}
        <div>
          <div style={{ fontSize: '0.6rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>what do you want to build?</div>
          <textarea value={intent} onChange={e => setIntent(e.target.value)} placeholder="e.g. make a Mau-voice version of Ernesto's app post workflow for the astrology niche" style={{ width: '100%', minHeight: 80, background: '#080B14', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 7, color: '#94a3b8', fontSize: '0.75rem', padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)')} />
        </div>

        {/* Generate btn */}
        <button onClick={generate} disabled={loading || (!pinned.length && !intent.trim())} style={{ background: loading ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.16)', border: '1px solid rgba(99,102,241,0.28)', borderRadius: 7, color: loading ? '#374151' : '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, padding: '9px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {loading ? '⏳ generating...' : '⚡ generate prompt'}
        </button>

        {/* Output */}
        {result && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: '0.6rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>ready to send to eddie</div>
              <button onClick={copy} style={{ background: copied ? 'rgba(20,184,166,0.12)' : 'rgba(99,102,241,0.1)', border: `1px solid ${copied ? 'rgba(20,184,166,0.28)' : 'rgba(99,102,241,0.18)'}`, borderRadius: 5, color: copied ? '#14b8a6' : '#6366f1', fontSize: '0.62rem', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {copied ? '✓ copied!' : '📋 copy'}
              </button>
            </div>
            <div style={{ background: '#080B14', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 7, padding: '10px 12px', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 240, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function SkillTree() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set(['voices']));
  const [selectedSkill, setSelectedSkill] = useState<SkillWithContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [pinned, setPinned] = useState<SkillWithContent[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/skills?select=name,path,parent,category,description&limit=500`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    }).then(r => r.json()).then(data => { if (Array.isArray(data)) setSkills(data); else setError('Error'); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const togglePath = useCallback((p: string) => setOpenPaths(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; }), []);

  const fetchContent = useCallback(async (skill: Skill) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/skills?path=eq.${encodeURIComponent(skill.path)}&select=content`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    const data = await res.json();
    return Array.isArray(data) && data[0] ? data[0].content : undefined;
  }, []);

  const selectLeaf = useCallback(async (skill: Skill) => {
    setSelectedSkill(skill); setContentLoading(true);
    try { const content = await fetchContent(skill); setSelectedSkill({ ...skill, content }); } catch { } finally { setContentLoading(false); }
  }, [fetchContent]);

  const pinSkill = useCallback(async (skill: Skill) => {
    setPinned(prev => prev.find(s => s.path === skill.path) ? prev : [...prev, skill]);
    setShowBuilder(true);
    fetchContent(skill).then(content => { if (content) setPinned(prev => prev.map(s => s.path === skill.path ? { ...s, content } : s)); });
  }, [fetchContent]);

  const tree = buildTree(skills);
  const roots = [...CATEGORY_ORDER.filter(c => tree.has(c)).map(c => ({ key: c, node: tree.get(c)! })),
    ...Array.from(tree.entries()).filter(([k]) => !CATEGORY_ORDER.includes(k)).map(([k, n]) => ({ key: k, node: n }))];

  const sq = searchQuery.toLowerCase();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#080B14', fontFamily: "'Courier New', Courier, monospace", overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: 300, minWidth: 260, maxWidth: 340, borderRight: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', background: '#0a0d18', scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.15) transparent' }}>
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(99,102,241,0.1)', flexShrink: 0 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '0.14em', textTransform: 'uppercase', textShadow: '0 0 16px rgba(99,102,241,0.6)' }}>eddie brain</div>
          <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: 2 }}>{loading ? 'loading...' : `${skills.filter(s => s.path).length} skill nodes`}</div>
        </div>
      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(99,102,241,0.08)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="search skills..."
            style={{ width: '100%', background: '#080B14', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 16, padding: '5px 28px 5px 10px', color: '#64748b', fontSize: '0.68rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)')} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>×</button>}
        </div>
      </div>
        <div style={{ flex: 1, paddingBottom: 80 }}>
          {loading && <div style={{ padding: '16px 18px', color: '#374151', fontSize: '0.75rem' }}>loading...</div>}
          {error && <div style={{ padding: '16px 18px', color: '#f87171', fontSize: '0.75rem' }}>{error}</div>}
          {roots.filter(({ node }) => !sq || nodeMatchesSq(node, sq)).map(({ key, node }) => {
            const meta = CATEGORY_META[key] || { icon: '📁', color: '#6b7280', label: key };
            const isOpen = openPaths.has(key);
            return (
              <div key={key}>
                <button onClick={() => togglePath(key)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(99,102,241,0.06)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ width: 24, height: 24, borderRadius: 5, background: `${meta.color}16`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', flexShrink: 0 }}>{meta.icon}</span>
                  <span style={{ flex: 1, fontSize: '0.72rem', fontWeight: 700, color: isOpen ? meta.color : '#64748b', letterSpacing: '0.09em', textTransform: 'uppercase' }}>{meta.label}</span>
                  <span style={{ fontSize: '0.6rem', color: '#374151', background: '#111827', padding: '1px 5px', borderRadius: 8, marginRight: 3 }}>{countLeaves(node)}</span>
                  <span style={{ color: '#374151', fontSize: '0.6rem' }}>{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && Array.from(node.children.values())
                  .sort((a, b) => { const af = a.children.size > 0, bf = b.children.size > 0; if (af && !bf) return -1; if (!af && bf) return 1; return a.label.localeCompare(b.label); })
                  .map(ch => <TreeNodeRow key={ch.fullPath} node={ch} depth={1} accentColor={meta.color} openPaths={openPaths} togglePath={togglePath} selectedPath={selectedSkill?.path ?? null} onSelectLeaf={selectLeaf} onPin={pinSkill} sq={sq} />)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '36px 44px 80px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.15) transparent' }}>
        {!selectedSkill ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, userSelect: 'none' }}>
            <div style={{ fontSize: '2.5rem', opacity: 0.1 }}>🧠</div>
            <div style={{ fontSize: '0.72rem', color: '#1f2937', letterSpacing: '0.1em', textTransform: 'uppercase' }}>select a skill to read</div>
            <div style={{ fontSize: '0.65rem', color: '#1a2130', marginTop: 4 }}>hover any skill → "+ add" to build prompts</div>
          </div>
        ) : (
          <div style={{ maxWidth: 740 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
              <div style={{ fontSize: '0.65rem', color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{selectedSkill.path?.split('/').join(' › ')}</div>
              <button onClick={() => selectedSkill && pinSkill(selectedSkill)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: 6, color: '#a5b4fc', fontSize: '0.62rem', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>⚡ add to builder</button>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>{selectedSkill.name}</h1>
            {selectedSkill.description && <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, borderLeft: `3px solid ${CATEGORY_META[selectedSkill.category]?.color || '#6b7280'}`, paddingLeft: 12, margin: '0 0 24px' }}>{selectedSkill.description}</p>}
            <div style={{ height: 1, background: 'rgba(99,102,241,0.08)', marginBottom: 24 }} />
            {contentLoading ? <div style={{ color: '#374151', fontSize: '0.75rem' }}>loading...</div>
              : selectedSkill.content ? <div style={{ fontSize: '0.86rem', lineHeight: 1.75, color: '#94a3b8' }} dangerouslySetInnerHTML={{ __html: renderMd(selectedSkill.content) }} />
              : <div style={{ color: '#1f2937', fontSize: '0.75rem' }}>no content</div>}
          </div>
        )}
      </div>

      {/* Floating builder toggle button */}
      <button
        onClick={() => setShowBuilder(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
          background: showBuilder ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.12)',
          border: `1px solid rgba(99,102,241,${showBuilder ? '0.4' : '0.2'})`,
          borderRadius: 24, padding: '9px 18px',
          color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700,
          cursor: 'pointer', fontFamily: "'Courier New', Courier, monospace",
          letterSpacing: '0.06em', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          transition: 'all 0.15s',
        }}
      >
        ⚡ builder{pinned.length > 0 ? ` (${pinned.length})` : ''}
      </button>

      {/* Floating popup */}
      {showBuilder && (
        <PromptBuilderPopup
          pinned={pinned}
          onRemove={p => setPinned(prev => prev.filter(s => s.path !== p))}
          onClear={() => setPinned([])}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  );
}
