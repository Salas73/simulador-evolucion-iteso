/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';

export function CinematicIce() {
  const flakes = useMemo(() => Array.from({length: 28}).map(() => ({
    left: Math.random()*100, delay: Math.random()*4, dur: 3 + Math.random()*4,
    size: 4 + Math.random()*8, drift: (Math.random()-0.5)*30
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at 50% 100%, rgba(125,211,252,0.18), transparent 70%), linear-gradient(180deg, rgba(125,211,252,0.05), transparent)'}} />
      {flakes.map((f, i) => (
        <div key={i} className="absolute text-cyan-200/70" style={{
          left: `${f.left}%`, top: 0, fontSize: `${f.size}px`,
          animation: `snowfall ${f.dur}s linear ${f.delay}s infinite`,
          ['--drift' as any]: `${f.drift}px`
        }}>❄</div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{
        background: 'linear-gradient(180deg, transparent, rgba(165,221,255,0.18))',
        clipPath: 'polygon(0 60%, 8% 50%, 18% 65%, 28% 45%, 40% 60%, 52% 40%, 64% 55%, 76% 38%, 88% 58%, 100% 50%, 100% 100%, 0 100%)'
      }} />
    </div>
  );
}

export function CinematicDrought() {
  const cracks = useMemo(() => Array.from({length: 6}).map(() => ({
    x1: Math.random()*100, y1: 70 + Math.random()*25,
    x2: Math.random()*100, y2: 80 + Math.random()*20
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at 50% 30%, rgba(246,196,83,0.18), transparent 60%), linear-gradient(180deg, rgba(246,140,40,0.08), rgba(120,60,20,0.15))'}} />
      <div className="absolute top-8 left-1/2 -translate-x-1/2" style={{ animation: 'pulseSun 2.4s ease-in-out infinite' }}>
        <div className="w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, #ffe28a, #f6c453 60%, #d97706 100%)' }} />
      </div>
      <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
        {cracks.map((c, i) => (
          <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="rgba(80,40,15,0.5)" strokeWidth="0.4" />
        ))}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-1/4" style={{ background: 'linear-gradient(180deg, transparent, rgba(120,60,20,0.4))' }} />
    </div>
  );
}

export function CinematicPredator() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at 50% 100%, rgba(255,93,108,0.18), transparent 65%), linear-gradient(180deg, rgba(20,8,12,0.6), rgba(40,8,18,0.5))'}} />
      <div className="absolute inset-0 flex items-end justify-center pb-8">
        <svg viewBox="0 0 120 80" className="w-3/4 h-3/4" style={{ animation: 'prowl 3.6s ease-in-out infinite' }}>
          <path d="M10 60 Q 18 40, 30 45 Q 38 38, 50 42 L 70 42 Q 82 38, 92 44 Q 102 40, 110 60 L 105 65 L 95 60 L 85 65 L 75 60 L 65 64 L 55 60 L 45 64 L 35 60 L 25 65 L 15 62 Z"
                fill="#1a0508" stroke="#3b0a14" strokeWidth="0.6" />
          <ellipse cx="38" cy="35" rx="3" ry="3.5" fill="#ff5d6c" style={{ animation: 'blinkEye 3s ease-in-out infinite', filter: 'drop-shadow(0 0 6px #ff5d6c)' }} />
          <ellipse cx="48" cy="35" rx="3" ry="3.5" fill="#ff5d6c" style={{ animation: 'blinkEye 3s ease-in-out infinite', filter: 'drop-shadow(0 0 6px #ff5d6c)' }} />
        </svg>
      </div>
      <div className="absolute top-4 left-8 w-1 h-1 rounded-full bg-red-400 blink" />
      <div className="absolute top-6 right-12 w-1 h-1 rounded-full bg-red-400 blink" style={{animationDelay: '0.4s'}} />
    </div>
  );
}

export function CinematicVirus() {
  const viruses = useMemo(() => Array.from({length: 9}).map(() => ({
    x: 10 + Math.random()*80, y: 10 + Math.random()*70,
    vx: (Math.random()-0.5)*30, vy: (Math.random()-0.5)*30,
    dur: 4 + Math.random()*3, delay: Math.random()*2,
    size: 12 + Math.random()*10
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(circle at 50% 50%, rgba(167,139,250,0.18), transparent 70%), linear-gradient(180deg, rgba(20,12,40,0.6), rgba(8,4,20,0.7))'}} />
      {viruses.map((v, i) => (
        <div key={i} className="absolute" style={{
          left: `${v.x}%`, top: `${v.y}%`,
          animation: `virusFloat ${v.dur}s ease-in-out ${v.delay}s infinite`,
          ['--vx' as any]: `${v.vx}px`, ['--vy' as any]: `${v.vy}px`
        }}>
          <svg width={v.size} height={v.size} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 6px #a78bfa)' }}>
            <circle cx="12" cy="12" r="5" fill="#a78bfa" opacity="0.85" />
            {Array.from({length:8}).map((_,j) => {
              const a = (j/8)*Math.PI*2;
              return <line key={j} x1={12+Math.cos(a)*5} y1={12+Math.sin(a)*5} x2={12+Math.cos(a)*9} y2={12+Math.sin(a)*9} stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" />;
            })}
            {Array.from({length:8}).map((_,j) => {
              const a = (j/8)*Math.PI*2;
              return <circle key={'c'+j} cx={12+Math.cos(a)*9} cy={12+Math.sin(a)*9} r="1.4" fill="#c4b5fd" />;
            })}
          </svg>
        </div>
      ))}
    </div>
  );
}

export function CinematicMeteor() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at 50% 100%, rgba(246,140,40,0.25), transparent 60%), linear-gradient(180deg, rgba(8,4,20,0.7), rgba(40,12,8,0.5))'}} />
      {Array.from({length: 24}).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white/70" style={{
          left: `${Math.random()*100}%`, top: `${Math.random()*60}%`,
          width: '1.5px', height: '1.5px',
          animation: `blink ${1.4+Math.random()*2}s ease-in-out ${Math.random()*2}s infinite`
        }} />
      ))}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute" style={{ top: '50%', left: '50%', animation: 'meteorTrail 3s linear infinite' }}>
          <div className="relative">
            <div className="w-3 h-3 rounded-full" style={{background: '#ffd97a', boxShadow: '0 0 16px #f6c453, 0 0 36px #f97316'}} />
            <div className="absolute top-1/2 right-2 w-32 h-1 -translate-y-1/2" style={{ background: 'linear-gradient(270deg, #ffd97a, transparent)', filter: 'blur(1px)' }} />
          </div>
        </div>
      </div>
      <div className="absolute" style={{ bottom: '20%', left: '60%', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #f6c453', animation: 'shockwave 3s linear infinite' }} />
    </div>
  );
}

export function CinematicBottleneck() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(56,225,255,0.12), transparent 70%), linear-gradient(180deg, rgba(8,12,28,0.7), rgba(4,8,20,0.85))'}} />
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        {Array.from({length: 40}).map((_, i) => (
          <circle key={i} cx={20 + (i%10)*18} cy={20 + Math.floor(i/10)*14} r="3"
            fill={i < 8 ? '#34f0a0' : 'rgba(125,211,252,0.4)'}
            style={{ animation: `blink ${2+Math.random()*2}s ease-in-out ${Math.random()*2}s infinite` }} />
        ))}
        <path d="M 40 90 L 160 90 L 110 130 L 110 170 L 90 170 L 90 130 Z"
              fill="rgba(56,225,255,0.06)" stroke="rgba(56,225,255,0.4)" strokeWidth="1" />
        {Array.from({length: 6}).map((_, i) => (
          <circle key={'b'+i} cx={85 + (i%3)*12} cy={180 + Math.floor(i/3)*8} r="2.5"
            fill="#34f0a0"
            style={{ animation: `blink 1.6s ease-in-out ${Math.random()*1.5}s infinite` }} />
        ))}
      </svg>
    </div>
  );
}

