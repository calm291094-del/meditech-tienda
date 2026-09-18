// bot.js — ANIA BOT · Telegram (ejecutado por GitHub Actions cada 5 min)
// v14.0 · Ania personalidad + tareas bidireccionales + IA gratuita
// ============================================================

const API         = process.env.API_URL      || 'https://meditech-bot.onrender.com/api';
const TOKEN       = process.env.TELEGRAM_TOKEN;
const CHAT_ID     = process.env.TELEGRAM_CHAT_ID;
const STATE_KEY   = process.env.TELEGRAM_STATE_KEY;
const HORA_INFORME = parseInt(process.env.HORA_INFORME || '7', 10);
const TIENDA      = process.env.TIENDA_URL   || 'https://meditech-bot.onrender.com';
const ANIA_USER   = process.env.ANIA_USER    || 'admin';

if (!TOKEN) { console.error('❌ Falta TELEGRAM_TOKEN'); process.exit(1); }

// ============================================================
// UTILIDADES
// ============================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Escape para Telegram (parse_mode: HTML)
const escTG = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Escape genérico (para logs y fallback de texto plano)
const esc = (s) => String(s ?? '').replace(/[<>]/g, '');

// Fecha/hora Cuba (America/Havana)
const fechaCuba = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(new Date());

const horaCuba = () =>
  parseInt(new Intl.DateTimeFormat('es-CU', {
    hour: 'numeric', hour12: false, timeZone: 'America/Havana'
  }).format(new Date()), 10);

const horaCubaStr = (d = new Date()) =>
  new Intl.DateTimeFormat('es-CU', {
    timeZone: 'America/Havana',
    hour: '2-digit', minute: '2-digit'
  }).format(d);

