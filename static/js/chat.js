// ============================================
// CHAT.JS — Ania: chatbot inteligente y seguro (MEJORADO)
// ============================================
const CHAT = {
    historia: [],       // memoria de la conversación
    datos: null,        // catálogo cacheado
    datosTs: 0,
    ocupado: false,
    intencionesDetectadas: [],  // 🧠 Para mejorar contexto
    ultimoProducto: null        // 🧠 Recordar último producto consultado
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
    let t = String(txt).replace(/`[\s\S]*?`/g, '').replace(/```/g, '');
    t = t.replace(/<\s*(script|iframe|object|embed|form)[\s\S]*?>/gi, '')
         .replace(/<\s*\/\s*(script|iframe|object|embed|form)\s*>/gi, '');
    t = t.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    t = t.replace(/javascript\s*:/gi, '');
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return t.replace(/\n/g, '<br>').trim();
}

// 🔒 Detectar si hay sesión activa
function haySesionChat() {
    const session = localStorage.getItem('session');
    if (session && session !== 'null' && session !== '') return true;
    const clavesAlt = ['mt_session', 'currentUser', 'auth_user'];
    for (const key of clavesAlt) {
        const val = localStorage.getItem(key);
        if (val && val !== 'null' && val !== '') return true;
    }
    return false;
}

// 👤 Obtener nombre del usuario si está logueado
function getNombreUsuarioChat() {
    try {
        const session = localStorage.getItem('session');
        if (session) {
            const data = JSON.parse(session);
            return data.name || data.username || data.usuario || null;
        }
    } catch(e) {}
    return null;
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
    const nombreUsuario = getNombreUsuarioChat();
    const saludoPersonalizado = nombreUsuario ? `El usuario se llama ${nombreUsuario}. ` : '';
    
    const system = `Eres "Ania", asistente virtual de MediTech, tienda de medicamentos, tecnología y accesorios de salud en Holguín, Cuba.
${saludoPersonalizado}
REGLAS OBLIGATORIAS:
Responde SIEMPRE en español, tono amable, máximo 3-4 líneas.
Para productos, precios o stock usa SOLO este catálogo real. NUNCA inventes productos, precios ni disponibilidad:
${catalogo.resumenTexto}
Si preguntan por un producto, da su precio exacto y stock del catálogo.
Si preguntan cómo comprar, indica que pueden añadir al carrito en la web o pedir ayuda para armar el pedido.
Si preguntan algo ajeno a la tienda, responde con simpatía y redirige al tema de MediTech.
No uses markdown (#, -, *); texto simple con algún emoji.
Horario de atención: Lunes a Sábado de 9:00 AM a 6:00 PM.
Ubicación: Holguín, Cuba.`;

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

// 🧩 Fallback local inteligente MEJORADO
function respuestaLocal(txt, catalogo) {
    const lower = txt.toLowerCase();
    const nombreUsuario = getNombreUsuarioChat();
    const saludo = nombreUsuario ? `¡Hola ${nombreUsuario}! ` : '¡Hola! ';
    const hits = buscarProductos(txt, catalogo.productos);

    // 🔒 Si no hay sesión, invitar a registrarse
    if (!haySesionChat()) {
        if (/\b(hola|buenas|saludos)\b/.test(lower)) {
            return `${saludo}☕️ Soy Ania, asistente de MediTech. Para ver el catálogo completo y comprar, <strong>necesitas crear una cuenta gratuita</strong>. Haz clic en "Iniciar Sesión" arriba a la derecha 🔒`;
        }
        if (/\b(producto|catalogo|precio|medicamento|tecnologia|comprar)\b/.test(lower)) {
            return `🔒 Para ver productos, precios y comprar necesitas una cuenta. <strong>¡Registrarse es gratis y toma menos de 1 minuto!</strong> Haz clic en "Iniciar Sesión" arriba a la derecha.`;
        }
    }

    // Saludos
    if (/\b(hola|buenas|saludos|hey|hi|buenos días|buenas tardes|buenas noches)\b/.test(lower)) {
        return `${saludo}☕️ Soy Ania, asistente de MediTech. ¿Buscas medicamentos o tecnología? Pregúntame por cualquier producto con su precio 😊`;
    }

    // Resultados de búsqueda de productos
    if (hits.length) {
        // 🧠 Recordar último producto para contexto
        CHAT.ultimoProducto = hits[0];
        
        const lista = hits.map(p => {
            const stockInfo = p.stock <= 10 ? `⚠️ (solo ${p.stock})` : '✅';
            return `• <strong>${escaparHTML(p.name)}</strong> — $${p.price} ${stockInfo}`;
        }).join('<br>');
        return `Encontré esto en nuestro catálogo:<br><br>${lista}<br><br>¿Te interesa alguno? Puedes añadirlo al carrito en la web 🛒`;
    }

    // Agradecimientos
    if (/\b(gracias|thank|thx)\b/.test(lower)) {
        return `¡De nada! ☕️ ¿Necesitas algo más? ✨`;
    }

    // Información de compra
    if (/\b(pedido|comprar|carrito|envio|envío|delivery|domicilio)\b/.test(lower)) {
        return `📦 Para comprar: añade productos al carrito en la web y completa el formulario de pedido. El envío tiene costo adicional según tu zona. Si quieres, dime qué necesitas y te armo la lista.`;
    }

    // Horarios
    if (/\b(horario|hora|abierto|cierran|abren|atienden)\b/.test(lower)) {
        return `🕐 Nuestro horario de atención es:<br><br>📅 Lunes a Sábado: 9:00 AM - 6:00 PM<br>📅 Domingos: Cerrado<br><br>¡Te esperamos! 😊`;
    }

    // Ubicación
    if (/\b(donde|dónde|ubicacion|ubicación|dirección|direccion|quedan|estan)\b/.test(lower)) {
        return `📍 Estamos ubicados en Holguín, Cuba. Para consultas específicas de dirección o entregas, contáctanos por nuestro canal de Telegram.`;
    }

    // Formas de pago
    if (/\b(pago|pagar|tarjeta|efectivo|transferencia|como pago)\b/.test(lower)) {
        return `💳 Aceptamos efectivo y transferencias. Al completar tu pedido por correo, te indicaremos las opciones de pago disponibles para tu zona.`;
    }

    // Contacto
    if (/\b(contacto|telefono|teléfono|whatsapp|telegram|correo|email)\b/.test(lower)) {
        return `📱 Puedes contactarnos por:<br><br>🤖 Telegram: @AniaAsistenteBot (yo misma 😉)<br>🌐 Web: Este sitio web<br><br>¡Estoy aquí para ayudarte!`;
    }

    // Catálogo general
    if (/\b(producto|catalogo|catálogo|vende|precio|medicamento|tecnologia|tecnología|qué tienen)\b/.test(lower)) {
        return `💰 Estos son algunos productos disponibles:<br><br>${escaparHTML(catalogo.resumenTexto).slice(0, 700).replace(/\n/g, '<br>')}<br><br>¿Te interesa alguno en particular?`;
    }

    // Despedida
    if (/\b(adios|adiós|bye|hasta luego|chao|nos vemos)\b/.test(lower)) {
        return `¡Hasta pronto! 👋 Fue un placer ayudarte. Recuerda que estoy aquí 24/7 para lo que necesites. ¡Que tengas un excelente día! ✨`;
    }

    // Respuesta por defecto
    return `Disculpa, el servicio de IA está ocupado ahora mismo 😅 Pero puedo ayudarte con el catálogo: pregúntame por un producto, su precio o cómo comprar.`;
}

// ⚡ Botones rápidos MEJORADOS (contextuales)
function renderChips() {
    const chips = document.getElementById('chat-chips');
    if (!chips) return;
    
    const tieneSesion = haySesionChat();
    let opciones;
    
    if (tieneSesion) {
        opciones = ['🛍️ Ver productos', '💊 Medicamentos', '💻 Tecnología', '📦 ¿Cómo compro?', '🕐 Horarios', '💳 Formas de pago'];
    } else {
        opciones = ['🔐 ¿Cómo me registro?', '🛍️ Ver productos', '💊 Medicamentos', '💻 Tecnología'];
    }
    
    chips.innerHTML = opciones.map(o =>
        `<button class="chat-chip" onclick="quickSend('${o}')">${o}</button>`).join('');
}

function quickSend(t) {
    const i = document.getElementById('chat-input');
    if (!i) return;
    i.value = t;
    sendMessage();
}

// 💬 Envío principal MEJORADO
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
    messages.innerHTML += `<div id="${typingId}" class="message bot" style="background:#f3f4f6;"> <div class="typing-indicator" style="display:flex;gap:5px;padding:4px 0;"> <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;"></span> <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;animation-delay:0.2s;"></span> <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;animation-delay:0.4s;"></span> </div> </div>`;
    messages.scrollTop = messages.scrollHeight;

    try {
        const catalogo = await obtenerCatalogo();
        CHAT.historia.push({ role: 'user', content: txt });

        let respuesta = '';
        
        // 🔒 Si no hay sesión y pregunta por productos, usar fallback local directamente
        if (!haySesionChat() && /\b(producto|catalogo|precio|medicamento|comprar|tecnologia)\b/i.test(txt)) {
            respuesta = respuestaLocal(txt, catalogo);
            CHAT.historia.push({ role: 'assistant', content: respuesta.replace(/<[^>]+>/g, '') });
        } else {
            // Intentar con IA primero
            const ia = await llamarIA(CHAT.historia, catalogo);
            if (ia.ok && ia.texto.trim().length >= 10) {
                respuesta = limpiarRespuestaIA(ia.texto);
                CHAT.historia.push({ role: 'assistant', content: ia.texto });
            } else {
                respuesta = respuestaLocal(txt, catalogo);
                CHAT.historia.push({ role: 'assistant', content: respuesta.replace(/<[^>]+>/g, '') });
            }
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