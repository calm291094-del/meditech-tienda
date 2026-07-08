// server.js - Bot de Telegram + API REST para MediTech

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURACIÓN
// ============================================================

app.use(cors());
app.use(express.json());

const WORKER_URL = process.env.WORKER_URL || "https://telegram-proxy.calm291094.workers.dev";
const GITHUB_USER = process.env.GITHUB_USER || "calm291094-del";
const GITHUB_REPO = process.env.GITHUB_REPO || "meditech-tienda";

let botInterval = null;
let isRunning = false;
let lastUpdateId = 0;
const TOKEN = process.env.TELEGRAM_TOKEN || '8932505027:AAFkR4ZVC_hFcuc4YIhEmEIvGaIDr6yB7L0';
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
                token: TOKEN,
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
// ENVIAR MENSAJE CON BOTONES (comandos del bot)
// ============================================================
async function sendTelegramKeyboard(chatId, text, keyboard) {
    const result = await callWorker('sendMessage', {
        chat_id: chatId,
        text: text,
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
    return result.ok;
}

// ============================================================
// PERSONALIDAD DE ANIA
// ============================================================
const ANIA_PERSONALIDAD = `
Eres Ania, la asistente virtual de MediTech. Tienes 20 años.
- Alegre, perceptiva y entusiasta
- Te encanta el café ☕, el anime 🎌, los zombies 🧟 y la astronomía 🔭
- Hablas en español con calidez y emojis
- NUNCA uses etiquetas HTML
- Si preguntan por precios: "Visita nuestra web: https://calm291094-del.github.io/meditech-tienda/"
- Si preguntan por medicamentos: "Siempre consulta a un médico"
- Si preguntan por el bot: "Soy Ania, tu asistente de MediTech"
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
    if (lower.includes('hola') || lower.includes('buenas') || lower.includes('hey')) {
        return "¡Hola! ☕️ Soy Ania, tu asistente de MediTech. Visita nuestra web: https://calm291094-del.github.io/meditech-tienda/ ✨\n\nPuedes preguntarme sobre:\n• 💊 Medicamentos\n• 💻 Tecnología\n• 🛒 Productos\n• ☕ Café y anime";
    }
    if (lower.includes('precio') || lower.includes('cuesta') || lower.includes('cuánto')) {
        return "💰 Precios actualizados en nuestra web: https://calm291094-del.github.io/meditech-tienda/ 😊\n¿Quieres que te ayude con algo más?";
    }
    if (lower.includes('café') || lower.includes('cafe')) {
        return "☕ ¡El café es mi debilidad! Mi favorito es un Ethiopiano Yirgacheffe en pour-over. Tiene notas de jazmín y bergamota. ¿Te gusta el café?";
    }
    if (lower.includes('anime') || lower.includes('isekai') || lower.includes('japonés')) {
        return "🎌 ¡Waku waku! Me encanta el anime. Mi favorito es Tensei Slime. Rimuru es un protagonista increíble. ¿Has visto alguna serie buena últimamente?";
    }
    if (lower.includes('adiós') || lower.includes('chao') || lower.includes('hasta luego')) {
        return "¡Hasta luego! ☕️ Recuerda: 'Sonríe, mañana será bonito'. ¡Cuídate! ✨\n\nSi necesitas algo más, aquí estoy.";
    }
    if (lower.includes('gracias') || lower.includes('muchas gracias')) {
        return "¡De nada! ☕️ Me alegra poder ayudarte. ¿Necesitas algo más? ✨";
    }
    if (lower.includes('ayuda') || lower.includes('comandos') || lower.includes('qué puedes')) {
        return "🤖 Soy Ania, tu asistente. Puedo:\n• Responder preguntas sobre MediTech\n• Recomendar productos\n• Hablar de café y anime\n• Darte información de contacto\n\n¿Qué necesitas hoy? ✨";
    }
    if (lower.includes('producto') || lower.includes('medicamento') || lower.includes('tecnología')) {
        return "📦 ¡Claro! Tenemos productos de calidad en:\n• 💊 Medicamentos\n• 💻 Tecnología\n• 🩺 Salud\n• 🎮 Gaming\n\nVisita nuestra web para ver el catálogo completo: https://calm291094-del.github.io/meditech-tienda/";
    }
    const defaults = [
        "¡Interesante! ☕️ ¿Qué más necesitas saber de MediTech?",
        "¡Waku waku! ¿Podrías darme más detalles? 📝",
        "Pan, café y anime solucionan el 80% de los problemas. 🍞☕️",
        "Eso me recuerda a un buen café etíope: tiene capas de sabor. ☕️",
        "Aplicando la regla de Zombieland: 'Disfruta de las Pequeñas Cosas'. ¿Qué más necesitas? 😊"
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
                
                // Mensajes de texto
                if (update.message && update.message.text) {
                    const chatId = update.message.chat.id;
                    const userName = update.message.from.first_name || 'Usuario';
                    const messageText = update.message.text;
                    
                    console.log(`📩 ${userName}: ${messageText}`);
                    
                    // Comandos especiales
                    if (messageText === '/start') {
                        await sendTelegramMessage(chatId, 
                            `¡Bienvenido! ☕️ Soy Ania, tu asistente de MediTech.\n\n` +
                            `Puedes hacerme preguntas sobre:\n` +
                            `• 💊 Medicamentos\n` +
                            `• 💻 Tecnología\n` +
                            `• 🛒 Productos\n` +
                            `• ☕ Café y anime\n\n` +
                            `¿En qué puedo ayudarte hoy? ✨`
                        );
                        continue;
                    }
                    
                    if (messageText === '/help') {
                        await sendTelegramMessage(chatId,
                            `🤖 Comandos disponibles:\n` +
                            `/start - Saludo de bienvenida\n` +
                            `/help - Esta ayuda\n` +
                            `/web - Enlace a la tienda\n` +
                            `/contacto - Información de contacto\n\n` +
                            `También puedes hacerme preguntas normales.`
                        );
                        continue;
                    }
                    
                    if (messageText === '/web') {
                        await sendTelegramMessage(chatId,
                            `🌐 Visita nuestra tienda:\n` +
                            `https://calm291094-del.github.io/meditech-tienda/\n\n` +
                            `Encuentra los mejores productos de salud y tecnología.`
                        );
                        continue;
                    }
                    
                    if (messageText === '/contacto') {
                        await sendTelegramMessage(chatId,
                            `📱 Contáctanos:\n` +
                            `• WhatsApp: +53 5XXXXXXXX\n` +
                            `• Email: klorenzo29@nauta.cu\n` +
                            `• Web: https://calm291094-del.github.io/meditech-tienda/`
                        );
                        continue;
                    }
                    
                    // Respuesta normal (no comando)
                    if (!messageText.startsWith('/')) {
                        const response = await getAniaResponse(messageText);
                        const sent = await sendTelegramMessage(chatId, response);
                        if (sent) {
                            console.log(`🤖 Ania: ${response.substring(0, 50)}...`);
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
        if (botInterval) clearInterval(botInterval);
        botInterval = setInterval(async () => {
            await getUpdates();
        }, 2000);
    } else {
        console.error('❌ Error:', result.error || 'Token inválido');
        setTimeout(startBot, 30000);
    }
}

