import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeConfig } from '../types';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeConfig: (config: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [config, setConfig] = useState<ThemeConfig | null>(null);

  // 判断当前时间是否处于自定义暗色时间段
  const isTimeInRange = (start: string, end: string): boolean => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins < endMins) {
      return currentMins >= startMins && currentMins < endMins;
    } else {
      return currentMins >= startMins || currentMins < endMins;
    }
  };

  const calculateTheme = useCallback((): Theme => {

    // 用户手动切换后优先使用本地覆盖
    const storedOverride = localStorage.getItem('theme_override') as Theme | null;
    if (storedOverride) {
      return storedOverride;
    }

    // 按配置的模式计算默认主题
    if (config) {
      if (config.mode === 'manual') {
        return config.default || 'light';
      }
      
      if (config.mode === 'custom' && config.customSchedule) {
        const { start, end } = config.customSchedule;
        return isTimeInRange(start, end) ? 'dark' : 'light';
      }
      
      if (config.mode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }

    const legacyStored = localStorage.getItem('theme') as Theme | null;
    if (legacyStored) return legacyStored;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [config]);

  useEffect(() => {
    const computedTheme = calculateTheme();
    setTheme(computedTheme);

    const root = window.document.documentElement;
    if (computedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [calculateTheme]);

  useEffect(() => {
    if (config?.mode !== 'custom') return;
    
    // 自定义时间段模式下每分钟检查一次时间窗口
    const interval = setInterval(() => {

      const computedTheme = calculateTheme();
      if (computedTheme !== theme) {
        setTheme(computedTheme);
        const root = window.document.documentElement;
        if (computedTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [config, theme, calculateTheme]);

  useEffect(() => {
    if (config && config.mode !== 'auto') return;

    if (localStorage.getItem('theme_override')) return;

    // 自动模式监听系统配色变化，保持同步
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
       const computedTheme = calculateTheme();
       setTheme(computedTheme);
       const root = window.document.documentElement;
       if (computedTheme === 'dark') root.classList.add('dark');
       else root.classList.remove('dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config, calculateTheme]);

  // 手动切换主题，同时写入覆盖标记防止自动模式覆盖
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    localStorage.setItem('theme_override', newTheme);

    localStorage.setItem('theme', newTheme); 

    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeConfig: setConfig }}>
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
