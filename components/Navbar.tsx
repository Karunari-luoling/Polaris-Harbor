import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Code, Globe, BookOpen, User, Sun, Moon } from 'lucide-react';
import { AppConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useCopy } from '../context/CopyContext';
import BrandMark from './BrandMark';

interface NavbarProps {
  siteConfig: AppConfig['site'];
}

const Navbar: React.FC<NavbarProps> = ({ siteConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { nav } = useCopy();
  const location = useLocation();

  useEffect(() => {
    // 滚动一定距离后为导航加玻璃底，避免和首屏的星港背景糊在一起
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: nav.home, path: '/', icon: <User size={18} /> },
    { name: nav.projects, path: '/projects', icon: <Code size={18} /> },
    { name: nav.websites, path: '/websites', icon: <Globe size={18} /> },
    { name: nav.articles, path: '/articles', icon: <BookOpen size={18} /> },
  ];

  const themeLabel = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';

  return (
    <nav className={`fixed inset-x-0 top-0 z-[1000] transition-[padding] duration-500 ${scrolled ? 'py-2.5' : 'py-3.5 md:py-5'}`}>
      <div className="shell">
        <div
          className={`flex items-center justify-between gap-3 rounded-full px-3 py-2 transition-all duration-500 md:px-4 ${
            scrolled
              ? 'glass-strong border border-[var(--line)] shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)]'
              : 'border border-transparent'
          }`}
        >
          <NavLink to="/" className="group flex min-w-0 items-center gap-3 focus:outline-none">
            <span className="relative">
              <span className="absolute -inset-2 rounded-full bg-[var(--glow-teal)] opacity-60 blur-lg transition-opacity duration-500 group-hover:opacity-100" />
              <BrandMark site={siteConfig} size="md" className="relative transition-transform duration-500 group-hover:scale-105" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold leading-none tracking-wide text-ink md:text-xl">
                {siteConfig.brandName}
              </span>
              {/* 品牌名的英文标记，用字距撑出招牌感 */}
              <span className="mt-1 hidden font-mono text-[8px] uppercase tracking-[0.34em] text-faint sm:block">
                Polaris Harbor · 星港
              </span>
            </span>
          </NavLink>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--panel)] p-1 backdrop-blur-md">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative rounded-full px-4 py-2 text-[12px] font-medium tracking-wide transition-all duration-300 ${
                      isActive
                        ? 'bg-[var(--panel-strong)] text-lamp shadow-[inset_0_1px_0_var(--inner-sheen)]'
                        : 'text-muted hover:bg-white/5 hover:text-ink'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute right-2 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-lamp shadow-[0_0_8px_var(--lamp)]" />
                      )}
                      <span className={isActive ? 'pr-1.5' : ''}>{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] text-muted backdrop-blur-md transition-all duration-300 hover:border-[var(--lamp)] hover:text-lamp"
              aria-label={themeLabel}
              title={themeLabel}
            >
              {theme === 'dark' ? (
                <Sun size={16} className="transition-transform duration-500 group-hover:rotate-45" />
              ) : (
                <Moon size={16} className="transition-transform duration-500 group-hover:-rotate-12" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] text-muted transition-colors focus:outline-none"
              aria-label={themeLabel}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => setIsOpen(open => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] text-muted transition-colors focus:outline-none"
              aria-label={isOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <div
            className={`mt-2 origin-top overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--panel-strong)] p-2 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all duration-300 ease-out ${
              isOpen
                ? 'visible translate-y-0 scale-y-100 opacity-100'
                : 'invisible -translate-y-2 scale-y-95 opacity-0'
            }`}
          >
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-[var(--lamp-soft)] text-lamp'
                      : 'text-muted hover:bg-white/5 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {React.cloneElement(item.icon as React.ReactElement<{ size?: number; className?: string }>, {
                      size: 18,
                      className: isActive ? 'text-lamp' : 'text-faint',
                    })}
                    <span>{item.name}</span>
                    {isActive && <span className="ml-auto h-1 w-1 rounded-full bg-lamp" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
