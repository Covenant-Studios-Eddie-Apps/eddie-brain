'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import SkillTree from '@/components/SkillTree';

// Canvas graph only renders on client (uses refs, canvas, requestAnimationFrame)
const CanvasGraph = dynamic(() => import('@/components/CanvasGraph'), { ssr: false });

const TOGGLE_STYLE: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  display: 'flex',
  gap: 4,
  background: 'rgba(8,11,20,0.92)',
  border: '1px solid rgba(99,102,241,0.25)',
  borderRadius: 28,
  padding: '4px',
  fontFamily: "'Courier New', Courier, monospace",
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
};

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 18px',
        borderRadius: 22,
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.72rem',
        fontFamily: 'inherit',
        fontWeight: active ? 700 : 400,
        background: active ? 'rgba(99,102,241,0.22)' : 'transparent',
        color: active ? '#a5b4fc' : '#4b5563',
        letterSpacing: '0.06em',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [view, setView] = useState<'tree' | 'graph'>('tree');

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#080B14',
        position: 'relative',
      }}
    >
      {view === 'tree' ? <SkillTree /> : <CanvasGraph />}

      {/* View toggle — centered bottom */}
      <div style={TOGGLE_STYLE}>
        <ToggleBtn active={view === 'tree'} onClick={() => setView('tree')}>
          skill tree
        </ToggleBtn>
        <ToggleBtn active={view === 'graph'} onClick={() => setView('graph')}>
          brain graph
        </ToggleBtn>
      </div>
    </div>
  );
}
