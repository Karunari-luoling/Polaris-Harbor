import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Code, Globe, BookOpen, User, Sun, Moon } from 'lucide-react';
import { AppConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  siteConfig: AppConfig['site'];
}

const Navbar: React.FC<NavbarProps> = ({ siteConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // 滚动一定距离后为导航添加毛玻璃背景与阴影
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 路由导航项配置，便于复用在桌面端和移动端菜单
  const navItems = [
    { name: '主页', path: '/', icon: <User size={18} /> },
    { name: '项目', path: '/projects', icon: <Code size={18} /> },
    { name: '网站', path: '/websites', icon: <Globe size={18} /> },
    { name: '文章', path: '/articles', icon: <BookOpen size={18} /> },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ease-in-out ${
        scrolled 
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 py-3 shadow-sm' 
          : 'bg-white/0 py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">

          <NavLink to="/" className="flex items-center gap-2.5 group focus:outline-none">
            {siteConfig.logoImage ? (
               <div className="w-10 h-10 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                 <img src={siteConfig.logoImage} alt={siteConfig.brandName} className="w-full h-full object-cover" />
               </div>
            ) : (
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/10 dark:shadow-white/5 group-hover:scale-105 transition-all duration-300 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <span className="relative z-10 font-bold text-lg tracking-tighter group-hover:text-white transition-colors">
                   {(siteConfig.logoText || 'DS').substring(0, 2).toUpperCase()}
                 </span>
              </div>
            )}
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {siteConfig.brandName}
            </span>
          </NavLink>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-full p-1.5 shadow-sm">
              {navItems.map((item) => (
                <NavLink 
                  key={item.name} 
                  to={item.path} 
                  className={({ isActive }) =>
                    `px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-100'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-700/80'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-3">
             <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div 
        className={`absolute top-full left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-xl md:hidden transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'opacity-100 scale-y-100 translate-y-0 visible' : 'opacity-0 scale-y-95 -translate-y-2 invisible'
        }`}
      >
        <div className="px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20, className: isActive ? 'text-blue-300 dark:text-blue-600' : 'text-slate-400 dark:text-slate-500' })}
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
