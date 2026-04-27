/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';

// ICONS (lightweight SVG, no external dependency needed)
type IconProps = { name: string; className?: string; strokeWidth?: number };
export function Icon({ name, className = "w-4 h-4", strokeWidth = 1.8 }: IconProps) {
  const props = { viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };
  switch(name) {
    case 'activity': return <svg {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'feather': return <svg {...props}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>;
    case 'eye': return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'shield': return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'heart': return <svg {...props}><path d="M22 12h-4l-3 8-6-16-3 8H2"/></svg>;
    case 'refresh': return <svg {...props}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case 'wind': return <svg {...props}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>;
    case 'dna': return <svg {...props}><path d="M4 4c4 0 4 4 8 4s4-4 8-4M4 8c4 0 4 4 8 4s4-4 8-4M4 12c4 0 4 4 8 4s4-4 8-4M4 16c4 0 4 4 8 4s4-4 8-4"/></svg>;
    case 'sparkles': return <svg {...props}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.4L22 17l-2.2.6L19 20l-.8-2.4L16 17l2.2-.6z"/></svg>;
    case 'skull': return <svg {...props}><path d="M9 21H7a2 2 0 0 1-2-2v-3a8 8 0 0 1 14 0v3a2 2 0 0 1-2 2h-2"/><circle cx="9" cy="13" r="1.5"/><circle cx="15" cy="13" r="1.5"/><path d="M10 21v-2M14 21v-2"/></svg>;
    case 'trophy': return <svg {...props}><path d="M6 9V3h12v6a6 6 0 0 1-12 0z"/><path d="M6 9H3v3a4 4 0 0 0 4 4M18 9h3v3a4 4 0 0 1-4 4M9 21h6"/></svg>;
    case 'branch': return <svg {...props}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>;
    case 'restart': return <svg {...props}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>;
    case 'play': return <svg {...props}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
    case 'book': return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    default: return null;
  }
}

// ENERGY BAR
type Color = 'em' | 'am' | 'cy';
export function EnergyBar({ value, max = 5, color = 'em', highlighted = false }: { value: number; max?: number; color?: Color; highlighted?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return <div key={i} className={`seg ${filled ? `filled-${color}` : ''} ${highlighted && filled ? 'seg-pulse' : ''}`} />;
      })}
    </div>
  );
}

// PROBABILITY RING (HUD)
export function ProbabilityRing({ value }: { value: number }) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimVal(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  const radius = 110;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (animVal / 100) * circ;
  const tone = animVal >= 70 ? '#34f0a0' : animVal >= 40 ? '#f6c453' : '#ff5d6c';
  return (
    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
      <div className="absolute inset-0 spin-slower opacity-50">
        <svg viewBox="0 0 280 280" className="w-full h-full">
          <circle cx="140" cy="140" r="135" fill="none" stroke="rgba(56,225,255,0.2)" strokeDasharray="2 6" />
          {Array.from({length: 12}).map((_, i) => {
            const a = (i/12) * Math.PI * 2;
            return <line key={i} x1={140 + Math.cos(a)*128} y1={140 + Math.sin(a)*128} x2={140 + Math.cos(a)*135} y2={140 + Math.sin(a)*135} stroke="rgba(56,225,255,0.4)" strokeWidth="1.2" />;
          })}
        </svg>
      </div>
      <div className="absolute inset-4 spin-slow opacity-40">
        <svg viewBox="0 0 280 280" className="w-full h-full">
          {Array.from({length: 60}).map((_, i) => {
            const a = (i/60) * Math.PI * 2;
            const len = i % 5 === 0 ? 6 : 3;
            return <line key={i} x1={140 + Math.cos(a)*100} y1={140 + Math.sin(a)*100} x2={140 + Math.cos(a)*(100-len)} y2={140 + Math.sin(a)*(100-len)} stroke="rgba(125,211,252,0.5)" strokeWidth="1" />;
          })}
        </svg>
      </div>
      <svg viewBox="0 0 280 280" className="absolute inset-0 w-full h-full">
        <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(125,211,252,0.1)" strokeWidth="6" />
        <circle cx="140" cy="140" r={radius} fill="none"
          stroke={tone} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 140 140)"
          style={{ filter: `drop-shadow(0 0 12px ${tone})`, transition: 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1), stroke 0.4s' }} />
      </svg>
      <div className="relative z-10 text-center">
        <div className="text-[9px] tracking-[0.3em] font-mono text-cyan-300/70 uppercase mb-1">Probabilidad de Supervivencia</div>
        <div className="text-7xl font-display font-bold digital tabular-nums leading-none" style={{ color: tone, textShadow: `0 0 28px ${tone}99, 0 0 4px ${tone}` }}>
          {Math.round(animVal).toString().padStart(2,'0')}<span className="text-4xl opacity-60">%</span>
        </div>
        <div className="text-[9px] mt-2 font-mono tracking-widest text-slate-400">FENOTIPO ACTUAL</div>
      </div>
    </div>
  );
}
