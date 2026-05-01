// ── API Configuration ──────────────────────────────────────────────────
// Change this to your Render backend URL in production
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://blogpost-backend-7l0a.onrender.com/api'; // ← UPDATE THIS

window.API_BASE = API_BASE;
