// server.js — Backend MediTech (Express + almacenamiento JSON)
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
// 👇 Si montas un disco persistente en Render, define DATA_DIR=/data
const DATA_DIR = process.env.DATA_DIR || __dirname;
const TIENDA_URL = process.env.TIENDA_URL || 'https://meditech-bot.onrender.com';

if (JWT_SECRET === 'fallback_secret_change_me') {
  console.warn('⚠️ JWT_SECRET sin definir. Configúralo en Render.');
}

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-state-key']
}));
app.use(express.json({ limit: '10mb' }));

// ---- Rate limit simple (sin dependencias) ----
const buckets = new Map();
function rateLimit(ventanaMs, max) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'desconocida';
    const ahora = Date.now();
    let b = buckets.get(ip);
    if (!b || ahora > b.reset) { b = { count: 0, reset: ahora + ventanaMs }; buckets.set(ip, b); }
    if (++b.count > max) return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un momento.' });
    next();
  };
}
app.use('/api/', rateLimit(60 * 1000, 120));
setInterval(() => {
  const a = Date.now();
  for (const [k, b] of buckets) if (a > b.reset) buckets.delete(k);
}, 5 * 60 * 1000).unref();

// ============================================================
// ARCHIVOS JSON con persistencia en GitHub
// ============================================================
const rutaJSON = (nombre) => path.join(DATA_DIR, nombre);

const GITHUB_USER = process.env.GITHUB_USER || 'calm291094-del';
const GITHUB_REPO = process.env.GITHUB_REPO || 'meditech-tienda';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GH_BRANCH = process.env.GITHUB_BRANCH || 'main';

// --- Leer desde disco (rápido) ---
function leerArrayJSON(nombre) {
  try {
    const parsed = JSON.parse(fs.readFileSync(rutaJSON(nombre), 'utf8'));
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      const clave = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (clave) return parsed[clave];
    }
    return [];
  } catch {
    return [];
  }
}

