import React, { useEffect, useState, useRef } from 'react';
import { cn } from '../lib/utils';

interface SplashIntroProps {
  onComplete: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'ignite' | 'assemble' | 'surge' | 'finalize' | 'dissolve' | 'hidden'>('ignite');
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-generate static data to avoid re-renders
  const [stars] = useState(() =>
    Array.from({ length: 160 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 120 - 10}%`,
      left: `${Math.random() * 120 - 10}%`,
      size: Math.random() < 0.05 ? `${Math.random() * 3 + 2}px` : `${Math.random() * 1.5 + 0.3}px`,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.6,
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 6}s`,
    }))
  );

  const [particles] = useState(() =>
    Array.from({ length: 28 }).map((_, i) => {
      const angle = (i / 28) * Math.PI * 2;
      const distance = 120 + Math.random() * 80;
      return {
        id: i,
        px: `${Math.cos(angle) * distance}px`,
        py: `${Math.sin(angle) * distance}px`,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 0.4,
        color: i % 5 === 0 ? '#60a5fa' : i % 5 === 1 ? '#a78bfa' : i % 5 === 2 ? '#34d399' : i % 5 === 3 ? '#f59e0b' : '#e879f9',
      };
    })
  );

  const [dataStreams] = useState(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${5 + i * 8}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 4}s`,
      opacity: 0.04 + Math.random() * 0.06,
    }))
  );

  useEffect(() => {
    const tAssemble  = setTimeout(() => setPhase('assemble'),  800);
    const tSurge     = setTimeout(() => setPhase('surge'),     2800);
    const tFinalize  = setTimeout(() => setPhase('finalize'),  4200);
    const tDissolve  = setTimeout(() => setPhase('dissolve'),  6000);
    const tHidden    = setTimeout(() => { setPhase('hidden'); onComplete(); }, 7400);

    // Smooth progress bar
    let p = 0;
    progressRef.current = setInterval(() => {
      p = Math.min(p + (Math.random() * 2.5 + 0.5), 100);
      setProgress(p);
      if (p >= 100 && progressRef.current) clearInterval(progressRef.current);
    }, 60);

    return () => {
      [tAssemble, tSurge, tFinalize, tDissolve, tHidden].forEach(clearTimeout);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [onComplete]);

  if (phase === 'hidden') return null;

  const cubes = [
    { color: '#22d3ee', pos: 'top-[8%]  left-[42%]', delay: 0.0, size: 'w-4 h-4' },
    { color: '#f59e0b', pos: 'top-[18%] left-[68%]', delay: 0.15, size: 'w-3 h-3' },
    { color: '#e879f9', pos: 'top-[12%] left-[22%]', delay: 0.25, size: 'w-5 h-5' },
    { color: '#34d399', pos: 'top-[48%] left-[10%]', delay: 0.35, size: 'w-4 h-4' },
    { color: '#fb923c', pos: 'bottom-[12%] left-[28%]', delay: 0.45, size: 'w-3 h-3' },
    { color: '#818cf8', pos: 'bottom-[18%] left-[62%]', delay: 0.55, size: 'w-5 h-5' },
    { color: '#4ade80', pos: 'bottom-[8%]  left-[48%]', delay: 0.65, size: 'w-4 h-4' },
    { color: '#38bdf8', pos: 'top-[38%]  right-[8%]',  delay: 0.75, size: 'w-3 h-3' },
    { color: '#f472b6', pos: 'top-[28%]  right-[20%]', delay: 0.85, size: 'w-4 h-4' },
    { color: '#a3e635', pos: 'bottom-[28%] left-[14%]', delay: 0.95, size: 'w-3 h-3' },
  ];

  const showSurge = phase === 'surge' || phase === 'finalize' || phase === 'dissolve';
  const showFinalize = phase === 'finalize' || phase === 'dissolve';

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#020409] selection:bg-transparent",
      phase === 'dissolve' && "animate-[cinematic-dissolve_1.4s_ease-in_forwards]"
    )}>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LAYER 1: DEEP SPACE BACKGROUND                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Deep nebula gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(59,130,246,0.07)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_80%_20%,rgba(168,85,247,0.05)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_20%_80%,rgba(34,211,238,0.04)_0%,transparent_60%)]" />

        {/* Parallax star container */}
        <div className="absolute inset-[-10%] animate-[splash-parallax_25s_ease-in-out_infinite]">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
                backgroundColor: 'white',
                animation: star.twinkle
                  ? `pulse ${star.duration} ${star.delay} ease-in-out infinite alternate`
                  : undefined,
                boxShadow: parseFloat(star.size) > 2 ? `0 0 ${parseFloat(star.size) * 3}px rgba(255,255,255,0.6)` : undefined,
              }}
            />
          ))}
        </div>

        {/* Data stream vertical lines */}
        {dataStreams.map((stream) => (
          <div
            key={stream.id}
            className="absolute top-0 w-px"
            style={{
              left: stream.left,
              height: '100%',
              background: `linear-gradient(to bottom, transparent 0%, rgba(59,130,246,${stream.opacity}) 30%, rgba(59,130,246,${stream.opacity}) 70%, transparent 100%)`,
              animation: `data-stream ${stream.duration} ${stream.delay} linear infinite`,
            }}
          />
        ))}

        {/* Hex grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] animate-[hex-pulse_8s_ease-in-out_infinite]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34zM28 100L0 84V50l28-16 28 16v34z' fill='none' stroke='rgba(59,130,246,1)' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '56px 100px',
          }}
        />

        {/* Scan sweep line */}
        {(phase !== 'ignite') && (
          <div
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background: 'linear-gradient(to right, transparent 0%, rgba(59,130,246,0.5) 20%, rgba(139,92,246,0.6) 50%, rgba(59,130,246,0.5) 80%, transparent 100%)',
              boxShadow: '0 0 20px 4px rgba(59,130,246,0.3)',
              animation: 'scan-sweep 4s 0.5s linear infinite',
            }}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LAYER 2: CENTER COMPOSITION                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center">

        {/* CORNER BRACKETS */}
        {(phase !== 'ignite') && (
          <div className="absolute -inset-16 pointer-events-none">
            {/* Top-left */}
            <svg className="absolute top-0 left-0 w-10 h-10" viewBox="0 0 40 40" fill="none">
              <path d="M40 4 H4 V40" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"
                strokeDasharray="80" strokeDashoffset="80"
                style={{ animation: 'corner-draw 0.8s 0.3s ease-out forwards' }} />
            </svg>
            {/* Top-right */}
            <svg className="absolute top-0 right-0 w-10 h-10" viewBox="0 0 40 40" fill="none">
              <path d="M0 4 H36 V40" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"
                strokeDasharray="80" strokeDashoffset="80"
                style={{ animation: 'corner-draw 0.8s 0.5s ease-out forwards' }} />
            </svg>
            {/* Bottom-left */}
            <svg className="absolute bottom-0 left-0 w-10 h-10" viewBox="0 0 40 40" fill="none">
              <path d="M40 36 H4 V0" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"
                strokeDasharray="80" strokeDashoffset="80"
                style={{ animation: 'corner-draw 0.8s 0.7s ease-out forwards' }} />
            </svg>
            {/* Bottom-right */}
            <svg className="absolute bottom-0 right-0 w-10 h-10" viewBox="0 0 40 40" fill="none">
              <path d="M0 36 H36 V0" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"
                strokeDasharray="80" strokeDashoffset="80"
                style={{ animation: 'corner-draw 0.8s 0.9s ease-out forwards' }} />
            </svg>
          </div>
        )}

        {/* LOGO CONTAINER */}
        <div className="relative w-[320px] h-[320px] flex items-center justify-center">

          {/* Deep ambient glow behind logo */}
          <div className={cn(
            "absolute w-48 h-48 rounded-full blur-[80px] transition-all duration-2000",
            phase === 'ignite' ? "opacity-0 scale-50" : "opacity-100 scale-100",
            "bg-primary/20"
          )} />

          {/* ORBIT RING 1 (tilted) */}
          <div className={cn(
            "absolute inset-4 rounded-[40%_60%_70%_30%_/_50%] border-primary/35 splash-orbit-ring",
            "bg-gradient-to-tr from-primary/5 to-transparent",
            phase === 'ignite' ? "opacity-0" : "opacity-100"
          )} />

          {/* ORBIT RING 2 (counter-tilted, slightly smaller) */}
          <div className={cn(
            "absolute inset-10 rounded-[60%_40%_30%_70%_/_50%] border-accent/20 transition-opacity duration-1000",
            phase === 'ignite' ? "opacity-0" : "opacity-100"
          )}
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            animation: phase !== 'ignite' ? 'orbit-rotate 5s cubic-bezier(0.2,0.8,0.2,1) forwards reverse' : undefined,
          }} />

          {/* EXPAND RINGS on logo materialization */}
          {phase === 'assemble' && (
            <>
              <div className="absolute inset-[30%] rounded-full border border-primary/70"
                style={{ animation: 'ring-expand 1.2s 0.1s ease-out forwards' }} />
              <div className="absolute inset-[30%] rounded-full border border-accent/50"
                style={{ animation: 'ring-expand-2 1.6s 0.4s ease-out forwards' }} />
            </>
          )}

          {/* PARTICLE BURST on assemble */}
          {phase === 'assemble' && (
            <div className="absolute inset-0 flex items-center justify-center">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                    // @ts-expect-error Custom CSS vars
                    '--px': p.px,
                    '--py': p.py,
                    animation: `particle-fly 1.2s ${p.delay}s cubic-bezier(0.2,0.8,0.2,1) forwards`,
                  }}
                />
              ))}
            </div>
          )}

          {/* ENERGY STREAM SVG (circuit lines connecting to logo) */}
          {showSurge && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320" fill="none">
              <path d="M20,160 Q80,80 160,160" stroke="rgba(59,130,246,0.4)" strokeWidth="1"
                strokeDasharray="300" style={{ animation: 'energy-stream 2s ease-in-out infinite' }} />
              <path d="M300,160 Q240,80 160,160" stroke="rgba(139,92,246,0.4)" strokeWidth="1"
                strokeDasharray="300" style={{ animation: 'energy-stream 2s 0.4s ease-in-out infinite' }} />
              <path d="M160,20 Q200,100 160,160" stroke="rgba(34,211,238,0.3)" strokeWidth="1"
                strokeDasharray="200" style={{ animation: 'energy-stream 1.8s 0.2s ease-in-out infinite' }} />
              <path d="M160,300 Q120,220 160,160" stroke="rgba(248,113,113,0.3)" strokeWidth="1"
                strokeDasharray="200" style={{ animation: 'energy-stream 2.2s 0.6s ease-in-out infinite' }} />
            </svg>
          )}

          {/* MOTION TRAILS */}
          {showSurge && (
            <div className="absolute top-[33%] right-[15%] w-[160px] h-[90px] z-10 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/25 to-transparent blur-lg animate-[trail-flow_1.5s_infinite]" />
              <div className="absolute top-1/2 w-full h-[2px] bg-primary/35 blur-[1px] -translate-y-1/2 animate-[trail-flow_0.8s_-0.2s_infinite]" />
              <div className="absolute top-[30%] w-[70%] h-[1px] bg-sky-400/20 blur-sm animate-[trail-flow_1.3s_-0.5s_infinite]" />
            </div>
          )}

          {/* CASCADING CUBES */}
          <div className="absolute inset-0 z-20">
            {showSurge && cubes.map((cube, i) => (
              <div
                key={i}
                className={cn("absolute rounded-md cube-cascade", cube.pos, cube.size)}
                style={{
                  backgroundColor: cube.color,
                  animationDelay: `${cube.delay}s`,
                  boxShadow: `0 0 20px ${cube.color}88, 0 0 6px ${cube.color}`,
                }}
              />
            ))}
          </div>

          {/* ─── CORE LOGO ARROW ─── */}
          <div className={cn(
            "relative z-30 transition-all duration-1000",
            phase === 'ignite' && "opacity-0 scale-75",
            phase === 'assemble' && "animate-[arrow-materialize_1.2s_cubic-bezier(0.16,1,0.3,1)_forwards]",
            showSurge && "animate-[arrow-drift_7s_ease-in-out_infinite]"
          )}>
            <svg
              width="150" height="150" viewBox="0 0 100 100"
              className={cn("transition-all duration-1000", showFinalize && "splash-logo-glow")}
            >
              <defs>
                <linearGradient id="spl-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%">   <animate attributeName="stop-color" values="hsl(217,91%,65%);hsl(280,80%,70%);hsl(217,91%,65%)" dur="4s" repeatCount="indefinite" /></stop>
                  <stop offset="100%"><animate attributeName="stop-color" values="hsl(280,80%,70%);hsl(180,80%,55%);hsl(280,80%,70%)" dur="4s" repeatCount="indefinite" /></stop>
                </linearGradient>
                <linearGradient id="spl-grad-inner" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                </linearGradient>
                <filter id="spl-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="spl-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <clipPath id="spl-arrow-clip">
                  <path d="M10,80 L50,58 L90,80 L50,8 Z" />
                </clipPath>
              </defs>

              {/* Outer glow layer */}
              <path d="M10,80 L50,58 L90,80 L50,8 Z"
                fill="url(#spl-grad-main)" opacity="0.3" filter="url(#spl-glow-soft)" />

              {/* Main arrow body */}
              <path d="M10,80 L50,58 L90,80 L50,8 Z"
                fill="url(#spl-grad-main)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.8"
                filter="url(#spl-glow)" />

              {/* Highlight sheen */}
              <path d="M50,12 L88,78 L50,60 Z"
                fill="url(#spl-grad-inner)" opacity="0.25" />

              {/* Center spine */}
              <line x1="50" y1="18" x2="50" y2="56"
                stroke="white" strokeWidth="1.2" strokeOpacity="0.6"
                strokeLinecap="round" />

              {/* Wing detail lines */}
              <line x1="50" y1="56" x2="22" y2="72"
                stroke="white" strokeWidth="0.8" strokeOpacity="0.35" strokeLinecap="round" />
              <line x1="50" y1="56" x2="78" y2="72"
                stroke="white" strokeWidth="0.8" strokeOpacity="0.35" strokeLinecap="round" />

              {/* Inner glow dot */}
              <circle cx="50" cy="38" r="3" fill="white" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Chromatic ghost (shifted for aberration feel) */}
              {showFinalize && (
                <path d="M10,80 L50,58 L90,80 L50,8 Z"
                  fill="none" stroke="rgba(234,179,8,0.15)" strokeWidth="1"
                  transform="translate(2,1)" />
              )}
            </svg>

            {/* Glitch layer on logo */}
            {showFinalize && (
              <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
                <svg width="150" height="150" viewBox="0 0 100 100" className="absolute inset-0">
                  <path d="M10,80 L50,58 L90,80 L50,8 Z"
                    fill="rgba(99,102,241,0.4)"
                    style={{ animation: 'glitch-slice-1 6s 1s ease-in-out infinite' }} />
                </svg>
                <svg width="150" height="150" viewBox="0 0 100 100" className="absolute inset-0">
                  <path d="M10,80 L50,58 L90,80 L50,8 Z"
                    fill="rgba(239,68,68,0.3)"
                    style={{ animation: 'glitch-slice-2 6s 1s ease-in-out infinite' }} />
                </svg>
              </div>
            )}
          </div>

        </div>{/* end logo container */}

        {/* ─── TEXT BLOCK ─── */}
        <div className={cn(
          "mt-10 text-center transition-all duration-700",
          showFinalize ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          {/* Main title */}
          <div className="relative">
            <h1
              className="text-5xl md:text-7xl font-black text-white tracking-[0.22em] relative"
              style={{ animation: showFinalize ? 'text-reveal 0.9s cubic-bezier(0.16,1,0.3,1) forwards' : undefined }}
            >
              FR2 APPLAUNCHER
            </h1>
            {/* Title glow */}
            <div
              className="absolute inset-0 text-5xl md:text-7xl font-black tracking-[0.22em] text-primary pointer-events-none select-none blur-2xl opacity-50"
              aria-hidden
            >
              FR2 APPLAUNCHER
            </div>
            {/* Glitch clone 1 */}
            {showFinalize && (
              <div
                className="absolute inset-0 text-5xl md:text-7xl font-black tracking-[0.22em] text-cyan-400 pointer-events-none select-none"
                aria-hidden
                style={{ mixBlendMode: 'screen', animation: 'glitch-slice-1 7s 2s infinite' }}
              >
                FR2 APPLAUNCHER
              </div>
            )}
            {/* Glitch clone 2 */}
            {showFinalize && (
              <div
                className="absolute inset-0 text-5xl md:text-7xl font-black tracking-[0.22em] text-red-400 pointer-events-none select-none"
                aria-hidden
                style={{ mixBlendMode: 'screen', animation: 'glitch-slice-2 7s 2s infinite' }}
              >
                FR2 APPLAUNCHER
              </div>
            )}
          </div>

          {/* Tagline */}
          <p
            className="mt-3 text-xs md:text-sm font-bold text-primary/70 uppercase"
            style={{
              letterSpacing: '0.5em',
              animation: showFinalize ? 'tagline-reveal 1.2s 0.3s cubic-bezier(0.16,1,0.3,1) forwards' : undefined,
              opacity: 0,
            }}
          >
            Enterprise Application Access Platform
          </p>

          {/* Status badges */}
          {showFinalize && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {[
                { label: 'ENTERPRISE', color: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#60a5fa', delay: '0.4s' },
                { label: 'SECURE',     color: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.4)',  text: '#4ade80', delay: '0.6s' },
                { label: 'ONLINE',     color: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)', text: '#c084fc', delay: '0.8s' },
              ].map((badge) => (
                <span
                  key={badge.label}
                  className="text-[9px] font-black px-3 py-1 rounded-full tracking-[0.15em]"
                  style={{
                    backgroundColor: badge.color,
                    border: `1px solid ${badge.border}`,
                    color: badge.text,
                    opacity: 0,
                    animation: `badge-pop 0.5s ${badge.delay} cubic-bezier(0.34,1.56,0.64,1) forwards`,
                  }}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary"
                style={{
                  width: `${progress}%`,
                  transition: 'width 0.1s linear',
                  boxShadow: '0 0 10px hsl(var(--primary)/0.8)',
                }}
              />
            </div>
            <span className="text-[9px] font-bold tabular-nums text-primary/50 tracking-widest">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LAYER 3: FINAL GLOW BURST                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {phase === 'dissolve' && (
        <>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)', animation: 'pulse 0.6s ease-in-out infinite alternate' }} />
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm pointer-events-none" />
        </>
      )}
    </div>
  );
};
