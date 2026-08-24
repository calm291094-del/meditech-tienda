// ============================================
// CHAT.JS — Ania: chatbot inteligente y seguro
// ============================================
const CHAT = {
  historia: [],       // memoria de la conversación
  datos: null,        // catálogo cacheado
  datosTs: 0,
  ocupado: false
};

function toggleChat() {
  const win = document.getElementById('chatbot-window');
  const btn = document.querySelector('.chatbot-toggle');
  if (!win || !btn) return;
  win.classList.toggle('open');
  btn.innerHTML = win.classList.contains('open') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-comment-dots"></i>';
  if (win.classList.contains('open')) renderChips();
}

// 🛡️ Sanitización (evita XSS)
function escaparHTML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function limpiarRespuestaIA(txt) {
  let t = String(txt).replace(/```[\s\S]*?```/g, '').replace(/```/g, '');
  t = t.replace(/<\s*(script|iframe|object|embed|form)[\s\S]*?>/gi, '')
       .replace(/<\s*\/\s*(script|iframe|object|embed|form)\s*>/gi, '');
  t = t.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  t = t.replace(/javascript\s*:/gi, '');
  t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return t.replace(/\n/g, '<br>').trim();
}

// 🛒 Catálogo real (cache 5 min)
async function obtenerCatalogo(force = false) {
  const ahora = Date.now();
  if (!force && CHAT.datos && ahora - CHAT.datosTs < 5 * 60 * 1000) return CHAT.datos;
  try {
    const apiUrl = window.API_URL || 'https://meditech-bot.onrender.com/api';
    const r = await fetch(`${apiUrl}/productos-resumen`);
    const d = await r.json();
    if (d.ok) { CHAT.datos = d; CHAT.datosTs = ahora; }
  } catch (e) {
    console.warn('⚠️ Catálogo no disponible:', e.message);
  }
  return CHAT.datos || { ok: false, resumenTexto: 'Catálogo no disponible ahora mismo.', productos: [] };
}

function buscarProductos(texto, productos) {
  const términos = texto.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (!términos.length) return [];
  return (productos || []).filter(p =>
    términos.some(t => `${p.name} ${p.category}`.toLowerCase().includes(t))
  ).slice(0, 6);
}

// 🧠 IA (Pollinations) con fallback en cascada
async function llamarIA(historia, catalogo) {
  const system = `Eres "Ania", asistente virtual de MediTech, tienda de medicamentos, tecnología y accesorios de salud en Holguín, Cuba.
REGLAS OBLIGATORIAS:
1. Responde SIEMPRE en español, tono amable, máximo 3-4 líneas.
2. Para productos, precios o stock usa SOLO este catálogo real. NUNCA inventes productos, precios ni disponibilidad:
${catalogo.resumenTexto}
3. Si preguntan por un producto, da su precio exacto y stock del catálogo.
4. Si preguntan cómo comprar, indica que pueden añadir al carrito en la web o pedir ayuda para armar el pedido.
5. Si preguntan algo ajeno a la tienda, responde con simpatía y redirige al tema de MediTech.
6. No uses markdown (#, -, *); texto simple con algún emoji.`;

  const mensajes = [
    { role: 'system', content: system },
    ...historia.slice(-8) // memoria: últimos 8 turnos
  ];

  // Intento 1: POST
  try {
    const r = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: mensajes, model: 'openai' })
    });
    if (r.ok) return { texto: await r.text(), ok: true };
    if (r.status === 402) return { ok: false, limitado: true };
  } catch (e) { console.warn('IA POST falló:', e.message); }

  // Intento 2: GET simple
  try {
    const prompt = encodeURIComponent(mensajes.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:');
    const r = await fetch(`https://text.pollinations.ai/${prompt.slice(0, 6000)}`);
    if (r.ok) return { texto: await r.text(), ok: true };
  } catch (e) { console.warn('IA GET falló:', e.message); }

  return { ok: false };
}