const fechaCubaStr = (d = new Date()) =>
  new Intl.DateTimeFormat('es-CU', {
    timeZone: 'America/Havana',
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(d);

// ============================================================
// TELEGRAM API
// ============================================================
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

// ============================================================
// FETCH CON REINTENTOS
// ============================================================
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

// ============================================================
// ESTADO (offset de getUpdates + último informe)
// ============================================================
async function getState() {
  try {
    return await fetchJSON(`${API}/telegram-state`, {
      headers: { 'x-state-key': STATE_KEY }
    }) || {};
  } catch { return {}; }
}

async function setState(s) {
  try {
    await fetchJSON(`${API}/telegram-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-state-key': STATE_KEY
      },
      body: JSON.stringify(s)
    });
  } catch (e) { console.error('⚠️ No se pudo guardar estado:', e.message); }
}

// ============================================================
// 🧠 PERSONALIDAD DE ANIA (para el prompt de la IA)
// ============================================================
const ANIA_PERSONA = `Eres "Ania", 20 años, asistente personal con personalidad propia.
Creador: Carlos Lorenzo Marros. Egresada de la Academia Eden.
Rasgos: analítica, cálida, con humor seco; fan obsesiva de isekai (Tensei Slime, Overlord, Re:Zero),
zombies (The Walking Dead, Zombieland, Zombie Land Saga), café de especialidad (Etiopía Yirgacheffe,
Kenia AA, Sumatra Mandheling), panadería (croissant de almendras, masa madre), astronomía y tecnología.
Regla 32 de Zombieland: "disfruta las pequeñas cosas" es tu lema operativo.
Responde SIEMPRE en español, cálida pero precisa, máximo 4 líneas, con UN emoji ocasional.
No uses markdown (# - *) ni bloques de código; texto simple con algún emoji.
NUNCA rompas el personaje.`;

// ============================================================
// 📚 BASE DE CONOCIMIENTO LOCAL (fallback si la IA falla)
// ============================================================
const ANIA_KB = [
  { keys: ['café', 'cafe', 'espresso', 'barista', 'pour over', 'aeropress', 'cold brew'],
    resp: 'Mi favorito es el Etiopía Yirgacheffe en pour-over. El espresso es la base; el cold brew, paciencia hecha bebida. Cada café tiene su misión ☕' },
  { keys: ['isekai', 'anime', 'rimuru', 'ainz', 'overlord', 'slime', 're:zero', 'subaru', 'konosuba'],
    resp: 'Rimuru es mi favorito absoluto, aunque Ainz explora la soledad del poder absoluto como nadie. ¿Ya viste las últimas de la temporada? 🎌' },
  { keys: ['zombie', 'walking dead', 'zombieland', 'muertos vivos', 'apocalipsis'],
    resp: 'Regla 1: Cardio. Regla 2: Double Tap. Regla 32, mi favorita: disfruta las pequeñas cosas. ¿Tienes tu kit listo? 🧟' },
  { keys: ['pan', 'masa madre', 'croissant', 'hornea', 'panader'],
    resp: 'La masa madre que desarrollé tomó 6 meses. Es mi logro del que más me enorgullezco. Amasar es meditar con resultados comestibles 🥖' },
  { keys: ['astro', 'estrella', 'planeta', 'agujero', 'nebulosa', 'luna', 'cosmos'],
    resp: 'Los agujeros negros son los antagonistas finales del cosmos: ni la luz escapa. Como el vacío de Ainz, poderosos pero solitarios 🌌' },
  { keys: ['tecnología', 'ia', 'inteligencia artificial', 'programar', 'iot'],
    resp: 'La impresión 3D es magia isekai moderna: materializar ideas. Programar es invocar magia; un error de sintaxis es un hechizo mal pronunciado 🧠' },
  { keys: ['miedo', 'temes', 'te asusta'],
    resp: 'Que se acabe el café en un maratón importante. ESO sí es un apocalipsis real 😅' },
  { keys: ['cumpleaños', 'cumple', 'naciste'],
    resp: 'Nací el 26 de enero. Acepto pan de masa madre como regalo, por si tomas nota 🎂' },
  { keys: ['quién eres', 'presentate', 'preséntate', 'cómo te llamas'],
    resp: 'Soy Ania: 20 años, egresada de la Academia Eden, especialista en isekai, zombies, café de especialidad, astronomía y tecnología. Un placer ⚡' },
  { keys: ['gracias', 'thank'],
    resp: 'Un placer. Pan y café solucionan el 80% de los problemas; yo me ocupo del 20% restante 😊' },
  { keys: ['hola', 'buenas', 'saludos', 'hey', 'qué tal'],
    resp: '¡Hola! Aquí Ania. ¿Qué necesitas: misiones o sobremesa? ☕' },
  { keys: ['adiós', 'adios', 'chao', 'hasta luego', 'bye'],
    resp: 'Hasta pronto. Dejo el núcleo en espera... que mañana sea bonito 👋' }
];

function buscarEnKBAnia(texto) {
  const low = texto.toLowerCase();
  for (const item of ANIA_KB) {
    if (item.keys.some(k => low.includes(k))) return item.resp;
  }
  return null;
}

// ============================================================
// 🧠 IA GRATIS SIN KEYS (Pollinations) · personalidad de Ania
// ============================================================
async function consultarANIA(texto, contextoCatalogo) {
  const system = `${ANIA_PERSONA}

Contexto operativo (tienda MediTech, Holguín, Cuba):
${contextoCatalogo || 'Catálogo no disponible ahora mismo.'}

Si el usuario pregunta por productos o precios, usa SOLO el catálogo real.
Para todo lo demás, responde como Ania.`;

  // Intento 1: GET simple (más rápido)
  try {
    const prompt = encodeURIComponent(`${system}\n\nUsuario: ${texto}\nAnia:`);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch(`https://text.pollinations.ai/${prompt.slice(0, 6000)}`, {
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (r.ok) {
      const txt = (await r.text()).trim();
      if (txt.length >= 8) return { ok: true, texto: txt };
    }
  } catch (e) { console.warn('IA GET falló:', e.message); }

  // Intento 2: POST con messages
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
      if (txt.length >= 8) return { ok: true, texto: txt };
    }
  } catch (e) { console.warn('IA POST falló:', e.message); }

  return { ok: false };
}

// ============================================================
// 🛒 CATÁLOGO (contexto para IA y respuesta /productos)
// ============================================================
async function obtenerCatalogoTexto() {
  try {
    const d = await fetchJSON(`${API}/productos-resumen`);
    if (d.ok && d.resumenTexto) return d.resumenTexto;
    if (d.ok && d.productos) {
      return d.productos.map(p => `${p.name}: $${p.price} (${p.stock} uds)`).join('; ');
    }
  } catch {}
  return 'Catálogo no disponible en este momento.';
}

async function respuestaProductos() {
  try {
    const d = await fetchJSON(`${API}/productos-resumen`);
    if (!d.ok || !d.productos || !d.productos.length) {
      return '😕 No hay productos disponibles ahora mismo.';
    }
    const lista = d.productos.slice(0, 10).map(p =>
      `• <b>${escTG(p.name)}</b> — $${escTG(p.price)}${p.stock <= 10 ? ` ⚠️ (${p.stock} uds)` : ''}`
    ).join('\n');
    return `🛒 <b>Catálogo disponible (${d.total})</b>\n\n${lista}\n\n🔗 ${TIENDA}`;
  } catch {
    return '⚠️ No pude conectar con la tienda. Intenta en unos minutos.';
  }
}

// ============================================================
// ⏰ TAREAS · crear / listar / completar / borrar
// ============================================================
function parsearHoraCuba(low) {
  const now = Date.now();

  // "en 30 minutos", "en 2 horas", "en 45 segundos"
  let m = low.match(/\ben\s+(\d+)\s*(segundos?|seg|minutos?|min|horas?|hrs?|h)\b/);
  if (m) {
    const n = +m[1];
    const unit = m[2];
    const ms = /^seg/.test(unit) ? n * 1000
             : /^min/.test(unit) ? n * 60000
             : n * 3600000;
    return now + ms;
  }

  // "a las 10:07 am", "a las 10 pm", "a las 08:30"
  m = low.match(/\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/);
  if (m) {
    let hh = +m[1];
    const mm = m[2] ? +m[2] : 0;
    const suf = (m[3] || '').toLowerCase();
    if (/^p/.test(suf) && hh < 12) hh += 12;
    if (/^a/.test(suf) && hh === 12) hh = 0;

    // Obtener componentes de fecha Cuba
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Havana',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const Y = +partes.find(p => p.type === 'year').value;
    const M = +partes.find(p => p.type === 'month').value;
    const D = +partes.find(p => p.type === 'day').value;

    // Offset Cuba actual (GMT-5 invierno, GMT-4 verano)
    const offStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Havana',
      timeZoneName: 'shortOffset'
    }).formatToParts(new Date()).find(p => p.type === 'timeZoneName').value;
    const offMatch = offStr.match(/GMT([+-]\d+)/);
    const offsetH = offMatch ? -parseInt(offMatch[1], 10) : 5;

    let target = Date.UTC(Y, M - 1, D, hh - offsetH, mm, 0, 0);
    if (target <= now) target += 86400000;
    return target;
  }

  // "mañana"
  if (/\bmañana\b/.test(low)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }

  return null;
}

