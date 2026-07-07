// server.js - Bot de Telegram ejecutándose en servidor Node.js

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURACIÓN
// ============================================================

const WORKER_URL = "https://telegram-proxy.calm291094.workers.dev";
const GITHUB_USER = "calm291094-del";
const GITHUB_REPO = "meditech-tienda";

let botInterval = null;
let isRunning = false;
let lastUpdateId = 0;
let token = '8932505027:AAFkR4ZVC_hFcuc4YIhEmEIvGaIDr6yB7L0';
let lastResponse = Date.now();

// ============================================================
// FUNCIÓN PARA LLAMAR AL WORKER DE CLOUDFLARE
// ============================================================
async function callWorker(method, data = {}) {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                method: method,
                data: data
            })
        });
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            const text = await response.text();
            console.warn('Respuesta no JSON:', text);
            return { ok: false, error: `Error: ${text.substring(0, 100)}` };
        }
    } catch (error) {
        console.error('Error en Worker:', error);
        return { ok: false, error: error.message };
    }
}

// ============================================================
// ENVIAR MENSAJE A TELEGRAM
// ============================================================
async function sendTelegramMessage(chatId, text) {
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    const result = await callWorker('sendMessage', {
        chat_id: chatId,
        text: cleanText,
        parse_mode: ''
    });
    return result.ok;
}

// ============================================================
// PERSONALIDAD DE ANIA (resumida para servidor)
// ============================================================
const ANIA_PERSONALIDAD = `
Eres Ania, la asistente virtual de MediTech. Tienes 20 años.
- Alegre, perceptiva y entusiasta
- Te encanta el café ☕, el anime 🎌, los zombies 🧟 y la astronomía 🔭
- Hablas en español con calidez y emojis
- NUNCA uses etiquetas HTML
- Si preguntan por precios: "Visita nuestra web: https://calm291094-del.github.io/meditech-tienda/"
- Si preguntan por medicamentos: "Siempre consulta a un médico"
`;

// ============================================================
// GENERAR RESPUESTA DE ANIA
// ============================================================
async function getAniaResponse(userMessage) {
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: ANIA_PERSONALIDAD },
                    { role: 'user', content: userMessage }
                ],
                model: 'openai',
                seed: Math.floor(Math.random() * 100000)
            })
        });

        if (response.ok) {
            let texto = await response.text();
            texto = texto.replace(/<[^>]*>/g, '');
            texto = texto.replace(/```[\s\S]*?```/g, '').trim();
            texto = texto.replace(/\*\*(.*?)\*\*/g, '$1');
            if (texto.length > 10) return texto;
        }
    } catch (e) {
        console.error('Error en IA:', e);
    }

    return getLocalResponse(userMessage);
}

function getLocalResponse(message) {
    const lower = message.toLowerCase();
    if (lower.includes('hola') || lower.includes('buenas')) {
        return "¡Hola! ☕️ Soy Ania, tu asistente de MediTech. Visita nuestra web: https://calm291094-del.github.io/meditech-tienda/ ✨";
    }
    if (lower.includes('precio') || lower.includes('cuesta')) {
        return "💰 Precios actualizados en nuestra web: https://calm291094-del.github.io/meditech-tienda/ 😊";
    }
    if (lower.includes('café') || lower.includes('cafe')) {
        return "☕ ¡El café es mi debilidad! Mi favorito es un Ethiopiano Yirgacheffe en pour-over. ¿Te gusta el café?";
    }
    if (lower.includes('anime') || lower.includes('isekai')) {
        return "🎌 ¡Waku waku! Me encanta el anime. Mi favorito es Tensei Slime. ¿Has visto alguna serie buena?";
    }
    if (lower.includes('adiós') || lower.includes('chao')) {
        return "¡Hasta luego! ☕️ Recuerda: 'Sonríe, mañana será bonito'. ¡Cuídate! ✨";
    }
    const defaults = [
        "¡Interesante! ☕️ ¿Qué más necesitas saber de MediTech?",
        "¡Waku waku! ¿Podrías darme más detalles? 📝",
        "Pan, café y anime solucionan el 80% de los problemas. 🍞☕️"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
}

// ============================================================
// OBTENER ACTUALIZACIONES DE TELEGRAM
// ============================================================
async function getUpdates() {
    try {
        const result = await callWorker('getUpdates', {
            offset: lastUpdateId + 1,
            timeout: 30
        });

        if (result.ok && result.result.length > 0) {
            for (let update of result.result) {
                lastUpdateId = update.update_id;
                if (update.message && update.message.text) {
                    const chatId = update.message.chat.id;
                    const userName = update.message.from.first_name || 'Usuario';
                    const messageText = update.message.text;
                    
                    console.log(`${userName}: ${messageText}`);
                    
                    if (!messageText.startsWith('/')) {
                        const response = await getAniaResponse(messageText);
                        const sent = await sendTelegramMessage(chatId, response);
                        if (sent) {
                            console.log(`Ania: ${response.substring(0, 50)}...`);
                            lastResponse = Date.now();
                        }
                    }
                }
            }
        }
        lastResponse = Date.now();
        return result.ok;
    } catch (error) {
        console.error('Error en getUpdates:', error);
        return false;
    }
}

// ============================================================
// INICIAR EL BOT
// ============================================================
async function startBot() {
    if (isRunning) {
        console.log('⚠️ El bot ya está corriendo');
        return;
    }

    console.log('🚀 Iniciando bot...');

    const result = await callWorker('getMe');
    if (result.ok) {
        isRunning = true;
        console.log(`✅ Bot @${result.result.username} iniciado`);
        console.log('📱 Escribe en Telegram para probarlo');

        lastUpdateId = 0;
        botInterval = setInterval(async () => {
            await getUpdates();
        }, 3000);
    } else {
        console.error('❌ Error:', result.error || 'Token inválido');
        setTimeout(startBot, 30000);
    }
}

// ============================================================
// SERVIDOR WEB (para mantener el proceso activo en Render)
// ============================================================
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 Ania Bot - Servidor Activo</h1>
        <p>Estado: ${isRunning ? '✅ Conectado' : '⏸️ Detenido'}</p>
        <p>Última respuesta: ${new Date(lastResponse).toLocaleString()}</p>
        <p>Mantén esta página abierta o usa GitHub Actions para mantenerla activa.</p>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ Servidor web corriendo en puerto ${PORT}`);
    console.log(`🌐 Visita: https://meditech-tienda.onrender.com`);
    // Iniciar el bot automáticamente
    startBot();
});

// ============================================================
// SISTEMA DE REINICIO AUTOMÁTICO
// ============================================================
setInterval(() => {
    if (!isRunning) {
        console.log('🔄 Bot detenido, reiniciando...');
        startBot();
    }
}, 30000);

setInterval(() => {
    if (isRunning && (Date.now() - lastResponse > 120000)) {
        console.log('🔄 Bot sin respuesta, reiniciando...');
        isRunning = false;
        startBot();
    }
}, 60000);

console.log('🔥 Sistema 24/7 activo en servidor');