export function CinematicCompetition() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at 50% 80%, rgba(246,196,83,0.15), transparent 65%), linear-gradient(180deg, rgba(20,16,8,0.6), rgba(40,28,12,0.5))'}} />
      <div className="absolute inset-0 flex items-center justify-around px-12">
        <svg viewBox="0 0 60 60" className="w-1/4 h-1/2" style={{ animation: 'prowl 2.4s ease-in-out infinite' }}>
          <path d="M15 45 Q 22 25, 30 28 Q 38 25, 45 45 L 40 48 L 35 45 L 30 48 L 25 45 L 20 48 Z" fill="#34f0a0" opacity="0.85" stroke="#1a8a4d" strokeWidth="0.6" />
          <circle cx="25" cy="32" r="1.5" fill="#0a1f0f" />
          <circle cx="35" cy="32" r="1.5" fill="#0a1f0f" />
        </svg>
        <div className="font-mono text-2xl text-amber-300 blink">VS</div>
        <svg viewBox="0 0 60 60" className="w-1/4 h-1/2" style={{ animation: 'prowl 2.4s ease-in-out 1.2s infinite reverse' }}>
          <path d="M15 45 Q 22 25, 30 28 Q 38 25, 45 45 L 40 48 L 35 45 L 30 48 L 25 45 L 20 48 Z" fill="#f6c453" opacity="0.85" stroke="#8a5a1f" strokeWidth="0.6" />
          <circle cx="25" cy="32" r="1.5" fill="#1f1408" />
          <circle cx="35" cy="32" r="1.5" fill="#1f1408" />
        </svg>
      </div>
    </div>
  );
}

