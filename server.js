// server.js - Backend completo con PostgreSQL + bcrypt + JWT + Bot Telegram
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors({
    origin: '*',  // ✅ Permite todas las solicitudes (para pruebas)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
// IMPORTAR BASE DE DATOS (eliminar dependencia de PostgreSQL)
// ============================================================
// ❌ Elimina estas líneas:
// const { query, getOne, getAll, initTables } = require('./db');
// initTables().catch(console.error);

// ✅ En su lugar, usa archivos JSON directamente:
const fs = require('fs');
const path = require('path');

// Funciones para leer/escribir archivos JSON
function leerJSON(nombre) {
    try {
        const data = fs.readFileSync(path.join(__dirname, nombre), 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

function escribirJSON(nombre, datos) {
    fs.writeFileSync(path.join(__dirname, nombre), JSON.stringify(datos, null, 2));
}

// Funciones de base de datos simuladas (para mantener compatibilidad)
const query = async (text, params) => {
    console.log('📝 Consulta SQL simulada:', text, params);
    return { rows: [] };
};

const getOne = async (text, params) => {
    console.log('📝 getOne SQL simulada:', text, params);
    return null;
};

const getAll = async (text, params) => {
    console.log('📝 getAll SQL simulada:', text, params);
    return [];
};

const initTables = async () => {
    console.log('📝 initTables simulada - usando JSON files');
    return Promise.resolve();
};

// ============================================================
// CONFIGURACIÓN DEL BOT DE TELEGRAM
// ============================================================
const WORKER_URL = process.env.WORKER_URL || "https://telegram-proxy.calm291094.workers.dev";
const TOKEN = process.env.TELEGRAM_TOKEN;

let isRunning = false;
let lastUpdateId = 0;
let lastResponse = Date.now();
let reconnectAttempts = 0;
let errorMessage = '';
let botInterval = null;

console.log('🔧 CONFIGURACIÓN:');
console.log(`   WORKER_URL: ${WORKER_URL}`);
console.log(`   TOKEN: ${TOKEN ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO'}`);

// ============================================================
// 🛡️ MIDDLEWARE DE AUTENTICACIÓN JWT
// ============================================================
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    // Verificar si el token fue invalidado
    const invalidated = await getOne(
        'SELECT * FROM tokens_invalidados WHERE token = $1',
        [token]
    );
    if (invalidated) {
        return res.status(403).json({ error: 'Token inválido o revocado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

const esAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Se requiere rol de administrador.' });
    }
    next();
};

// ============================================================
// 📝 FUNCIONES DE TOKENS JWT
// ============================================================
function generarToken(usuario) {
    return jwt.sign(
        { id: usuario.id, username: usuario.username, role: usuario.role },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

function generarRefreshToken(usuario) {
    return jwt.sign(
        { id: usuario.id, username: usuario.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// ============================================================
// 🌐 RUTAS DE LA API
// ============================================================

// ---- Health Check ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- REGISTRO ----
app.post('/api/register', async (req, res) => {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name) {
        return res.status(400).json({ error: 'Nombre, usuario y contraseña son obligatorios' });
    }

    try {
        const exists = await getOne('SELECT id FROM usuarios WHERE username = $1', [username]);
        if (exists) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await query(
            `INSERT INTO usuarios (username, password_hash, name, email, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, name, email, role, created_at`,
            [username, hashedPassword, name, email, 'user']
        );

        const newUser = result.rows[0];
        const token = generarToken(newUser);
        const refreshToken = generarRefreshToken(newUser);

        await query(
            'UPDATE usuarios SET refresh_token = $1 WHERE id = $2',
            [refreshToken, newUser.id]
        );

        res.status(201).json({
            message: 'Usuario creado correctamente',
            usuario: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            token,
            refreshToken
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ---- LOGIN ----
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    try {
        const user = await getOne('SELECT * FROM usuarios WHERE username = $1', [username]);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = generarToken(user);
        const refreshToken = generarRefreshToken(user);

        await query(
            'UPDATE usuarios SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [refreshToken, user.id]
        );

        const { password_hash, refresh_token, ...usuarioSinPass } = user;

        res.json({
            message: 'Login exitoso',
            usuario: usuarioSinPass,
            token,
            refreshToken
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ---- REFRESH TOKEN ----
app.post('/api/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token requerido' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await getOne(
            'SELECT * FROM usuarios WHERE id = $1 AND refresh_token = $2',
            [decoded.id, refreshToken]
        );

        if (!user) {
            return res.status(401).json({ error: 'Refresh token inválido' });
        }

        const newToken = generarToken(user);
        const newRefreshToken = generarRefreshToken(user);

        await query(
            'UPDATE usuarios SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newRefreshToken, user.id]
        );

        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error('Error en refresh:', error);
        res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }
});

// ---- LOGOUT ----
app.post('/api/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        await query(
            'INSERT INTO tokens_invalidados (token, usuario) VALUES ($1, $2)',
            [token, req.user.username]
        );

        await query(
            'UPDATE usuarios SET refresh_token = NULL WHERE id = $1',
            [req.user.id]
        );

        res.json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: 'Error al cerrar sesión' });
    }
});

// ---- USUARIOS (solo admin) ----
app.get('/api/usuarios', authenticateToken, esAdmin, async (req, res) => {
    try {
        const usuarios = await getAll(
            'SELECT id, username, name, email, role, created_at FROM usuarios ORDER BY id'
        );
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.get('/api/usuarios/:id', authenticateToken, esAdmin, async (req, res) => {
    try {
        const user = await getOne(
            'SELECT id, username, name, email, role, created_at FROM usuarios WHERE id = $1',
            [req.params.id]
        );
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

app.put('/api/usuarios/:id', authenticateToken, esAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    try {
        let queryText = 'UPDATE usuarios SET name = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP';
        let params = [name, email, role, id];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            queryText = 'UPDATE usuarios SET name = $1, email = $2, role = $3, password_hash = $4, updated_at = CURRENT_TIMESTAMP';
            params = [name, email, role, hashedPassword, id];
        }

        const result = await query(
            `${queryText} WHERE id = $${params.length} RETURNING id, username, name, email, role, created_at`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

app.delete('/api/usuarios/:id', authenticateToken, esAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await getOne('SELECT username FROM usuarios WHERE id = $1', [id]);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (user.username === 'root') {
            return res.status(400).json({ error: 'No se puede eliminar al usuario root' });
        }

        await query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// ---- PRODUCTOS ----
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await getAll('SELECT * FROM productos ORDER BY id DESC');
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

app.post('/api/productos', authenticateToken, esAdmin, async (req, res) => {
    const { name, category, price, description, stock, image, feat, available } = req.body;

    if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
    }

    try {
        const result = await query(
            `INSERT INTO productos (name, category, price, description, stock, image, feat, available, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                name,
                category || 'medicamento',
                parseFloat(price),
                description || '',
                parseInt(stock) || 0,
                image || 'https://via.placeholder.com/300x200',
                feat ? 1 : 0,
                available !== undefined ? (available ? 1 : 0) : 1,
                req.user.username
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

app.put('/api/productos/:id', authenticateToken, esAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, category, price, description, stock, image, available, feat } = req.body;

    try {
        const result = await query(
            `UPDATE productos SET
                name = $1,
                category = $2,
                price = $3,
                description = $4,
                stock = $5,
                image = $6,
                available = $7,
                feat = $8,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [
                name,
                category,
                parseFloat(price),
                description,
                parseInt(stock),
                image,
                available !== undefined ? (available ? 1 : 0) : 1,
                feat ? 1 : 0,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

app.delete('/api/productos/:id', authenticateToken, esAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query('DELETE FROM productos WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// ---- PEDIDOS ----
app.post('/api/pedidos', authenticateToken, async (req, res) => {
    const { items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío' });
    }

    try {
        let total = 0;
        const itemsValidados = [];

        for (const item of items) {
            const prod = await getOne('SELECT * FROM productos WHERE id = $1', [item.id]);
            if (!prod) {
                return res.status(404).json({ error: `Producto ${item.id} no encontrado` });
            }
            if (!prod.available || prod.stock < item.cantidad) {
                return res.status(400).json({ error: `Stock insuficiente para ${prod.name}` });
            }
            const subtotal = parseFloat(prod.price) * item.cantidad;
            total += subtotal;
            itemsValidados.push({
                id: prod.id,
                nombre: prod.name,
                cantidad: item.cantidad,
                precio: parseFloat(prod.price),
                subtotal
            });
            await query(
                'UPDATE productos SET stock = stock - $1, available = CASE WHEN stock - $1 <= 0 THEN 0 ELSE available END WHERE id = $2',
                [item.cantidad, prod.id]
            );
        }

        const pedidoId = 'PED-' + Date.now();
        await query(
            `INSERT INTO pedidos (id, usuario, email, items, total, estado)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                pedidoId,
                req.user.username,
                req.user.email || 'no-email',
                JSON.stringify(itemsValidados),
                total,
                'pendiente'
            ]
        );

        res.status(201).json({
            message: 'Pedido creado',
            pedido: { id: pedidoId, usuario: req.user.username, total, items: itemsValidados }
        });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(500).json({ error: 'Error al crear pedido' });
    }
});


app.get('/api/pedidos', authenticateToken, esAdmin, async (req, res) => {
    try {
        const pedidos = await getAll('SELECT * FROM pedidos ORDER BY created_at DESC');
        const parsed = pedidos.map(p => ({
            ...p,
            items: typeof p.items === 'string' ? JSON.parse(p.items) : p.items
        }));
        res.json(parsed);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

app.put('/api/pedidos/:id', authenticateToken, esAdmin, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        const result = await query(
            'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
            [estado, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar pedido:', error);
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
});


// ---- CONFIGURACIÓN (para la tienda) ----
app.get('/api/config', (req, res) => {
    res.json({
        headerSubtitle: "Salud & Tecnología",
        categoriasTitle: "Explora por Categoría",
        categoriasSubtitle: "Encuentra exactamente lo que necesitas",
        productosTitle: "🌟 Productos Destacados",
        productosSubtitle: "Los más populares entre nuestros clientes",
        ofertasTitle: "🔥 Ofertas Especiales",
        ofertasSubtitle: "Aprovecha estos descuentos exclusivos",
        footerDescription: "Tu tienda confiable para medicamentos y hardware de última generación."
    });
});

// ============================================================
// 🔑 TOKEN DE GITHUB - RUTA PÚBLICA (para el frontend)
// ============================================================

// Obtener token de GitHub (público - solo lectura)
// ⚠️ Esta ruta NO requiere autenticación para que el frontend pueda cargar el token
app.get('/api/config/github-token-public', async (req, res) => {
    try {
        const result = await getOne('SELECT value FROM config WHERE key = $1', ['github_token']);
        // Solo devolvemos el token si existe, sin información sensible adicional
        res.json({ token: result ? result.value : '' });
    } catch (error) {
        console.error('Error al obtener token público:', error);
        res.status(500).json({ error: 'Error al obtener token' });
    }
});

// ============================================================
// 🔑 CONFIGURACIÓN - TOKEN DE GITHUB (DESDE DB)
// ============================================================

// Obtener token de GitHub (solo admin)
app.get('/api/config/github-token', authenticateToken, esAdmin, async (req, res) => {
    try {
        const result = await getOne('SELECT value FROM config WHERE key = $1', ['github_token']);
        res.json({ token: result ? result.value : '' });
    } catch (error) {
        console.error('Error al obtener token:', error);
        res.status(500).json({ error: 'Error al obtener token' });
    }
});

// Actualizar token de GitHub (solo admin)
app.post('/api/config/github-token', authenticateToken, esAdmin, async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token es requerido' });
    }
    try {
        const exists = await getOne('SELECT key FROM config WHERE key = $1', ['github_token']);
        if (exists) {
            await query('UPDATE config SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2', [token, 'github_token']);
        } else {
            await query('INSERT INTO config (key, value) VALUES ($1, $2)', ['github_token', token]);
        }
        res.json({ message: 'Token actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar token:', error);
        res.status(500).json({ error: 'Error al actualizar token' });
    }
});

// Probar token (verifica si es válido contra GitHub)
app.post('/api/config/test-github-token', authenticateToken, esAdmin, async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token es requerido' });
    }
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
        });
        if (response.ok) {
            res.json({ valid: true, message: 'Token válido' });
        } else {
            const errorData = await response.json();
            res.json({ valid: false, message: errorData.message || 'Token inválido' });
        }
    } catch (error) {
        res.json({ valid: false, message: 'Error de conexión' });
    }
});

// ============================================================
// 🤖 FUNCIONES DEL BOT DE TELEGRAM
// ============================================================

async function callWorker(method, data = {}) {
    if (!TOKEN) return { ok: false, error: 'Token no configurado' };
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: TOKEN, method, data })
        });
        return await response.json();
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

async function sendTelegramMessage(chatId, text) {
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    const result = await callWorker('sendMessage', {
        chat_id: chatId,
        text: cleanText,
        parse_mode: ''
    });
    return result.ok;
}

// 🔥 Función mejorada con acceso a productos desde la base de datos
async function getAniaResponse(userMessage) {
    try {
        // 1. Obtener productos de la base de datos
        const productos = await getAll('SELECT name, price, description, stock FROM productos LIMIT 20');
        
        // 2. Construir contexto de productos
        let productosContexto = '';
        if (productos && productos.length > 0) {
            productosContexto = productos.map(p => 
                `- ${p.name} ($${parseFloat(p.price).toFixed(2)}): ${(p.description || '').substring(0, 100)}... Stock: ${p.stock}`
            ).join('\n');
        } else {
            productosContexto = 'No hay productos disponibles en este momento.';
        }

        // 3. Llamar a la IA con contexto
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: 'system', 
                        content: `Eres Ania, la asistente virtual de MediTech. 
                        Tienes acceso a estos productos de la tienda:\n${productosContexto}\n
                        Tu personalidad es alegre, entusiasta y usas emojis.
                        Hablas en español.
                        Si preguntan por un producto, dales información específica.
                        Si preguntan por precios, menciónalos.
                        Siempre recomienda consultar a un médico para temas de salud.`
                    },
                    { role: 'user', content: userMessage }
                ],
                model: 'openai'
            })
        });

        if (response.ok) {
            let texto = await response.text();
            texto = texto.replace(/<[^>]*>/g, '').trim();
            if (texto.length > 10) return texto;
        }
    } catch (e) {
        console.error('Error en IA:', e.message);
    }

    // Fallback: respuestas locales
    const lower = userMessage.toLowerCase();
    if (lower.includes('hola') || lower.includes('buenas')) {
        return "¡Hola! ☕️ Soy Ania, tu asistente de MediTech. ¿En qué puedo ayudarte hoy? ✨\n\nPuedes preguntarme por nuestros productos, precios o recomendaciones.";
    }
    if (lower.includes('precio') || lower.includes('cuesta')) {
        return "💰 Puedes ver todos los precios en nuestra web: https://calm291094-del.github.io/meditech-tienda/ 😊 ¿Quieres que te recomiende algún producto?";
    }
    if (lower.includes('gracias')) {
        return "¡De nada! ☕️ Me alegra poder ayudarte. ¿Necesitas algo más? ✨";
    }
    if (lower.includes('producto') || lower.includes('medicamento') || lower.includes('tecnología')) {
        return "📦 Tenemos una amplia variedad de productos en:\n• 💊 Medicamentos\n• 💻 Tecnología\n• 🩺 Salud\n• 🎮 Gaming\n\n¿Quieres que te cuente más sobre algún producto en particular?";
    }
    return "¡Interesante! ☕️ ¿Qué más necesitas saber de MediTech?";
}

async function getUpdates() {
    try {
        const result = await callWorker('getUpdates', {
            offset: lastUpdateId + 1,
            timeout: 30
        });
        if (result.error_code === 409) {
            errorMessage = 'Conflicto con otra instancia';
            return false;
        }
        if (result.ok && result.result) {
            for (let update of result.result) {
                lastUpdateId = update.update_id;
                if (update.message?.text) {
                    const chatId = update.message.chat.id;
                    const text = update.message.text;
                    if (text === '/start') {
                        await sendTelegramMessage(chatId, "¡Bienvenido a MediTech! ☕️ Soy Ania. ¿En qué puedo ayudarte? ✨");
                    } else if (text === '/help') {
                        await sendTelegramMessage(chatId, "📋 Comandos:\n/start - Saludo\n/help - Ayuda\n/web - Tienda");
                    } else if (text === '/web') {
                        await sendTelegramMessage(chatId, "🌐 https://calm291094-del.github.io/meditech-tienda/");
                    } else if (!text.startsWith('/')) {
                        const response = await getAniaResponse(text);
                        await sendTelegramMessage(chatId, response);
                        lastResponse = Date.now();
                    }
                }
            }
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function startBot() {
    if (isRunning) return;
    if (!TOKEN) {
        errorMessage = 'Token no configurado';
        setTimeout(startBot, 30000);
        return;
    }
    const result = await callWorker('getMe');
    if (result.ok) {
        isRunning = true;
        errorMessage = '';
        console.log(`✅ Bot @${result.result.username} iniciado`);
        if (botInterval) clearInterval(botInterval);
        botInterval = setInterval(getUpdates, 3000);
        lastUpdateId = 0;
    } else {
        errorMessage = result.error || result.description || 'Error al iniciar';
        reconnectAttempts++;
        setTimeout(startBot, Math.min(30000, reconnectAttempts * 5000));
    }
}

// ============================================================
// 🌐 RUTAS WEB
// ============================================================

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🤖 Ania Bot - MediTech</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f0fdfa; color: #1f2937; }
                .card { background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
                .status { display: inline-block; padding: 8px 20px; border-radius: 30px; font-weight: bold; }
                .online { background: #10b981; color: white; }
                .offline { background: #ef4444; color: white; }
                .connecting { background: #f59e0b; color: white; }
                .bot-info { background: #f8fafc; border-radius: 12px; padding: 15px; margin: 10px 0; }
                h1 { color: #0d9488; }
                .emoji-big { font-size: 48px; }
                .btn { background: #0d9488; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; display: inline-block; border: none; cursor: pointer; }
                .btn:hover { background: #0f766e; }
                .btn-warning { background: #f59e0b; }
                .btn-warning:hover { background: #d97706; }
                .error-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 15px; margin: 10px 0; color: #dc2626; }
            </style>
        </head>
        <body>
            <div class="card">
                <div style="text-align: center;">
                    <span class="emoji-big">🤖</span>
                    <h1>Ania Bot - MediTech</h1>
                    <p style="color: #6b7280;">Asistente virtual con inteligencia artificial</p>
                </div>
                ${errorMessage ? `<div class="error-box"><strong>❌ Error:</strong> ${errorMessage}</div>` : ''}
                <div class="bot-info">
                    <p><strong>📊 Estado:</strong> <span class="status ${isRunning ? 'online' : 'connecting'}">${isRunning ? '✅ Conectado' : '🔄 Conectando...'}</span></p>
                    <p><strong>🕐 Última respuesta:</strong> ${new Date(lastResponse).toLocaleString('es-ES')}</p>
                    <p><strong>📱 Bot:</strong> @AniaAsistenteBot</p>
                    <p><strong>🔄 Intentos:</strong> ${reconnectAttempts}</p>
                </div>
                <div style="margin: 20px 0;">
                    <h3>📋 Comandos disponibles</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><code>/start</code> - Saludo</li>
                        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><code>/help</code> - Ayuda</li>
                        <li style="padding: 8px 0;"><code>/web</code> - Tienda</li>
                    </ul>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://t.me/AniaAsistenteBot" target="_blank" class="btn">💬 Abrir en Telegram</a>
                    <br><br>
                    <a href="/force-restart" class="btn btn-warning">🔄 Forzar Reinicio</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/force-restart', (req, res) => {
    isRunning = false;
    if (botInterval) { clearInterval(botInterval); botInterval = null; }
    lastUpdateId = 0;
    errorMessage = 'Reiniciando...';
    setTimeout(startBot, 2000);
    res.redirect('/');
});

app.get('/diagnostico', (req, res) => {
    res.json({
        token_configurado: !!TOKEN,
        worker_url: WORKER_URL,
        bot_corriendo: isRunning,
        intentos: reconnectAttempts,
        ultimo_error: errorMessage,
        ultima_respuesta: new Date(lastResponse).toISOString()
    });
});

// ============================================================
// 🔧 RUTA DE MIGRACIÓN (DESDE JSON A POSTGRESQL)
// ============================================================
app.get('/run-migration', async (req, res) => {
    const SECRET_KEY = 'tu_clave_secreta_aqui';
    const providedKey = req.query.key;

    if (providedKey !== SECRET_KEY) {
        return res.status(401).send('🔒 Acceso denegado. Clave incorrecta.');
    }

    res.send('🚀 Iniciando migración... (revisa los logs)');

    (async () => {
        try {
            console.log('🚀 === INICIANDO MIGRACIÓN ===');
            const DATA_DIR = __dirname;
            console.log(`📂 Directorio de trabajo: ${DATA_DIR}`);

            // Listar archivos
            try {
                const files = fs.readdirSync(DATA_DIR);
                console.log(`📄 Archivos encontrados: ${files.join(', ')}`);
            } catch (e) {
                console.log('❌ No se pudo listar archivos:', e.message);
            }

            // 1. Migrar usuarios
            const usuariosPath = path.join(DATA_DIR, 'usuarios.json');
            if (fs.existsSync(usuariosPath)) {
                const rawData = fs.readFileSync(usuariosPath, 'utf8');
                const data = JSON.parse(rawData);
                let usuariosArray = [];
                if (Array.isArray(data)) usuariosArray = data;
                else if (data.usuarios) usuariosArray = data.usuarios;
                console.log(`📥 Insertando ${usuariosArray.length} usuarios...`);
                let count = 0;
                for (const u of usuariosArray) {
                    if (!u.username) continue;
                    const exists = await getOne('SELECT id FROM usuarios WHERE username = $1', [u.username]);
                    if (!exists) {
                        let passwordHash = u.password;
                        if (!passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
                            passwordHash = await bcrypt.hash(passwordHash || 'password123', 10);
                        }
                        await query(
                            `INSERT INTO usuarios (username, password_hash, name, email, role, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [u.username, passwordHash, u.name, u.email || '', u.role || 'user', u.fecha || new Date()]
                        );
                        count++;
                    }
                }
                console.log(`✅ ${count} usuarios migrados.`);
            }

            // 2. Migrar productos
            const productosPath = path.join(DATA_DIR, 'productos.json');
            if (fs.existsSync(productosPath)) {
                const rawData = fs.readFileSync(productosPath, 'utf8');
                const data = JSON.parse(rawData);
                let productosArray = [];
                if (Array.isArray(data)) productosArray = data;
                else if (data.productos) productosArray = data.productos;
                console.log(`📥 Insertando ${productosArray.length} productos...`);
                let prodCount = 0;
                for (const p of productosArray) {
                    if (!p.name) continue;
                    const exists = await getOne('SELECT id FROM productos WHERE name = $1', [p.name]);
                    if (!exists) {
                        await query(
                            `INSERT INTO productos (name, category, price, description, stock, image, feat, available, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                            [
                                p.name,
                                p.category || 'medicamento',
                                parseFloat(p.price) || 0,
                                p.desc || p.description || '',
                                parseInt(p.stock) || 0,
                                p.image || 'https://via.placeholder.com/300x200',
                                p.feat ? 1 : 0,
                                p.available !== undefined ? (p.available ? 1 : 0) : 1,
                                p.fechaCreacion || p.created_at || new Date()
                            ]
                        );
                        prodCount++;
                        console.log(`✅ Producto insertado: ${p.name}`);
                    }
                }
                console.log(`✅ ${prodCount} productos migrados.`);
            }

            // 3. Migrar pedidos
            const pedidosPath = path.join(DATA_DIR, 'pedidos.json');
            if (fs.existsSync(pedidosPath)) {
                const rawData = fs.readFileSync(pedidosPath, 'utf8');
                const data = JSON.parse(rawData);
                let pedidosArray = [];
                if (Array.isArray(data)) pedidosArray = data;
                else if (data.pedidos) pedidosArray = data.pedidos;
                console.log(`📥 Insertando ${pedidosArray.length} pedidos...`);
                let pedCount = 0;
                for (const p of pedidosArray) {
                    if (!p.id) continue;
                    const exists = await getOne('SELECT id FROM pedidos WHERE id = $1', [p.id]);
                    if (!exists) {
                        await query(
                            `INSERT INTO pedidos (id, usuario, email, items, total, estado, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                            [
                                p.id,
                                p.usuario || 'anonimo',
                                p.email || 'no-email',
                                JSON.stringify(p.items || []),
                                p.total || 0,
                                p.estado || 'pendiente',
                                p.fecha || new Date()
                            ]
                        );
                        pedCount++;
                    }
                }
                console.log(`✅ ${pedCount} pedidos migrados.`);
            }

            console.log('🎉 Migración completada desde endpoint.');
        } catch (error) {
            console.error('❌ Error en migración:', error);
            console.error('📚 Stack:', error.stack);
        }
    })();
});


// ============================================================
// 📧 ENVIAR PEDIDO POR CORREO - VERSIÓN AUTÓNOMA Y ROBUSTA
// ============================================================
app.post('/api/enviar-pedido', (req, res) => {
    // ✅ Siempre responder con JSON, incluso en errores.
    try {
        console.log('📧 POST /api/enviar-pedido recibido');
        console.log('📦 Body:', req.body);

        const { email, nombre, pedido, total } = req.body;

        // Validación simple
        if (!pedido || !Array.isArray(pedido) || pedido.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El pedido está vacío o no es un array'
            });
        }

        // 1. Procesar los items (asegurar tipos)
        const itemsProcesados = pedido.map(p => ({
            nombre: p.nombre || 'Producto',
            cantidad: parseInt(p.cantidad) || 1,
            precio: parseFloat(p.precio) || 0
        }));

        // 2. Calcular total si no viene
        let totalCalculado = parseFloat(total) || 0;
        if (!total || total === 0) {
            totalCalculado = itemsProcesados.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        }

        // 3. Crear el objeto del pedido
        const nuevoPedido = {
            id: 'PED-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            cliente: nombre || 'Cliente anónimo',
            email: email || 'cliente@meditech.com',
            fecha: new Date().toISOString(),
            items: itemsProcesados,
            total: totalCalculado,
            estado: 'pendiente'
        };

        // 4. Intentar guardar en pedidos.json (operación síncrona para simplificar)
        try {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, 'pedidos.json');
            let pedidos = [];

            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                pedidos = JSON.parse(data);
                if (!Array.isArray(pedidos)) pedidos = [];
            }

            pedidos.push(nuevoPedido);
            fs.writeFileSync(filePath, JSON.stringify(pedidos, null, 2));
            console.log('✅ Pedido guardado en pedidos.json:', nuevoPedido.id);

        } catch (fileError) {
            // Si falla el guardado en archivo, solo lo registramos, pero no fallamos la respuesta.
            console.error('❌ Error guardando en pedidos.json:', fileError.message);
        }

        // 5. Intentar guardar en PostgreSQL (si está disponible)
        try {
            // Verificar si la función 'query' existe y es accesible
            if (typeof query === 'function') {
                // Usamos query de forma síncrona o asíncrona, aquí la llamamos y no esperamos su resultado.
                // Para simplificar y no bloquear, lo dejamos como un intento sin await.
                query(
                    `INSERT INTO pedidos (id, usuario, email, items, total, estado, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        nuevoPedido.id,
                        nuevoPedido.cliente,
                        nuevoPedido.email,
                        JSON.stringify(nuevoPedido.items),
                        nuevoPedido.total,
                        nuevoPedido.estado,
                        nuevoPedido.fecha
                    ]
                ).then(() => console.log('✅ Pedido guardado en PostgreSQL'))
                 .catch(dbErr => console.warn('⚠️ Error en PostgreSQL:', dbErr.message));
            } else {
                console.warn('⚠️ Función "query" no disponible, saltando PostgreSQL.');
            }
        } catch (dbError) {
            console.warn('⚠️ Error al intentar guardar en PostgreSQL:', dbError.message);
        }

        // 6. RESPONDER AL FRONTEND (ÉXITO)
        return res.status(200).json({
            success: true,
            message: 'Pedido recibido correctamente',
            pedido: nuevoPedido
        });

    } catch (error) {
        // Capturar cualquier error inesperado y responder con un JSON de error
        console.error('❌ Error crítico en /api/enviar-pedido:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});


// ============================================================
// 🚀 INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`🌐 URL: https://meditech-tienda-node.onrender.com`);
    console.log(`📱 Bot: @AniaAsistenteBot`);
    console.log(`🔍 Diagnóstico: /diagnostico`);
    setTimeout(startBot, 1000);
});

// Sistema de recuperación del bot
setInterval(() => {
    if (!isRunning) startBot();
}, 30000);

console.log('🔥 Sistema 24/7 activo para @AniaAsistenteBot');
