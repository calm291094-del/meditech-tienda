// bot.js — ANIA BOT · ejecutado por GitHub Actions cada 5 minutos
const API = process.env.API_URL || 'https://meditech-bot.onrender.com/api';
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const STATE_KEY = process.env.TELEGRAM_STATE_KEY;
const HORA_INFORME = parseInt(process.env.HORA_INFORME || '7', 10);
const TIENDA = 'https://meditech-bot.onrender.com';

if (!TOKEN) { console.error('❌ Falta TELEGRAM_TOKEN'); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function tg(method, data) {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const j = await r.json();
    if (!j.ok) console.error(`⚠️ Telegram ${method}:`, j.description);
    return j;
}

async function fetchJSON(url, opts = {}, reintentos = 3) {
    for (let i = 0; i < reintentos; i++) {
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 45000);
            const r = await fetch(url, { ...opts, signal: ctrl.signal });
            clearTimeout(t);
            if (r.ok) return await r.json();
            if (r.status >= 500) { await sleep(3000); continue; }
            return await r.json().catch(() => ({}));
        } catch (e) {
            if (i === reintentos - 1) throw e;
            await sleep(3000);
        }
    }
}

async function getState() {
    try { return await fetchJSON(`${API}/telegram-state`, { headers: { 'x-state-key': STATE_KEY } }); }
    catch { return {}; }
}
async function setState(s) {
    try {
        await fetchJSON(`${API}/telegram-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-state-key': STATE_KEY },
            body: JSON.stringify(s)
        });
    } catch (e) { console.error('No se pudo guardar estado:', e.message); }
}

const fechaCuba = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(new Date());
const horaCuba = () => parseInt(new Intl.DateTimeFormat('es-CU', { hour: 'numeric', hour12: false, timeZone: 'America/Havana' }).format(new Date()), 10);

// ============================================================
// 🧠 IA GRATIS SIN KEYS (Pollinations.ai)
// ============================================================
async function consultarIA(texto, contextoCatalogo) {
    const system = `Eres "Ania", asistente de MediTech, tienda de medicamentos y tecnología en Holguín, Cuba.
Responde SIEMPRE en español, tono amable, máximo 3 líneas, sin markdown (# - *), con algún emoji.
Para productos/precios/stock usa SOLO este catálogo real, NUNCA inventes:
${contextoCatalogo}
Si preguntan algo ajeno a la tienda, redirige con simpatía hacia MediTech.`;

    const prompt = encodeURIComponent(`${system}\n\nUsuario: ${texto}\nAnia:`);

    // Intento 1: GET simple de Pollinations (sin key)
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000); // timeout 20s
        const r = await fetch(`https://text.pollinations.ai/${prompt.slice(0, 6000)}`, { signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) {
            const txt = (await r.text()).trim();
            if (txt.length >= 10) return { ok: true, texto: txt };
        }
    } catch (e) { console.warn('IA GET falló:', e.message); }

    // Intento 2: POST de Pollinations (sin key)
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        const r = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ctrl.signal,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: texto }
                ],
                model: 'openai'
            })
        });
        clearTimeout(t);
        if (r.ok) {
            const txt = (await r.text()).trim();
            if (txt.length >= 10) return { ok: true, texto: txt };
        }
    } catch (e) { console.warn('IA POST falló:', e.message); }

    return { ok: false };
}

// ============================================================
// 📚 BASE DE CONOCIMIENTOS LOCAL (fallback si la IA falla)
// ============================================================
const BASE_CONOCIMIENTO = [
    { keys: ['horario', 'hora', 'abierto', 'cierran', 'abren', 'atienden'],
      resp: '🕐 Atendemos de Lunes a Sábado de 9:00 AM a 6:00 PM. Domingos cerrado. ¡Te esperamos! 😊' },
    { keys: ['ubicacion', 'ubicación', 'donde', 'dónde', 'dirección', 'direccion', 'quedan'],
      resp: `📍 Estamos en Holguín, Cuba. Visita nuestra tienda online: ${TIENDA}` },
    { keys: ['envio', 'envío', 'delivery', 'domicilio', 'entrega'],
      resp: '🚚 El envío tiene costo adicional según tu zona. Al confirmar tu pedido coordinamos la entrega. 📦' },
    { keys: ['pago', 'pagar', 'tarjeta', 'efectivo', 'transferencia'],
      resp: '💳 Aceptamos efectivo y transferencia. Al completar tu pedido te indicamos las opciones para tu zona.' },
    { keys: ['contacto', 'telefono', 'teléfono', 'whatsapp', 'correo', 'email'],
      resp: `📱 Puedes contactarnos por este bot o en la web: ${TIENDA}` },
    { keys: ['comprar', 'pedido', 'carrito', 'como compro', 'cómo compro'],
      resp: `🛒 Para comprar: entra a la web, añade productos al carrito y completa el formulario de pedido. ¡Es muy fácil! ${TIENDA}` },
    { keys: ['gracias', 'thank'], resp: '¡De nada! ☕️ ¿Necesitas algo más? ✨' },
    { keys: ['adios', 'adiós', 'bye', 'chao', 'hasta luego'], resp: '¡Hasta pronto! 👋 Estoy aquí 24/7. ¡Que tengas buen día! ✨' },
    { keys: ['hola', 'buenas', 'saludos', 'hey'],
      resp: '¡Hola! 👋 ¿Buscas medicamentos o tecnología? Escríbeme /productos para ver el catálogo 😊' }
];

function buscarEnBaseConocimiento(texto) {
    const bajo = texto.toLowerCase();
    for (const item of BASE_CONOCIMIENTO) {
        if (item.keys.some(k => bajo.includes(k))) return item.resp;
    }
    return null;
}

