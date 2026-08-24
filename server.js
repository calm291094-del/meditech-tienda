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
// ARCHIVOS JSON (lectura tolerante + escritura atómica)
// ============================================================
const rutaJSON = (nombre) => path.join(DATA_DIR, nombre);

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

function escribirJSON(nombre, datos) {
  const final = rutaJSON(nombre);
  const tmp = final + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(datos, null, 2));
    fs.renameSync(tmp, final); // atómico: evita archivos corruptos
    console.log(`✅ ${nombre} guardado`);
  } catch (e) {
    console.error(`❌ Error guardando ${nombre}:`, e.message);
  }
}

function inicializarArchivos() {
  for (const f of ['usuarios.json', 'productos.json', 'pedidos.json']) {
    if (!fs.existsSync(rutaJSON(f))) escribirJSON(f, []);
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
    res.status(201).json({
      message: 'Usuario creado correctamente',
      usuario: { id: newUser.id, username, name, email, role: 'user' },
      token: generarToken(newUser)
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
    res.json({ message: 'Login exitoso', usuario: usuarioSinPass, token: generarToken(user) });
  } catch (e) {
    console.error('🔥 ERROR EN LOGIN:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
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
  pedidos[index] = { ...pedidos[index], ...req.body, actualizado: new Date().toISOString() };
  escribirJSON('pedidos.json', pedidos);
  res.json(pedidos[index]);
});

app.post('/api/enviar-pedido', (req, res) => {
  try {
    const { email, nombre, pedido, total } = req.body;
    if (!pedido || !Array.isArray(pedido) || pedido.length === 0) {
      return res.status(400).json({ success: false, error: 'El pedido está vacío' });
    }
    const items = pedido.map(p => ({
      nombre: p.nombre || 'Producto',
      cantidad: parseInt(p.cantidad) || 1,
      precio: parseFloat(p.precio) || 0
    }));
    const nuevoPedido = {
      id: 'PED-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      cliente: nombre || 'Cliente',
      email: email || 'cliente@meditech.com',
      fecha: new Date().toISOString(),
      items,
      total: parseFloat(total) || items.reduce((s, i) => s + i.precio * i.cantidad, 0),
      estado: 'pendiente'
    };
    const pedidos = leerArrayJSON('pedidos.json');
    pedidos.push(nuevoPedido);
    escribirJSON('pedidos.json', pedidos);
    res.status(200).json({ success: true, message: 'Pedido recibido correctamente', pedido: nuevoPedido });
  } catch (e) {
    console.error('❌ Error en enviar-pedido:', e);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
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
inicializarArchivos();

// Crear admin inicial si no existe (usa ADMIN_USER / ADMIN_PASS en Render)
(async () => {
  const usuarios = leerArrayJSON('usuarios.json');
  if (!usuarios.some(u => u.role === 'admin')) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASS || 'admin123', 10);
    usuarios.push({
      id: 1, username: process.env.ADMIN_USER || 'admin', password_hash: hash,
      name: 'Administrador', role: 'admin', created_at: new Date().toISOString()
    });
    escribirJSON('usuarios.json', usuarios);
    console.log('👤 Usuario admin creado (revisa ADMIN_USER/ADMIN_PASS)');
  }
})();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor en puerto ${PORT} | Datos en: ${DATA_DIR}`);
});