// --- Descargar un JSON desde GitHub (al arrancar) ---
async function descargarJSONDeGitHub(nombre) {
  if (!GITHUB_TOKEN) return false;
  try {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${nombre}?ref=${GH_BRANCH}`;
    const r = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'MediTech-Backend'
      }
    });
    if (!r.ok) {
      console.log(`ℹ️  ${nombre} no existe aún en GitHub (HTTP ${r.status})`);
      return false;
    }
    const data = await r.json();
    const contenido = Buffer.from(data.content, 'base64').toString('utf8');
    fs.writeFileSync(rutaJSON(nombre), contenido);
    console.log(`⬇️  ${nombre} descargado de GitHub`);
    return true;
  } catch (e) {
    console.error(`❌ Error descargando ${nombre}:`, e.message);
    return false;
  }
}

// --- Subir un JSON a GitHub (tras cada escritura) ---
async function subirJSONAGitHub(nombre, contenido, mensaje) {
  if (!GITHUB_TOKEN) return false;
  try {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${nombre}`;

    // 1. Obtener el SHA actual (necesario para actualizar)
    let sha = null;
    const getR = await fetch(`${url}?ref=${GH_BRANCH}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'MediTech-Backend'
      }
    });
    if (getR.ok) {
      const d = await getR.json();
      sha = d.sha;
    }

    // 2. Commit
    const body = {
      message: mensaje || `🔄 update ${nombre}`,
      content: Buffer.from(contenido).toString('base64'),
      branch: GH_BRANCH,
      ...(sha ? { sha } : {})
    };

    const putR = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'MediTech-Backend'
      },
      body: JSON.stringify(body)
    });

    if (putR.ok) {
      console.log(`⬆️  ${nombre} subido a GitHub`);
      return true;
    } else {
      const err = await putR.text();
      console.error(`❌ Error subiendo ${nombre}:`, err);
      return false;
    }
  } catch (e) {
    console.error(`❌ Error subiendo ${nombre}:`, e.message);
    return false;
  }
}

// --- Escribir en disco Y en GitHub ---
function escribirJSON(nombre, datos) {
  const final = rutaJSON(nombre);
  const tmp = final + '.tmp';
  const contenido = JSON.stringify(datos, null, 2);

  try {
    fs.writeFileSync(tmp, contenido);
    fs.renameSync(tmp, final);
    console.log(`✅ ${nombre} guardado en disco`);
  } catch (e) {
    console.error(`❌ Error guardando ${nombre}:`, e.message);
    return;
  }

  // Subir a GitHub en background (no bloquea la respuesta)
  subirJSONAGitHub(nombre, contenido, `🔄 update ${nombre}`).catch(() => {});
}

// --- Inicialización con descarga desde GitHub ---
async function inicializarArchivos() {
  const archivos = ['usuarios.json', 'productos.json', 'pedidos.json', 'ania_tasks.json'];
  for (const f of archivos) {
    // Si existe en GitHub, se trae (y sobreescribe el local efímero)
    const bajado = await descargarJSONDeGitHub(f);
    // Si no existe ni en disco ni en GitHub, se crea vacío
    if (!bajado && !fs.existsSync(rutaJSON(f))) {
      escribirJSON(f, []);
    }
  }
}

// ============================================================
// AUTENTICACIÓN JWT
// ============================================================
function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, username: usuario.username, role: usuario.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

const authenticateToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

const esAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Se requiere rol de administrador.' });
  next();
};

// Clave compartida para que el bot (GitHub Actions) guarde su estado
const STATE_KEY = process.env.TELEGRAM_STATE_KEY || '';
const authState = (req, res, next) => {
  if (!STATE_KEY || req.headers['x-state-key'] !== STATE_KEY) {
    return res.status(403).json({ error: 'Clave de estado inválida' });
  }
  next();
};

// ============================================================
// 📰 MOTOR DE NOTICIAS (RSS en el servidor → sin CORS ni 403)
// ============================================================
const FUENTES_NOTICIAS = {
  latam: [
    { fuente: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml' },
    { fuente: 'Cubadebate', url: 'https://www.cubadebate.cu/rss/' },
    { fuente: 'RT en Español', url: 'https://actualidad.rt.com/actualidad.rss' }
  ],
  tech: [
    { fuente: 'Hipertextual', url: 'https://hipertextual.com/feed' },
    { fuente: "WWWhat's new", url: 'https://wwwhatsnew.com/feed/' },
    { fuente: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' }
  ],
  tendencias: [
    { fuente: 'Google News', url: 'https://news.google.com/rss?hl=es-419&gl=US&ceid=US:es-419' }
  ]
};

function limpiarXML(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsearFeed(xml, limite = 6) {
  const items = [];
  const esRSS = /<item[\s>]/i.test(xml);
  const regex = esRSS ? /<item\b[^>]*>([\s\S]*?)<\/item>/gi : /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = regex.exec(xml)) && items.length < limite) {
    const b = m[1];
    const titulo = limpiarXML((b.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    let link = ((b.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || '').trim();
    if (!link || link.startsWith('<')) link = (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || '';
    const fecha = (b.match(/<(pubDate|published|updated)>([\s\S]*?)<\/\1>/i) || [])[2] || '';
    if (titulo) items.push({ titulo, link: limpiarXML(link), fecha: fecha.trim() });
  }
  return items;
}

async function fetchFeed(fuente) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(fuente.url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MediTech-Ania/13.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} en ${fuente.fuente}`);
    return parsearFeed(await r.text(), 6).map(i => ({ ...i, fuente: fuente.fuente }));
  } finally {
    clearTimeout(timer);
  }
}

let cacheNoticias = { data: null, ts: 0 };
const CACHE_NOTICIAS_MS = 10 * 60 * 1000;

async function obtenerNoticias() {
  const ahora = Date.now();
  if (cacheNoticias.data && ahora - cacheNoticias.ts < CACHE_NOTICIAS_MS) return cacheNoticias.data;

  const resultado = { ok: true, actualizado: new Date().toISOString(), noticias: {} };
  for (const [cat, fuentes] of Object.entries(FUENTES_NOTICIAS)) {
    const settles = await Promise.allSettled(fuentes.map(f => fetchFeed(f)));
    const items = settles.flatMap(s => (s.status === 'fulfilled' ? s.value : []));
    const vistos = new Set();
    resultado.noticias[cat] = items.filter(i => {
      const k = i.titulo.toLowerCase();
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    }).slice(0, 8);
  }
  cacheNoticias = { data: resultado, ts: ahora };
  return resultado;
}