export function CinematicHabitat() {
  const leaves = useMemo(() => Array.from({length: 14}).map(() => ({
    left: Math.random()*100, delay: Math.random()*4, dur: 4 + Math.random()*4, lx: (Math.random()-0.5)*60
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'linear-gradient(180deg, rgba(52,240,160,0.08), rgba(246,196,83,0.12))'}} />
      <div className="absolute left-0 top-0 w-1/2 h-full" style={{background: 'radial-gradient(ellipse at 30% 70%, rgba(52,240,160,0.18), transparent 60%)'}} />
      <div className="absolute right-0 top-0 w-1/2 h-full" style={{background: 'radial-gradient(ellipse at 70% 70%, rgba(246,196,83,0.2), transparent 60%)'}} />
      {leaves.map((l, i) => (
        <div key={i} className="absolute text-amber-300/70" style={{
          left: `${l.left}%`, top: 0, fontSize: '14px',
          animation: `leafFall ${l.dur}s ease-in ${l.delay}s infinite`,
          ['--lx' as any]: `${l.lx}px`
        }}>❦</div>
      ))}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-300/40 to-transparent flicker" />
    </div>
  );
}

export function CinematicToxin() {
  const bubbles = useMemo(() => Array.from({length: 16}).map(() => ({
    left: Math.random()*100, delay: Math.random()*3, dur: 4 + Math.random()*4, size: 4 + Math.random()*8
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at 50% 100%, rgba(52,240,160,0.25), transparent 65%), linear-gradient(180deg, rgba(8,20,16,0.5), rgba(12,32,24,0.7))'}} />
      {bubbles.map((b, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: `${b.left}%`, bottom: '-20px', width: `${b.size}px`, height: `${b.size}px`,
          background: 'radial-gradient(circle, #6cf3a8, #1ec47e)', opacity: 0.6,
          animation: `snowfall ${b.dur}s linear ${b.delay}s infinite reverse`,
          filter: 'blur(0.5px)'
        }} />
      ))}
      <svg className="absolute bottom-0 left-1/3" width="60" height="40" viewBox="0 0 60 40" style={{ animation: 'fishFloat 2.4s ease-in-out infinite' }}>
        <path d="M5 20 Q 15 5, 35 12 L 50 8 L 50 32 L 35 28 Q 15 35, 5 20 Z" fill="rgba(255,93,108,0.5)" stroke="#ff5d6c" strokeWidth="0.8" />
        <circle cx="38" cy="18" r="1.2" fill="#1a0508" />
      </svg>
    </div>
  );
}

export function Cinematic({ id }: { id: string }) {
  switch(id) {
    case 'ice': return <CinematicIce />;
    case 'drought': return <CinematicDrought />;
    case 'predator': return <CinematicPredator />;
    case 'virus': return <CinematicVirus />;
    case 'meteor': return <CinematicMeteor />;
    case 'bottleneck': return <CinematicBottleneck />;
    case 'competition': return <CinematicCompetition />;
    case 'habitat': return <CinematicHabitat />;
    case 'toxin': return <CinematicToxin />;
    default: return null;
  }
}
