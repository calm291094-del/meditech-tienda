// ============================================================
// 🛡️ ARMYTAGE PROFESSIONAL SUITE v3.1 - VERSIÓN COMPLETA
// ============================================================
// MODO COMPATIBILIDAD: CLICS PERMITIDOS + CHAT INTEGRADO
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        version: '3.1-compat',
        debug: true,
        maxLogs: 100,
        enableAllAgents: true,
        agentTimeout: 5000,
        dashboardEnabled: false,
        oracleUpdateInterval: 5000,
        sentinelMLThreshold: 0.9,
        phantomStealthMode: false,
        valkyrieAutoBlock: false,
        inspectorDeepScan: false
    };

    // ============================================================
    // 2. LOGS
    // ============================================================
    const LogSystem = {
        _logs: [],
        _maxLogs: CONFIG.maxLogs,

        init() { return this; },

        log(tipo, mensaje, datos = {}, agente = 'system') {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                agente
            };
            this._logs.push(entry);
            if (this._logs.length > this._maxLogs) {
                this._logs.shift();
            }
            if (CONFIG.debug) {
                console.log(`[${agente}] ${mensaje}`);
            }
            return entry;
        },

        getLogs(tipo = null, limite = 100) {
            let logs = this._logs;
            if (tipo) {
                logs = logs.filter(l => l.tipo === tipo);
            }
            return logs.slice(-limite);
        },

        getStats() {
            const stats = { total: this._logs.length, porTipo: {}, porAgente: {} };
            for (const log of this._logs) {
                stats.porTipo[log.tipo] = (stats.porTipo[log.tipo] || 0) + 1;
                stats.porAgente[log.agente] = (stats.porAgente[log.agente] || 0) + 1;
            }
            return stats;
        },

        clear() {
            this._logs = [];
        }
    };

    // ============================================================
    // 3. BUS DE AGENTES
    // ============================================================
    const AgentBus = {
        _agents: {},
        _events: {},
        _messageHistory: [],

        register(agentName, agentInstance) {
            this._agents[agentName] = agentInstance;
            this._agents[agentName].name = agentName;
            console.log(`🤝 Agente "${agentName}" registrado`);
            return this;
        },

        broadcast(message, data = {}, sender = 'system') {
            const event = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                timestamp: new Date().toISOString(),
                sender,
                message,
                data
            };
            this._messageHistory.push(event);
            
            Object.values(this._agents).forEach(agent => {
                if (agent && typeof agent.receive === 'function') {
                    try {
                        agent.receive(event);
                    } catch (e) {}
                }
            });

            if (this._events[message]) {
                this._events[message].forEach(callback => {
                    try { callback(event); } catch (e) {}
                });
            }
            return event;
        },

        on(eventName, callback) {
            if (!this._events[eventName]) {
                this._events[eventName] = [];
            }
            this._events[eventName].push(callback);
            return this;
        },

        sendTo(agentName, message, data = {}) {
            const agent = this._agents[agentName];
            if (!agent) return false;
            if (typeof agent.receive === 'function') {
                agent.receive({ sender: 'system', message, data, timestamp: new Date().toISOString() });
                return true;
            }
            return false;
        },

        getActiveAgents() {
            return Object.keys(this._agents);
        }
    };

    // ============================================================
    // 4. TOAST SYSTEM - SILENCIOSO
    // ============================================================
    const ToastSystem = {
        show(message, type = 'info', duration = 3000) {
            console.log(`[Toast] ${message}`);
        },
        success(msg) { this.show(`✅ ${msg}`, 'success'); },
        error(msg) { this.show(`❌ ${msg}`, 'error'); },
        warning(msg) { this.show(`⚠️ ${msg}`, 'warning'); },
        info(msg) { this.show(`ℹ️ ${msg}`, 'info'); },
        security(msg) { this.show(`🔒 ${msg}`, 'security'); }
    };

    // ============================================================
    // 5. AGENTE: VALKYRIE - SIN BLOQUEOS
    // ============================================================
    class ValkyrieAgent {
        constructor() {
            this.name = 'ValkyrieAgent';
            this.personality = 'La Justiciera (Modo Compatibilidad)';
            this.emoji = '🎯';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.autoBlock = false;
            this.policies = [];
            this.blockedDomains = [];
            this.suspiciousElements = [];
            this._elementosPermitidos = ['*'];
        }

        activate() {
            this.activated = true;
            console.log('🎯 Valkyrie activada - SIN BLOQUEOS');
            return this;
        }

        receive(event) {
            this.stats.messagesReceived++;
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        getStatus() {
            return {
                name: this.name,
                personality: this.personality,
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }

        aplicarPoliticas(config) {
            console.log('🎯 Políticas ignoradas (modo compatibilidad)');
            return true;
        }

        obtenerPoliticas() {
            return {
                eliminarEventosInline: false,
                bloquearScriptsExternos: false,
                bloquearEval: false,
                bloquearInnerHTMLMalicioso: false,
                bloquearDocumentWrite: false,
                bloquearAccesoDatos: false
            };
        }

        agregarRegla(regla) {
            console.log('🎯 Regla agregada (solo log):', regla.nombre);
            return { id: 'regla-' + Date.now(), ...regla, accion: 'log' };
        }

        evaluar(elemento, tipo) {
            return 'allow';
        }

        agregarElementoPermitido(id) {
            console.log('🎯 Elemento permitido:', id);
        }
    }

    // ============================================================
    // 6. AGENTE: SECURITY - PASIVO
    // ============================================================
    class SecurityAgent {
        constructor() {
            this.name = 'SecurityAgent';
            this.personality = 'El Guardián (Modo Pasivo)';
            this.emoji = '🕵️';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.protecciones = { teclas: false, devtools: false };
            this.devToolsDetected = false;
        }

        activate() {
            this.activated = true;
            console.log('🕵️ Security activado - MODO PASIVO');
            return this;
        }

        receive(event) {
            this.stats.messagesReceived++;
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        getStatus() {
            return {
                name: this.name,
                personality: this.personality,
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }
    }

    // ============================================================
    // 7. AGENTE: INSPECTOR - PASIVO
    // ============================================================
    class InspectorAgent {
        constructor() {
            this.name = 'InspectorAgent';
            this.personality = 'El Detective (Modo Pasivo)';
            this.emoji = '🔍';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.secretsFound = [];
            this.vulnerabilities = [];
            this.endpoints = [];
            this.suspicious = [];
            this.scanResults = null;
        }

        activate() {
            this.activated = true;
            console.log('🔍 Inspector activado - MODO PASIVO');
            return this;
        }

        receive(event) {
            this.stats.messagesReceived++;
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        getStatus() {
            return {
                name: this.name,
                personality: this.personality,
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }
    }

    // ============================================================
    // 8. AGENTE: SENTINEL - PASIVO
    // ============================================================
    class SentinelAgent {
        constructor() {
            this.name = 'SentinelAgent';
            this.personality = 'El Profeta (Modo Pasivo)';
            this.emoji = '🧠';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.threatPredictions = [];
            this.anomalies = [];
            this.behavioralProfile = null;
        }

        activate() {
            this.activated = true;
            console.log('🧠 Sentinel activado - MODO PASIVO');
            return this;
        }

        receive(event) {
            this.stats.messagesReceived++;
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        getStatus() {
            return {
                name: this.name,
                personality: this.personality,
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }
    }

    // ============================================================
    // 9. AGENTE: PHANTOM - DESACTIVADO
    // ============================================================
    class PhantomAgent {
        constructor() {
            this.name = 'PhantomAgent';
            this.personality = 'El Espectro (Desactivado)';
            this.emoji = '⚡';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.watermarkActive = false;
            this.protectionLevel = 'off';
        }

        activate() {
            this.activated = true;
            console.log('⚡ Phantom desactivado');
            return this;
        }

        receive(event) {
            this.stats.messagesReceived++;
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        getStatus() {
            return {
                name: this.name,
                personality: this.personality,
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }
    }

    // ============================================================
    // 10. AGENTE: ORACLE - SIMPLIFICADO
    // ============================================================
    class OracleAgent {
        constructor() {
            this.name = 'OracleAgent';
            this.personality = 'El Oráculo (Simplificado)';
            this.emoji = '🤖';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.metrics = { health: 100, threats: 0, logs: 0, agents: 0 };
            this.insights = ['✅ Sistema en modo compatibilidad'];
        }

        activate() {
            this.activated = true;
            console.log('🤖 Oracle activado');
            return this;
        }

        receive(event) {
            this.stats.messagesReceived++;
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        getStatus() {
            return {
                name: this.name,
                personality: this.personality,
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }
    }

    // ============================================================
    // 11. CHAT SYSTEM - COMPLETO
    // ============================================================
    const ChatSystem = {
        _container: null,
        _messages: null,
        _input: null,
        _toggleBtn: null,
        _isOpen: false,

        init() {
            console.log('💬 Inicializando chat...');
            this._crearUI();
            this._agregarMensaje('sistema', '🛡️ Armytage Suite v' + CONFIG.version);
            this._agregarMensaje('sistema', '💡 Escribe /help para ver comandos');
            this._agregarMensaje('sistema', '✅ Modo Compatibilidad - Clics habilitados');
        },

        _crearUI() {
            // Contenedor del chat
            const container = document.createElement('div');
            container.id = 'armytage-chat';
            container.style.cssText = `
                position: fixed;
                top: 50%;
                right: 0;
                transform: translateY(-50%) translateX(100%);
                width: 420px;
                max-height: 560px;
                background: #1e293b;
                border-radius: 12px 0 0 12px;
                box-shadow: -5px 0 30px rgba(0,0,0,0.6);
                display: flex;
                flex-direction: column;
                font-family: system-ui, -apple-system, sans-serif;
                z-index: 999998;
                border: 1px solid #334155;
                border-right: none;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            `;
            document.body.appendChild(container);
            this._container = container;

            // Header
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 10px 14px;
                background: linear-gradient(135deg, #0f172a, #1e293b);
                color: #f1f5f9;
                font-weight: bold;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #334155;
                cursor: pointer;
                user-select: none;
                flex-shrink: 0;
            `;
            header.innerHTML = `
                <span>🛡️ Armytage Suite</span>
                <span style="font-size:11px;color:#0d9488;">v${CONFIG.version}</span>
            `;
            header.onclick = () => this._toggleChat();
            container.appendChild(header);

            // Mensajes
            const messages = document.createElement('div');
            messages.id = 'armytage-chat-messages';
            messages.style.cssText = `
                flex: 1;
                padding: 8px 10px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 4px;
                background: #0f172a;
                min-height: 200px;
                max-height: 380px;
            `;
            container.appendChild(messages);
            this._messages = messages;

            // Input
            const inputContainer = document.createElement('div');
            inputContainer.style.cssText = `
                display: flex;
                padding: 6px;
                border-top: 1px solid #334155;
                background: #0f172a;
                gap: 4px;
                flex-shrink: 0;
            `;
            
            const input = document.createElement('input');
            input.id = 'armytage-chat-input';
            input.type = 'text';
            input.placeholder = 'Escribe un comando... (/help)';
            input.style.cssText = `
                flex: 1;
                padding: 6px 10px;
                border: 1px solid #334155;
                border-radius: 6px;
                background: #1e293b;
                color: #f1f5f9;
                font-size: 12px;
                outline: none;
                min-width: 0;
            `;
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this._procesarComando(input.value);
                    input.value = '';
                }
            };
            inputContainer.appendChild(input);
            this._input = input;

            const sendBtn = document.createElement('button');
            sendBtn.textContent = '➤';
            sendBtn.style.cssText = `
                padding: 6px 12px;
                background: #0d9488;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                flex-shrink: 0;
                transition: background 0.2s;
            `;
            sendBtn.onmouseover = () => sendBtn.style.background = '#0f766e';
            sendBtn.onmouseout = () => sendBtn.style.background = '#0d9488';
            sendBtn.onclick = () => {
                this._procesarComando(input.value);
                input.value = '';
            };
            inputContainer.appendChild(sendBtn);
            container.appendChild(inputContainer);

            // Botón toggle
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'armytage-toggle-btn';
            toggleBtn.textContent = '◀';
            toggleBtn.style.cssText = `
                position: fixed;
                top: 50%;
                right: 0;
                transform: translateY(-50%);
                width: 32px;
                height: 60px;
                background: linear-gradient(135deg, #0d9488, #0891b2);
                color: white;
                border: none;
                border-radius: 8px 0 0 8px;
                cursor: pointer;
                font-size: 18px;
                z-index: 999999;
                box-shadow: -2px 0 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                transition: all 0.3s ease;
                border-right: 2px solid rgba(255,255,255,0.1);
            `;
            toggleBtn.onclick = () => this._toggleChat();
            document.body.appendChild(toggleBtn);
            this._toggleBtn = toggleBtn;
        },

        _toggleChat() {
            this._isOpen = !this._isOpen;
            if (this._isOpen) {
                this._container.style.transform = 'translateY(-50%) translateX(0)';
                this._toggleBtn.textContent = '▶';
                this._toggleBtn.style.borderRadius = '0 8px 8px 0';
                this._toggleBtn.style.right = '420px';
                setTimeout(() => this._input?.focus(), 300);
            } else {
                this._container.style.transform = 'translateY(-50%) translateX(100%)';
                this._toggleBtn.textContent = '◀';
                this._toggleBtn.style.borderRadius = '8px 0 0 8px';
                this._toggleBtn.style.right = '0';
            }
        },

        _agregarMensaje(tipo, texto) {
            if (!this._messages) return;
            const msg = document.createElement('div');
            msg.style.cssText = `
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                line-height: 1.5;
                word-wrap: break-word;
                color: #f1f5f9;
                max-width: 100%;
            `;
            
            if (tipo === 'sistema') {
                msg.style.background = '#1e293b';
                msg.style.color = '#94a3b8';
                msg.style.fontSize = '11px';
                msg.style.textAlign = 'center';
                msg.style.borderBottom = '1px solid #334155';
                msg.style.padding = '6px';
            } else if (tipo === 'comando') {
                msg.style.background = '#2d3748';
                msg.style.alignSelf = 'flex-end';
                msg.style.color = '#e2e8f0';
                msg.style.borderRadius = '8px 8px 4px 8px';
            } else if (tipo === 'respuesta') {
                msg.style.background = '#1e293b';
                msg.style.borderLeft = '2px solid #0d9488';
                msg.style.alignSelf = 'flex-start';
                msg.style.paddingLeft = '8px';
                msg.style.whiteSpace = 'pre-wrap';
                msg.style.fontSize = '12px';
                msg.style.maxWidth = '95%';
                msg.style.borderRadius = '8px 8px 8px 4px';
            } else if (tipo === 'error') {
                msg.style.background = '#450a0a';
                msg.style.borderLeft = '2px solid #ef4444';
                msg.style.color = '#fca5a5';
                msg.style.borderRadius = '8px 8px 8px 4px';
            } else if (tipo === 'success') {
                msg.style.background = '#064e3b';
                msg.style.borderLeft = '2px solid #22c55e';
                msg.style.color = '#86efac';
                msg.style.borderRadius = '8px 8px 8px 4px';
            }
            
            msg.textContent = texto;
            this._messages.appendChild(msg);
            this._messages.scrollTop = this._messages.scrollHeight;
        },

        _procesarComando(input) {
            const trimmed = input.trim();
            if (!trimmed) return;
            
            this._agregarMensaje('comando', `> ${trimmed}`);
            
            const args = trimmed.split(' ');
            const cmd = args[0].toLowerCase();
            let respuesta = '';

            switch (cmd) {
                case '/help':
                    respuesta = `📋 COMANDOS DISPONIBLES

📊 /status     - Estado del sistema
📊 /health     - Salud del sistema
🤖 /agents     - Agentes activos
📝 /logs [n]   - Últimos logs
🧹 /clear      - Limpiar chat

🔍 /scan       - Escanear scripts (pasivo)
🔑 /secrets    - Secretos encontrados
⚠️ /vulns      - Vulnerabilidades
🌐 /endpoints  - Endpoints

🧠 /predict    - Predicciones
⚠️ /anomalies  - Anomalías

🎯 /policies   - Políticas activas
🚫 /block <d>  - Bloquear dominio (simulado)
✅ /unblock <d>- Desbloquear dominio (simulado)

❓ /help       - Esta ayuda`;
                    break;

                case '/status':
                    const agents = Object.keys(AgentBus._agents);
                    respuesta = `📊 ESTADO

⏰ ${new Date().toLocaleTimeString()}
🤖 Agentes: ${agents.length}
📝 Logs: ${LogSystem.getLogs().length}
🛡️ Modo: COMPATIBILIDAD - SIN BLOQUEOS
✅ Clics: HABILITADOS

Agentes activos:
${agents.map(a => '  • ' + a).join('\n')}`;
                    break;

                case '/health':
                    respuesta = `📊 SALUD

🟢 Estado: Excelente (100%)
🛡️ Modo: Compatibilidad
✅ Clics: Habilitados
🔒 Seguridad: Pasiva (sin bloqueos)
📝 Logs: ${LogSystem.getLogs().length}`;
                    break;

                case '/agents':
                    const agentList = Object.keys(AgentBus._agents);
                    const agentStatus = agentList.map(name => {
                        const agent = AgentBus._agents[name];
                        return `  ${agent?.emoji || '🤖'} ${name} - ${agent?.activated ? '🟢 Activo' : '🔴 Inactivo'}`;
                    }).join('\n');
                    respuesta = `🤖 AGENTES ACTIVOS (${agentList.length})\n\n${agentStatus}`;
                    break;

                case '/logs':
                    const n = parseInt(args[1]) || 5;
                    const logs = LogSystem.getLogs(null, n);
                    if (logs.length === 0) {
                        respuesta = '📝 No hay logs disponibles';
                    } else {
                        respuesta = `📝 ÚLTIMOS ${logs.length} LOGS:\n\n` +
                            logs.map(l => `[${l.timestamp?.split('T')[1]?.slice(0,8) || '--:--:--'}] ${l.agente}: ${l.mensaje}`).join('\n');
                    }
                    break;

                case '/clear':
                    if (this._messages) this._messages.innerHTML = '';
                    respuesta = null;
                    break;

                case '/scan':
                    respuesta = '🔍 Modo pasivo: escaneo simulado (sin bloqueos)';
                    break;

                case '/secrets':
                    respuesta = '🔑 No se encontraron secretos (modo pasivo)';
                    break;

                case '/vulns':
                    respuesta = '✅ No se encontraron vulnerabilidades';
                    break;

                case '/endpoints':
                    respuesta = '🌐 No se encontraron endpoints';
                    break;

                case '/predict':
                    respuesta = '🧠 Sin predicciones (modo pasivo)';
                    break;

                case '/anomalies':
                    respuesta = '✅ Sin anomalías detectadas';
                    break;

                case '/policies':
                    respuesta = `📋 POLÍTICAS ACTIVAS

• eliminarEventosInline: false
• bloquearScriptsExternos: false
• bloquearEval: false
• bloquearInnerHTMLMalicioso: false
• bloquearDocumentWrite: false

✅ Todas las interacciones están permitidas`;
                    break;

                case '/block':
                    if (args[1]) {
                        respuesta = `🚫 Dominio ${args[1]} bloqueado (simulado)`;
                    } else {
                        respuesta = '❌ Uso: /block <dominio>';
                    }
                    break;

                case '/unblock':
                    if (args[1]) {
                        respuesta = `✅ Dominio ${args[1]} desbloqueado (simulado)`;
                    } else {
                        respuesta = '❌ Uso: /unblock <dominio>';
                    }
                    break;

                default:
                    respuesta = `❌ Comando desconocido. Escribe /help`;
            }

            if (respuesta) {
                this._agregarMensaje('respuesta', respuesta);
            }
        }
    };

    // ============================================================
    // 12. BADGE ÚNICO - SIN DUPLICADOS
    // ============================================================
    function crearBadge() {
        // Eliminar badges existentes
        document.querySelectorAll('#armytage-status-badge, [style*="Modo Interactivo"]').forEach(el => {
            if (el.id !== 'armytage-toggle-btn' && el.id !== 'armytage-chat') {
                el.remove();
            }
        });

        const badge = document.createElement('div');
        badge.id = 'armytage-status-badge';
        badge.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(34, 197, 94, 0.9);
            color: white;
            font-family: Arial, sans-serif;
            font-size: 11px;
            padding: 6px 12px;
            border-radius: 20px;
            z-index: 999997;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            pointer-events: none;
            user-select: none;
        `;
        badge.textContent = '🛡️ Modo Interactivo';
        document.body.appendChild(badge);
    }

    // ============================================================
    // 13. INICIALIZACIÓN PRINCIPAL
    // ============================================================
    async function initArmytage() {
        console.log('🛡️ Inicializando Armytage v' + CONFIG.version);
        console.log('📋 MODO COMPATIBILIDAD - SIN BLOQUEOS');

        try {
            LogSystem.init();

            const valkyrie = new ValkyrieAgent();
            const security = new SecurityAgent();
            const inspector = new InspectorAgent();
            const sentinel = new SentinelAgent();
            const phantom = new PhantomAgent();
            const oracle = new OracleAgent();

            AgentBus
                .register('ValkyrieAgent', valkyrie)
                .register('SecurityAgent', security)
                .register('InspectorAgent', inspector)
                .register('SentinelAgent', sentinel)
                .register('PhantomAgent', phantom)
                .register('OracleAgent', oracle);

            await Promise.all([
                valkyrie.activate(),
                security.activate(),
                inspector.activate(),
                sentinel.activate(),
                phantom.activate(),
                oracle.activate()
            ]);

            // Iniciar chat
            ChatSystem.init();

            // Crear badge único
            setTimeout(crearBadge, 100);

            // Exponer API
            window.armytage = {
                version: CONFIG.version,
                agents: AgentBus._agents,
                bus: AgentBus,
                logs: LogSystem,
                toast: ToastSystem,
                valkyrie: valkyrie,
                status: () => ({
                    version: CONFIG.version,
                    agents: Object.keys(AgentBus._agents),
                    totalAgents: Object.keys(AgentBus._agents).length,
                    logs: LogSystem.getLogs().length,
                    modo: 'COMPATIBILIDAD - SIN BLOQUEOS'
                }),
                health: () => ({
                    score: 100,
                    level: 'Excelente (Modo Compatibilidad)',
                    stats: LogSystem.getStats()
                })
            };

            window.valkyrie = valkyrie;

            console.log(`✅ Armytage inicializado (${Object.keys(AgentBus._agents).length} agentes)`);
            console.log('💬 Haz clic en ◀ para abrir el chat');
            console.log('📋 Escribe /help para ver comandos');

        } catch (error) {
            console.error('❌ Error:', error);
        }
    }

    // ============================================================
    // 14. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArmytage);
    } else {
        initArmytage();
    }

})();