const escTG = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ============================================================
// 🌐 RUTAS
// ============================================================
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ---- REGISTRO ----
app.post('/api/register', async (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'Nombre, usuario y contraseña son obligatorios' });
  try {
    const usuarios = leerArrayJSON('usuarios.json');
    if (usuarios.find(u => u.username === username)) return res.status(400).json({ error: 'El usuario ya existe' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(), username, password_hash: hashedPassword, name, email,
      role: 'user', created_at: new Date().toISOString()
    };
    usuarios.push(newUser);
    escribirJSON('usuarios.json', usuarios);
    
    const accessToken = generarToken(newUser);
    const refreshToken = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      message: 'Usuario creado correctamente',
      usuario: { id: newUser.id, username, name, email, role: 'user' },
      token: accessToken,
      refreshToken
    });
    
  } catch (e) {
    console.error('Error en registro:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ---- LOGIN ----
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Datos incompletos' });
    const usuarios = leerArrayJSON('usuarios.json');
    const user = usuarios.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    let validPassword = false;
    if (user.password_hash) validPassword = await bcrypt.compare(password, user.password_hash);
    else if (user.password) validPassword = (password === user.password); // legado
    if (!validPassword) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const usuarioSinPass = { ...user };
    delete usuarioSinPass.password_hash;
    delete usuarioSinPass.password;

    const accessToken = generarToken(user);
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ 
      message: 'Login exitoso', 
      usuario: usuarioSinPass, 
      token: accessToken,
      refreshToken
    });
    
  } catch (e) {
    console.error('🔥 ERROR EN LOGIN:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ---- REFRESH TOKEN ----
app.post('/api/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ error: 'Falta refreshToken' });
  }
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const usuarios = leerArrayJSON('usuarios.json');
    const user = usuarios.find(u => u.id === payload.id || u.username === payload.username);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const nuevoAccess = generarToken(user);
    const nuevoRefresh = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: nuevoAccess, refreshToken: nuevoRefresh });
  } catch (e) {
    return res.status(403).json({ error: 'Refresh token inválido o expirado' });
  }
});

// ---- USUARIOS (admin) ----
app.get('/api/usuarios', authenticateToken, esAdmin, (req, res) => {
  const usuarios = leerArrayJSON('usuarios.json').map(({ password_hash, password, ...rest }) => rest);
  res.json(usuarios);
});

// ---- PRODUCTOS ----
app.get('/api/productos', (req, res) => res.json(leerArrayJSON('productos.json')));

app.post('/api/productos', authenticateToken, esAdmin, (req, res) => {
  const { name, category, price, description, stock, image, feat, available } = req.body;
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
  }
  const productos = leerArrayJSON('productos.json');
  const newProduct = {
    id: Date.now(), name,
    category: category || 'medicamento',
    price: parseFloat(price),
    description: description || '',
    desc: description || '',
    stock: parseInt(stock) || 0,
    image: image || 'https://via.placeholder.com/300x200',
    feat: !!feat,
    available: available !== undefined ? !!available : true,
    created_by: req.user.username,
    created_at: new Date().toISOString()
  };
  productos.push(newProduct);
  escribirJSON('productos.json', productos);
  res.status(201).json(newProduct);
});

app.put('/api/productos/:id', authenticateToken, esAdmin, (req, res) => {
  const { id } = req.params;
  const { name, category, price, desc, description, stock, image, available, feat } = req.body;
  const productos = leerArrayJSON('productos.json');
  const index = productos.findIndex(p => p.id == id);
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const p = productos[index];
  const nuevaDesc = desc !== undefined ? desc : (description !== undefined ? description : (p.description || p.desc || ''));
  productos[index] = {
    ...p,
    name: name !== undefined ? name : p.name,
    category: category !== undefined ? category : p.category,
    price: price !== undefined && price !== '' ? parseFloat(price) : p.price,
    description: nuevaDesc, // ✅ ambos campos sincronizados → la IA ve la descripción
    desc: nuevaDesc,
    stock: stock !== undefined && stock !== '' ? parseInt(stock) : p.stock,
    image: image !== undefined ? image : p.image,
    available: available !== undefined ? (available === true || available === 'true' || available === 1 || available === '1') : p.available,
    feat: feat !== undefined ? (feat === true || feat === 'true' || feat === 1 || feat === '1') : p.feat,
    updated_at: new Date().toISOString()
  };
  escribirJSON('productos.json', productos);
  res.json(productos[index]);
});

