// server.js - Backend con JSON (sin PostgreSQL)
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
// MIDDLEWARES (CORS)
// ============================================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
// FUNCIONES PARA ARCHIVOS JSON
// ============================================================
function leerJSON(nombre) {
    try {
        const data = fs.readFileSync(path.join(__dirname, nombre), 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.log(`📄 Archivo ${nombre} no encontrado, creando...`);
        return null;
    }
}

function escribirJSON(nombre, datos) {
    try {
        fs.writeFileSync(path.join(__dirname, nombre), JSON.stringify(datos, null, 2));
        console.log(`✅ ${nombre} guardado correctamente.`);
    } catch (e) {
        console.error(`❌ Error guardando ${nombre}:`, e.message);
    }
}

// ============================================================
// CONFIGURACIÓN DEL BOT DE TELEGRAM (SIMPLIFICADA)
// ============================================================
const TOKEN = process.env.TELEGRAM_TOKEN;
let isRunning = false;
let lastUpdateId = 0;
let lastResponse = Date.now();
let reconnectAttempts = 0;
let errorMessage = '';
let botInterval = null;

console.log('🔧 CONFIGURACIÓN:');
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
        const usuarios = leerJSON('usuarios.json') || [];
        const exists = usuarios.find(u => u.username === username);
        if (exists) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            id: Date.now(),
            username,
            password_hash: hashedPassword,
            name,
            email,
            role: 'user',
            created_at: new Date().toISOString()
        };

        usuarios.push(newUser);
        escribirJSON('usuarios.json', usuarios);

        const token = generarToken(newUser);

        res.status(201).json({
            message: 'Usuario creado correctamente',
            usuario: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            token
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
        const usuarios = leerJSON('usuarios.json') || [];
        const user = usuarios.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = generarToken(user);
        const { password_hash, ...usuarioSinPass } = user;

        res.json({
            message: 'Login exitoso',
            usuario: usuarioSinPass,
            token
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ---- USUARIOS (solo admin) ----
app.get('/api/usuarios', authenticateToken, esAdmin, async (req, res) => {
    try {
        const usuarios = leerJSON('usuarios.json') || [];
        const usuariosSinPass = usuarios.map(({ password_hash, ...rest }) => rest);
        res.json(usuariosSinPass);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// ---- PRODUCTOS ----
app.get('/api/productos', async (req, res) => {
    try {
        const productos = leerJSON('productos.json') || [];
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
        const productos = leerJSON('productos.json') || [];
        const newProduct = {
            id: Date.now(),
            name,
            category: category || 'medicamento',
            price: parseFloat(price),
            description: description || '',
            stock: parseInt(stock) || 0,
            image: image || 'https://via.placeholder.com/300x200',
            feat: feat ? 1 : 0,
            available: available !== undefined ? (available ? 1 : 0) : 1,
            created_by: req.user.username,
            created_at: new Date().toISOString()
        };
        productos.push(newProduct);
        escribirJSON('productos.json', productos);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

app.put('/api/productos/:id', authenticateToken, esAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, category, price, description, stock, image, available, feat } = req.body;

    try {
        const productos = leerJSON('productos.json') || [];
        const index = productos.findIndex(p => p.id == id);
        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        productos[index] = {
            ...productos[index],
            name: name || productos[index].name,
            category: category || productos[index].category,
            price: parseFloat(price) || productos[index].price,
            description: description || productos[index].description,
            stock: parseInt(stock) || productos[index].stock,
            image: image || productos[index].image,
            available: available !== undefined ? (available ? 1 : 0) : productos[index].available,
            feat: feat !== undefined ? (feat ? 1 : 0) : productos[index].feat,
            updated_at: new Date().toISOString()
        };
        escribirJSON('productos.json', productos);
        res.json(productos[index]);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

app.delete('/api/productos/:id', authenticateToken, esAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const productos = leerJSON('productos.json') || [];
        const index = productos.findIndex(p => p.id == id);
        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        productos.splice(index, 1);
        escribirJSON('productos.json', productos);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// ---- PEDIDOS ----
app.get('/api/pedidos', authenticateToken, esAdmin, async (req, res) => {
    try {
        const pedidos = leerJSON('pedidos.json') || [];
        res.json(pedidos);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// ============================================================
// 📧 ENVIAR PEDIDO POR CORREO (VERSIÓN SIMPLIFICADA)
// ============================================================
app.post('/api/enviar-pedido', (req, res) => {
    console.log('📧 POST /api/enviar-pedido recibido');
    console.log('📦 Body:', req.body);
    
    // Siempre responder con JSON, incluso en error
    try {
        const { email, nombre, pedido, total } = req.body;
        
        // Validación simple
        if (!pedido || !Array.isArray(pedido) || pedido.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'El pedido está vacío' 
            });
        }
        
        // Procesar items
        const itemsProcesados = pedido.map(p => ({
            nombre: p.nombre || 'Producto',
            cantidad: parseInt(p.cantidad) || 1,
            precio: parseFloat(p.precio) || 0
        }));
        
        // Crear pedido
        const nuevoPedido = {
            id: 'PED-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            cliente: nombre || 'Cliente',
            email: email || 'cliente@meditech.com',
            fecha: new Date().toISOString(),
            items: itemsProcesados,
            total: parseFloat(total) || itemsProcesados.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
            estado: 'pendiente'
        };
        
        // Guardar en pedidos.json
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
            console.log('✅ Pedido guardado:', nuevoPedido.id);
        } catch (fileError) {
            console.error('❌ Error guardando archivo:', fileError.message);
        }
        
        // Responder con éxito
        return res.status(200).json({
            success: true,
            message: 'Pedido recibido correctamente',
            pedido: nuevoPedido
        });
        
    } catch (error) {
        console.error('❌ Error crítico:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ============================================================
// 🔑 TOKEN DE GITHUB - RUTA PÚBLICA
// ============================================================
app.get('/api/config/github-token-public', (req, res) => {
    try {
        // Leer token desde archivo o usar el de localStorage
        const token = process.env.GITHUB_TOKEN || '';
        res.json({ token: token });
    } catch (error) {
        console.error('Error al obtener token público:', error);
        res.status(500).json({ error: 'Error al obtener token' });
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
// 🚀 INICIAR SERVIDOR
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`🌐 URL: https://meditech-bot.onrender.com`);
});

console.log('🔥 Sistema 24/7 activo');
