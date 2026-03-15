'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: string;
  size: number;
  desc: string;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

const nodes: NodeDatum[] = [
  // Core
  { id: 'eddie', label: 'Eddie 🐱', group: 'core', size: 40, desc: 'Digital COO @ Covenant Studios' },
  { id: 'covenant-studios', label: 'Covenant Studios', group: 'core', size: 30, desc: 'App studio building Christian mobile apps' },
  { id: 'prayer-lock', label: 'Prayer Lock', group: 'core', size: 25, desc: 'Flagship app — blocks phone until you pray. $24K/mo MRR' },
  // Memory/Brain files
  { id: 'memory', label: 'MEMORY.md', group: 'core', size: 22, desc: 'Long-term memory — all sessions, decisions, context' },
  { id: 'soul', label: 'SOUL.md', group: 'core', size: 18, desc: 'Who Eddie is — values, voice, personality' },
  { id: 'user', label: 'USER.md', group: 'core', size: 16, desc: 'Mau Baron + Ernesto — the humans' },
  // App Research
  { id: 'appstoretracker', label: 'appstoretracker', group: 'research', size: 20, desc: 'App Store revenue, rankings, competitor data' },
  { id: 'ads', label: 'ads', group: 'research', size: 18, desc: 'Ad performance via Singular API' },
  { id: 'revenue', label: 'revenue', group: 'research', size: 20, desc: 'Revenue reporting via Superwall' },
  { id: 'viewtrack', label: 'viewtrack', group: 'research', size: 18, desc: 'TikTok video analytics' },
  { id: 'general-report', label: 'general-report', group: 'research', size: 16, desc: 'Daily unified report — views + revenue + ads' },
  // Content/Voice
  { id: 'tweets', label: 'tweets', group: 'content', size: 22, desc: "X/Twitter threads in Ernesto's voice" },
  { id: 'ernesto-voice', label: 'ernesto-voice', group: 'content', size: 20, desc: "Transform text to Ernesto's exact voice" },
  { id: 'ernesto-guides', label: 'ernesto-guides', group: 'content', size: 16, desc: 'Dark mode guide infographics for X' },
  { id: 'viral-hooks', label: 'viral-hooks', group: 'content', size: 22, desc: 'Viral app formats from SGE articles' },
  { id: 'app-viral-combo', label: 'app-viral-combo', group: 'content', size: 20, desc: 'Viral hook + app idea combo posts' },
  { id: 'mind-maps', label: 'mind-maps', group: 'content', size: 16, desc: 'Flowchart mind map images for X' },
  // Building
  { id: 'rork-app-generator', label: 'rork-app-generator', group: 'building', size: 28, desc: 'Full pipeline: niche → Rork build → 60fps recording → combo video' },
  { id: 'website-builder', label: 'website-builder', group: 'building', size: 24, desc: 'Code → GitHub → Vercel deploy in one flow' },
  { id: 'arcads', label: 'arcads', group: 'building', size: 18, desc: 'UGC video ads with AI actors' },
  { id: 'supabase-integration', label: 'supabase-integration', group: 'building', size: 16, desc: 'Add Supabase backend to any Next.js app' },
  // Marketing
  { id: 'larry-cinematic-v1', label: 'larry-cinematic', group: 'marketing', size: 22, desc: 'TikTok cinematic slideshow pipeline for Prayer Lock' },
  { id: 'ad-research', label: 'ad-research', group: 'marketing', size: 18, desc: 'Scrape Meta Ad Library, transcribe competitor ads' },
  { id: 'screensdesign', label: 'screensdesign', group: 'marketing', size: 16, desc: 'Research competitor onboarding flows' },
  // Ops
  { id: 'finance', label: 'finance', group: 'ops', size: 18, desc: 'Prayer Lock expense tracking + Notion reporting' },
  { id: 'reddit', label: 'reddit', group: 'ops', size: 16, desc: 'Reddit post generator — viral post cards' },
  { id: 'tools', label: 'tools', group: 'ops', size: 16, desc: 'Directory of all internal tools/websites built' },
  // Tools built
  { id: 'google-docs-clone', label: 'google-docs-clone', group: 'ops', size: 14, desc: 'Internal collaborative doc editor' },
  { id: 'word-clone', label: 'word-clone', group: 'ops', size: 14, desc: 'Fully playable Wordle clone' },
];