app.delete('/api/productos/:id', authenticateToken, esAdmin, (req, res) => {
  const productos = leerArrayJSON('productos.json');
  const index = productos.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  productos.splice(index, 1);
  escribirJSON('productos.json', productos);
  res.json({ message: 'Producto eliminado' });
});

// ---- PEDIDOS ----
app.get('/api/pedidos', authenticateToken, esAdmin, (req, res) => res.json(leerArrayJSON('pedidos.json')));

app.put('/api/pedidos/:id', authenticateToken, esAdmin, (req, res) => {
  const pedidos = leerArrayJSON('pedidos.json');
  const index = pedidos.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Pedido no encontrado' });

  const pedido = pedidos[index];
  const estadoAnterior = pedido.estado;
  const nuevoEstado = req.body.estado;
  const nota = req.body.nota || '';

  // Registrar en historial si cambió el estado
  if (nuevoEstado && nuevoEstado !== estadoAnterior) {
    pedido.historial = pedido.historial || [];
    pedido.historial.push({
      estado: nuevoEstado,
      anterior: estadoAnterior,
      fecha: new Date().toISOString(),
      por: req.user.username,
      nota
    });
  }

  pedidos[index] = {
    ...pedido,
    ...req.body,
    actualizado: new Date().toISOString()
  };

  escribirJSON('pedidos.json', pedidos);
  res.json(pedidos[index]);
});

async function notificarTelegram(pedido) {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) return;

  const itemsTexto = pedido.items
    .map(i => `• ${i.nombre} x${i.cantidad} — $${i.subtotal}`)
    .join('\n');

  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const mensaje =
    `🛒 <b>NUEVO PEDIDO</b>\n\n` +
    `🆔 <code>${esc(pedido.id)}</code>\n` +
    `👤 ${esc(pedido.cliente)}\n` +
    `📧 ${esc(pedido.email)}\n` +
    (pedido.telefono ? `📞 ${esc(pedido.telefono)}\n` : '') +
    (pedido.direccion ? `📍 ${esc(pedido.direccion)}\n` : '') +
    `\n<b>Productos:</b>\n${esc(itemsTexto)}\n\n` +
    `💰 <b>Total: $${pedido.total}</b>\n` +
    (pedido.notas ? `\n📝 ${esc(pedido.notas)}` : '');

  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Error notificando Telegram:', e.message);
  }
}

