
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: string;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark mode
  const [fontSize, setFontSize] = useState<string>('medium');

  useEffect(() => {
    const savedTheme = localStorage.getItem('wadmecon_theme') as Theme | null;
    const savedFontSize = localStorage.getItem('wadmecon_fontSize') as string | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    if (savedFontSize) {
      setFontSize(savedFontSize);
      document.documentElement.dataset.fontSize = savedFontSize;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('wadmecon_theme', newTheme);
  };

  const increaseFontSize = () => {
    let newSize: string;
    switch (fontSize) {
      case 'small': newSize = 'medium'; break;
      case 'medium': newSize = 'large'; break;
      case 'large': newSize = 'x-large'; break;
      default: newSize = 'x-large';
    }
    setFontSize(newSize);
    document.documentElement.dataset.fontSize = newSize;
    localStorage.setItem('wadmecon_fontSize', newSize);
  };

  const decreaseFontSize = () => {
    let newSize: string;
    switch (fontSize) {
      case 'x-large': newSize = 'large'; break;
      case 'large': newSize = 'medium'; break;
      case 'medium': newSize = 'small'; break;
      default: newSize = 'small';
    }
    setFontSize(newSize);
    document.documentElement.dataset.fontSize = newSize;
    localStorage.setItem('wadmecon_fontSize', newSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontSize, increaseFontSize, decreaseFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
