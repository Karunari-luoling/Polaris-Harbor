import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 此前对外分享过 #/projects 形式的链接，改写为真实路径避免出现死链。
// pathname 可能以 / 结尾，直接拼接会得到 //path 这种协议相对 URL 并触发跨源 SecurityError。
if (window.location.hash.startsWith('#/')) {
  const base = window.location.pathname.replace(/\/+$/, '');
  window.history.replaceState(null, '', base + window.location.hash.slice(1) + window.location.search);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
