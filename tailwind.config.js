/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        // 展示字体只用于姓名、区块标题等大字号场景；中文回退到系统宋体，避免缺字时掉回无衬线。
        display: ['Cormorant Garamond', 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', 'serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      letterSpacing: {
        label: '0.3em',
      },
    },
  },
  plugins: [],
};
