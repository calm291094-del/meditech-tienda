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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
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

async function enviarInforme(chatDestino) {
  const data = await fetchJSON(`${API}/informe-diario`);
  if (!data.ok || !data.mensajes) throw new Error('El backend no pudo generar el informe');
  for (const msg of data.mensajes) {
    await tg('sendMessage', { chat_id: chatDestino, text: msg, parse_mode: 'HTML', disable_web_page_preview: true });
    await sleep(600);
  }
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
    } else if (/\b(hola|buenas|saludos)\b/.test(bajo)) {
      respuesta = '¡Hola! 👋 ¿Buscas medicamentos o tecnología? Escríbeme /productos para ver el catálogo 😊';
    } else if (/\b(precio|cuesta|vende|producto|catalogo|medicamento|tecnologia)\b/.test(bajo)) {
      respuesta = await respuestaProductos();
    }

    if (respuesta) {
      await tg('sendMessage', { chat_id: chatId, text: respuesta, parse_mode: 'HTML', disable_web_page_preview: true });
    }
  }
  return state;
}

(async () => {
  try {
    // Eliminar webhook por si quedó alguno residual
    await tg('deleteWebhook', { drop_pending_updates: false });

    const state = await getState();
    await procesarComandos(state);

    // Informe diario
    const hoy = fechaCuba();
    if (CHAT_ID && horaCuba() >= HORA_INFORME && state.ultimoInforme !== hoy) {
      console.log('📤 Enviando informe diario...');
      try {
        await enviarInforme(CHAT_ID);
        state.ultimoInforme = hoy;
      } catch (e) {
        console.error('❌ Error enviando informe:', e.message);
      }
    }

    await setState(state);
    console.log('✅ Ciclo completado');
  } catch (e) {
    console.error('❌ Error del bot:', e);
    process.exitCode = 1;
  }
})();