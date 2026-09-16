// bot.js — ANIA BOT · ejecutado por GitHub Actions cada 5 minutos (MEJORADO)
const API = process.env.API_URL || 'https://meditech-bot.onrender.com/api';
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;         // grupo/canal del informe diario
const STATE_KEY = process.env.TELEGRAM_STATE_KEY;
const HORA_INFORME = parseInt(process.env.HORA_INFORME || '7', 10); // hora de Cuba
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

// fetch tolerante (Render free tarda en despertar)
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
    try {
        return await fetchJSON(`${API}/telegram-state`, { headers: { 'x-state-key': STATE_KEY } });
    } catch { return {}; }
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

// ---------- INFORME DIARIO ----------
async function enviarInforme(chatDestino) {
    const data = await fetchJSON(`${API}/informe-diario`);
    if (!data.ok || !data.mensajes) throw new Error('El backend no pudo generar el informe');
    for (const msg of data.mensajes) {
        await tg('sendMessage', { chat_id: chatDestino, text: msg, parse_mode: 'HTML', disable_web_page_preview: true });
        await sleep(600);
    }
}

// ---------- CATÁLOGO ----------
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

// 🆕 Ofertas disponibles
async function respuestaOfertas() {
    try {
        const d = await fetchJSON(`${API}/productos-resumen`);
        if (!d.ok || !d.productos) return '😕 No hay ofertas disponibles ahora mismo.';
        
        // Filtrar productos con stock bajo (posibles ofertas) o destacados
        const ofertas = d.productos.filter(p => p.stock <= 10).slice(0, 5);
        
        if (!ofertas.length) {
            return '🔥 Por ahora no hay ofertas especiales activas, ¡pero vuelve pronto! Revisa nuestro catálogo completo en la web.';
        }
        
        const lista = ofertas
            .map(p => `🔥 <b>${esc(p.name)}</b> — $${esc(p.price)} ⚠️ ¡Solo quedan ${p.stock}!`)
            .join('\n');
        
        return `🔥 <b>¡Últimas unidades disponibles!</b>\n\n${lista}\n\n🛒 Aprovecha antes de que se agoten: ${TIENDA}`;
    } catch {
        return '⚠️ No pude conectar con la tienda para verificar ofertas.';
    }
}

// 🆕 Respuesta de horarios
function respuestaHorarios() {
    return `🕐 <b>Horario de atención MediTech</b>\n\n📅 Lunes a Sábado: 9:00 AM - 6:00 PM\n📅 Domingos: Cerrado\n\n📍 Holguín, Cuba\n\n¡Te esperamos! 😊`;
}

// 🆕 Respuesta de contacto
function respuestaContacto() {
    return `📱 <b>Formas de contacto</b>\n\n🤖 Telegram: @AniaAsistenteBot (yo misma 😉)\n🌐 Web: ${TIENDA}\n\n💬 Puedes escribirme por aquí cuando quieras, estoy disponible 24/7.`;
}

// 🆕 Respuesta de formas de pago
function respuestaPagos() {
    return `💳 <b>Formas de pago</b>\n\n• Efectivo al recibir\n• Transferencia bancaria\n\n📦 Al completar tu pedido, te indicamos las opciones disponibles para tu zona.`;
}

// 🆕 Respuesta de envíos
function respuestaEnvios() {
    return `🚚 <b>Información de envíos</b>\n\n• Envío con costo adicional según zona\n• Coordinamos la entrega al confirmar tu pedido\n• Holguín y alrededores\n\n📦 Para más detalles, arma tu carrito en la web y completa el pedido.`;
}

// 🆕 Respuesta de ayuda extendida
function respuestaAyuda() {
    return `📋 <b>Comandos disponibles</b>\n\n/start — Bienvenida\n/help — Esta ayuda\n/productos — Catálogo con precios\n/ofertas — Productos con últimas unidades\n/horario — Horario de atención\n/ubicacion — Dónde estamos\n/contacto — Formas de contacto\n/pagos — Formas de pago\n/envios — Información de envíos\n/web — Enlace a la tienda\n/informe — Noticias + catálogo del día\n/estado — Estado del sistema\n\n💬 <b>O escríbeme natural:</b>\n"hola", "¿qué venden?", "precio de...", "¿tienen paracetamol?", "¿cómo compro?"`;
}

// 🆕 Respuesta de ubicación
function respuestaUbicacion() {
    return `📍 <b>Ubicación</b>\n\nEstamos en Holguín, Cuba.\n\n🕐 Horario: Lunes a Sábado de 9:00 AM a 6:00 PM\n\n🌐 Visita nuestra tienda online: ${TIENDA}`;
}

