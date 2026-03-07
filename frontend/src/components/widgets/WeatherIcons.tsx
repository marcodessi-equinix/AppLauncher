import React from 'react';
import { cn } from '../../lib/utils';
import '../../index.css';

// Using inline CSS objects for animations might be tedious, so we will rely on Tailwind classes where possible,
// and custom CSS inside index.css for the complex keyframes (pulse, float, lightning).

interface WeatherIconProps {
  className?: string;
}

// ── Moon (clear night) ──────────────────────────────────────────────────────
export const MoonIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-15 animate-pulse-slow"></div>
    <svg className="relative w-full h-full text-indigo-200 drop-shadow-[0_0_6px_rgba(165,180,252,0.5)]" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
    {/* Stars */}
    <svg className="absolute inset-0 w-full h-full animate-pulse-slow" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ animationDelay: '0.5s' }}>
      <circle cx="18" cy="5" r="0.6" className="text-indigo-100" />
      <circle cx="21" cy="8" r="0.4" className="text-indigo-100" />
      <circle cx="19" cy="3" r="0.3" className="text-indigo-100" />
    </svg>
  </div>
);

// ── Night partly cloudy ─────────────────────────────────────────────────────
export const NightCloudIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-indigo-500/10 rounded-full blur-xl animate-pulse-slow"></div>
    <svg className="relative w-full h-full animate-float" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
      {/* Moon behind cloud */}
      <path className="text-indigo-300 fill-indigo-300/80" d="M12 6a4 4 0 1 0 4 4 2.8 2.8 0 0 1-4-4z" stroke="none" />
      {/* Cloud */}
      <path className="text-slate-300 fill-slate-300/80" d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1776 10.2014 17.8596 10.0215C17.4363 6.63417 14.5492 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2372 4.01188 11.4716 4.0349 11.7027C2.26189 12.3025 1 13.9877 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" stroke="none" />
    </svg>
  </div>
);

export const SunIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute inset-0 bg-yellow-500 rounded-full blur-xl opacity-20 animate-pulse-slow"></div>
    <svg className="relative w-full h-full text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)] animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  </div>
);

export const CloudIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-white/5 rounded-full blur-xl animate-pulse-slow"></div>
    <svg className="relative w-full h-full text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.2)] animate-float" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1776 10.2014 17.8596 10.0215C17.4363 6.63417 14.5492 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2372 4.01188 11.4716 4.0349 11.7027C2.26189 12.3025 1 13.9877 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" stroke="none" />
    </svg>
  </div>
);

export const CloudRainIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-blue-500/10 rounded-full blur-xl"></div>
     <svg className="relative w-full h-full animate-float" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path className="text-slate-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] fill-slate-300/80" d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1776 10.2014 17.8596 10.0215C17.4363 6.63417 14.5492 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2372 4.01188 11.4716 4.0349 11.7027C2.26189 12.3025 1 13.9877 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" stroke="none" />
       <path className="text-blue-400 animate-rain-1 shadow-blue-400" d="M8 15v2" stroke="currentColor" />
       <path className="text-blue-400 animate-rain-2 shadow-blue-400" d="M12 15v2" stroke="currentColor" />
       <path className="text-blue-400 animate-rain-3 shadow-blue-400" d="M16 15v2" stroke="currentColor" />
     </svg>
  </div>
);

export const CloudLightningIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-purple-500/10 rounded-full blur-xl animate-lightning-bg"></div>
    <svg className="relative w-full h-full animate-float" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path className="text-slate-400 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] fill-slate-400" d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1776 10.2014 17.8596 10.0215C17.4363 6.63417 14.5492 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2372 4.01188 11.4716 4.0349 11.7027C2.26189 12.3025 1 13.9877 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" stroke="none" />
       <path className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)] animate-lightning" d="M13 14l-4 5h4v4l5-6h-4z" stroke="currentColor" />
    </svg>
  </div>
);

export const CloudSnowIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-cyan-300/10 rounded-full blur-xl"></div>
    <svg className="relative w-full h-full animate-float" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path className="text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] fill-slate-200/90" d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1776 10.2014 17.8596 10.0215C17.4363 6.63417 14.5492 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2372 4.01188 11.4716 4.0349 11.7027C2.26189 12.3025 1 13.9877 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" stroke="none" />
       <path className="text-cyan-200 animate-snow-1" d="M8 15v.01" stroke="currentColor" strokeWidth="3" />
       <path className="text-cyan-200 animate-snow-2" d="M12 17v.01" stroke="currentColor" strokeWidth="3" />
       <path className="text-cyan-200 animate-snow-3" d="M16 15v.01" stroke="currentColor" strokeWidth="3" />
    </svg>
  </div>
);

export const CloudFogIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[70%] bg-slate-400/10 rounded-full blur-2xl animate-pulse-slow"></div>
    <svg className="relative w-full h-full animate-float" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path className="text-slate-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] fill-slate-400/60" d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1776 10.2014 17.8596 10.0215C17.4363 6.63417 14.5492 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2372 4.01188 11.4716 4.0349 11.7027C2.26189 12.3025 1 13.9877 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" stroke="none" />
       <path className="text-slate-300 animate-fog-1" d="M4 22h16" stroke="currentColor" />
       <path className="text-slate-300 animate-fog-2" d="M6 19h12" stroke="currentColor" />
    </svg>
  </div>
);

// We need a CloudDrizzle which is a lighter rain version
export const CloudDrizzleIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-blue-300/10 rounded-full blur-xl"></div>
    <svg className="relative w-full h-full animate-float" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path className="text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] fill-slate-200/90" d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1776 10.2014 17.8596 10.0215C17.4363 6.63417 14.5492 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2372 4.01188 11.4716 4.0349 11.7027C2.26189 12.3025 1 13.9877 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" stroke="none" />
       <path className="text-blue-300 animate-rain-1 shadow-blue-300" d="M10 15v1" stroke="currentColor" />
       <path className="text-blue-300 animate-rain-2 shadow-blue-300" d="M14 15v1" stroke="currentColor" />
    </svg>
  </div>
);

export const WindIcon: React.FC<WeatherIconProps> = ({ className }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <svg className="relative w-full h-full text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.4)] animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1-1.8 4.3H2"/>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
    </svg>
  </div>
);

// Moon / Night Icon (Optional, Open-Meteo provides day/night codes later but for now we just use Sun/Moon alternatively if we wanted, but Sun is generic clear icon)
export const UnknownIcon: React.FC<WeatherIconProps> = ({ className }) => (
   <div className={cn("relative flex items-center justify-center", className)}>
      <svg className="relative w-full h-full text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <circle cx="12" cy="12" r="10"/>
         <path d="M12 16v-4"/>
         <path d="M12 8h.01"/>
      </svg>
   </div>
);
