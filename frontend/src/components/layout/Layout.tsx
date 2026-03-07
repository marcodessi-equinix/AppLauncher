import React from 'react';
import { Header } from './Header';
import { Dock } from './Dock';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {


  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased relative noise-overlay pb-20">
      {/* Ambient background ... */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* ... */}
      </div>

      <Header />
      
      <main className="relative z-10 w-full px-[clamp(32px,3vw,64px)] py-6">
        {children}
      </main>
      
      <footer className="relative z-10 py-6 text-center text-[10px] text-muted-foreground/30 font-medium tracking-wider uppercase">
        <p>&copy; {new Date().getFullYear()} FR2 AppLauncher · Enterprise Application Access Platform</p>
      </footer>

      <Dock />
    </div>
  );
};
