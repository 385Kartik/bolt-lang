import { useState, useEffect } from 'react';

const storeState = {
  cart: [],
  theme: (typeof window !== 'undefined' && (localStorage.getItem('bolt_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))) || 'light',
};
const listeners = new Set();

export function updateStore(recipe) {
  recipe(storeState);
  listeners.forEach(l => l());
}

export function useStore(selector) {
  const [_, forceRender] = useState(0);
  useEffect(() => {
    const listener = () => forceRender(v => v + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  return selector(storeState);
}

export function ThemeManager() {
  const theme = useStore(s => s.theme);
  
  useEffect(() => {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('bolt_theme', theme);
  }, [theme]);
  
  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);
  
  return null;
}