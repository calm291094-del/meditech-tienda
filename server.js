// server.js - Versión corregida para @AniaAsistenteBot

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURACIÓN - ¡TOKEN CORRECTO!
// ============================================================

app.use(cors());
app.use(express.json());

// ⚠️ IMPORTANTE: Usa el token de @AniaAsistenteBot
// Obtenlo de @BotFather en Telegram
const WORKER_URL = process.env.WORKER_URL || "https://telegram-proxy.calm291094.workers.dev";
const TOKEN = process.env.TELEGRAM_TOKEN || '8932505027:AAFkR4ZVC_hFcuc4YIhEmEIvGaIDr6yB7L0';

console.log('🔧 Configuración:');
console.log(`   Bot: @AniaAsistenteBot`);
console.log(`   WORKER_URL: ${WORKER_URL}`);
console.log(`   TOKEN: ${TOKEN.substring(0, 15)}...`);

let botInterval = null;
let isRunning = false;
let lastUpdateId = 0;
let lastResponse = Date.now();
let reconnectAttempts = 0;

// ============================================================
// FUNCIÓN PARA LLAMAR AL WORKER
// ============================================================
async function callWorker(method, data = {}) {
    try {
        console.log(`📡 Llamando Worker: ${method}`);
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
            const result = await response.json();
            console.log(`✅ Worker respondió: ${method} -> ok: ${result.ok}`);
            return result;
        } else {
            const text = await response.text();
            console.warn('⚠️ Respuesta no JSON:', text.substring(0, 100));
            return { ok: false, error: `Respuesta no JSON: ${text.substring(0, 100)}` };
        }
    } catch (error) {
        console.error('❌ Error en Worker:', error.message);
        return { ok: false, error: error.message };
    }
}

// ============================================================
// ENVIAR MENSAJE
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
// RESPONDER CON IA
// ============================================================
async function getAniaResponse(userMessage) {
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'Eres Ania, asistente de MediTech. Alegre, entusiasta, hablas español con emojis. Sin HTML.' },
                    { role: 'user', content: userMessage }
                ],
                model: 'openai'
            })
        });

        if (response.ok) {
            let texto = await response.text();
            texto = texto.replace(/<[^>]*>/g, '').trim();
            if (texto.length > 10) return texto;
        }
    } catch (e) {
        console.error('Error en IA:', e.message);
    }

    // Respuestas locales
    const lower = userMessage.toLowerCase();
    if (lower.includes('hola') || lower.includes('buenas')) {
        return "¡Hola! ☕️ Soy Ania, tu asistente de MediTech. ¿En qué puedo ayudarte hoy? ✨\n\nPuedes preguntarme sobre:\n• 💊 Medicamentos\n• 💻 Tecnología\n• 🛒 Productos\n• ☕ Café y anime";
    }
    if (lower.includes('precio') || lower.includes('cuesta')) {
        return "💰 Precios actualizados en nuestra web: https://calm291094-del.github.io/meditech-tienda/ 😊";
    }
    if (lower.includes('gracias')) {
        return "¡De nada! ☕️ Me alegra poder ayudarte. ¿Necesitas algo más? ✨";
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
    if (lower.includes('ayuda') || lower.includes('help')) {
        return "🤖 Puedo ayudarte con:\n• Información de productos\n• Precios\n• Contacto\n• Recomendaciones\n\n¿Qué necesitas hoy? ✨";
    }
    return "¡Interesante! ☕️ ¿Qué más necesitas saber de MediTech?";
}

