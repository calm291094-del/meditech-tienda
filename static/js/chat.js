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
        // ✅ CORRECCIÓN: Obtener productos de forma segura (Backend o Fallback)
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
            // Fallback seguro: solo usa S.pr si existe y es un array
            if (window.S && window.S.pr && Array.isArray(window.S.pr)) {
                productosContexto = window.S.pr.slice(0, 15).map(p => 
                    `• ${p.name} ($${p.price}) - Stock: ${p.stock}`
                ).join('\n');
            }
        }

        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: 'system', 
                        content: `Eres el asistente de MediTech, una tienda en Holguín, Cuba. 
                        CATÁLOGO DISPONIBLE:\n${productosContexto}\n
                        REGLAS: Responde en español, sé amable y conciso (máx 3-4 líneas). 
                        Si preguntan por productos, usa la información del catálogo. 
                        Si no sabes algo, di que no está disponible. Recomienda consultar a un médico para temas de salud.`
                    },
                    { role: 'user', content: txt }
                ],
                model: 'openai'
            })
        });
        
        let respuesta = 'Disculpa, tuve un problema de conexión. ¿Puedes repetir?';
        if (response.ok) {
            respuesta = await response.text();
            respuesta = respuesta.replace(/```[\s\S]*?```/g, '').trim();
            respuesta = respuesta.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
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
