'use client'

import { useEffect, useState } from 'react'

interface Skill {
  id: string
  name: string
  description: string | null
  content: string
  category: string | null
  updated_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  analytics: '#3B82F6',
  content: '#8B5CF6',
  research: '#10B981',
  video: '#F59E0B',
  dev: '#EAB308',
  ops: '#6B7280',
}

function getCategoryColor(category: string | null): string {
  if (!category) return '#6366F1'
  return CATEGORY_COLORS[category.toLowerCase()] ?? '#6366F1'
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function Home() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Skill | null>(null)

  useEffect(() => {
    fetch('/api/skills')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSkills(data)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <div className="text-2xl font-bold tracking-tight">Eddie Brain</div>
        {!loading && (
          <span className="text-sm text-gray-400">
            {skills.length} skill{skills.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Loading skills...
            </div>
          ) : skills.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No skills loaded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {skills.map((skill) => {
                const color = getCategoryColor(skill.category)
                return (
                  <button
                    key={skill.id}
                    onClick={() => setSelected(skill)}
                    className="text-left rounded-xl border p-4 transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none"
                    style={{
                      backgroundColor: hexToRgba(color, 0.12),
                      borderColor: hexToRgba(color, 0.5),
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3"
                      style={{ backgroundColor: color }}
                    >
                      {skill.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-semibold text-white truncate">{skill.name}</div>
                    {skill.category && (
                      <div className="text-xs mt-1" style={{ color }}>
                        {skill.category}
                      </div>
                    )}
                    {skill.description && (
                      <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                        {skill.description}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </main>

        {/* Side panel */}
        {selected && (
          <aside className="w-96 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <div className="font-bold text-lg">{selected.name}</div>
                {selected.category && (
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: getCategoryColor(selected.category) }}
                  >
                    {selected.category}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {selected.description && (
                <p className="text-sm text-gray-400 mb-4">{selected.description}</p>
              )}
              <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {selected.content}
              </pre>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