// ============================================================
// OBTENER ACTUALIZACIONES
// ============================================================
async function getUpdates() {
    try {
        const result = await callWorker('getUpdates', {
            offset: lastUpdateId + 1,
            timeout: 30
        });

        if (result.ok && result.result && result.result.length > 0) {
            console.log(`📩 Recibidas ${result.result.length} actualizaciones`);
            for (let update of result.result) {
                lastUpdateId = update.update_id;
                if (update.message && update.message.text) {
                    const chatId = update.message.chat.id;
                    const userName = update.message.from.first_name || 'Usuario';
                    const messageText = update.message.text;
                    
                    console.log(`📩 ${userName}: ${messageText}`);
                    
                    // Comandos
                    if (messageText === '/start') {
                        await sendTelegramMessage(chatId, 
                            `¡Bienvenido a MediTech! ☕️\n\n` +
                            `Soy Ania, tu asistente virtual. Puedo ayudarte con información sobre nuestros productos de salud y tecnología.\n\n` +
                            `🌐 Visita nuestra web: https://calm291094-del.github.io/meditech-tienda/\n\n` +
                            `¿En qué puedo ayudarte hoy? ✨`
                        );
                        continue;
                    }
                    
                    if (messageText === '/help') {
                        await sendTelegramMessage(chatId,
                            `📋 Comandos disponibles:\n` +
                            `/start - Saludo de bienvenida\n` +
                            `/help - Esta ayuda\n` +
                            `/web - Enlace a la tienda\n\n` +
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
                    
                    // Respuesta normal
                    if (!messageText.startsWith('/')) {
                        const response = await getAniaResponse(messageText);
                        await sendTelegramMessage(chatId, response);
                        lastResponse = Date.now();
                    }
                }
            }
        }
        return true;
    } catch (error) {
        console.error('❌ Error en getUpdates:', error.message);
        return false;
    }
}

// ============================================================
// INICIAR BOT
// ============================================================
async function startBot() {
    if (isRunning) {
        console.log('⚠️ Bot ya está corriendo');
        return;
    }

    console.log('🚀 Iniciando @AniaAsistenteBot...');

    // Probar el token
    console.log('🔑 Probando token...');
    const result = await callWorker('getMe');
    
    if (result.ok && result.result) {
        isRunning = true;
        reconnectAttempts = 0;
        console.log(`✅ Bot @${result.result.username} iniciado`);
        console.log(`📱 ID: ${result.result.id}`);
        console.log('📱 Escribe en Telegram para probarlo');

        if (botInterval) clearInterval(botInterval);
        botInterval = setInterval(async () => {
            await getUpdates();
        }, 2000);
    } else {
        console.error('❌ Error al iniciar:', result.error || 'Token inválido');
        reconnectAttempts++;
        const delay = Math.min(30000, reconnectAttempts * 5000);
        console.log(`⏳ Reintentando en ${delay/1000} segundos...`);
        setTimeout(startBot, delay);
    }
}

// ============================================================
// SERVIDOR WEB
// ============================================================

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
                .connecting { background: #f59e0b; color: white; }
                .bot-info { background: #f8fafc; border-radius: 12px; padding: 15px; margin: 10px 0; }
                h1 { color: #0d9488; }
                .emoji-big { font-size: 48px; }
                .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }
                .btn { background: #0d9488; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block; border: none; cursor: pointer; }
                .btn:hover { background: #0f766e; }
                .btn-warning { background: #f59e0b; }
                .btn-warning:hover { background: #d97706; }
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
                    <p><strong>📊 Estado:</strong> 
                        <span class="status ${isRunning ? 'online' : 'connecting'}">
                            ${isRunning ? '✅ Conectado' : '🔄 Conectando...'}
                        </span>
                    </p>
                    <p><strong>🕐 Última respuesta:</strong> ${new Date(lastResponse).toLocaleString('es-ES')}</p>
                    <p><strong>📱 Bot:</strong> @AniaAsistenteBot</p>
                    <p><strong>🔄 Intentos:</strong> ${reconnectAttempts}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>📋 Comandos disponibles</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><code>/start</code> - Saludo de bienvenida</li>
                        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><code>/help</code> - Ver comandos disponibles</li>
                        <li style="padding: 8px 0;"><code>/web</code> - Enlace a la tienda</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://t.me/AniaAsistenteBot" target="_blank" class="btn">
                        💬 Abrir en Telegram
                    </a>
                    <br><br>
                    <a href="/force-restart" class="btn btn-warning">
                        🔄 Forzar Reinicio
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

// Endpoint para forzar reinicio
app.get('/force-restart', (req, res) => {
    console.log('🔄 Forzando reinicio del bot...');
    isRunning = false;
    if (botInterval) {
        clearInterval(botInterval);
        botInterval = null;
    }
    setTimeout(startBot, 1000);
    res.redirect('/');
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`✅ Servidor web en puerto ${PORT}`);
    console.log(`🌐 URL: https://meditech-bot.onrender.com`);
    console.log(`📱 Bot: @AniaAsistenteBot`);
    setTimeout(startBot, 1000);
});

// ============================================================
// SISTEMA DE RECUPERACIÓN
// ============================================================

setInterval(() => {
    if (!isRunning) {
        console.log('🔄 Bot detenido, reiniciando...');
        startBot();
    }
}, 30000);

setInterval(() => {
    if (isRunning && (Date.now() - lastResponse > 120000)) {
        console.log('🔄 Bot sin actividad, reiniciando...');
        isRunning = false;
        if (botInterval) {
            clearInterval(botInterval);
            botInterval = null;
        }
        startBot();
    }
}, 60000);

console.log('🔥 Sistema 24/7 activo para @AniaAsistenteBot');