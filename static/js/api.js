// API.JS — cliente del backend
const API_URL = 'https://meditech-bot.onrender.com/api';
window.API_URL = API_URL; // para que chat.js lo use

const GITHUB_USER = 'calm291094-del';
const GITHUB_REPO = 'meditech-tienda';
let GITHUB_TOKEN = '';
let HEADERS = { Authorization: '', Accept: 'application/vnd.github.v3+json' };

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); }

async function apiRequest(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, signal: ctrl.signal });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error en la petición' }));
      throw new Error(error.error || `Error ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Tiempo de espera agotado');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// 🔒 El token de GitHub ahora se pide con sesión de admin (nunca público)
async function cargarTokenGitHub() {
  try {
    const d = await apiRequest('/config/github-token');
    GITHUB_TOKEN = d.token || '';
    HEADERS.Authorization = GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : '';
  } catch (e) {
    console.warn('Token GitHub no disponible:', e.message);
  }
}