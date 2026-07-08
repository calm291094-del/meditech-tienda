// server.js - Backend completo (Bot + API REST)
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors()); // Permite peticiones desde cualquier origen
app.use(express.json({ limit: '10mb' }));

// ============================================================
// CONFIGURACIÓN DEL BOT (existente)
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
// 📦 BASE DE DATOS EN MEMORIA (para pruebas)
// ============================================================
// ⚠️ IMPORTANTE: En producción usa una base de datos real (MongoDB, PostgreSQL, etc.)
let usuarios = [];
let productos = [];
let pedidos = [];

// Cargar datos desde archivos JSON si existen (opcional)
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function leerJSON(nombre) {
    try {
        const data = fs.readFileSync(path.join(DATA_DIR, nombre), 'utf8');
        return JSON.parse(data);
    } catch { return null; }
}

function escribirJSON(nombre, datos) {
    fs.writeFileSync(path.join(DATA_DIR, nombre), JSON.stringify(datos, null, 2));
}

// Cargar datos iniciales
const usuariosGuardados = leerJSON('usuarios.json');
if (usuariosGuardados) usuarios = usuariosGuardados;
else {
    // Usuario admin por defecto
    usuarios = [{
        username: 'root',
        password: 'Root*4815162342+-', // ⚠️ En producción usa bcrypt
        name: 'Administrador',
        email: 'admin@meditech.com',
        role: 'admin',
        fecha: new Date().toISOString()
    }];
    escribirJSON('usuarios.json', usuarios);
}

const productosGuardados = leerJSON('productos.json');
if (productosGuardados) productos = productosGuardados;

const pedidosGuardados = leerJSON('pedidos.json');
if (pedidosGuardados) pedidos = pedidosGuardados;

// ============================================================
// 🌐 RUTAS DE LA API (LO QUE LE FALTA A TU INDEX.HTML)
// ============================================================

// ---- Health Check ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Productos ----
app.get('/api/productos', (req, res) => {
    res.json(productos);
});

app.post('/api/productos', (req, res) => {
    const { name, category, price, desc, stock, image, feat, available } = req.body;
    const nuevo = {
        id: 'p' + Date.now(),
        name,
        category: category || 'medicamento',
        price: parseFloat(price),
        desc: desc || '',
        stock: parseInt(stock) || 0,
        image: image || 'https://via.placeholder.com/300x200',
        feat: feat || false,
        available: available !== undefined ? available : true
    };
    productos.push(nuevo);
    escribirJSON('productos.json', productos);
    res.json(nuevo);
});

app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const index = productos.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
    const { name, category, price, desc, stock, image, available, feat } = req.body;
    if (name) productos[index].name = name;
    if (category) productos[index].category = category;
    if (price !== undefined) productos[index].price = parseFloat(price);
    if (desc) productos[index].desc = desc;
    if (stock !== undefined) productos[index].stock = parseInt(stock);
    if (image) productos[index].image = image;
    if (available !== undefined) productos[index].available = available;
    if (feat !== undefined) productos[index].feat = feat;
    escribirJSON('productos.json', productos);
    res.json(productos[index]);
});

app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const index = productos.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
    productos.splice(index, 1);
    escribirJSON('productos.json', productos);
    res.json({ message: 'Producto eliminado' });
});

// ---- Usuarios ----
app.get('/api/usuarios', (req, res) => {
    // ⚠️ En producción, no devuelvas contraseñas
    const usuariosSinPass = usuarios.map(({ password, ...rest }) => rest);
    res.json(usuariosSinPass);
});

app.post('/api/register', (req, res) => {
    const { username, password, name, email } = req.body;
    if (usuarios.find(u => u.username === username)) {
        return res.status(400).json({ error: 'El usuario ya existe' });
    }
    const nuevo = {
        username,
        password, // ⚠️ En producción usa bcrypt
        name,
        email,
        role: 'user',
        fecha: new Date().toISOString()
    };
    usuarios.push(nuevo);
    escribirJSON('usuarios.json', usuarios);
    // ⚠️ En producción no devuelvas la contraseña
    const { password: _, ...usuarioSinPass } = nuevo;
    res.json({ 
        message: 'Usuario creado',
        usuario: usuarioSinPass,
        token: 'fake-jwt-token' // ⚠️ En producción genera un JWT real
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = usuarios.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    const { password: _, ...usuarioSinPass } = user;
    res.json({
        token: 'fake-jwt-token', // ⚠️ En producción genera un JWT real
        usuario: usuarioSinPass
    });
});

// ---- Pedidos ----
app.post('/api/pedidos', (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío' });
    }
    // Validar stock
    let total = 0;
    const itemsValidados = [];
    for (const item of items) {
        const prod = productos.find(p => p.id === item.id);
        if (!prod) return res.status(404).json({ error: `Producto ${item.id} no encontrado` });
        if (!prod.available || prod.stock < item.cantidad) {
            return res.status(400).json({ error: `Stock insuficiente para ${prod.name}` });
        }
        const subtotal = prod.price * item.cantidad;
        total += subtotal;
        itemsValidados.push({
            id: prod.id,
            nombre: prod.name,
            cantidad: item.cantidad,
            precio: prod.price,
            subtotal
        });
        // Descontar stock
        prod.stock -= item.cantidad;
        if (prod.stock === 0) prod.available = false;
    }
    const pedido = {
        id: 'PED-' + Date.now(),
        usuario: req.body.usuario || 'anonimo',
        fecha: new Date().toISOString(),
        items: itemsValidados,
        total,
        estado: 'pendiente'
    };
    pedidos.push(pedido);
    escribirJSON('pedidos.json', pedidos);
    escribirJSON('productos.json', productos);
    res.json({ message: 'Pedido creado', pedido });
});

app.get('/api/pedidos', (req, res) => {
    res.json(pedidos);
});

// ---- Configuración (opcional) ----
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
// 🤖 FUNCIONES DEL BOT (existentes)
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
// 🌐 RUTAS WEB (existentes)
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
        ultima_respuesta: new Date(lastResponse).toISOString(),
        usuarios: usuarios.length,
        productos: productos.length,
        pedidos: pedidos.length
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