// Respuesta final por defecto si todo falla
const RESPUESTA_DEFAULT = '🤔 Puedo ayudarte con el catálogo (/productos), horarios, envíos y más. Escríbeme /help para ver todo lo que sé 😉';

// ============================================================
// 🛒 CATÁLOGO
// ============================================================
async function obtenerCatalogoTexto() {
    try {
        const d = await fetchJSON(`${API}/productos-resumen`);
        if (d.ok && d.resumenTexto) return d.resumenTexto;
        if (d.ok && d.productos) {
            return d.productos.map(p => `${p.name}: $${p.price} (${p.stock} en stock)`).join('; ');
        }
    } catch {}
    return 'Catálogo no disponible en este momento.';
}

async function respuestaProductos() {
    try {
        const d = await fetchJSON(`${API}/productos-resumen`);
        if (!d.ok || !d.productos || !d.productos.length) return '😕 No hay productos disponibles ahora mismo.';
        const lista = d.productos.slice(0, 10)
            .map(p => `• <b>${esc(p.name)}</b> — $${esc(p.price)} ${p.stock <= 10 ? `⚠️ (${p.stock} uds)` : ''}`)
            .join('\n');
        return `🛒 <b>Catálogo disponible (${d.total})</b>\n\n${lista}\n\n🔗 Catálogo completo: ${TIENDA}`;
    } catch {
        return '⚠️ No pude conectar con la tienda. Intenta en unos minutos.';
    }
}

async function enviarInforme(chatDestino) {
    const data = await fetchJSON(`${API}/informe-diario`);
    if (!data.ok || !data.mensajes) throw new Error('El backend no pudo generar el informe');
    for (const msg of data.mensajes) {
        await tg('sendMessage', { chat_id: chatDestino, text: msg, parse_mode: 'HTML', disable_web_page_preview: true });
        await sleep(600);
    }
}

// ============================================================
// 🧠 CEREBRO: decide cómo responder a mensajes naturales
//    1) Comandos → directo
//    2) Base de conocimiento → instantáneo
//    3) IA (Pollinations) → conversación libre
//    4) Default
// ============================================================
async function responderNatural(texto) {
    // 1) Base de conocimiento primero (rápido y siempre funciona)
    const local = buscarEnBaseConocimiento(texto);
    if (local) return local;

    // 2) Si pregunta por productos, dar catálogo real
    if (/\b(precio|cuesta|vende|producto|catalogo|catálogo|medicamento|tecnologia|tecnología|qué tienen|que tienen)\b/.test(texto.toLowerCase())) {
        return await respuestaProductos();
    }

    // 3) Intentar IA gratis
    try {
        const contexto = await obtenerCatalogoTexto();
        const ia = await consultarIA(texto, contexto);
        if (ia.ok) return esc(ia.texto).slice(0, 900);
    } catch (e) { console.warn('Error IA:', e.message); }

    // 4) Default
    return RESPUESTA_DEFAULT;
}

// ============================================================
// COMANDOS
// ============================================================
async function procesarComandos(state) {
    const j = await tg('getUpdates', { timeout: 0, offset: state.offset || 0, allowed_updates: ['message'] });
    if (!j.ok || !j.result.length) return state;

    for (const upd of j.result) {
        state.offset = upd.update_id + 1;
        const msg = upd.message;
        if (!msg || !msg.text) continue;

        const chatId = msg.chat.id;
        const texto = msg.text.trim();
        const bajo = texto.toLowerCase();
        let respuesta = null;

        if (bajo.startsWith('/start')) {
            respuesta = `¡Hola! 🤖 Soy <b>Ania</b>, asistente de MediTech (Holguín, Cuba) 💊💻\n\nComandos:\n/help — ayuda\n/productos — catálogo con precios\n/web — tienda\n/informe — informe del día\n\nTambién puedes escribirme "hola" o preguntarme por un producto 😉`;
        } else if (bajo.startsWith('/help')) {
            respuesta = `📋 <b>Comandos</b>\n/start — bienvenida\n/productos — catálogo y precios\n/web — enlace de la tienda\n/informe — noticias + catálogo del día\n\n💬 O escríbeme natural: "hola", "¿qué venden?", "precio de..."`;
        } else if (bajo.startsWith('/web')) {
            respuesta = `🔗 Nuestra tienda: ${TIENDA}`;
        } else if (bajo.startsWith('/productos')) {
            respuesta = await respuestaProductos();
        } else if (bajo.startsWith('/informe')) {
            try { await enviarInforme(chatId); } catch (e) { respuesta = '❌ ' + esc(e.message); }
        } else if (bajo.startsWith('/estado')) {
            respuesta = `🟢 ANIA OS v13.0 operativa\n🕒 Hora Cuba: ${horaCuba()}:00\n📅 ${esc(fechaCuba())}`;
        } else {
            // 🧠 Mensaje natural → cerebro con IA + base de conocimiento
            respuesta = await responderNatural(texto);
        }

        if (respuesta) {
            await tg('sendMessage', { chat_id: chatId, text: respuesta, parse_mode: 'HTML', disable_web_page_preview: true });
        }
    }
    return state;
}

// ============================================================
// MAIN
// ============================================================
(async () => {
    try {
        const state = await getState();
        await procesarComandos(state);

        const hoy = fechaCuba();
        if (CHAT_ID && horaCuba() >= HORA_INFORME && state.ultimoInforme !== hoy) {
            console.log('📤 Enviando informe diario...');
            await enviarInforme(CHAT_ID);
            state.ultimoInforme = hoy;
        }

        await setState(state);
        console.log('✅ Ciclo completado');
    } catch (e) {
        console.error('❌ Error del bot:', e);
        process.exitCode = 1;
    }
})();