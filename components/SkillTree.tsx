'use client';

import { useEffect, useState, useCallback } from 'react';

const SUPABASE_URL = 'https://vpxncpcgokciivykhezc.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweG5jcGNnb2tjaWl2eWtoZXpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYxMDc4OCwiZXhwIjoyMDg5MTg2Nzg4fQ.MQUa3x80eny3FMSS1g4q5P3BLcdC5oWH6Okk3lY2_lM';

interface Skill {
  name: string;
  path: string;
  parent: string | null;
  category: string;
  description: string | null;
}

interface SkillWithContent extends Skill {
  content?: string;
}

// Tree node — either a folder (has children) or a leaf (has skill data)
interface TreeNode {
  label: string;
  fullPath: string;
  isLeaf: boolean;
  skill?: Skill;
  children: Map<string, TreeNode>;
}

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  voices:   { icon: '🎙',  color: '#a855f7', label: 'Voices'   },
  research: { icon: '🔬',  color: '#14b8a6', label: 'Research' },
  formats:  { icon: '📋',  color: '#60a5fa', label: 'Formats'  },
  studio:   { icon: '🏗',  color: '#f59e0b', label: 'Studio'   },
  ops:      { icon: '⚙️', color: '#9ca3af', label: 'Ops'      },
};

const CATEGORY_ORDER = ['voices', 'research', 'formats', 'studio', 'ops'];

// Build a nested tree from flat skill list using path segments
function buildTree(skills: Skill[]): Map<string, TreeNode> {
  const roots = new Map<string, TreeNode>();

  for (const skill of skills) {
    if (!skill.path) continue;
    const parts = skill.path.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let current = roots;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join('/');

      if (!current.has(part)) {
        current.set(part, {
          label: part,
          fullPath,
          isLeaf: false,
          children: new Map(),
        });
      }

      const node = current.get(part)!;

      if (isLast) {
        // Mark as leaf and attach skill data
        node.isLeaf = true;
        node.skill = skill;
      }

      current = node.children;
    }
  }

  return roots;
}

// Count total leaf nodes in a subtree
function countLeaves(node: TreeNode): number {
  if (node.isLeaf && node.children.size === 0) return 1;
  let count = node.isLeaf ? 1 : 0;
  for (const child of node.children.values()) {
    count += countLeaves(child);
  }
  return count;
}