app.post('/api/enviar-pedido', async (req, res) => {
  try {
    const { email, nombre, telefono, direccion, notas, pedido } = req.body;

    // ---- Validaciones básicas ----
    if (!pedido || !Array.isArray(pedido) || pedido.length === 0) {
      return res.status(400).json({ success: false, error: 'El pedido está vacío' });
    }
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Nombre inválido' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }
    if (pedido.length > 50) {
      return res.status(400).json({ success: false, error: 'Demasiados items en el pedido' });
    }

    // ---- Cargar productos REALES del backend ----
    const productos = leerArrayJSON('productos.json');
    const itemsValidados = [];
    let totalReal = 0;

    for (const item of pedido) {
      const idPedido = item.id || item.producto_id;
      const cantidad = parseInt(item.cantidad);

      if (!idPedido || isNaN(cantidad) || cantidad < 1) {
        return res.status(400).json({ 
          success: false, 
          error: `Item inválido: ${item.nombre || 'sin nombre'}` 
        });
      }

      // 🔒 Buscar producto REAL en el backend
      const productoReal = productos.find(p => String(p.id) === String(idPedido));
      if (!productoReal) {
        return res.status(400).json({ 
          success: false, 
          error: `Producto no encontrado: ${item.nombre || idPedido}` 
        });
      }

      // 🔒 Validar disponibilidad
      if (productoReal.available === false || productoReal.stock <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: `El producto "${productoReal.name}" está agotado` 
        });
      }

      // 🔒 Validar stock suficiente
      if (cantidad > productoReal.stock) {
        return res.status(400).json({ 
          success: false, 
          error: `Solo hay ${productoReal.stock} unidades de "${productoReal.name}"` 
        });
      }

      // 🔒 Precio REAL del servidor (ignora el que mande el cliente)
      const precioReal = parseFloat(productoReal.price) || 0;
      const subtotalReal = precioReal * cantidad;
      totalReal += subtotalReal;

      itemsValidados.push({
        id: productoReal.id,
        nombre: productoReal.name,
        categoria: productoReal.category,
        precio: precioReal,
        cantidad,
        subtotal: subtotalReal
      });
    }

    // ---- Crear pedido validado ----
    const nuevoPedido = {
      id: 'PED-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      cliente: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: (telefono || '').trim(),
      direccion: (direccion || '').trim(),
      notas: (notas || '').trim(),
      fecha: new Date().toISOString(),
      items: itemsValidados,
      total: totalReal,
      estado: 'pendiente',
      historial: [
        { estado: 'pendiente', fecha: new Date().toISOString(), por: 'cliente' }
      ]
    };

    // ---- Descontar stock ----
    for (const item of itemsValidados) {
      const idx = productos.findIndex(p => String(p.id) === String(item.id));
      if (idx !== -1) {
        productos[idx].stock = Math.max(0, (productos[idx].stock || 0) - item.cantidad);
        if (productos[idx].stock === 0) {
          productos[idx].available = false;
        }
      }
    }
    escribirJSON('productos.json', productos);

    // ---- Guardar pedido ----
    const pedidos = leerArrayJSON('pedidos.json');
    pedidos.push(nuevoPedido);
    escribirJSON('pedidos.json', pedidos);

    // ---- Notificar al admin por Telegram (opcional, ver mejora #4) ----
    notificarTelegram(nuevoPedido).catch(() => {});

    res.status(200).json({ 
      success: true, 
      message: 'Pedido recibido correctamente', 
      pedido: {
        id: nuevoPedido.id,
        total: nuevoPedido.total,
        items: nuevoPedido.items.length,
        estado: nuevoPedido.estado
      }
    });

  } catch (e) {
    console.error('❌ Error en enviar-pedido:', e);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ============================================================
// 🧠 MÓDULO ANIA — Gestión de tareas y recordatorios
// ============================================================

const USUARIO_ANIA = process.env.ANIA_USER || 'admin';

function leerTareas() {
  return leerArrayJSON('ania_tasks.json');
}
function guardarTareas(t) {
  escribirJSON('ania_tasks.json', t);
}

// --- GET: listar tareas ---
app.get('/api/ania/tasks', (req, res) => {
  const user = req.query.user || USUARIO_ANIA;
  const todas = leerTareas().filter(t => t.usuario === user);
  res.json(todas);
});

// --- POST: crear tarea ---
app.post('/api/ania/tasks', (req, res) => {
  const { texto, remindAt, usuario, source, notifyVia } = req.body || {};
  if (!texto || typeof texto !== 'string' || texto.trim().length < 2) {
    return res.status(400).json({ error: 'Texto de tarea inválido' });
  }
  const tareas = leerTareas();
  const nueva = {
    id: 'T' + Date.now() + Math.random().toString(36).slice(2, 6),
    usuario: usuario || USUARIO_ANIA,
    texto: texto.trim(),
    remindAt: remindAt || null,
    done: false,
    notified: false,
    source: source || 'web',
    // ✅ FIX: 'local' (web), 'telegram' (bot), 'both'
    notifyVia: notifyVia || (source === 'telegram' ? 'telegram' : 'local'),
    created: new Date().toISOString()
  };
  tareas.push(nueva);
  guardarTareas(tareas);
  res.status(201).json(nueva);
});

// --- PUT: actualizar tarea (marcar hecha, editar) ---
app.put('/api/ania/tasks/:id', (req, res) => {
  const tareas = leerTareas();
  const idx = tareas.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
  tareas[idx] = { ...tareas[idx], ...req.body, updated: new Date().toISOString() };
  guardarTareas(tareas);
  res.json(tareas[idx]);
});

// --- DELETE: borrar tarea ---
app.delete('/api/ania/tasks/:id', (req, res) => {
  const tareas = leerTareas();
  const nuevas = tareas.filter(t => t.id !== req.params.id);
  guardarTareas(nuevas);
  res.json({ ok: true });
});

// ---- CONFIG ----
app.get('/api/config', (req, res) => { // ✅ sintaxis corregida
  res.json({
    headerSubtitle: "Salud & Tecnología",
    categoriasTitle: "Explora por Categoría",
    categoriasSubtitle: "Encuentra exactamente lo que necesitas",
    productosTitle: "🌟 Productos Destacados",
    productosSubtitle: "Los más populares entre nuestros clientes",
    ofertasTitle: "🔥 Ofertas Especiales",
    ofertasSubtitle: "Aprovecha estos descuentos exclusivos",
    footerDescription: "Tu tienda confiable de medicamentos y hardware de última generación."
  });
});

// 🔒 Token de GitHub SOLO para admins autenticados (antes era público)
app.get('/api/config/github-token', authenticateToken, esAdmin, (req, res) => {
  res.json({ token: process.env.GITHUB_TOKEN || '' });
});

// Guardar/actualizar token de GitHub (solo admin)
// Nota: esto solo actualiza la variable en memoria del proceso actual.
// Para persistirlo entre reinicios, se debe setear en Render ENV.
app.post('/api/config/github-token', authenticateToken, esAdmin, (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token inválido' });
  }
  process.env.GITHUB_TOKEN = token;
  res.json({ ok: true, message: 'Token actualizado en memoria del proceso' });
});