// ---------- COMANDOS ----------
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

        // Comandos con slash
        if (bajo.startsWith('/start')) {
            respuesta = `¡Hola! 🤖 Soy <b>Ania</b>, asistente de MediTech (Holguín, Cuba) 💊💻\n\nPuedo ayudarte con:\n• Catálogo de productos y precios\n• Información de horarios y envíos\n• Armar tu pedido\n\nComandos rápidos:\n/help — Ver todos los comandos\n/productos — Catálogo con precios\n/web — Tienda online\n\nTambién puedes escribirme "hola" o preguntarme por un producto 😉`;
        } else if (bajo.startsWith('/help') || bajo.startsWith('/ayuda')) {
            respuesta = respuestaAyuda();
        } else if (bajo.startsWith('/web')) {
            respuesta = `🔗 Nuestra tienda: ${TIENDA}`;
        } else if (bajo.startsWith('/productos')) {
            respuesta = await respuestaProductos();
        } else if (bajo.startsWith('/ofertas')) {
            respuesta = await respuestaOfertas();
        } else if (bajo.startsWith('/horario') || bajo.startsWith('/hora')) {
            respuesta = respuestaHorarios();
        } else if (bajo.startsWith('/ubicacion') || bajo.startsWith('/donde')) {
            respuesta = respuestaUbicacion();
        } else if (bajo.startsWith('/contacto')) {
            respuesta = respuestaContacto();
        } else if (bajo.startsWith('/pagos') || bajo.startsWith('/pago')) {
            respuesta = respuestaPagos();
        } else if (bajo.startsWith('/envios') || bajo.startsWith('/envio')) {
            respuesta = respuestaEnvios();
        } else if (bajo.startsWith('/informe')) {
            try { await enviarInforme(chatId); } catch (e) { respuesta = '❌ ' + esc(e.message); }
        } else if (bajo.startsWith('/estado')) {
            respuesta = `🟢 ANIA OS v13.0 operativa\n🕒 Hora Cuba: ${horaCuba()}:00\n📅 ${esc(fechaCuba())}`;
        } 
        // Conversación natural
        else if (/\b(hola|buenas|saludos|hey|hi|buenos días|buenas tardes|buenas noches)\b/.test(bajo)) {
            respuesta = '¡Hola! 👋 ¿Buscas medicamentos o tecnología? Escríbeme /productos para ver el catálogo o pregúntame por un producto específico 😊';
        } else if (/\b(gracias|thank|thx)\b/.test(bajo)) {
            respuesta = '¡De nada! ☕️ ¿Necesitas algo más? Estoy aquí para ayudarte ✨';
        } else if (/\b(adios|adiós|bye|hasta luego|chao|nos vemos)\b/.test(bajo)) {
            respuesta = '¡Hasta pronto! 👋 Fue un placer ayudarte. Recuerda que estoy disponible 24/7. ¡Que tengas un excelente día! ✨';
        } else if (/\b(precio|cuesta|vende|producto|catalogo|medicamento|tecnologia|qué tienen|que tienen)\b/.test(bajo)) {
            respuesta = await respuestaProductos();
        } else if (/\b(horario|hora|abierto|cierran|abren|atienden)\b/.test(bajo)) {
            respuesta = respuestaHorarios();
        } else if (/\b(donde|dónde|ubicacion|ubicación|dirección|direccion|quedan|estan)\b/.test(bajo)) {
            respuesta = respuestaUbicacion();
        } else if (/\b(pago|pagar|tarjeta|efectivo|transferencia|como pago)\b/.test(bajo)) {
            respuesta = respuestaPagos();
        } else if (/\b(envio|envío|delivery|domicilio|entrega)\b/.test(bajo)) {
            respuesta = respuestaEnvios();
        } else if (/\b(contacto|telefono|teléfono|whatsapp|telegram|correo|email)\b/.test(bajo)) {
            respuesta = respuestaContacto();
        } else if (/\b(oferta|descuento|promocion|promoción|barato)\b/.test(bajo)) {
            respuesta = await respuestaOfertas();
        } else if (/\b(comprar|pedido|carrito|como compro|cómo compro)\b/.test(bajo)) {
            respuesta = '📦 Para comprar: entra a la web, añade productos al carrito y completa el formulario de pedido. Al finalizar, te contactamos para coordinar pago y entrega. ¡Es muy fácil! 😊';
        } else {
            // Respuesta por defecto para mensajes no reconocidos
            respuesta = '🤔 No estoy segura de entender. Puedo ayudarte con:\n\n/productos — Catálogo\n/horario — Horarios\n/contacto — Contacto\n/help — Ver todos los comandos\n\nO escríbeme el nombre de un producto que busques 😉';
        }

        if (respuesta) {
            await tg('sendMessage', { chat_id: chatId, text: respuesta, parse_mode: 'HTML', disable_web_page_preview: true });
        }
    }
    return state;
}

// ---------- MAIN ----------
(async () => {
    try {
        const state = await getState();

        // 1) Responder mensajes pendientes
        await procesarComandos(state);

        // 2) Informe diario (una vez al día, desde la hora configurada)
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