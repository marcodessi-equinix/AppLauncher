import React from 'react';
import { useStore } from '../store/useStore';

export const ThemeManager: React.FC = () => {
  React.useEffect(() => {
    // 1. Initial Apply (No React State Dependency)
    const storedTheme = window.localStorage.getItem('fr2-applauncher-storage');
    let initialTheme = 'dark';
    
    if (storedTheme) {
      try {
        const parsed = JSON.parse(storedTheme);
        if (parsed.state && parsed.state.theme) {
          initialTheme = parsed.state.theme;
        }
      } catch (e) {
        console.error('Failed to parse theme', e);
      }
    }

    const applyTheme = (t: string) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark', 'equinix');
        root.classList.add(t);
        root.setAttribute('data-theme', t);
        root.style.colorScheme = t === 'light' ? 'light' : 'dark';
    };

    applyTheme(initialTheme);

    // 2. Subscribe to store changes manually to avoid re-rendering THIS component
    // We import the store instance directly to subscribe
    const unsub = useStore.subscribe((state) => {
        applyTheme(state.theme);
    });

    return () => {
        unsub();
    };
  }, []);

  return null;
};