// Test rápido del token
app.post('/api/config/test-github-token', authenticateToken, esAdmin, async (req, res) => {
  const { token } = req.body || {};
  const t = token || process.env.GITHUB_TOKEN;
  if (!t) return res.json({ valid: false, message: 'No hay token' });
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${t}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'MediTech-Backend'
      }
    });
    if (r.ok) {
      const u = await r.json();
      return res.json({ valid: true, message: `Conectado como ${u.login}` });
    }
    return res.json({ valid: false, message: `GitHub respondió ${r.status}` });
  } catch (e) {
    res.json({ valid: false, message: e.message });
  }
});

// ---- TELEGRAM PROXY (solo para TU bot, ya no es relay abierto) ----
app.post('/api/telegram-proxy', async (req, res) => {
  try {
    const { token, method, data } = req.body;
    if (!method) return res.status(400).json({ ok: false, error: "Falta 'method'" });
    const tokenValido = process.env.TELEGRAM_TOKEN;
    if (!tokenValido || token !== tokenValido) {
      return res.status(403).json({ ok: false, error: 'Token no autorizado' });
    }
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    });
    res.status(r.status).json(await r.json());
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Error del proxy: ' + e.message });
  }
});

// ---- ESTADO DEL BOT (offset de getUpdates + fecha del último informe) ----
app.get('/api/telegram-state', authState, (req, res) => {
  res.json(leerArrayJSON('telegram_state.json')[0] || {});
});
app.post('/api/telegram-state', authState, (req, res) => {
  escribirJSON('telegram_state.json', [req.body || {}]);
  res.json({ ok: true });
});