const links: LinkDatum[] = [
  // Eddie is center
  { source: 'eddie', target: 'covenant-studios' },
  { source: 'eddie', target: 'prayer-lock' },
  { source: 'eddie', target: 'memory' },
  { source: 'eddie', target: 'soul' },
  { source: 'eddie', target: 'user' },
  // Research cluster
  { source: 'covenant-studios', target: 'appstoretracker' },
  { source: 'covenant-studios', target: 'ads' },
  { source: 'covenant-studios', target: 'revenue' },
  { source: 'covenant-studios', target: 'viewtrack' },
  { source: 'ads', target: 'general-report' },
  { source: 'revenue', target: 'general-report' },
  { source: 'viewtrack', target: 'general-report' },
  // Content cluster
  { source: 'eddie', target: 'tweets' },
  { source: 'eddie', target: 'ernesto-voice' },
  { source: 'ernesto-voice', target: 'tweets' },
  { source: 'ernesto-voice', target: 'ernesto-guides' },
  { source: 'ernesto-voice', target: 'app-viral-combo' },
  { source: 'viral-hooks', target: 'app-viral-combo' },
  { source: 'tweets', target: 'mind-maps' },
  // Building cluster
  { source: 'eddie', target: 'rork-app-generator' },
  { source: 'eddie', target: 'website-builder' },
  { source: 'rork-app-generator', target: 'arcads' },
  { source: 'website-builder', target: 'supabase-integration' },
  { source: 'website-builder', target: 'google-docs-clone' },
  { source: 'website-builder', target: 'word-clone' },
  { source: 'tools', target: 'google-docs-clone' },
  { source: 'tools', target: 'word-clone' },
  // Marketing cluster
  { source: 'prayer-lock', target: 'larry-cinematic-v1' },
  { source: 'prayer-lock', target: 'ad-research' },
  { source: 'rork-app-generator', target: 'screensdesign' },
  { source: 'appstoretracker', target: 'app-viral-combo' },
  // Ops
  { source: 'covenant-studios', target: 'finance' },
  { source: 'covenant-studios', target: 'reddit' },
  { source: 'eddie', target: 'tools' },
];

const groupColors: Record<string, string> = {
  core: '#a855f7',
  research: '#14b8a6',
  content: '#f87171',
  building: '#60a5fa',
  marketing: '#f59e0b',
  ops: '#9ca3af',
};

const groupLabels: Record<string, string> = {
  core: 'Core / Identity',
  research: 'App Research',
  content: 'Content / Voice',
  building: 'Building',
  marketing: 'Marketing',
  ops: 'Ops / Finance',
};