// Minimal markdown → HTML transform
function renderMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 style="color:#e2e8f0;font-size:1rem;font-weight:700;margin:1.2em 0 0.4em 0">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#f1f5f9;font-size:1.15rem;font-weight:700;margin:1.4em 0 0.5em 0">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#fff;font-size:1.3rem;font-weight:800;margin:1.6em 0 0.6em 0">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f1f5f9">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#cbd5e1">$1</em>')
    .replace(/`([^`\n]+)`/g, '<code style="background:#1e293b;color:#7dd3fc;padding:1px 5px;border-radius:3px;font-size:0.87em">$1</code>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #1e293b;margin:1em 0"/>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #4b5563;padding-left:0.75em;color:#94a3b8;margin:0.5em 0">$1</blockquote>')
    .replace(/^[-*•] (.+)$/gm, '<li style="margin:0.2em 0;color:#94a3b8;list-style:disc;margin-left:1.2em">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:0.2em 0;color:#94a3b8;list-style:decimal;margin-left:1.2em">$1</li>');

  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (block) => `<ul style="margin:0.5em 0;padding:0">${block}</ul>`);

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<[h1-6hlibcpquor]/.test(block.trim())) return block;
      if (block.trim() === '') return '';
      return `<p style="color:#94a3b8;margin:0.6em 0;line-height:1.75">${block.trim()}</p>`;
    })
    .join('\n');

  return html;
}

// Recursive tree node renderer
function TreeNodeRow({
  node,
  depth,
  accentColor,
  openPaths,
  togglePath,
  selectedPath,
  onSelectLeaf,
}: {
  node: TreeNode;
  depth: number;
  accentColor: string;
  openPaths: Set<string>;
  togglePath: (p: string) => void;
  selectedPath: string | null;
  onSelectLeaf: (skill: Skill) => void;
}) {
  const isOpen = openPaths.has(node.fullPath);
  const isSelected = selectedPath === node.fullPath;
  const hasChildren = node.children.size > 0;
  const paddingLeft = 18 + depth * 16;

  // Pure leaf node (no children)
  if (node.isLeaf && !hasChildren) {
    return (
      <button
        onClick={() => node.skill && onSelectLeaf(node.skill)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          width: '100%',
          padding: `5px 16px 5px ${paddingLeft}px`,
          background: isSelected ? `${accentColor}14` : 'transparent',
          border: 'none',
          borderLeft: isSelected ? `2px solid ${accentColor}` : '2px solid transparent',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.05)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <span style={{ color: '#1f2937', fontSize: '0.5rem', flexShrink: 0 }}>◆</span>
        <span
          style={{
            fontSize: '0.71rem',
            color: isSelected ? accentColor : '#4b5563',
            fontWeight: isSelected ? 600 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 0.1s',
          }}
        >
          {node.label}
        </span>
      </button>
    );
  }

  // Folder node (may also be a leaf if it has both children and skill data)
  const leafCount = countLeaves(node);

  return (
    <div>
      <button
        onClick={() => {
          togglePath(node.fullPath);
          // If it's also a leaf, select it
          if (node.isLeaf && node.skill) onSelectLeaf(node.skill);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          width: '100%',
          padding: `6px 16px 6px ${paddingLeft}px`,
          background: isSelected ? `${accentColor}10` : 'transparent',
          border: 'none',
          borderLeft: isSelected ? `2px solid ${accentColor}66` : '2px solid transparent',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            isSelected ? `${accentColor}10` : 'transparent';
        }}
      >
        <span style={{ color: '#374151', fontSize: '0.58rem', flexShrink: 0, width: 10 }}>
          {isOpen ? '▾' : '▸'}
        </span>
        <span style={{ fontSize: '0.58rem', flexShrink: 0 }}>{isOpen ? '📂' : '📁'}</span>
        <span
          style={{
            fontSize: '0.72rem',
            color: isOpen ? '#94a3b8' : '#4b5563',
            fontWeight: 600,
            flex: 1,
            transition: 'color 0.12s',
          }}
        >
          {node.label}
        </span>
        <span
          style={{
            fontSize: '0.6rem',
            color: '#374151',
            background: '#111827',
            padding: '1px 5px',
            borderRadius: 10,
            marginRight: 4,
            flexShrink: 0,
          }}
        >
          {leafCount}
        </span>
      </button>

      {isOpen && (
        <div>
          {Array.from(node.children.values())
            .sort((a, b) => {
              // Folders before leaves
              const aIsFolder = a.children.size > 0;
              const bIsFolder = b.children.size > 0;
              if (aIsFolder && !bIsFolder) return -1;
              if (!aIsFolder && bIsFolder) return 1;
              return a.label.localeCompare(b.label);
            })
            .map((child) => (
              <TreeNodeRow
                key={child.fullPath}
                node={child}
                depth={depth + 1}
                accentColor={accentColor}
                openPaths={openPaths}
                togglePath={togglePath}
                selectedPath={selectedPath}
                onSelectLeaf={onSelectLeaf}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function SkillTree() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set(['voices']));
  const [selectedSkill, setSelectedSkill] = useState<SkillWithContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/skills?select=name,path,parent,category,description&limit=500`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSkills(data);
        else setError('Unexpected response from Supabase');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const togglePath = useCallback((path: string) => {
    setOpenPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const selectLeaf = useCallback(async (skill: Skill) => {
    setSelectedSkill(skill);
    setContentLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/skills?path=eq.${encodeURIComponent(skill.path)}&select=content,name,description`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSelectedSkill({ ...skill, content: data[0].content });
      }
    } catch {
      // leave without content
    } finally {
      setContentLoading(false);
    }
  }, []);

  // Build the full tree, then split into top-level category roots
  const fullTree = buildTree(skills);

  // Get category roots in order
  const catRoots = CATEGORY_ORDER
    .filter((c) => fullTree.has(c))
    .map((c) => ({ key: c, node: fullTree.get(c)! }));

  // Any extra categories not in the standard order
  const extraRoots = Array.from(fullTree.entries())
    .filter(([k]) => !CATEGORY_ORDER.includes(k))
    .map(([k, n]) => ({ key: k, node: n }));

  const allRoots = [...catRoots, ...extraRoots];

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: '#080B14',
        fontFamily: "'Courier New', Courier, monospace",
        overflow: 'hidden',
      }}
    >
      {/* ── Sidebar ── */}
      <div
        style={{
          width: 300,
          minWidth: 260,
          maxWidth: 340,
          borderRight: '1px solid rgba(99,102,241,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#0a0d18',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.2) transparent',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 18px 14px',
            borderBottom: '1px solid rgba(99,102,241,0.12)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textShadow: '0 0 18px rgba(99,102,241,0.7)',
            }}
          >
            eddie brain
          </div>
          <div style={{ fontSize: '0.68rem', color: '#374151', marginTop: 3 }}>
            {loading ? 'loading...' : `${skills.filter(s => s.path).length} skill nodes`}
          </div>
        </div>

        {/* Tree */}
        <div style={{ flex: 1, paddingBottom: 72 }}>
          {loading && (
            <div style={{ padding: '20px 18px', color: '#374151', fontSize: '0.78rem' }}>
              loading skills...
            </div>
          )}
          {error && (
            <div style={{ padding: '20px 18px', color: '#f87171', fontSize: '0.78rem' }}>
              error: {error}
            </div>
          )}

          {allRoots.map(({ key, node }) => {
            const meta = CATEGORY_META[key] || { icon: '📁', color: '#6b7280', label: key };
            const isCatOpen = openPaths.has(key);
            const totalLeaves = countLeaves(node);

            return (
              <div key={key}>
                {/* ── Top-level category row ── */}
                <button
                  onClick={() => togglePath(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    padding: '9px 18px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(99,102,241,0.07)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.06)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
                  }
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: `${meta.color}18`,
                      border: `1px solid ${meta.color}33`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isCatOpen ? meta.color : '#64748b',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      transition: 'color 0.15s',
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: '#374151',
                      background: '#111827',
                      padding: '1px 6px',
                      borderRadius: 10,
                      marginRight: 4,
                    }}
                  >
                    {totalLeaves}
                  </span>
                  <span style={{ color: '#374151', fontSize: '0.62rem' }}>
                    {isCatOpen ? '▾' : '▸'}
                  </span>
                </button>

                {/* ── Recursive children ── */}
                {isCatOpen &&
                  Array.from(node.children.values())
                    .sort((a, b) => {
                      const aIsFolder = a.children.size > 0;
                      const bIsFolder = b.children.size > 0;
                      if (aIsFolder && !bIsFolder) return -1;
                      if (!aIsFolder && bIsFolder) return 1;
                      return a.label.localeCompare(b.label);
                    })
                    .map((child) => (
                      <TreeNodeRow
                        key={child.fullPath}
                        node={child}
                        depth={1}
                        accentColor={meta.color}
                        openPaths={openPaths}
                        togglePath={togglePath}
                        selectedPath={selectedSkill?.path ?? null}
                        onSelectLeaf={selectLeaf}
                      />
                    ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content panel ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '40px 48px 80px',
          background: '#080B14',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.2) transparent',
        }}
      >
        {!selectedSkill && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
              userSelect: 'none',
            }}
          >
            <div style={{ fontSize: '3rem', opacity: 0.12 }}>🧠</div>
            <div
              style={{
                fontSize: '0.78rem',
                color: '#1f2937',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              select a skill node to read
            </div>
          </div>
        )}

        {selectedSkill && (
          <div style={{ maxWidth: 760 }}>
            {/* Breadcrumb path */}
            <div
              style={{
                fontSize: '0.68rem',
                color: '#374151',
                marginBottom: 20,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {selectedSkill.path?.split('/').join(' › ')}
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#f1f5f9',
                marginBottom: 10,
                letterSpacing: '0.02em',
              }}
            >
              {selectedSkill.name}
            </h1>

            {/* Description */}
            {selectedSkill.description && (
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#64748b',
                  marginBottom: 28,
                  lineHeight: 1.65,
                  borderLeft: `3px solid ${CATEGORY_META[selectedSkill.category]?.color || '#6b7280'}`,
                  paddingLeft: 14,
                  margin: '0 0 28px',
                }}
              >
                {selectedSkill.description}
              </p>
            )}

            <div style={{ height: 1, background: 'rgba(99,102,241,0.1)', marginBottom: 28 }} />

            {/* Markdown content */}
            {contentLoading ? (
              <div style={{ color: '#374151', fontSize: '0.78rem', letterSpacing: '0.06em' }}>
                loading content...
              </div>
            ) : selectedSkill.content ? (
              <div
                style={{ fontSize: '0.88rem', lineHeight: 1.8, color: '#94a3b8' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedSkill.content) }}
              />
            ) : (
              <div style={{ color: '#1f2937', fontSize: '0.78rem' }}>no content available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
