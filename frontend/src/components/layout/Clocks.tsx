import React, { useState, useEffect } from 'react';
import { Settings, Plus, X, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { WorldClock } from '../../store/useStore';
import { cn } from '../../lib/utils';

const TIMEZONE_PRESETS: WorldClock[] = [
    { city: 'London', tz: 'Europe/London', flagClass: 'fi fi-gb' },
    { city: 'Paris', tz: 'Europe/Paris', flagClass: 'fi fi-fr' },
    { city: 'New York', tz: 'America/New_York', flagClass: 'fi fi-us' },
    { city: 'Los Angeles', tz: 'America/Los_Angeles', flagClass: 'fi fi-us' },
    { city: 'Chicago', tz: 'America/Chicago', flagClass: 'fi fi-us' },
    { city: 'India', tz: 'Asia/Kolkata', flagClass: 'fi fi-in' },
    { city: 'Tokyo', tz: 'Asia/Tokyo', flagClass: 'fi fi-jp' },
    { city: 'Sydney', tz: 'Australia/Sydney', flagClass: 'fi fi-au' },
    { city: 'Dubai', tz: 'Asia/Dubai', flagClass: 'fi fi-ae' },
    { city: 'Singapore', tz: 'Asia/Singapore', flagClass: 'fi fi-sg' },
    { city: 'Shanghai', tz: 'Asia/Shanghai', flagClass: 'fi fi-cn' },
    { city: 'São Paulo', tz: 'America/Sao_Paulo', flagClass: 'fi fi-br' },
    { city: 'Moscow', tz: 'Europe/Moscow', flagClass: 'fi fi-ru' },
    { city: 'Seoul', tz: 'Asia/Seoul', flagClass: 'fi fi-kr' },
    { city: 'Istanbul', tz: 'Europe/Istanbul', flagClass: 'fi fi-tr' },
];

export const LiveClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-2.5 px-2">
            <div className="flex flex-col items-end gap-0.5">
                <span className="text-lg font-bold tabular-nums leading-none text-primary tracking-tight">
                    {time.toLocaleTimeString('de-DE', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[11px] text-foreground/80 uppercase tracking-wider font-semibold hidden xl:inline">
                    {time.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>
        </div>
    );
};

export const WorldClocks: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const { worldClocks, addWorldClock, removeWorldClock, isAdmin, editMode } = useStore();
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAddClock = (preset: WorldClock) => {
        // Don't add if already exists
        if (worldClocks.some(c => c.tz === preset.tz)) return;
        addWorldClock(preset);
    };

    return (
        <div className="flex items-center gap-4 py-0.5">
            {worldClocks.map((clock, index) => {
                const targetTime = new Date(time.toLocaleString('en-US', { timeZone: clock.tz }));
                const berlinTime = new Date(time.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
                const diff = (targetTime.getTime() - berlinTime.getTime()) / (1000 * 60 * 60);
                const offset = `${diff >= 0 ? '+' : ''}${Math.round(diff * 10) / 10}h`;

                return (
                    <div key={`${clock.tz}-${index}`} className="flex items-center gap-2 group cursor-default">
                        <span className={`text-base leading-none rounded-sm overflow-hidden drop-shadow-sm ${clock.flagClass}`}></span>
                        <div className="flex items-center gap-2 leading-none">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{clock.city}</span>
                            <span className="text-sm font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
                                {time.toLocaleTimeString('de-DE', { timeZone: clock.tz, hour12: false, hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground/50 tabular-nums">
                                ({offset})
                            </span>
                        </div>
                        {isAdmin && editMode && showSettings && (
                            <button 
                                onClick={() => removeWorldClock(index)}
                                className="h-4 w-4 rounded-full bg-destructive/20 hover:bg-destructive/40 flex items-center justify-center text-destructive transition-colors"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        )}
                    </div>
                );
            })}

            {/* Admin clock settings */}
            {isAdmin && editMode && (
                <div className="relative ml-auto">
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                            showSettings 
                                ? "bg-primary/15 text-primary border border-primary/30" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Settings className="h-3 w-3" />
                        Clocks
                    </button>

                    {showSettings && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                            <div className="absolute right-0 top-8 w-64 rounded-xl glass-card p-2 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-72 overflow-y-auto">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 py-1.5 mb-1">
                                    Zeitzonen hinzufügen
                                </p>
                                {TIMEZONE_PRESETS.map((preset) => {
                                    const alreadyAdded = worldClocks.some(c => c.tz === preset.tz);
                                    return (
                                        <button
                                            key={preset.tz}
                                            onClick={() => !alreadyAdded && handleAddClock(preset)}
                                            disabled={alreadyAdded}
                                            className={cn(
                                                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200",
                                                alreadyAdded 
                                                    ? "text-muted-foreground/40 cursor-default" 
                                                    : "hover:bg-[hsl(var(--glass-highlight)/0.05)] text-foreground"
                                            )}
                                        >
                                            <span className={cn(preset.flagClass, "text-sm rounded-sm overflow-hidden")} />
                                            <span className="flex-1 text-left">{preset.city}</span>
                                            {alreadyAdded ? (
                                                <Check className="h-3 w-3 text-primary/50" />
                                            ) : (
                                                <Plus className="h-3 w-3 text-muted-foreground/50" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