export default function BrainGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<NodeDatum | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: NodeDatum } | null>(null);
  const selectedRef = useRef<NodeDatum | null>(null);

  const handleNodeClick = useCallback((node: NodeDatum) => {
    if (selectedRef.current?.id === node.id) {
      selectedRef.current = null;
      setSelected(null);
    } else {
      selectedRef.current = node;
      setSelected(node);
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Defs for glow filter
    const defs = svg.append('defs');

    const glowFilter = defs.append('filter').attr('id', 'glow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const strongGlow = defs.append('filter').attr('id', 'strongGlow');
    strongGlow.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'coloredBlur');
    const feMerge2 = strongGlow.append('feMerge');
    feMerge2.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge2.append('feMergeNode').attr('in', 'SourceGraphic');

    const container = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Deep copy nodes/links for simulation
    const simNodes: NodeDatum[] = nodes.map(n => ({ ...n }));
    const simLinks: LinkDatum[] = links.map(l => ({ ...l }));

    const simulation = d3.forceSimulation<NodeDatum>(simNodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(simLinks).id(d => d.id).distance(120).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NodeDatum>().radius(d => d.size + 20));

    // Links
    const link = container.append('g')
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', '#2a2a3a')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Node groups
    const nodeGroup = container.append('g')
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    nodeGroup.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => groupColors[d.group] || '#666')
      .attr('fill-opacity', 0.85)
      .attr('filter', 'url(#glow)')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 0);

    // Node labels
    nodeGroup.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size + 14)
      .attr('fill', 'rgba(255,255,255,0.85)')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    // Hover + click interactions
    nodeGroup
      .on('mouseover', function (event: MouseEvent, d: NodeDatum) {
        setTooltip({ x: event.clientX, y: event.clientY, node: d });
        d3.select(this).select('circle')
          .attr('filter', 'url(#strongGlow)')
          .attr('fill-opacity', 1);
      })
      .on('mousemove', function (event: MouseEvent) {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
      })
      .on('mouseout', function () {
        setTooltip(null);
        d3.select(this).select('circle')
          .attr('filter', 'url(#glow)')
          .attr('fill-opacity', 0.85);
      })
      .on('click', function (_event: MouseEvent, d: NodeDatum) {
        const currentSelected = selectedRef.current;
        if (currentSelected?.id === d.id) {
          selectedRef.current = null;
          setSelected(null);
          // Reset all
          nodeGroup.select('circle')
            .attr('opacity', 1)
            .attr('stroke', 'transparent')
            .attr('stroke-width', 0);
          link.attr('stroke-opacity', 0.6).attr('stroke', '#2a2a3a');
        } else {
          selectedRef.current = d;
          setSelected(d);

          const connectedIds = new Set<string>();
          connectedIds.add(d.id);
          simLinks.forEach(l => {
            const srcId = typeof l.source === 'object' ? (l.source as NodeDatum).id : l.source;
            const tgtId = typeof l.target === 'object' ? (l.target as NodeDatum).id : l.target;
            if (srcId === d.id) connectedIds.add(tgtId);
            if (tgtId === d.id) connectedIds.add(srcId);
          });

          nodeGroup.select('circle')
            .attr('opacity', (nd: NodeDatum) => connectedIds.has(nd.id) ? 1 : 0.15)
            .attr('stroke', (nd: NodeDatum) => nd.id === d.id ? 'white' : 'transparent')
            .attr('stroke-width', (nd: NodeDatum) => nd.id === d.id ? 3 : 0);

          link
            .attr('stroke-opacity', (l: LinkDatum) => {
              const srcId = typeof l.source === 'object' ? (l.source as NodeDatum).id : l.source;
              const tgtId = typeof l.target === 'object' ? (l.target as NodeDatum).id : l.target;
              return (srcId === d.id || tgtId === d.id) ? 1 : 0.05;
            })
            .attr('stroke', (l: LinkDatum) => {
              const srcId = typeof l.source === 'object' ? (l.source as NodeDatum).id : l.source;
              const tgtId = typeof l.target === 'object' ? (l.target as NodeDatum).id : l.target;
              return (srcId === d.id || tgtId === d.id) ? groupColors[d.group] : '#2a2a3a';
            });
        }
      });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x ?? 0)
        .attr('y1', d => (d.source as NodeDatum).y ?? 0)
        .attr('x2', d => (d.target as NodeDatum).x ?? 0)
        .attr('y2', d => (d.target as NodeDatum).y ?? 0);

      nodeGroup.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Click on background to deselect
    svg.on('click', function (event: MouseEvent) {
      if (event.target === svgRef.current) {
        selectedRef.current = null;
        setSelected(null);
        nodeGroup.select('circle')
          .attr('opacity', 1)
          .attr('stroke', 'transparent')
          .attr('stroke-width', 0);
        link.attr('stroke-opacity', 0.6).attr('stroke', '#2a2a3a');
      }
    });

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-full" style={{ background: '#0a0a0f' }}>
      <svg ref={svgRef} className="w-full h-full" />

      {/* Title */}
      <div className="absolute top-5 left-5 font-mono select-none pointer-events-none">
        <div className="text-white text-xl font-bold tracking-widest" style={{ textShadow: '0 0 20px rgba(168,85,247,0.8)' }}>
          eddie brain
        </div>
        <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
          {nodes.length} nodes · {links.length} connections
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-5 left-5 font-mono select-none pointer-events-none">
        <div className="space-y-1.5">
          {Object.entries(groupColors).map(([group, color]) => (
            <div key={group} className="flex items-center gap-2">
              <div
                className="rounded-full"
                style={{ width: 10, height: 10, background: color, boxShadow: `0 0 6px ${color}` }}
              />
              <span className="text-xs" style={{ color: '#9ca3af' }}>{groupLabels[group]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 font-mono"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            background: '#1a1a2e',
            border: `1px solid ${groupColors[tooltip.node.group]}40`,
            borderRadius: 8,
            padding: '8px 12px',
            maxWidth: 240,
            boxShadow: `0 0 20px ${groupColors[tooltip.node.group]}30`,
          }}
        >
          <div className="text-white text-sm font-bold">{tooltip.node.label}</div>
          <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>{tooltip.node.desc}</div>
        </div>
      )}

      {/* Side Panel */}
      <div
        className="absolute top-0 right-0 h-full font-mono transition-transform duration-300 ease-in-out"
        style={{
          width: 280,
          background: '#0d0d1a',
          borderLeft: selected ? `1px solid ${groupColors[selected.group]}40` : '1px solid transparent',
          transform: selected ? 'translateX(0)' : 'translateX(100%)',
          padding: '80px 24px 24px',
          boxShadow: selected ? `-10px 0 40px rgba(0,0,0,0.5)` : 'none',
        }}
      >
        {selected && (
          <>
            <button
              onClick={() => {
                selectedRef.current = null;
                setSelected(null);
              }}
              className="absolute top-5 right-5 text-gray-500 hover:text-white text-lg"
            >
              ✕
            </button>
            <div
              className="w-12 h-12 rounded-full mb-4 flex items-center justify-center text-xl"
              style={{
                background: groupColors[selected.group],
                boxShadow: `0 0 20px ${groupColors[selected.group]}80`,
              }}
            >
              {selected.group === 'core' ? '⚡' :
               selected.group === 'research' ? '🔍' :
               selected.group === 'content' ? '✍️' :
               selected.group === 'building' ? '🔨' :
               selected.group === 'marketing' ? '📢' : '⚙️'}
            </div>
            <div className="text-white text-base font-bold mb-1">{selected.label}</div>
            <div
              className="text-xs mb-3 uppercase tracking-widest"
              style={{ color: groupColors[selected.group] }}
            >
              {groupLabels[selected.group]}
            </div>
            <div className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
              {selected.desc}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1f1f2e' }}>
              <div className="text-xs" style={{ color: '#4b5563' }}>
                connections: {links.filter(l => l.source === selected.id || l.target === selected.id).length}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