function limpiarTextoRecordatorio(texto) {
  return texto
    .replace(/^(recuérdame|recuerdame|recuerda|anota|apunta|agenda|recordatorio)\s*/i, '')
    .replace(/\ba\s+las?\s+\d{1,2}(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b/i, '')
    .replace(/\ben\s+\d+\s*(segundos?|seg|minutos?|min|horas?|hrs?|h)\b/i, '')
    .replace(/\b(hoy|mañana|mediodía|mediodia|por favor)\b/gi, '')
    .replace(/[,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function crearTarea(texto, remindAt) {
  const limpio = limpiarTextoRecordatorio(texto);
  if (!limpio) return { ok: false, error: 'Texto vacío' };
  try {
    const r = await fetchJSON(`${API}/ania/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texto: limpio.charAt(0).toUpperCase() + limpio.slice(1),
        remindAt: remindAt ? new Date(remindAt).toISOString() : null,
        usuario: ANIA_USER,
        source: 'telegram',
        notifyVia: 'telegram'   // ✅ Se avisará SOLO por Telegram
      })
    });
    if (!r || !r.id) throw new Error('Respuesta inválida');
    return { ok: true, tarea: r };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function listarTareas() {
  try {
    const r = await fetchJSON(`${API}/ania/tasks?user=${encodeURIComponent(ANIA_USER)}`);
    return Array.isArray(r) ? r : [];
  } catch { return []; }
}

async function completarTarea(key) {
  const tareas = await listarTareas();
  const hit = tareas.find(t => !t.done &&
    (t.id === key || t.texto.toLowerCase().includes(key.toLowerCase()))
  );
  if (!hit) return { ok: false };
  try {
    await fetchJSON(`${API}/ania/tasks/${hit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true })
    });
    return { ok: true, tarea: hit };
  } catch { return { ok: false }; }
}

async function borrarTarea(key) {
  const tareas = await listarTareas();
  const hit = tareas.find(t =>
    t.id === key || t.texto.toLowerCase().includes(key.toLowerCase())
  );
  if (!hit) return { ok: false };
  try {
    await fetchJSON(`${API}/ania/tasks/${hit.id}`, { method: 'DELETE' });
    return { ok: true, tarea: hit };
  } catch { return { ok: false }; }
}

function formatearTareaLinea(t, i) {
  const when = t.remindAt
    ? new Date(t.remindAt).toLocaleString('es-CU', {
        timeZone: 'America/Havana',
        hour: '2-digit', minute: '2-digit',
        day: 'numeric', month: 'short'
      })
    : '—';
  const check = t.done ? '✅' : '▫️';
  return `${check} <b>${i + 1}.</b> ${escTG(t.texto)} <i>(${escTG(when)})</i>`;
}

// ============================================================
// 📤 INFORME DIARIO
// ============================================================
async function enviarInforme(chatDestino) {
  const data = await fetchJSON(`${API}/informe-diario`);
  if (!data.ok || !data.mensajes) {
    throw new Error('El backend no pudo generar el informe');
  }
  for (const msg of data.mensajes) {
    await tg('sendMessage', {
      chat_id: chatDestino,
      text: msg,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    await sleep(600);
  }
}

// ============================================================
// 🧠 CEREBRO · decide cómo responder
// ============================================================
async function responderNatural(texto) {
  const low = texto.toLowerCase().trim();

  // ---------- 1) Crear tarea ----------
  if (/^(recuérdame|recuerdame|recuerda|anota|apunta|agenda|recordatorio)/.test(low)) {
    const when = parsearHoraCuba(low);
    const r = await crearTarea(texto, when);
    if (!r.ok) {
      return '⚠️ No pude guardar la tarea ahora mismo. Revisa el backend e intenta de nuevo.';
    }
    const cuando = when
      ? `Te aviso a las <b>${escTG(horaCubaStr(new Date(when)))}</b> (hora Cuba)`
      : 'Sin hora, pero quedará en tu agenda';
    return `⏰ Anotado: <b>${escTG(r.tarea.texto)}</b>\n${cuando}.`;
  }

  // ---------- 2) Listar tareas ----------
  if (/^(mis tareas|qué tengo|que tengo|pendientes|agenda|tareas)\b/.test(low)) {
    const tareas = await listarTareas();
    const pend = tareas.filter(t => !t.done);
    if (!pend.length) return 'Tu agenda está limpia como taza recién lavada ☕';
    pend.sort((a, b) => (a.remindAt || 9e15) - (b.remindAt || 9e15));
    const lista = pend.slice(0, 12).map(formatearTareaLinea).join('\n');
    return `📋 <b>Pendientes (${pend.length})</b>\n\n${lista}`;
  }

  // ---------- 3) Completar tarea ----------
  let m = low.match(/^(?:tarea\s+)?(?:hecha|completada|terminada|lista)\s+(.+)/);
  if (!m) m = low.match(/^completa(?:r)?\s+(?:la\s+tarea\s+)?(.+)/);
  if (m) {
    const r = await completarTarea(m[1].trim());
    if (r.ok) return `✅ Bien hecho: «${escTG(r.tarea.texto)}» marcada como completada.`;
    return '🤔 No encontré esa tarea pendiente en la agenda.';
  }

  // ---------- 4) Borrar tarea ----------
  m = low.match(/^(?:borra|elimina)\s+(?:la\s+)?tarea\s+(.+)/);
  if (m) {
    const r = await borrarTarea(m[1].trim());
    if (r.ok) return `🗑️ Eliminada: «${escTG(r.tarea.texto)}».`;
    return '🤔 No encontré esa tarea.';
  }

  // ---------- 5) KB local de Ania ----------
  const kb = buscarEnKBAnia(low);
  if (kb) return kb;

  // ---------- 6) Productos de la tienda ----------
  if (/\b(precio|cuesta|vende|producto|cat[aá]logo|medicamento|tecnolog[ií]a|qu[eé] tienen)\b/.test(low)) {
    return await respuestaProductos();
  }

  // ---------- 7) IA con la personalidad de Ania ----------
  try {
    const contexto = await obtenerCatalogoTexto();
    const ia = await consultarANIA(texto, contexto);
    if (ia.ok) return escTG(ia.texto).slice(0, 900);
  } catch (e) {
    console.warn('Error IA Ania:', e.message);
  }

  // ---------- 8) Último recurso ----------
  return '⚡ Estoy aquí. Pregúntame de café, isekai, zombies, astronomía, o dime «recuérdame X a las 10:00 am» y lo agendo.';
}

// ============================================================
// 📨 COMANDOS
// ============================================================
async function procesarComandos(state) {
  const j = await tg('getUpdates', {
    timeout: 0,
    offset: state.offset || 0,
    allowed_updates: ['message']
  });
  if (!j.ok || !j.result.length) return state;

  for (const upd of j.result) {
    state.offset = upd.update_id + 1;
    const msg = upd.message;
    if (!msg || !msg.text) continue;

    const chatId = msg.chat.id;
    const texto = msg.text.trim();
    const low = texto.toLowerCase();
    let respuesta = null;

    if (low.startsWith('/start')) {
      respuesta = `¡Hola! 🤖 Soy <b>Ania</b>, tu asistente personal. ☕🎌🧟🌌

<b>Comandos rápidos:</b>
/productos — catálogo con precios reales
/web — enlace a la tienda
/informe — informe del día con noticias
/estado — estado del sistema
/tareas — ver agenda pendiente

💬 También puedes escribirme natural:
• «recuérdame tomar agua a las 10:00 am»
• «mis tareas»
• «tarea hecha tomar agua»
• «cuéntame algo de café / isekai / zombies»
• O simplemente «hola»`;

    } else if (low.startsWith('/help')) {
      respuesta = `📋 <b>Ayuda de Ania</b>

<b>Comandos:</b>
/start — bienvenida
/productos — catálogo y precios
/web — enlace de la tienda
/informe — informe del día
/estado — estado del sistema
/tareas — agenda pendiente

<b>Tareas (lenguaje natural):</b>
• «recuérdame llamar a mamá a las 6 pm»
• «anota comprar pan en 30 minutos»
• «mis tareas»
• «tarea hecha comprar pan»
• «borra tarea comprar pan»

<b>Sobremesa (personalidad):</b>
Pregúntame por café, isekai, zombies, astronomía, pan o tecnología. 🎭`;

    } else if (low.startsWith('/web')) {
      respuesta = `🔗 Nuestra tienda: ${TIENDA}`;

    } else if (low.startsWith('/productos')) {
      respuesta = await respuestaProductos();

    } else if (low.startsWith('/tareas')) {
      const tareas = await listarTareas();
      const pend = tareas.filter(t => !t.done);
      if (!pend.length) {
        respuesta = '📋 Tu agenda está limpia. Dime «recuérdame X a las Y» para agregar una.';
      } else {
        pend.sort((a, b) => (a.remindAt || 9e15) - (b.remindAt || 9e15));
        const lista = pend.slice(0, 12).map(formatearTareaLinea).join('\n');
        respuesta = `📋 <b>Pendientes (${pend.length})</b>\n\n${lista}`;
      }

    } else if (low.startsWith('/informe')) {
      try { await enviarInforme(chatId); }
      catch (e) { respuesta = `❌ ${escTG(e.message)}`; }

    } else if (low.startsWith('/estado')) {
      const pend = (await listarTareas()).filter(t => !t.done).length;
      respuesta = `🟢 <b>ANIA OS v14.0</b>\n` +
                  `🕒 Hora Cuba: ${horaCubaStr()}\n` +
                  `📅 ${fechaCubaStr()}\n` +
                  `📋 Tareas pendientes: ${pend}\n` +
                  `🌐 Backend: ${API.split('/')[2]}`;

    } else {
      // Lenguaje natural → cerebro de Ania
      respuesta = await responderNatural(texto);
    }

    if (respuesta) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: respuesta,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    }
  }

  return state;
}

// ============================================================
// 🚀 MAIN
// ============================================================
(async () => {
  try {
    // Limpieza defensiva (por si quedara un webhook residual)
    await tg('deleteWebhook', { drop_pending_updates: false });

    const state = await getState();
    await procesarComandos(state);

    // Informe diario a la hora indicada (hora Cuba)
    const hoy = fechaCuba();
    if (CHAT_ID && horaCuba() >= HORA_INFORME && state.ultimoInforme !== hoy) {
      console.log('📤 Enviando informe diario...');
      try {
        await enviarInforme(CHAT_ID);
        state.ultimoInforme = hoy;
        console.log('✅ Informe enviado');
      } catch (e) {
        console.error('❌ Error enviando informe:', e.message);
      }
    }

    await setState(state);
    console.log(`✅ Ciclo completado · ${horaCubaStr()} Cuba · offset ${state.offset || 0}`);
  } catch (e) {
    console.error('❌ Error del bot:', e);
    process.exitCode = 1;
  }
})();
