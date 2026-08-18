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
        // ✅ NUEVO: Consultar productos reales desde el backend
        let productosContexto = 'No hay productos disponibles en este momento.';
        try {
            const response = await fetch(`${API_URL}/productos-resumen`);
            if (response.ok) {
                const data = await response.json();
                if (data.ok && data.resumenTexto) {
                    productosContexto = data.resumenTexto;
                    console.log(`📦 Chatbot: ${data.total} productos cargados para contexto`);
                }
            }
        } catch (e) {
            console.warn('⚠️ No se pudieron cargar productos, usando fallback');
            // Fallback a variable global si la API falla
            if (window.S && window.S.pr) {
                productosContexto = window.S.pr.slice(0, 30).map(p => 
                    `• ${p.name} (${p.category || 'general'}) - $${p.price} - Stock: ${p.stock}\n  ${p.description || ''}`
                ).join('\n\n');
            }
        }
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: 'system', 
                        content: `Eres el asistente virtual de MediTech, una tienda de medicamentos y tecnología en Holguín, Cuba.
                        
CATÁLOGO ACTUAL DE PRODUCTOS DISPONIBLES:
${productosContexto}

REGLAS IMPORTANTES:
- Responde SIEMPRE en español, de forma amigable y profesional.
- Si el cliente pregunta por un producto específico, busca en el catálogo y da precio, stock y descripción.
- Si pregunta por categorías (medicamentos, tecnología, gaming, salud), agrupa los productos relevantes.
- Si el stock es bajo (<5), avisa: "Quedan pocas unidades".
- Si el producto no está en el catálogo, di honestamente: "No lo tenemos disponible ahora, pero puedo sugerirte alternativas".
- SIEMPRE recomienda consultar a un médico para temas de salud.
- Usa emojis con moderación (💊 para medicamentos, 💻 para tecnología, 🎮 para gaming).
- Sé conciso: máximo 3-4 oraciones por respuesta.`
                    },
                    { role: 'user', content: txt }
                ],
                model: 'openai'
            })
        });
        
        let respuesta = 'Lo siento, no pude procesar tu pregunta. ¿Puedes reformularla?';
        if (response.ok) {
            respuesta = await response.text();
            respuesta = respuesta.replace(/```[\s\S]*?```/g, '').trim();
            respuesta = respuesta.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `<div class="message bot">${respuesta}</div>`;
    } catch (error) {
        console.error('Error en chat:', error);
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `
            <div class="message bot" style="background:#fee2e2;color:#991b1b;">❌ Error de conexión. Por favor intenta de nuevo.</div>
        `;
    }
    messages.scrollTop = messages.scrollHeight;
}
