// server.js - Backend completo con PostgreSQL + bcrypt + JWT
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors({
    origin: '*', // En producción, especifica tu dominio
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
// IMPORTAR BASE DE DATOS
// ============================================================
const { query, getOne, getAll, initTables } = require('./db');

// Inicializar tablas al iniciar
initTables().catch(console.error);

// ============================================================
// CONFIGURACIÓN DEL BOT
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
// 📝 FUNCIONES DE TOKENS
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
        // Verificar si el usuario ya existe
        const exists = await getOne('SELECT id FROM usuarios WHERE username = $1', [username]);
        if (exists) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Hashear contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear usuario
        const result = await query(
            `INSERT INTO usuarios (username, password_hash, name, email, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, name, email, role, created_at`,
            [username, hashedPassword, name, email, 'user']
        );

        const newUser = result.rows[0];

        // Generar token
        const token = generarToken(newUser);
        const refreshToken = generarRefreshToken(newUser);

        // Guardar refresh token en la base de datos
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

        // Actualizar refresh token en la base de datos
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
        // Verificar refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        
        // Buscar usuario con ese refresh token
        const user = await getOne(
            'SELECT * FROM usuarios WHERE id = $1 AND refresh_token = $2',
            [decoded.id, refreshToken]
        );

        if (!user) {
            return res.status(401).json({ error: 'Refresh token inválido' });
        }

        // Generar nuevos tokens
        const newToken = generarToken(user);
        const newRefreshToken = generarRefreshToken(user);

        // Actualizar refresh token en la base de datos
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

        // Invalidar token
        await query(
            'INSERT INTO tokens_invalidados (token, usuario) VALUES ($1, $2)',
            [token, req.user.username]
        );

        // Limpiar refresh token del usuario
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
        // Verificar que no sea root
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

        // Validar stock y calcular total
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
            // Descontar stock
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
        // Parsear items JSON
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

// ---- CONFIGURACIÓN ----
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
// 🤖 FUNCIONES DEL BOT
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

async function getAniaResponse(userMessage) {
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'Eres Ania, asistente de MediTech. Alegre, entusiasta, hablas español con emojis.' },
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
    } catch (e) {}
    const lower = userMessage.toLowerCase();
    if (lower.includes('hola')) return "¡Hola! ☕️ Soy Ania, tu asistente de MediTech. ¿En qué puedo ayudarte hoy? ✨";
    if (lower.includes('precio')) return "💰 Precios en: https://calm291094-del.github.io/meditech-tienda/ 😊";
    if (lower.includes('gracias')) return "¡De nada! ☕️ ¿Necesitas algo más? ✨";
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
// 🚀 INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`🌐 URL: https://meditech-tienda-node.onrender.com`);
    console.log(`📱 Bot: @AniaAsistenteBot`);
    console.log(`🔍 Diagnóstico: /diagnostico`);
    setTimeout(startBot, 1000);
});

// Sistema de recuperación
setInterval(() => {
    if (!isRunning) startBot();
}, 30000);

console.log('🔥 Sistema 24/7 activo para @AniaAsistenteBot');





// ============================================================
// 🔧 RUTA DE MIGRACIÓN (SOLO PARA USO ÚNICO)
// ============================================================
app.get('/run-migration', async (req, res) => {
    // ⚠️ CLAVE SECRETA: Cambia 'tu_clave_secreta_aqui' por una clave que solo tú sepas
    const SECRET_KEY = 'tu_clave_secreta_aqui';
    const providedKey = req.query.key;

    if (providedKey !== SECRET_KEY) {
        return res.status(401).send('🔒 Acceso denegado. Clave incorrecta.');
    }

    try {
        res.send('🚀 Iniciando migración... (revisa los logs)');
        console.log('🚀 Ejecutando migración desde endpoint...');

        // Inicializar tablas
        await initTables();

        const DATA_DIR = path.join(__dirname, 'data');
        let totalMigrados = 0;

        // 1. Migrar usuarios
        const usuariosPath = path.join(DATA_DIR, 'usuarios.json');
        if (fs.existsSync(usuariosPath)) {
            const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
            console.log(`📥 Insertando ${usuarios.length} usuarios...`);
            for (const u of usuarios) {
                // ... (código de migración de usuarios que te di en migrate.js)
                // Cópialo aquí desde el archivo migrate.js
            }
            console.log('✅ Usuarios migrados.');
        }

        // 2. Migrar productos (copia el código de migrate.js)
        // 3. Migrar pedidos (copia el código de migrate.js)

        console.log('🎉 Migración completada desde endpoint.');
    } catch (error) {
        console.error('❌ Error en migración:', error);
        res.status(500).send('❌ Error en la migración: ' + error.message);
    }
});
