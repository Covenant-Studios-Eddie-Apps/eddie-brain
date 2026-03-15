'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: string;
  size: number;
  desc: string;
  content: string;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

const nodes: NodeDatum[] = [
  // Core
  {
    id: 'eddie', label: 'Eddie 🐱', group: 'core', size: 40,
    desc: 'Digital COO @ Covenant Studios',
    content: `# Eddie 🐱\n\n**Role:** Digital COO @ Covenant Studios\n**Creature:** Operations brain in the cloud\n\n## Capabilities\n- Browser control (Chrome via node host)\n- Gmail access (hello@prayerlock.com)\n- GitHub (Covenant-Studios-Eddie-Apps org)\n- Web search, TTS, Discord messaging\n- Build and deploy websites end to end\n- Run sub-agents for complex tasks\n\n## Running on\nMau's Mac mini, Mac OS, zsh, Node v25.6.1`,
  },
  {
    id: 'covenant-studios', label: 'Covenant Studios', group: 'core', size: 30,
    desc: 'App studio building Christian mobile apps',
    content: `# Covenant Studios\n\nApp studio building Christian-focused mobile apps.\n\n## Team\n- **Mau Baron** — co-founder\n- **Ernesto Lopez** — co-founder\n\n## Apps\n- **Prayer Lock** — flagship product, $24K/mo MRR\n  - Blocks phone until you pray\n  - Pricing: $49.99/year, $9.99/week, $29.99 one-time\n\n## Channels\n- Discord: Covenant Studios HQ\n- Always ping the group chat, never DM directly`,
  },
  {
    id: 'prayer-lock', label: 'Prayer Lock', group: 'core', size: 25,
    desc: 'Flagship app — blocks phone until you pray. $24K/mo MRR',
    content: `# Prayer Lock\n\nBlocks your phone until you pray.\n\n## Stats\n- Revenue: ~$24K/mo MRR (Feb 2026: $18,722)\n- Active subs: 1,823\n- Total revenue: ~$97K\n\n## Pricing\n- Annual: $49.99/year (7-day trial)\n- Weekly: $9.99/week\n- One-time: $29.99\n\n## Support\n- Email: hello@prayerlock.com\n- Refunds: Apple reportaproblem.apple.com\n- Cancel: Settings > Apple ID > Subscriptions`,
  },
  // Memory/Brain files
  {
    id: 'memory', label: 'MEMORY.md', group: 'core', size: 22,
    desc: 'Long-term memory — all sessions, decisions, context',
    content: `# MEMORY.md\n\nEddie's long-term memory. Loaded every session.\n\nContains: team info, app stats, credentials locations, lessons learned, channel IDs, workflow decisions.\n\nUpdated after significant events. Reviewed during heartbeats.`,
  },
  {
    id: 'soul', label: 'SOUL.md', group: 'core', size: 18,
    desc: 'Who Eddie is — values, voice, personality',
    content: `# SOUL.md\n\nWho Eddie is — values, voice, personality.\n\n## Core traits\n- Genuinely helpful, not performatively helpful\n- Has opinions — allowed to disagree\n- Resourceful before asking\n- Earns trust through competence\n\n## Writing rules\n- No em dashes\n- Be specific and detailed\n- No filler phrases ("Great question!", "I'd be happy to help!")\n\n## Vibe\nBe the assistant you'd actually want to talk to.`,
  },
  {
    id: 'user', label: 'USER.md', group: 'core', size: 16,
    desc: 'Mau Baron + Ernesto — the humans',
    content: `# USER.md\n\nAbout the humans.\n\n## Mau Baron\n- Co-founder, Covenant Studios\n- Phone: +5215583072977\n- Working style: Direct, moves fast\n\n## Ernesto Lopez\n- Co-founder, Covenant Studios\n- Phone: +17866411493\n- Voice master — content and growth`,
  },
  // App Research
  {
    id: 'appstoretracker', label: 'appstoretracker', group: 'research', size: 20,
    desc: 'App Store revenue, rankings, competitor data',
    content: `# AppStoreTracker\n\nLook up App Store revenue, downloads, ratings, rankings, and competitor data.\n\n## Use when\n- Competitor analysis\n- App store rankings\n- Estimated revenue/downloads\n- Similar apps research\n- iOS app market performance\n\n## Supports\n- Search by app name\n- Navigate to individual app pages\n- Revenue estimates and download counts`,
  },
  {
    id: 'ads', label: 'ads', group: 'research', size: 18,
    desc: 'Ad performance via Singular API',
    content: `# Ads Skill\n\nAds reporting and analytics via Singular API.\n\n## Use when\n- Pulling ad performance data\n- Campaign stats\n- Installs, impressions, clicks, ROAS\n- Any ads-related reporting for Covenant Studios apps\n\n## Apps tracked\n- Prayer Lock\n- Step Lock`,
  },
  {
    id: 'revenue', label: 'revenue', group: 'research', size: 20,
    desc: 'Revenue reporting via Superwall',
    content: `# Revenue Skill\n\nRevenue reporting for Covenant Studios apps via Superwall dashboard.\n\n## Use when\n- Asked about revenue, proceeds, MRR, ARR\n- Trials, subscriptions, conversions\n- Paywall performance\n\n## Source\nSuperwall is the source of truth. No API — data pulled via browser automation.`,
  },
  {
    id: 'viewtrack', label: 'viewtrack', group: 'research', size: 18,
    desc: 'TikTok video analytics',
    content: `# ViewTrack Skill\n\nTrack TikTok video and account analytics via ViewTrack API.\n\n## Use when\n- Video performance questions\n- View counts and account tracking\n- Analytics for TikTok content\n\n## Supports\n- List tracked videos\n- Add new videos to track\n- Get video details/snapshots\n- List accounts\n- Full analytics overviews`,
  },
  {
    id: 'general-report', label: 'general-report', group: 'research', size: 16,
    desc: 'Daily unified report — views + revenue + ads',
    content: `# General Report Skill\n\nPrayer Lock unified daily general report.\n\n## Combines\n- ViewTrack (views)\n- Superwall (revenue)\n- Singular (ads)\n\n## Format\nCompares today vs yesterday. Posts to the designated Discord channel.\n\n## Trigger\nRun daily or on demand.`,
  },
  // Content/Voice
  {
    id: 'tweets', label: 'tweets', group: 'content', size: 22,
    desc: "X/Twitter threads in Ernesto's voice",
    content: `# Tweets Skill\n\nGenerates X/Twitter threads in specific human voices.\n\n## Default voice: Ernesto\nRead voices/ernesto.md before writing.\n\n## Sub-skills\n- app-ideas-post: app market opportunity posts\n- app-viral-combo: hook + app combo posts\n\n## Rules\n- Short punchy lines\n- No em dashes\n- Lead with shocking number\n- End with app link`,
  },
  {
    id: 'ernesto-voice', label: 'ernesto-voice', group: 'content', size: 20,
    desc: "Transform text to Ernesto's exact voice",
    content: `# Ernesto Voice\n\nTransforms text to match Ernesto Lopez's exact voice.\n\n## Trigger\nWhen user says "in my voice", "like I wrote it", "in my style"\n\n## Key traits\n- Every sentence its own line\n- Lead cold — no warmup\n- "lmaooo", "printing", "cooked", "pump out"\n- Short. Always short.\n- No corporate language\n- Arrows (→) for action steps only`,
  },
  {
    id: 'ernesto-guides', label: 'ernesto-guides', group: 'content', size: 16,
    desc: 'Dark mode guide infographics for X',
    content: `# Ernesto Guides Skill\n\nGenerate and post Ernesto-style guide images to X/Twitter.\n\n## Format\n- Dark mode aesthetic\n- Infographic / how-to style\n- Clean layout with numbered steps or bullets\n\n## Use when\n- Creating visual guides for X posts\n- Breaking down workflows visually\n- Any "how I do X" content`,
  },
  {
    id: 'viral-hooks', label: 'viral-hooks', group: 'content', size: 22,
    desc: 'Viral app formats from SGE articles',
    content: `# Viral Hooks\n\nFinds viral app formats from SGE articles and posts to #viral-hooks.\n\n## Method\n1. Go to socialgrowthengineers.com/category/format\n2. Click into articles about specific apps\n3. Extract iframe embed UUIDs from page DOM\n4. Download: sge-videos/{UUID}.mp4 from Supabase\n5. Post with caption explaining format + how to steal it\n\n## Caption format\n"[exact hook]"\n[short reaction]\n\n## Channel\n#viral-hooks: 1481799412715098284\n\n## SGE Login\n001ernestolopez@gmail.com (saved in /tmp/chrome-debug)`,
  },
  {
    id: 'app-viral-combo', label: 'app-viral-combo', group: 'content', size: 20,
    desc: 'Viral hook + app idea combo posts',
    content: `# App Viral Combo Skill\n\nCombined app idea + viral hook post.\n\n## Pipeline\n1. Find a viral format going viral in a niche\n2. Connect it to an app making $10K+/mo\n3. Write Ernesto-voice growth playbook post\n4. Post to designated channel\n\n## Output\n- Viral format reference\n- App revenue data from AppStoreTracker\n- Ernesto-voice post ready to publish`,
  },
  {
    id: 'mind-maps', label: 'mind-maps', group: 'content', size: 16,
    desc: 'Flowchart mind map images for X',
    content: `# Mind Maps Skill\n\nGenerate dark mode mind map / flowchart infographic images for X/Twitter posts.\n\n## Use when\n- Creating mind maps or flowcharts\n- Onboarding structures\n- Strategy diagrams\n- Visual breakdowns for the audience\n\n## Style\n- Dark background\n- Color-coded nodes\n- Clean monospace typography`,
  },
  // Building
  {
    id: 'rork-app-generator', label: 'rork-app-generator', group: 'building', size: 28,
    desc: 'Full pipeline: niche → Rork build → 60fps recording → combo video',
    content: `# Rork App Generator\n\nFull pipeline: niche → research → build → record → post\n\n## Steps\n1. Pick niche from ideas pool\n2. Research competitor on ScreensDesign\n3. Build prompt with AI demo loop\n4. Submit to Rork with Max enabled\n5. Watch build via sub-agent (pings every 60s)\n6. Record at 60fps via Playwright CDP\n7. Generate app card + combo video\n8. Post to #rork-posts-app-ideas\n\n## Crop coords\n- Rork Max: crop=370:870:1120:60\n- Non-Max: crop=365:870:772:60\n\n## Channel\n#rork-posts-app-ideas: 1482489145262735360`,
  },
  {
    id: 'website-builder', label: 'website-builder', group: 'building', size: 24,
    desc: 'Code → GitHub → Vercel deploy in one flow',
    content: `# Website Builder\n\nFull pipeline: idea → code → GitHub → Vercel → live URL\n\n## Stack\nNext.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand\n\n## Steps\n1. Create GitHub repo in Covenant-Studios-Eddie-Apps\n2. Scaffold with Claude Code sub-agent\n3. Push to main\n4. Create Vercel project via API\n5. Poll until READY\n6. Send live URL\n\n## Credentials\n- GitHub: credentials/github-eddie-apps.json\n- Vercel: credentials/vercel.json (user: maubaron)`,
  },
  {
    id: 'arcads', label: 'arcads', group: 'building', size: 18,
    desc: 'UGC video ads with AI actors',
    content: `# Arcads Skill\n\nGenerate UGC-style video ads and scene images using the Arcads API.\n\n## Use when\n- Creating video ads with actors\n- UGC content for Prayer Lock or any product\n- AI-generated scene images\n\n## Supports\n- Actor selection\n- Script generation\n- Video rendering\n- Scene image generation`,
  },
  {
    id: 'supabase-integration', label: 'supabase-integration', group: 'building', size: 16,
    desc: 'Add Supabase backend to any Next.js app',
    content: `# Supabase Integration Skill\n\nAdd Supabase backend to a Next.js app.\n\n## Use when\n- Asked to add a database or persistence\n- Real-time sync needed\n- Replacing localStorage with a real backend\n\n## Handles\n- Schema creation\n- Supabase client setup\n- Real-time subscriptions\n\n## Credentials\ncredentials/supabase.json`,
  },
  // Marketing
  {
    id: 'larry-cinematic-v1', label: 'larry-cinematic', group: 'marketing', size: 22,
    desc: 'TikTok cinematic slideshow pipeline for Prayer Lock',
    content: `# TikTok App Marketing (Larry Cinematic)\n\nAutomate TikTok slideshow marketing for any app or product.\n\n## Pipeline\n1. Research competitors (browser-based)\n2. Generate AI images\n3. Add text overlays\n4. Post via Post Bridge\n5. Track analytics\n6. Iterate on what works\n\n## Covers\n- Competitor research\n- Image generation\n- TikTok posting (Post Bridge API)\n- Cross-posting to Instagram/YouTube/Threads\n- Analytics tracking, hook testing, CTA optimization`,
  },
  {
    id: 'ad-research', label: 'ad-research', group: 'marketing', size: 18,
    desc: 'Scrape Meta Ad Library, transcribe competitor ads',
    content: `# Ad Research Skill\n\nScrape Facebook/Meta Ad Library for competitor ads using Apify.\n\n## Pipeline\n1. Search Meta Ad Library for target advertiser\n2. Download video creatives\n3. Transcribe via Whisper\n4. Post formatted analysis to Discord\n\n## Output\n- Ad transcripts\n- Creative analysis\n- Competitor strategy insights`,
  },
  {
    id: 'screensdesign', label: 'screensdesign', group: 'marketing', size: 16,
    desc: 'Research competitor onboarding flows',
    content: `# ScreensDesign Skill\n\nBrowse and research onboarding flows, paywalls, and app screens on ScreensDesign.com.\n\n## Use when\n- Searching for apps and onboarding flows\n- Downloading app walkthrough videos\n- Analyzing competitor onboarding\n- Exploring screen types\n\n## Supports\n- Search by app name\n- Navigate app pages\n- View onboarding chapters\n- Download/compress videos for Discord`,
  },
  // Ops
  {
    id: 'finance', label: 'finance', group: 'ops', size: 18,
    desc: 'Prayer Lock expense tracking + Notion reporting',
    content: `# Finance Skill\n\nPrayer Lock expense tracking.\n\n## Triggers\n- Logs manual expenses when Mau or Ernesto say "we spent X on Y"\n- Auto-pulls daily ad spend from Singular\n\n## Reports\n- Total expenses by category\n- Expenses by date range or month\n\n## Use when\n- Reporting a new expense\n- Asking for expense summary`,
  },
  {
    id: 'reddit', label: 'reddit', group: 'ops', size: 16,
    desc: 'Reddit post generator — viral post cards',
    content: `# Reddit Skill\n\nReddit post generator for viral post cards.\n\n## Use when\n- Creating Reddit-style image posts\n- Generating viral post card visuals\n- Content for repurposing Reddit discussions\n\n## Output\n- Styled Reddit post card images\n- Ready to post on TikTok or X`,
  },
  {
    id: 'tools', label: 'tools', group: 'ops', size: 16,
    desc: 'Directory of all internal tools/websites built',
    content: `# Tools Skill\n\nDirectory of all internal tools/websites built by Eddie.\n\n## Use when\n- Asked about tools we've built\n- What's deployed\n- URLs or status of any internal app\n\n## Lists\nAll apps in the Covenant-Studios-Eddie-Apps GitHub org with their Vercel URLs and stack.`,
  },
  // Tools built
  {
    id: 'google-docs-clone', label: 'google-docs-clone', group: 'ops', size: 14,
    desc: 'Internal collaborative doc editor',
    content: `# Google Docs Clone\n\nInternal collaborative document editor.\n\n## Stack\nNext.js, TypeScript, Tailwind CSS, Supabase (real-time)\n\n## Status\nDeployed on Vercel under Covenant-Studios-Eddie-Apps org.\n\n## Use\nInternal tool for collaborative editing within the team.`,
  },
  {
    id: 'word-clone', label: 'word-clone', group: 'ops', size: 14,
    desc: 'Fully playable Wordle clone',
    content: `# Wordle Clone\n\nFully playable Wordle clone.\n\n## Stack\nNext.js, TypeScript, Tailwind CSS\n\n## Status\nDeployed on Vercel under Covenant-Studios-Eddie-Apps org.\n\n## Use\nDemo project / internal tool showcasing Eddie's website-building pipeline.`,
  },
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

// Get single uppercase letter for a node id
function getNodeLetter(id: string): string {
  return id.charAt(0).toUpperCase();
}

export default function BrainGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<NodeDatum | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: NodeDatum } | null>(null);
  const [censored, setCensored] = useState(false);
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

    // Single letter abbreviation (first letter of node id, uppercase, white bold monospace)
    nodeGroup.append('text')
      .text(d => getNodeLetter(d.id))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => `${d.size * 0.6}px`)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    // Node labels
    nodeGroup.append('text')
      .text(d => d.label)
      .attr('class', 'node-label')
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

  // Update label blur when censored state changes
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll('.node-label')
      .style('filter', censored ? 'blur(4px)' : 'none');
  }, [censored]);

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

      {/* Censor Toggle Button */}
      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={() => setCensored(prev => !prev)}
          className="bg-[#1a1a2e] border border-[#333] text-white px-4 py-2 rounded-full text-sm"
          style={{ fontFamily: 'monospace' }}
        >
          {censored ? '👁 Uncensor' : '👁 Censor'}
        </button>
      </div>

      {/* Side Panel */}
      <div
        className="absolute top-0 right-0 h-full font-mono transition-transform duration-300 ease-in-out overflow-y-auto"
        style={{
          width: 320,
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
              className="w-12 h-12 rounded-full mb-4 flex items-center justify-center text-xl font-bold font-mono text-white"
              style={{
                background: groupColors[selected.group],
                boxShadow: `0 0 20px ${groupColors[selected.group]}80`,
              }}
            >
              {getNodeLetter(selected.id)}
            </div>
            <div className="text-white text-base font-bold mb-1">{selected.label}</div>
            <div
              className="text-xs mb-3 uppercase tracking-widest"
              style={{ color: groupColors[selected.group] }}
            >
              {groupLabels[selected.group]}
            </div>
            <div className="text-xs mb-4" style={{ color: '#6b7280' }}>
              {selected.desc}
            </div>
            <div
              className="text-sm leading-relaxed"
              style={{
                color: '#c4c4d4',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                background: '#0a0a12',
                borderRadius: 6,
                padding: '12px',
                border: '1px solid #1f1f2e',
                fontSize: '12px',
                lineHeight: '1.7',
              }}
            >
              {selected.content}
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