// ---- 📰 NOTICIAS (para el panel web; sin CORS porque vienen del servidor) ----
app.get('/api/noticias', async (req, res) => {
  try {
    res.json(await obtenerNoticias());
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- 📊 INFORME DIARIO LISTO PARA TELEGRAM (HTML escapado + troceado) ----
app.get('/api/informe-diario', async (req, res) => {
  try {
    const { noticias } = await obtenerNoticias();
    const productos = leerArrayJSON('productos.json')
      .filter(p => p.stock > 0 && p.available !== false && p.available !== 0)
      .slice(0, 5);
    const pendientes = leerArrayJSON('pedidos.json').filter(p => p.estado === 'pendiente').length;
    const fecha = new Intl.DateTimeFormat('es-CU', { dateStyle: 'full', timeZone: 'America/Havana' }).format(new Date());

    const seccion = (emoji, titulo, items) => {
      const cuerpo = items.length
        ? items.map((n, i) => {
            const url = /^https?:\/\//.test(n.link) ? n.link : '';
            const t = escTG(n.titulo);
            return `${i + 1}. ${url ? `<a href="${url}">${t}</a>` : t} <i>(${escTG(n.fuente)})</i>`;
          }).join('\n')
        : '• Sin titulares disponibles en este momento.';
      return `${emoji} <b>${titulo}</b>\n${cuerpo}\n`;
    };

    const parte1 =
      `📊 <b>INFORME DIARIO · MediTech</b>\n🗓️ ${escTG(fecha)}\n\n` +
      seccion('🌎', 'NOTICIAS LATAM / CUBA', noticias.latam) + '\n' +
      seccion('🧠', 'IA Y TECNOLOGÍA', noticias.tech) + '\n' +
      seccion('📈', 'TENDENCIAS', noticias.tendencias);

    const parte2 =
      `🛒 <b>CATÁLOGO DISPONIBLE</b>\n` +
      (productos.length
        ? productos.map(p => `• ${escTG(p.name)} — $${p.price} (${p.stock} uds)`).join('\n')
        : '• Sin productos disponibles') +
      `\n\n📦 Pedidos pendientes: ${pendientes}` +
      `\n🔗 <a href="${TIENDA_URL}">Ir a la tienda</a>` +
      `\n\n🤖 Generado por ANIA OS v13.0`;

    res.json({ ok: true, parse_mode: 'HTML', mensajes: [parte1, parte2] });
  } catch (e) {
    console.error('Error en informe-diario:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- RESUMEN DE PRODUCTOS PARA IA (una sola ruta, con precios y descripciones) ----
app.get('/api/productos-resumen', (req, res) => {
  const productos = leerArrayJSON('productos.json');
  const disponibles = productos.filter(p =>
    p.stock > 0 && (p.available === undefined || p.available === true || p.available === 1)
  );
  const resumen = disponibles.map(p =>
    `• ${p.name} (${p.category || 'general'}) - $${p.price} - Stock: ${p.stock}\n  ${p.description || p.desc || 'Sin descripción'}`
  ).join('\n\n');
  res.json({
    ok: true,
    total: disponibles.length,
    totalGeneral: productos.length,
    resumenTexto: resumen || 'No hay productos disponibles en este momento.',
    productos: disponibles.map(p => ({
      name: p.name, category: p.category, price: p.price, stock: p.stock,
      description: p.description || p.desc || ''
    }))
  });
});

// ============================================================
// 🚀 ARRANQUE
// ============================================================
(async () => {
  await inicializarArchivos();  // 👈 ahora es async

  // Crear admin inicial si no existe
  const usuarios = leerArrayJSON('usuarios.json');
  if (!usuarios.some(u => u.role === 'admin')) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASS || 'admin123', 10);
    usuarios.push({
      id: 1,
      username: process.env.ADMIN_USER || 'admin',
      password_hash: hash,
      name: 'Administrador',
      role: 'admin',
      created_at: new Date().toISOString()
    });
    escribirJSON('usuarios.json', usuarios);
    console.log('👤 Usuario admin creado');
  }

  // ============================================================
  // ⏰ CRON: revisa tareas vencidas cada 30s y notifica por Telegram
  // ============================================================
async function revisarTareasVencidas() {
  try {
    const ahora = Date.now();
    const tareas = leerArrayJSON('ania_tasks.json');
    let cambios = false;

    for (const t of tareas) {
      if (t.done || t.notified) continue;
      if (!t.remindAt) continue;
      if (new Date(t.remindAt).getTime() > ahora) continue;

      // ✅ FIX: solo notificar por Telegram si la tarea lo pide
      // Las tareas creadas en la web (source:'web' / notifyVia:'local')
      // se avisan SOLO en el navegador → no duplicamos.
      const via = t.notifyVia || (t.source === 'telegram' ? 'telegram' : 'local');
      if (via === 'telegram' || via === 'both') {
        await enviarRecordatorioTelegram(t);
      }

      t.notified = true;
      t.notifiedAt = new Date().toISOString();
      cambios = true;
    }

    if (cambios) escribirJSON('ania_tasks.json', tareas);
  } catch (e) {
    console.error('Cron tareas error:', e.message);
  }
}

async function enviarRecordatorioTelegram(tarea) {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) return;
  const escTG = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const hora = new Date(tarea.remindAt).toLocaleString('es-CU', {
    timeZone: 'America/Havana', hour:'2-digit', minute:'2-digit',
    day:'numeric', month:'short'
  });
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `⏰ <b>Recordatorio</b>\n\n📋 ${escTG(tarea.texto)}\n\n<i>Agendado para ${escTG(hora)} · Cuba</i>`,
        parse_mode:'HTML',
        disable_notification: false
      })
    });
    console.log(`📨 Recordatorio Telegram: ${tarea.texto}`);
  } catch (e) {
    console.error('Error enviando recordatorio:', e.message);
  }
}

  // Ejecutar cada 30 segundos
  setInterval(revisarTareasVencidas, 30 * 1000);
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT} | Datos en: ${DATA_DIR}`);
    console.log(`📦 GitHub sync: ${GITHUB_TOKEN ? 'ACTIVO' : 'DESACTIVADO (falta GITHUB_TOKEN)'}`);
  });
})();
