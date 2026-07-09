// ============================================
// CHAT.JS - CHATBOT
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
        const productosContexto = S.pr.slice(0, 20).map(p => 
            `- ${p.name} ($${p.price}): ${(p.desc || '').substring(0, 100)}... Stock: ${p.stock}`
        ).join('\n');

        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: 'system', 
                        content: `Eres el asistente de MediTech, una tienda de medicamentos y tecnología. 
                        Tienes acceso a estos productos:\n${productosContexto}\n
                        Responde de forma amigable, profesional y concisa en español. 
                        Si preguntan por un producto específico, dales información del mismo.
                        Si preguntan por precios, menciónalos.
                        Siempre recomienda consultar a un médico para temas de salud.`
                    },
                    { role: 'user', content: txt }
                ],
                model: 'openai'
            })
        });

        let respuesta = 'Lo siento, no pude procesar tu pregunta.';
        if (response.ok) {
            respuesta = await response.text();
            respuesta = respuesta.replace(/```[\s\S]*?```/g, '').trim();
            respuesta = respuesta.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

        document.getElementById(typingId)?.remove();

        messages.innerHTML += `
            <div class="message bot">${respuesta}</div>
        `;
    } catch (error) {
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `
            <div class="message bot" style="background:#fee2e2;color:#991b1b;">❌ Error de conexión. Por favor intenta de nuevo.</div>
        `;
    }
    messages.scrollTop = messages.scrollHeight;
}