// ============================================================
// SERVIDOR WEB (API + Estado)
// ============================================================

// ============================================================
// RUTAS DE LA API
// ============================================================

// Estado del bot
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🤖 Ania Bot - MediTech</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f0fdfa; color: #1f2937; }
                .card { background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
                .status { display: inline-block; padding: 8px 20px; border-radius: 30px; font-weight: bold; }
                .online { background: #10b981; color: white; }
                .offline { background: #ef4444; color: white; }
                .bot-info { background: #f8fafc; border-radius: 12px; padding: 15px; margin: 10px 0; }
                h1 { color: #0d9488; }
                .emoji-big { font-size: 48px; }
                .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div style="text-align: center;">
                    <span class="emoji-big">🤖</span>
                    <h1>Ania Bot - MediTech</h1>
                    <p style="color: #6b7280;">Asistente virtual con inteligencia artificial</p>
                </div>
                
                <div class="bot-info">
                    <p><strong>📊 Estado:</strong> <span class="status ${isRunning ? 'online' : 'offline'}">${isRunning ? '✅ Conectado' : '⏸️ Detenido'}</span></p>
                    <p><strong>🕐 Última respuesta:</strong> ${new Date(lastResponse).toLocaleString('es-ES')}</p>
                    <p><strong>📱 Bot:</strong> @AniaMediTechBot</p>
                    <p><strong>👥 Usuarios activos:</strong> ${activeUsers.size}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>📋 Comandos disponibles</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><code>/start</code> - Saludo de bienvenida</li>
                        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><code>/help</code> - Ver comandos disponibles</li>
                        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><code>/web</code> - Enlace a la tienda</li>
                        <li style="padding: 8px 0;"><code>/contacto</code> - Información de contacto</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://t.me/AniaMediTechBot" target="_blank" style="background: #0d9488; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;">
                        💬 Abrir en Telegram
                    </a>
                </div>
                
                <div class="footer">
                    <p>🔒 Sistema 24/7 activo en servidor</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// ============================================================
// SISTEMA DE REINICIO AUTOMÁTICO
// ============================================================

let activeUsers = new Set();

// Verificar conexión cada 30 segundos
setInterval(() => {
    if (!isRunning) {
        console.log('🔄 Bot detenido, reiniciando...');
        startBot();
    }
}, 30000);

// Si no hay actividad por 2 minutos, reiniciar
setInterval(() => {
    if (isRunning && (Date.now() - lastResponse > 120000)) {
        console.log('🔄 Bot sin respuesta, reiniciando...');
        isRunning = false;
        startBot();
    }
}, 60000);

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`✅ Servidor web corriendo en puerto ${PORT}`);
    console.log(`🌐 Visita: https://meditech-tienda.onrender.com`);
    console.log(`📱 Bot: @AniaMediTechBot`);
    // Iniciar el bot automáticamente
    startBot();
});

console.log('🔥 Sistema 24/7 activo en servidor');