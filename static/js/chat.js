// ============================================
// CHAT.JS - CHATBOT MEJORADO Y ESTABLE
// ============================================

function toggleChat() {
    const win = document.getElementById('chatbot-window');
    const btn = document.querySelector('.chatbot-toggle');
    if (!win || !btn) return;
    win.classList.toggle('open');
    btn.innerHTML = win.classList.contains('open') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-comment-dots"></i>';
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    const txt = input.value.trim();
    if (!txt) return;
    
    messages.innerHTML += `<div class="message user">${txt}</div>`;
    input.value = '';
    
    const typingId = 'typing-' + Date.now();
    messages.innerHTML += `
        <div id="${typingId}" class="message bot" style="background:#f3f4f6;">
            <div class="typing-indicator" style="display:flex;gap:5px;padding:4px 0;">
                <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;"></span>
                <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;animation-delay:0.2s;"></span>
                <span style="width:8px;height:8px;border-radius:50%;background:#0d9488;animation:typing 1.4s infinite;animation-delay:0.4s;"></span>
            </div>
        </div>
    `;
    messages.scrollTop = messages.scrollHeight;
    
    try {
        // 1. Obtener productos de forma segura
        let productosContexto = "No hay productos disponibles en este momento.";
        try {
            const apiUrl = window.API_URL || 'https://meditech-bot.onrender.com/api';
            const res = await fetch(`${apiUrl}/productos-resumen`);
            if (res.ok) {
                const data = await res.json();
                if (data.ok && data.resumenTexto) {
                    productosContexto = data.resumenTexto;
                }
            }
        } catch (e) {
            console.warn("⚠️ No se pudo cargar el catálogo desde API, usando fallback local.");
            if (window.S && window.S.pr && Array.isArray(window.S.pr)) {
                productosContexto = window.S.pr.slice(0, 15).map(p => `• ${p.name} ($${p.price}) - Stock: ${p.stock}`).join('\n');
            }
        }

        let respuesta = '';
        let usoIA = true;

        // 2. Intentar usar la IA
        try {
            const response = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { 
                            role: 'system', 
                            content: `Eres el asistente de MediTech, una tienda en Holguín, Cuba. CATÁLOGO:\n${productosContexto}\nResponde en español, sé amable y conciso (máx 3-4 líneas). Si preguntan por productos, usa la información del catálogo.`
                        },
                        { role: 'user', content: txt }
                    ],
                    model: 'openai'
                })
            });
            
            if (response.ok) {
                respuesta = await response.text();
                respuesta = respuesta.replace(/```[\s\S]*?```/g, '').trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            } else if (response.status === 402) {
                console.warn('⚠️ Pollinations AI devolvió 402 (Límite alcanzado). Usando respuestas locales.');
                usoIA = false;
            } else {
                console.warn(`⚠️ Pollinations AI devolvió status ${response.status}`);
                usoIA = false;
            }
        } catch (error) {
            console.error('❌ Error conectando con IA:', error);
            usoIA = false;
        }

        // 3. Fallback local inteligente si la IA falla o está limitada
        if (!usoIA || respuesta.length < 10) {
            const lower = txt.toLowerCase();
            if (lower.includes('hola') || lower.includes('buenas') || lower.includes('saludos')) {
                respuesta = "¡Hola! ☕️ Soy el asistente de MediTech. ¿En qué puedo ayudarte hoy? ✨";
            } else if (lower.includes('producto') || lower.includes('vende') || lower.includes('catalogo') || lower.includes('medicamento') || lower.includes('tecnologia')) {
                respuesta = `💰 Tenemos productos disponibles. Aquí un resumen:\n\n${productosContexto}\n\n¿Te interesa alguno en particular?`;
            } else if (lower.includes('precio') || lower.includes('cuesta')) {
                respuesta = "💰 Los precios varían según el producto. Puedes ver el catálogo completo en nuestra web o preguntarme por un artículo específico.";
            } else if (lower.includes('gracias')) {
                respuesta = "¡De nada! ☕️ ¿Necesitas algo más? ✨";
            } else {
                respuesta = "Disculpa, el servicio de IA está temporalmente ocupado. Pero puedo decirte que tenemos medicamentos, tecnología y accesorios de salud. ¿Buscas algo en específico?";
            }
        }
        
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `<div class="message bot">${respuesta}</div>`;
    } catch (error) {
        console.error('❌ Error en chat:', error);
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `<div class="message bot" style="background:#fee2e2;color:#991b1b;">❌ Error de conexión. Intenta de nuevo.</div>`;
    }
    messages.scrollTop = messages.scrollHeight;
}
