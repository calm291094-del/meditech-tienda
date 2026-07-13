// ============================================
// API.JS - PETICIONES AL BACKEND
// ============================================

// 🔥 URL CORRECTA del backend
const API_URL = 'https://meditech-tienda-node.onrender.com/api';
const GITHUB_USER = "calm291094-del";
const GITHUB_REPO = "meditech-tienda";
let GITHUB_TOKEN = '';
let HEADERS = {
    "Authorization": "",
    "Accept": "application/vnd.github.v3+json"
};

function getToken() {
    return localStorage.getItem('token');
}

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        console.log(`📡 Llamando a: ${API_URL}${endpoint}`);
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        console.log(`📡 Status: ${response.status}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Error en la petición' }));
            throw new Error(error.error || `Error ${response.status}`);
        }
        const data = await response.json();
        console.log(`📡 Respuesta:`, data);
        return data;
    } catch (error) {
        console.error('❌ Error en API:', error.message);
        throw error;
    }
}
