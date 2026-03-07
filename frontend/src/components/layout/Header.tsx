import React from 'react';
import { Search, Sun, Lock, Unlock, Moon, Cloud, Shield, LogOut, Upload, Info } from 'lucide-react';
import { useStore, Theme } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { LoginModal } from '../admin/LoginModal';
import { WeatherModal } from '../widgets/WeatherModal';
import { useWeather } from '../../hooks/useWeather';
import { ImportPreviewModal } from '../admin/ImportPreviewModal';
import api, { parseBookmarks, ImportPreviewData } from '../../lib/api';
import { Button } from '../ui/button';
import { LiveClock, WorldClocks } from './Clocks';
import { InfoModal } from '../dashboard/InfoModal';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, isAdmin, setIsAdmin, toggleEditMode, editMode, theme, setTheme } = useStore();
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = React.useState(false);
  const [isThemeOpen, setIsThemeOpen] = React.useState(false);
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);
  
  // Import State
  const [importData, setImportData] = React.useState<ImportPreviewData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

  const { weather, loading: weatherLoading } = useWeather();
  
  // File upload ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const themes: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: 'dark', label: 'Premium Dark', icon: Moon },
    { id: 'light', label: 'Clean Enterprise', icon: Cloud },
    { id: 'equinix', label: 'Enterprise Red', icon: Shield },
  ];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setIsAdmin(false);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const data = await parseBookmarks(file);
        setImportData(data);
        setIsImportModalOpen(true);
    } catch (error) {
        console.error('Parse failed', error);
        alert('Fehler beim Lesen der Datei: ' + error);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-card" style={{ borderRadius: 0 }}>
        {/* Top highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[hsl(var(--glass-highlight)/0.1)] to-transparent" />
        
        <div className="w-full flex h-16 items-center justify-between px-4 md:px-[clamp(24px,3vw,72px)]">
          
          {/* Left: System Identity — compact */}
          <div className="flex items-center gap-3 shrink-0">
            <img 
              src="/FR2 App Launcher logo.png" 
              alt="FR2 AppLauncher" 
              className="h-8 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground leading-tight">FR2 AppLauncher</span>
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.12em] leading-none mt-0.5">Enterprise Access Platform</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1.5 ml-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-semibold text-emerald-400/70 uppercase tracking-wider">Online</span>
            </div>
          </div>

          {/* Center: Search — primary element */}
          <div className="flex-1 max-w-xl px-4 md:px-8">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
              <input 
                type="text"
                placeholder="Search applications..."
                className="h-11 w-full rounded-xl glass-input pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right: Compact telemetry & actions */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Info button — first */}
            <button 
              onClick={() => setIsInfoOpen(true)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-primary bg-primary/10 border border-primary/25 hover:bg-primary/15 hover:border-primary/40 transition-all duration-200 shadow-[0_0_12px_-4px_hsl(var(--glow)/0.25)]"
            >
              <Info className="h-4 w-4" />
              Info
            </button>

            {/* Weather — compact pill */}
            <button 
              onClick={() => setIsWeatherOpen(true)}
              className="hidden lg:flex items-center gap-2 hover:bg-[hsl(var(--glass-highlight)/0.05)] px-3 py-1.5 rounded-xl transition-colors duration-200 group"
            >
              {weatherLoading || !weather ? (
                <div className="h-6 w-6 bg-muted-foreground/20 rounded-full animate-pulse" />
              ) : (
                <div className="h-6 w-6 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-110">
                  <weather.current.icon className="w-full h-full drop-shadow-md" />
                </div>
              )}
              <span className="text-sm font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
                {weatherLoading || !weather ? '--' : `${weather.current.temp}°`}
              </span>
            </button>

            {/* Date & Time — compact */}
            <div className="hidden lg:block">
              <LiveClock />
            </div>

            <div className="h-8 w-[1px] bg-[hsl(var(--glass-border)/0.08)] hidden lg:block" />

            {/* Controls */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsThemeOpen(!isThemeOpen)}
                  className={cn("h-8 w-8 rounded-xl hover:bg-[hsl(var(--glass-highlight)/0.05)]", isThemeOpen && "bg-[hsl(var(--glass-highlight)/0.05)] text-primary")}
                >
                  <Sun className="h-4 w-4" />
                </Button>

                {isThemeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsThemeOpen(false)} />
                    <div className="absolute right-0 top-11 w-48 rounded-xl glass-card p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {themes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            setIsThemeOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 hover:bg-[hsl(var(--glass-highlight)/0.05)]",
                            theme === t.id && "bg-primary/10 text-primary"
                          )}
                        >
                          <t.icon className="h-3.5 w-3.5" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {isAdmin ? (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".html"
                    onChange={handleFileChange}
                  />

                  {editMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-primary hover:bg-primary/10"
                      title="Lesezeichen importieren"
                      onClick={handleImportClick}
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button 
                    variant={editMode ? "default" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8 rounded-xl"
                    onClick={toggleEditMode}
                    title={editMode ? "Bearbeitungsmodus beenden" : "Bearbeitungsmodus aktivieren"}
                  >
                    {editMode ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                    title="Abmelden"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsLoginOpen(true)}
                  className="h-8 text-[11px] font-semibold bg-transparent border-primary/15 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors duration-200 rounded-xl ml-1"
                >
                  Admin
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* World Clocks bar — always visible */}
        <div className="border-t border-[hsl(var(--glass-border)/0.06)] px-4 md:px-[clamp(24px,3vw,72px)] py-2">
          <WorldClocks />
        </div>
      </header>
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <WeatherModal isOpen={isWeatherOpen} onClose={() => setIsWeatherOpen(false)} data={weather} />
      <ImportPreviewModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} data={importData} />
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </>
  );
};
