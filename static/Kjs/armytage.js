// ============================================================
// 🛡️ ARMYTAGE PROFESSIONAL SUITE v3.1 - VERSIÓN DEFINITIVA
// ============================================================
// TODOS LOS COMANDOS FUNCIONALES - SIN DUPLICADOS
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        version: '3.1',
        debug: true,
        maxLogs: 500
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
    // 4. TOAST SYSTEM
    // ============================================================
    const ToastSystem = {
        _container: null,

        show(message, type = 'info', duration = 3000) {
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.id = 'armytage-toast';
                this._container.style.cssText = `
                    position: fixed;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 999999;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-width: 450px;
                    width: 90%;
                    pointer-events: none;
                    align-items: center;
                `;
                document.body.appendChild(this._container);
            }

            const toast = document.createElement('div');
            const colors = {
                info: '#3b82f6',
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#ef4444',
                security: '#8b5cf6'
            };
            const bg = colors[type] || colors.info;
            
            toast.style.cssText = `
                background: #1e293b;
                color: #f1f5f9;
                padding: 10px 16px;
                border-radius: 8px;
                border-left: 4px solid ${bg};
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 13px;
                pointer-events: auto;
                opacity: 0;
                transform: translateY(-20px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                width: 100%;
                text-align: center;
            `;
            toast.textContent = message;
            this._container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }, duration);
        },

        success(msg) { this.show(`✅ ${msg}`, 'success', 3000); },
        error(msg) { this.show(`❌ ${msg}`, 'error', 5000); },
        warning(msg) { this.show(`⚠️ ${msg}`, 'warning', 4000); },
        info(msg) { this.show(`ℹ️ ${msg}`, 'info', 3000); },
        security(msg) { this.show(`🔒 ${msg}`, 'security', 5000); }
    };

    // ============================================================
    // 5. AGENTE: VALKYRIE - SIN BLOQUEOS
    // ============================================================
    class ValkyrieAgent {
        constructor() {
            this.name = 'ValkyrieAgent';
            this.emoji = '🎯';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.autoBlock = false;
            this.policies = [];
            this.blockedDomains = [];
            this.suspiciousElements = [];
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
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }

        obtenerPoliticas() {
            return {
                eliminarEventosInline: false,
                bloquearScriptsExternos: false,
                bloquearEval: false,
                bloquearInnerHTMLMalicioso: false,
                bloquearDocumentWrite: false
            };
        }

        evaluar(elemento, tipo) {
            return 'allow';
        }

        agregarElementoPermitido(id) {
            console.log('🎯 Elemento permitido:', id);
        }
    }

    // ============================================================
    // 6. AGENTE: SECURITY
    // ============================================================
    class SecurityAgent {
        constructor() {
            this.name = 'SecurityAgent';
            this.emoji = '🕵️';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.devToolsDetected = false;
        }

        activate() {
            this.activated = true;
            console.log('🕵️ Security activado');
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
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }

        // Detectar DevTools real
        detectDevTools() {
            const diffWidth = window.outerWidth - window.innerWidth;
            const diffHeight = window.outerHeight - window.innerHeight;
            return (diffWidth > 160 || diffHeight > 160);
        }
    }

    // ============================================================
    // 7. AGENTE: INSPECTOR - FUNCIONAL
    // ============================================================
    class InspectorAgent {
        constructor() {
            this.name = 'InspectorAgent';
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
            console.log('🔍 Inspector activado');
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
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }

        // ============================================================
        // ESCANEO REAL - FUNCIONAL
        // ============================================================
        async scan() {
            const results = {
                secrets: [],
                vulnerabilities: [],
                endpoints: [],
                suspicious: [],
                scripts: []
            };

            const scripts = document.querySelectorAll('script');
            
            for (const script of scripts) {
                const content = script.src ? await this._fetchScript(script.src) : script.innerHTML;
                if (!content) continue;

                // Buscar secretos
                this._findSecrets(content, results);
                
                // Buscar endpoints
                this._findEndpoints(content, results);
                
                // Buscar vulnerabilidades
                this._findVulnerabilities(content, results);
                
                // Buscar comportamientos sospechosos
                this._findSuspicious(content, script, results);

                results.scripts.push({
                    src: script.src || 'inline',
                    length: content.length
                });
            }

            this.scanResults = results;
            this.secretsFound = results.secrets;
            this.vulnerabilities = results.vulnerabilities;
            this.endpoints = results.endpoints;
            this.suspicious = results.suspicious;

            LogSystem.log('INSPECTOR', `Escaneo completado: ${results.secrets.length} secretos, ${results.vulnerabilities.length} vulns`, results, this.name);
            
            return results;
        }

        _findSecrets(content, results) {
            const patterns = {
                'API Key': /(api[_-]?key|apikey)\s*[:=]\s*['"]([a-zA-Z0-9_-]{16,})['"]/gi,
                'JWT Token': /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
                'Password': /password\s*[:=]\s*['"][^'"]+['"]/gi,
                'AWS Key': /AKIA[0-9A-Z]{16}/g,
                'GitHub Token': /gh[pousr]_[a-zA-Z0-9]{36,}/g,
                'Bearer Token': /Bearer\s+[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/gi
            };

            for (const [type, pattern] of Object.entries(patterns)) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const value = match[1] || match[0];
                    results.secrets.push({
                        type,
                        value: value.substring(0, 50),
                        position: match.index
                    });
                }
            }
        }

        _findEndpoints(content, results) {
            const patterns = [
                /https?:\/\/[^\s"']+/g,
                /\/api\/[^\s"']+/g,
                /\/v\d\/[^\s"']+/g,
                /\/graphql/g,
                /\/auth\/[^\s"']+/g,
                /\/admin\/[^\s"']+/g,
                /\/user\/[^\s"']+/g
            ];

            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const endpoint = match[0];
                    if (!results.endpoints.some(e => e === endpoint)) {
                        results.endpoints.push(endpoint);
                    }
                }
            }
        }

        _findVulnerabilities(content, results) {
            const vulns = {
                'eval()': /eval\s*\(/g,
                'document.write': /document\.write\s*\(/g,
                'innerHTML (suspicious)': /\.innerHTML\s*=\s*[^'"]+(?:['"]|[^;])/g,
                'setTimeout (string)': /setTimeout\s*\(\s*["']/g,
                'setInterval (string)': /setInterval\s*\(\s*["']/g,
                'Function constructor': /new\s+Function\s*\(/g,
                'debugger': /\bdebugger\b/g
            };

            for (const [type, pattern] of Object.entries(vulns)) {
                if (pattern.test(content)) {
                    results.vulnerabilities.push({
                        type: type,
                        severity: type.includes('eval') || type.includes('document.write') ? 'high' : 'medium'
                    });
                }
            }
        }

        _findSuspicious(content, script, results) {
            const suspiciousPatterns = [
                { pattern: /localStorage\.(get|set)Item/, desc: 'Acceso a localStorage' },
                { pattern: /sessionStorage\.(get|set)Item/, desc: 'Acceso a sessionStorage' },
                { pattern: /document\.cookie/, desc: 'Acceso a cookies' },
                { pattern: /navigator\.sendBeacon/, desc: 'Beacon API' },
                { pattern: /fetch\s*\(/, desc: 'Fetch API' },
                { pattern: /XMLHttpRequest/, desc: 'XMLHttpRequest' },
                { pattern: /WebSocket/, desc: 'WebSocket' }
            ];

            for (const {pattern, desc} of suspiciousPatterns) {
                if (pattern.test(content)) {
                    results.suspicious.push({
                        desc,
                        script: script.src || 'inline'
                    });
                }
            }
        }

        async _fetchScript(url) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    return await response.text();
                }
            } catch (e) {}
            return null;
        }
    }

    // ============================================================
    // 8. AGENTE: SENTINEL - FUNCIONAL
    // ============================================================
    class SentinelAgent {
        constructor() {
            this.name = 'SentinelAgent';
            this.emoji = '🧠';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.threatPredictions = [];
            this.anomalies = [];
            this.behavioralProfile = null;
            this._eventos = [];
        }

        activate() {
            this.activated = true;
            console.log('🧠 Sentinel activado');
            this._construirPerfil();
            this._monitorearComportamiento();
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
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }

        _construirPerfil() {
            this.behavioralProfile = {
                clicks: 0,
                keypresses: 0,
                scrolls: 0,
                mouseMovements: 0
            };

            let startTime = Date.now();
            let clicks = 0, keys = 0, scrolls = 0, movements = 0;

            const handlers = {
                click: () => clicks++,
                keydown: () => keys++,
                scroll: () => scrolls++,
                mousemove: () => movements++
            };

            Object.entries(handlers).forEach(([event, handler]) => {
                document.addEventListener(event, handler);
            });

            setTimeout(() => {
                const duration = (Date.now() - startTime) / 1000;
                this.behavioralProfile.clicks = clicks / duration;
                this.behavioralProfile.keypresses = keys / duration;
                this.behavioralProfile.scrolls = scrolls / duration;
                this.behavioralProfile.mouseMovements = movements / duration;

                Object.entries(handlers).forEach(([event, handler]) => {
                    document.removeEventListener(event, handler);
                });

                LogSystem.log('SENTINEL', 'Perfil construido', this.behavioralProfile, this.name);
            }, 10000);
        }

        _monitorearComportamiento() {
            const startTime = Date.now();

            document.addEventListener('click', (e) => {
                this._eventos.push({
                    type: 'click',
                    time: Date.now() - startTime,
                    target: e.target.tagName
                });
            });

            document.addEventListener('keydown', (e) => {
                this._eventos.push({
                    type: 'keypress',
                    time: Date.now() - startTime,
                    key: e.key
                });
            });

            document.addEventListener('scroll', () => {
                this._eventos.push({
                    type: 'scroll',
                    time: Date.now() - startTime
                });
            });

            // Analizar cada 5 segundos
            setInterval(() => {
                this._analizarComportamiento();
            }, 5000);
        }

        _analizarComportamiento() {
            const eventos = this._eventos.slice(-20);
            if (eventos.length < 10) return;

            const clicks = eventos.filter(e => e.type === 'click').length;
            const keys = eventos.filter(e => e.type === 'keypress').length;
            const scrolls = eventos.filter(e => e.type === 'scroll').length;

            // Detectar anomalías
            if (clicks > 10) {
                this.anomalies.push({
                    type: 'Clics excesivos',
                    count: clicks,
                    timestamp: new Date().toISOString()
                });
            }

            if (keys > 30) {
                this.anomalies.push({
                    type: 'Tecleo excesivo',
                    count: keys,
                    timestamp: new Date().toISOString()
                });
            }

            if (scrolls > 15) {
                this.anomalies.push({
                    type: 'Scroll excesivo',
                    count: scrolls,
                    timestamp: new Date().toISOString()
                });
            }

            // Mantener solo últimas 100 anomalías
            if (this.anomalies.length > 100) {
                this.anomalies = this.anomalies.slice(-100);
            }

            // Generar predicciones
            if (this.anomalies.length > 5) {
                this.threatPredictions.push({
                    threat: 'Posible actividad de bot',
                    confidence: 0.7,
                    timestamp: new Date().toISOString()
                });
            }

            // Mantener solo últimas 50 predicciones
            if (this.threatPredictions.length > 50) {
                this.threatPredictions = this.threatPredictions.slice(-50);
            }
        }

        obtenerPredicciones() {
            return this.threatPredictions;
        }

        obtenerAnomalias() {
            return this.anomalies;
        }

        obtenerPerfil() {
            return this.behavioralProfile;
        }
    }

    // ============================================================
    // 9. AGENTE: PHANTOM - FUNCIONAL
    // ============================================================
    class PhantomAgent {
        constructor() {
            this.name = 'PhantomAgent';
            this.emoji = '⚡';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.watermarkActive = false;
        }

        activate() {
            this.activated = true;
            console.log('⚡ Phantom activado');
            this._embedWatermark();
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
                emoji: this.emoji,
                activated: this.activated,
                stats: this.stats
            };
        }

        _embedWatermark() {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            
            let user = 'anonymous';
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const data = JSON.parse(session);
                    user = data.username || 'anonymous';
                }
            } catch (e) {}

            ctx.font = '12px Arial';
            ctx.fillStyle = 'rgba(0,0,0,0.001)';
            ctx.textAlign = 'center';
            const text = `Armytage © ${new Date().getFullYear()} | ${user}`;
            ctx.fillText(text, 150, 75);
            
            const watermark = document.createElement('div');
            watermark.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                pointer-events: none;
                z-index: -1;
                background-image: url(${canvas.toDataURL()});
                background-repeat: repeat;
                opacity: 0.01;
            `;
            document.body.appendChild(watermark);
            this.watermarkActive = true;
        }

        regenerarWatermark() {
            const existing = document.querySelector('[style*="background-image: url(data:image/png;base64"]');
            if (existing) existing.remove();
            this.watermarkActive = false;
            this._embedWatermark();
            return '🌊 Watermark regenerado';
        }
    }

    // ============================================================
    // 10. CHAT SYSTEM - COMPLETO Y FUNCIONAL
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
            this._agregarMensaje('sistema', '✅ Todos los comandos son funcionales');
        },

        _crearUI() {
            // Eliminar chat existente
            const existing = document.getElementById('armytage-chat');
            if (existing) existing.remove();
            
            const existingBtn = document.getElementById('armytage-toggle-btn');
            if (existingBtn) existingBtn.remove();

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

        // ============================================================
        // PROCESAR COMANDOS - TODOS FUNCIONALES
        // ============================================================
        async _procesarComando(input) {
            const trimmed = input.trim();
            if (!trimmed) return;
            
            this._agregarMensaje('comando', `> ${trimmed}`);
            
            const args = trimmed.split(' ');
            const cmd = args[0].toLowerCase();
            let respuesta = '';

            try {
                switch (cmd) {
                    case '/help':
                        respuesta = this._help();
                        break;

                    case '/status':
                        respuesta = this._status();
                        break;

                    case '/health':
                        respuesta = this._health();
                        break;

                    case '/agents':
                        respuesta = this._agents();
                        break;

                    case '/logs':
                        const n = parseInt(args[1]) || 10;
                        respuesta = this._logs(n);
                        break;

                    case '/clear':
                        if (this._messages) this._messages.innerHTML = '';
                        respuesta = null;
                        break;

                    case '/scan':
                        respuesta = await this._scan();
                        break;

                    case '/secrets':
                        respuesta = this._secrets();
                        break;

                    case '/vulns':
                        respuesta = this._vulns();
                        break;

                    case '/endpoints':
                        respuesta = this._endpoints();
                        break;

                    case '/suspicious':
                        respuesta = this._suspicious();
                        break;

                    case '/predict':
                        respuesta = this._predict();
                        break;

                    case '/anomalies':
                        respuesta = this._anomalies();
                        break;

                    case '/profile':
                        respuesta = this._profile();
                        break;

                    case '/watermark':
                        respuesta = this._watermark();
                        break;

                    case '/devtools':
                        respuesta = this._devtools();
                        break;

                    case '/policies':
                        respuesta = this._policies();
                        break;

                    default:
                        respuesta = `❌ Comando desconocido. Escribe /help`;
                }
            } catch (e) {
                respuesta = `❌ Error: ${e.message}`;
            }

            if (respuesta) {
                this._agregarMensaje('respuesta', respuesta);
            }
        },

        // ============================================================
        // COMANDOS - TODOS FUNCIONALES
        // ============================================================

        _help() {
            return `📋 COMANDOS DISPONIBLES

═══════════════════════════════════
📊 GENERALES
═══════════════════════════════════
/status     - Estado del sistema
/health     - Salud del sistema
/agents     - Agentes activos
/logs [n]   - Últimos n logs
/clear      - Limpiar chat

═══════════════════════════════════
🔍 INSPECTOR
═══════════════════════════════════
/scan       - Escanear scripts
/secrets    - Secretos encontrados
/vulns      - Vulnerabilidades
/endpoints  - Endpoints
/suspicious - Comportamiento sospechoso

═══════════════════════════════════
🧠 SENTINEL
═══════════════════════════════════
/predict    - Predicciones
/anomalies  - Anomalías
/profile    - Perfil de comportamiento

═══════════════════════════════════
⚡ PHANTOM
═══════════════════════════════════
/watermark  - Regenerar watermark

═══════════════════════════════════
🕵️ SECURITY
═══════════════════════════════════
/devtools   - Estado DevTools

═══════════════════════════════════
🎯 VALKYRIE
═══════════════════════════════════
/policies   - Políticas activas

═══════════════════════════════════
❓ /help    - Esta ayuda`;
        },

        _status() {
            const agents = Object.keys(AgentBus._agents);
            const logs = LogSystem.getLogs().length;
            
            let agentStatus = '';
            for (const name of agents) {
                const agent = AgentBus._agents[name];
                if (agent) {
                    agentStatus += `  ${agent.emoji || '🤖'} ${name} - ${agent.activated ? '🟢 Activo' : '🔴 Inactivo'}\n`;
                }
            }

            return `📊 ESTADO DEL SISTEMA

⏰ ${new Date().toLocaleString()}
🤖 Agentes: ${agents.length}
📝 Logs: ${logs}
🛡️ Modo: COMPATIBILIDAD
✅ Clics: HABILITADOS

AGENTES:
${agentStatus}`;
        },

        _health() {
            const stats = LogSystem.getStats();
            const errors = stats.porTipo?.ERROR || 0;
            const security = stats.porTipo?.SECURITY || 0;
            
            let score = 100 - errors * 2 - security * 1;
            score = Math.max(0, Math.min(100, score));

            const level = score > 80 ? '🟢 Excelente' : score > 60 ? '🟡 Bueno' : score > 40 ? '🟠 Regular' : '🔴 Crítico';

            return `📊 SALUD DEL SISTEMA

🔵 Puntuación: ${score}/100
${level}

📊 ESTADÍSTICAS:
• Agentes: ${Object.keys(AgentBus._agents).length}
• Logs: ${LogSystem.getLogs().length}
• Errores: ${errors}
• Eventos de seguridad: ${security}

💡 ${score > 80 ? '✅ Todo en orden' : '⚠️ Revisar logs'}`;
        },

        _agents() {
            const agents = Object.keys(AgentBus._agents);
            let result = `🤖 AGENTES ACTIVOS (${agents.length})\n\n`;

            for (const name of agents) {
                const agent = AgentBus._agents[name];
                if (agent) {
                    result += `${agent.emoji || '🤖'} ${name}\n`;
                    result += `   📨 Mensajes: ${agent.stats?.messagesReceived || 0}\n`;
                    result += `   📤 Enviados: ${agent.stats?.messagesSent || 0}\n`;
                    result += `   ${agent.activated ? '🟢 Activo' : '🔴 Inactivo'}\n\n`;
                }
            }

            return result;
        },

        _logs(n) {
            const logs = LogSystem.getLogs(null, n);
            if (logs.length === 0) {
                return '📝 No hay logs disponibles';
            }
            return `📝 ÚLTIMOS ${logs.length} LOGS:\n\n` +
                logs.map(l => `[${l.timestamp?.split('T')[1]?.slice(0,8) || '--:--:--'}] ${l.agente}: ${l.mensaje}`).join('\n');
        },

        async _scan() {
            const inspector = AgentBus._agents['InspectorAgent'];
            if (!inspector) {
                return '❌ Inspector no disponible';
            }
            
            this._agregarMensaje('sistema', '🔍 Escaneando scripts...');
            const results = await inspector.scan();
            
            return `🔍 ESCANEO COMPLETADO

📊 RESULTADOS:
• Secretos: ${results.secrets.length}
• Vulnerabilidades: ${results.vulnerabilities.length}
• Endpoints: ${results.endpoints.length}
• Sospechosos: ${results.suspicious.length}
• Scripts analizados: ${results.scripts.length}

Usa /secrets, /vulns, /endpoints o /suspicious para detalles.`;
        },

        _secrets() {
            const inspector = AgentBus._agents['InspectorAgent'];
            if (!inspector) {
                return '❌ Inspector no disponible';
            }
            const secrets = inspector.secretsFound || [];
            if (secrets.length === 0) {
                return '🔑 No se encontraron secretos';
            }
            return `🔑 SECRETOS (${secrets.length}):\n\n` +
                secrets.map((s, i) => `${i+1}. ${s.type}: ${s.value}`).join('\n');
        },

        _vulns() {
            const inspector = AgentBus._agents['InspectorAgent'];
            if (!inspector) {
                return '❌ Inspector no disponible';
            }
            const vulns = inspector.vulnerabilities || [];
            if (vulns.length === 0) {
                return '✅ No se encontraron vulnerabilidades';
            }
            return `⚠️ VULNERABILIDADES (${vulns.length}):\n\n` +
                vulns.map((v, i) => `${i+1}. ${v.type} - ${v.severity}`).join('\n');
        },

        _endpoints() {
            const inspector = AgentBus._agents['InspectorAgent'];
            if (!inspector) {
                return '❌ Inspector no disponible';
            }
            const endpoints = inspector.endpoints || [];
            if (endpoints.length === 0) {
                return '🌐 No se encontraron endpoints';
            }
            return `🌐 ENDPOINTS (${endpoints.length}):\n\n` +
                endpoints.map((e, i) => `${i+1}. ${e}`).join('\n');
        },

        _suspicious() {
            const inspector = AgentBus._agents['InspectorAgent'];
            if (!inspector) {
                return '❌ Inspector no disponible';
            }
            const suspicious = inspector.suspicious || [];
            if (suspicious.length === 0) {
                return '✅ No se encontraron comportamientos sospechosos';
            }
            return `🚨 SOSPECHOSOS (${suspicious.length}):\n\n` +
                suspicious.map((s, i) => `${i+1}. ${s.desc} (${s.script})`).join('\n');
        },

        _predict() {
            const sentinel = AgentBus._agents['SentinelAgent'];
            if (!sentinel) {
                return '❌ Sentinel no disponible';
            }
            const predictions = sentinel.obtenerPredicciones();
            if (predictions.length === 0) {
                return '🧠 No hay predicciones';
            }
            return `🧠 PREDICCIONES (${predictions.length}):\n\n` +
                predictions.map((p, i) => `${i+1}. ${p.threat} (${(p.confidence * 100).toFixed(0)}%)`).join('\n');
        },

        _anomalies() {
            const sentinel = AgentBus._agents['SentinelAgent'];
            if (!sentinel) {
                return '❌ Sentinel no disponible';
            }
            const anomalies = sentinel.obtenerAnomalias();
            if (anomalies.length === 0) {
                return '✅ No hay anomalías';
            }
            return `⚠️ ANOMALÍAS (${anomalies.length}):\n\n` +
                anomalies.map((a, i) => `${i+1}. ${a.type} (${a.count || 0} eventos)`).join('\n');
        },

        _profile() {
            const sentinel = AgentBus._agents['SentinelAgent'];
            if (!sentinel) {
                return '❌ Sentinel no disponible';
            }
            const profile = sentinel.obtenerPerfil();
            if (!profile) {
                return '📊 Perfil no disponible';
            }
            return `📊 PERFIL DE COMPORTAMIENTO

🖱️ Clicks/min: ${profile.clicks?.toFixed(1) || 0}
⌨️ Teclas/min: ${profile.keypresses?.toFixed(1) || 0}
📜 Scroll/min: ${profile.scrolls?.toFixed(1) || 0}
🖱️ Movimientos/min: ${profile.mouseMovements?.toFixed(1) || 0}`;
        },

        _watermark() {
            const phantom = AgentBus._agents['PhantomAgent'];
            if (!phantom) {
                return '❌ Phantom no disponible';
            }
            return phantom.regenerarWatermark();
        },

        _devtools() {
            const security = AgentBus._agents['SecurityAgent'];
            if (!security) {
                return '❌ Security no disponible';
            }
            const detected = security.detectDevTools ? security.detectDevTools() : false;
            return `🕵️ DevTools: ${detected ? '🔴 DETECTADAS' : '🟢 NO DETECTADAS'}`;
        },

        _policies() {
            const valkyrie = AgentBus._agents['ValkyrieAgent'];
            if (!valkyrie) {
                return '❌ Valkyrie no disponible';
            }
            const policies = valkyrie.obtenerPoliticas ? valkyrie.obtenerPoliticas() : {};
            return `📋 POLÍTICAS ACTIVAS

• eliminarEventosInline: ${policies.eliminarEventosInline !== false ? '❌ ACTIVADO' : '✅ DESACTIVADO'}
• bloquearScriptsExternos: ${policies.bloquearScriptsExternos !== false ? '❌ ACTIVADO' : '✅ DESACTIVADO'}
• bloquearEval: ${policies.bloquearEval !== false ? '❌ ACTIVADO' : '✅ DESACTIVADO'}
• bloquearInnerHTMLMalicioso: ${policies.bloquearInnerHTMLMalicioso !== false ? '❌ ACTIVADO' : '✅ DESACTIVADO'}
• bloquearDocumentWrite: ${policies.bloquearDocumentWrite !== false ? '❌ ACTIVADO' : '✅ DESACTIVADO'}

✅ Todas las interacciones están permitidas`;
        }
    };

    // ============================================================
    // 11. BADGE ÚNICO
    // ============================================================
    function crearBadge() {
        // Eliminar TODOS los badges existentes
        document.querySelectorAll('[id*="badge"], [style*="Modo Interactivo"], [style*="Modo"]').forEach(el => {
            if (el.id !== 'armytage-toggle-btn' && el.id !== 'armytage-chat') {
                el.remove();
            }
        });

        // Eliminar también por texto
        document.querySelectorAll('div').forEach(el => {
            if (el.textContent && el.textContent.includes('Modo Interactivo') && 
                el.id !== 'armytage-toggle-btn' && el.id !== 'armytage-chat') {
                el.remove();
            }
        });

        const badge = document.createElement('div');
        badge.id = 'armytage-badge';
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
    // 12. INICIALIZACIÓN
    // ============================================================
    async function initArmytage() {
        console.log('🛡️ Inicializando Armytage v' + CONFIG.version);

        try {
            LogSystem.init();

            const valkyrie = new ValkyrieAgent();
            const security = new SecurityAgent();
            const inspector = new InspectorAgent();
            const sentinel = new SentinelAgent();
            const phantom = new PhantomAgent();

            AgentBus
                .register('ValkyrieAgent', valkyrie)
                .register('SecurityAgent', security)
                .register('InspectorAgent', inspector)
                .register('SentinelAgent', sentinel)
                .register('PhantomAgent', phantom);

            await Promise.all([
                valkyrie.activate(),
                security.activate(),
                inspector.activate(),
                sentinel.activate(),
                phantom.activate()
            ]);

            ChatSystem.init();

            // Badge único después de un delay
            setTimeout(crearBadge, 200);

            window.armytage = {
                version: CONFIG.version,
                agents: AgentBus._agents,
                bus: AgentBus,
                logs: LogSystem,
                toast: ToastSystem,
                valkyrie: valkyrie,
                inspector: inspector,
                sentinel: sentinel,
                phantom: phantom,
                security: security,
                status: () => ({
                    version: CONFIG.version,
                    agents: Object.keys(AgentBus._agents),
                    totalAgents: Object.keys(AgentBus._agents).length,
                    logs: LogSystem.getLogs().length
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArmytage);
    } else {
        initArmytage();
    }

})();