// 🧩 Fallback local inteligente (con búsqueda de productos por nombre)
function respuestaLocal(txt, catalogo) {
  const lower = txt.toLowerCase();
  const hits = buscarProductos(txt, catalogo.productos);

  if (/\b(hola|buenas|saludos)\b/.test(lower)) {
    return '¡Hola! ☕️ Soy Ania, asistente de MediTech. ¿Buscas medicamentos o tecnología? Pregúntame por cualquier producto con su precio 😊';
  }
  if (hits.length) {
    const lista = hits.map(p => `• <strong>${escaparHTML(p.name)}</strong> — $${p.price} ${p.stock <= 10 ? `⚠️ (solo ${p.stock})` : '✅'}`).join('<br>');
    return `Encontré esto en nuestro catálogo:<br><br>${lista}<br><br>¿Te interesa alguno? Puedes añadirlo al carrito en la web 🛒`;
  }
  if (/\b(gracias)\b/.test(lower)) return '¡De nada! ☕️ ¿Necesitas algo más? ✨';
  if (/\b(pedido|comprar|carrito|envio|envío)\b/.test(lower)) {
    return '📦 Para comprar: añade productos al carrito en la web y completa el formulario de pedido. Si quieres, dime qué necesitas y te armo la lista.';
  }
  if (/\b(producto|catalogo|catálogo|vende|precio|medicamento|tecnologia|tecnología)\b/.test(lower)) {
    return `💰 Estos son algunos productos disponibles:<br><br>${escaparHTML(catalogo.resumenTexto).slice(0, 700).replace(/\n/g, '<br>')}<br><br>¿Te interesa alguno en particular?`;
  }
  return 'Disculpa, el servicio de IA está ocupado ahora mismo 😅 Pero puedo ayudarte con el catálogo: pregúntame por un producto, su precio o cómo comprar.';
}

// ⚡ Botones rápidos
function renderChips() {
  const chips = document.getElementById('chat-chips');
  if (!chips) return;
  const opciones = ['🛍️ Ver productos', '💊 Medicamentos', '💻 Tecnología', '📦 ¿Cómo compro?'];
  chips.innerHTML = opciones.map(o =>
    `<button class="chat-chip" onclick="quickSend('${o}')">${o}</button>`).join('');
}
function quickSend(t) {
  const i = document.getElementById('chat-input');
  if (!i) return;
  i.value = t;
  sendMessage();
}

// 💬 Envío principal
async function sendMessage() {
  if (CHAT.ocupado) return;
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const txt = input.value.trim();
  if (!txt) return;

  CHAT.ocupado = true;
  input.value = '';
  messages.innerHTML += `<div class="message user">${escaparHTML(txt)}</div>`; // ✅ escapado

  const typingId = 'typing-' + Date.now();
  messages.innerHTML += `
    <div id="${typingId}" class="message bot" style="background:#f3f4f6;">
      <div class="typing-indicator" style="display:flex;gap:5px;padding:4px 0;">
        <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;animation-delay:0.2s;"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;animation-delay:0.4s;"></span>
      </div>
    </div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const catalogo = await obtenerCatalogo();
    CHAT.historia.push({ role: 'user', content: txt });

    let respuesta = '';
    const ia = await llamarIA(CHAT.historia, catalogo);
    if (ia.ok && ia.texto.trim().length >= 10) {
      respuesta = limpiarRespuestaIA(ia.texto);
      CHAT.historia.push({ role: 'assistant', content: ia.texto });
    } else {
      respuesta = respuestaLocal(txt, catalogo);
      CHAT.historia.push({ role: 'assistant', content: respuesta.replace(/<[^>]+>/g, '') });
    }
    if (CHAT.historia.length > 16) CHAT.historia = CHAT.historia.slice(-16);

    document.getElementById(typingId)?.remove();
    messages.innerHTML += `<div class="message bot">${respuesta}</div>`;
  } catch (e) {
    console.error('❌ Error en chat:', e);
    document.getElementById(typingId)?.remove();
    messages.innerHTML += `<div class="message bot" style="background:#fee2e2;color:#991b1b;">❌ Error de conexión. Intenta de nuevo.</div>`;
  }

  messages.scrollTop = messages.scrollHeight;
  renderChips();
  CHAT.ocupado = false;
}