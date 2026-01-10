
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React Render Error:", error);
    container.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; text-align: center;">
        <h2 style="color: #ef4444;">앱 로드 중 오류 발생</h2>
        <p style="color: #64748b; font-size: 14px;">브라우저 캐시를 지우고 다시 시도해주세요.</p>
        <pre style="text-align: left; background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
        <button onclick="window.location.reload()" style="background: #1675f2; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">새로고침</button>
      </div>
    `;
  }
}
