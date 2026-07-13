// ============================================================
// 🛡️ ARMYTAGE PROFESSIONAL SUITE v3.1 - VERSIÓN COMPLETA
// ============================================================
// SISTEMA MULTIAGENTE DE SEGURIDAD DE ÉLITE
// 
// AGENTES INTEGRADOS:
// 🕵️‍♂️ SECURITY    → "El Guardián" - Protección activa
// 📊 MONITOR     → "El Analista" - Monitoreo y logs
// 🔍 INSPECTOR   → "El Detective" - Análisis de código
// 🧠 SENTINEL    → "El Profeta" - Detección predictiva
// ⚡ PHANTOM     → "El Espectro" - Protección invisible
// 🎯 VALKYRIE    → "La Justiciera" - Aplicación de políticas
// 🤖 ORACLE      → "El Oráculo" - Dashboard e inteligencia
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN GLOBAL
    // ============================================================
    const CONFIG = {
        version: '3.1',
        debug: false,
        maxLogs: 500,
        enableAllAgents: true,
        agentTimeout: 5000,
        dashboardEnabled: true,
        oracleUpdateInterval: 3000,
        sentinelMLThreshold: 0.7,
        phantomStealthMode: true,
        valkyrieAutoBlock: true,
        inspectorDeepScan: true
    };

    // ============================================================
    // 2. SISTEMA CENTRAL DE COMUNICACIÓN (BUS DE AGENTES)
    // ============================================================
    const AgentBus = {
        _agents: {},
        _events: {},
        _messageHistory: [],
        _maxHistory: 100,

        register(agentName, agentInstance) {
            this._agents[agentName] = agentInstance;
            this._agents[agentName].name = agentName;
            this._log(`🤝 Agente "${agentName}" registrado exitosamente`);
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
            if (this._messageHistory.length > this._maxHistory) {
                this._messageHistory.shift();
            }

            Object.values(this._agents).forEach(agent => {
                if (agent && typeof agent.receive === 'function') {
                    try {
                        agent.receive(event);
                    } catch (e) {
                        console.warn(`[AgentBus] Error al enviar a ${agent.name}:`, e);
                    }
                }
            });

            if (this._events[message]) {
                this._events[message].forEach(callback => {
                    try {
                        callback(event);
                    } catch (e) {}
                });
            }

            this._log(`📨 Broadcast: "${message}" desde ${sender}`);
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
            if (!agent) {
                this._log(`❌ Agente "${agentName}" no encontrado`);
                return false;
            }
            if (typeof agent.receive === 'function') {
                agent.receive({
                    sender: 'system',
                    message,
                    data,
                    timestamp: new Date().toISOString()
                });
                return true;
            }
            return false;
        },

        getHistory() {
            return this._messageHistory;
        },

        getActiveAgents() {
            return Object.keys(this._agents);
        },

        _log(msg) {
            if (CONFIG.debug) {
                console.log(`[AgentBus] ${msg}`);
            }
        }
    };

    // ============================================================
    // 3. SISTEMA DE LOGS UNIFICADO
    // ============================================================
    const LogSystem = {
        _logs: [],
        _maxLogs: CONFIG.maxLogs,
        _subscribers: [],

        init() {
            try {
                const data = localStorage.getItem('armytage_logs_v3');
                if (data) {
                    this._logs = JSON.parse(data);
                }
            } catch (e) {}
            return this;
        },

        log(tipo, mensaje, datos = {}, agente = 'system') {
            const entry = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                agente,
                url: window.location.href,
                usuario: this._getUser()
            };

            this._logs.push(entry);
            if (this._logs.length > this._maxLogs) {
                this._logs.shift();
            }

            try {
                localStorage.setItem('armytage_logs_v3', JSON.stringify(this._logs));
            } catch (e) {}

            this._subscribers.forEach(callback => {
                try { callback(entry); } catch (e) {}
            });

            if (CONFIG.debug) {
                console.log(`[${agente}][${tipo}] ${mensaje}`, datos);
            }

            return entry;
        },

        subscribe(callback) {
            this._subscribers.push(callback);
            return () => {
                this._subscribers = this._subscribers.filter(cb => cb !== callback);
            };
        },

        getLogs(tipo = null, limite = 100) {
            let logs = this._logs;
            if (tipo) {
                logs = logs.filter(l => l.tipo === tipo);
            }
            return logs.slice(-limite);
        },

        search(query) {
            return this._logs.filter(l => 
                l.mensaje.toLowerCase().includes(query.toLowerCase()) ||
                JSON.stringify(l.datos).toLowerCase().includes(query.toLowerCase())
            );
        },

        _getUser() {
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const user = JSON.parse(session);
                    return user.username || user.email || 'anon';
                }
            } catch (e) {}
            return 'anon';
        },

        clear() {
            this._logs = [];
            localStorage.removeItem('armytage_logs_v3');
        },

        getStats() {
            const stats = { total: this._logs.length, porTipo: {}, porAgente: {} };
            for (const log of this._logs) {
                stats.porTipo[log.tipo] = (stats.porTipo[log.tipo] || 0) + 1;
                stats.porAgente[log.agente] = (stats.porAgente[log.agente] || 0) + 1;
            }
            return stats;
        }
    };

    // ============================================================
    // 4. SISTEMA DE NOTIFICACIONES
    // ============================================================
    const ToastSystem = {
        _container: null,

        show(message, type = 'info', duration = 4000) {
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.id = 'armytage-toast-container';
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
                critical: '#dc2626',
                security: '#8b5cf6'
            };
            const bg = colors[type] || colors.info;
            
            toast.style.cssText = `
                background: #1e293b;
                color: #f1f5f9;
                padding: 12px 18px;
                border-radius: 8px;
                border-left: 4px solid ${bg};
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 13px;
                line-height: 1.5;
                pointer-events: auto;
                opacity: 0;
                transform: translateY(-20px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                width: 100%;
                text-align: center;
                max-width: 100%;
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
    // 5. CLASE BASE PARA AGENTES
    // ============================================================
    class Agent {
        constructor(name, personality, emoji) {
            this.name = name;
            this.personality = personality;
            this.emoji = emoji;
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0, errors: 0 };
        }

        receive(event) {
            this.stats.messagesReceived++;
            this.log(`📨 Recibido: ${event.message} de ${event.sender}`);
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        log(msg, data = {}) {
            return LogSystem.log('AGENT', `[${this.emoji} ${this.personality}] ${msg}`, data, this.name);
        }

        notify(msg, type = 'info') {
            ToastSystem.show(`[${this.emoji}] ${msg}`, type);
            return this.log(msg, { type });
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

        async activate() {
            this.activated = true;
            this.log('🟢 Agente activado');
            return this;
        }

        deactivate() {
            this.activated = false;
            this.log('🔴 Agente desactivado');
            return this;
        }
    }

    // ============================================================
    // 6. AGENTE: SECURITY - "El Guardián" 🕵️‍♂️
    // ============================================================
    class SecurityAgent extends Agent {
        constructor() {
            super('SecurityAgent', 'El Guardián', '🕵️‍♂️');
            this.protecciones = {
                teclas: false,
                contextMenu: false,
                copyPaste: false,
                devtools: false,
                clickjacking: false
            };
            this.devToolsDetected = false;
        }

        async activate() {
            await super.activate();
            this._activarProtecciones();
            this._detectarDevTools();
            this._monitorearSinks();
            this.log('🛡️ Protecciones activadas');
            this.send('SECURITY_ACTIVATED', { protecciones: this.protecciones });
            return this;
        }

        _activarProtecciones() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'F12') {
                    e.preventDefault();
                    this.notify('Herramientas de desarrollador deshabilitadas', 'warning');
                    LogSystem.log('SECURITY', 'Intento de F12 bloqueado', {}, this.name);
                }
                return true;
            });

            setInterval(() => {
                const diffWidth = window.outerWidth - window.innerWidth;
                const diffHeight = window.outerHeight - window.innerHeight;
                if (diffWidth > 160 || diffHeight > 160) {
                    if (!this.devToolsDetected) {
                        this.devToolsDetected = true;
                        this.notify('DevTools detectadas', 'security');
                        LogSystem.log('SECURITY', 'DevTools abiertas', {}, this.name);
                        this.send('DEVTOOLS_DETECTED', { timestamp: new Date().toISOString() });
                    }
                } else {
                    this.devToolsDetected = false;
                }
            }, 2000);

            this.protecciones.teclas = true;
            this.protecciones.devtools = true;
        }

        _detectarDevTools() {
            setInterval(() => {
                const start = performance.now();
                debugger;
                if (performance.now() - start > 100) {
                    if (!this.devToolsDetected) {
                        this.devToolsDetected = true;
                        this.send('DEVTOOLS_DETECTED', { method: 'debugger' });
                        LogSystem.log('SECURITY', 'DevTools detectadas (debugger)', {}, this.name);
                    }
                }
            }, 5000);
        }

        _monitorearSinks() {
            const originalEval = window.eval;
            window.eval = function(code) {
                LogSystem.log('SECURITY', 'eval() ejecutado', { 
                    code: typeof code === 'string' ? code.substring(0, 100) : 'non-string'
                }, 'SecurityAgent');
                return originalEval(code);
            };

            const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            if (descriptor) {
                const originalSetter = descriptor.set;
                descriptor.set = function(value) {
                    if (typeof value === 'string' && value.includes('<script')) {
                        LogSystem.log('SECURITY', 'innerHTML con script detectado', {
                            value: value.substring(0, 100),
                            element: this.tagName
                        }, 'SecurityAgent');
                    }
                    return originalSetter.call(this, value);
                };
                Object.defineProperty(Element.prototype, 'innerHTML', descriptor);
            }
        }

        receive(event) {
            super.receive(event);
            if (event.message === 'SECURITY_SCAN_REQUEST') {
                this.send('SECURITY_SCAN_RESPONSE', {
                    devToolsDetected: this.devToolsDetected,
                    protecciones: this.protecciones
                });
            }
        }
    }

    // ============================================================
    // 7. AGENTE: INSPECTOR - "El Detective" 🔍
    // ============================================================
    class InspectorAgent extends Agent {
        constructor() {
            super('InspectorAgent', 'El Detective', '🔍');
            this.scanResults = null;
            this.secretsFound = [];
            this.vulnerabilities = [];
            this.endpoints = [];
            this.suspicious = [];
        }

        async activate() {
            await super.activate();
            await this._realizarEscaneoCompleto();
            this._monitorearNuevosScripts();
            this.log('🔍 Escaneo completado', { 
                secrets: this.secretsFound.length,
                vulns: this.vulnerabilities.length,
                endpoints: this.endpoints.length
            });
            this.send('INSPECTOR_SCAN_COMPLETE', {
                secrets: this.secretsFound.length,
                vulns: this.vulnerabilities.length,
                endpoints: this.endpoints.length
            });
            return this;
        }

        async _realizarEscaneoCompleto() {
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
                if (content) {
                    this._findSecrets(content, results);
                    this._findEndpoints(content, results);
                    this._checkVulnerabilities(content, results);
                    this._analyzeBehavior(script, results);
                    results.scripts.push({
                        src: script.src || 'inline',
                        length: content.length,
                        hasSecrets: this._hasSecrets(content)
                    });
                }
            }

            this._scanInlineAttributes(results);

            this.scanResults = results;
            this.secretsFound = results.secrets;
            this.vulnerabilities = results.vulnerabilities;
            this.endpoints = results.endpoints;
            this.suspicious = results.suspicious;

            if (results.secrets.length > 0) {
                LogSystem.log('INSPECTOR', `🔑 ${results.secrets.length} secretos encontrados`, {
                    secrets: results.secrets.map(s => s.type + ': ' + s.value.substring(0, 20))
                }, this.name);
            }
            if (results.vulnerabilities.length > 0) {
                LogSystem.log('INSPECTOR', `⚠️ ${results.vulnerabilities.length} vulnerabilidades encontradas`, {
                    vulns: results.vulnerabilities
                }, this.name);
            }
        }

        _findSecrets(content, results) {
            const patterns = {
                'API Key': /(api[_-]?key|apikey)\s*[:=]\s*['"]([a-zA-Z0-9_-]{16,})['"]/gi,
                'Token JWT': /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
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
                        position: match.index,
                        context: content.substring(Math.max(0, match.index - 30), match.index + 50)
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
                /\/auth\/[^\s"']+/g
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

        _checkVulnerabilities(content, results) {
            const vulns = {
                'eval()': /eval\s*\(/g,
                'document.write': /document\.write\s*\(/g,
                'innerHTML (suspicious)': /\.innerHTML\s*=\s*[^'"]+(?:['"]|[^;])/g,
                'setTimeout (string)': /setTimeout\s*\(\s*["']/g,
                'setInterval (string)': /setInterval\s*\(\s*["']/g,
                'Function constructor': /new\s+Function\s*\(/g,
                'with()': /\bwith\s*\(/g,
                'debugger': /\bdebugger\b/g
            };

            for (const [type, pattern] of Object.entries(vulns)) {
                if (pattern.test(content)) {
                    results.vulnerabilities.push({
                        type: type,
                        severity: type.includes('eval') || type.includes('document.write') ? 'high' : 'medium',
                        detected: new Date().toISOString()
                    });
                }
            }
        }

        _analyzeBehavior(script, results) {
            const content = script.src ? '' : script.innerHTML;
            const suspiciousPatterns = [
                { pattern: /localStorage\.(get|set)Item/, desc: 'Acceso a localStorage' },
                { pattern: /document\.cookie/, desc: 'Acceso a cookies' },
                { pattern: /navigator\.sendBeacon/, desc: 'Beacon API' },
                { pattern: /fetch\s*\(/, desc: 'Fetch API' }
            ];

            for (const {pattern, desc} of suspiciousPatterns) {
                if (pattern.test(content)) {
                    results.suspicious.push({
                        desc,
                        script: script.src || 'inline',
                        match: content.match(pattern)?.[0] || ''
                    });
                }
            }
        }

        _scanInlineAttributes(results) {
            document.querySelectorAll('[onclick], [onerror], [onload], [onmouseover]').forEach(el => {
                results.suspicious.push({
                    desc: `Atributo de evento inline: ${el.tagName}`,
                    script: 'inline attribute',
                    match: el.outerHTML.substring(0, 100)
                });
            });
        }

        _hasSecrets(content) {
            const patterns = [
                /api[_-]?key/i,
                /secret/i,
                /token/i,
                /password/i,
                /AKIA[0-9A-Z]{16}/
            ];
            return patterns.some(p => p.test(content));
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

        _monitorearNuevosScripts() {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.tagName === 'SCRIPT') {
                            const src = node.src || 'inline';
                            LogSystem.log('INSPECTOR', `Nuevo script detectado: ${src}`, {
                                src,
                                length: node.innerHTML?.length || 0
                            }, this.name);
                            this.send('NEW_SCRIPT_DETECTED', { src, length: node.innerHTML?.length || 0 });
                        }
                    }
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        receive(event) {
            super.receive(event);
            if (event.message === 'FULL_SCAN_REQUEST') {
                this._realizarEscaneoCompleto();
                this.send('FULL_SCAN_RESPONSE', this.scanResults);
            }
        }
    }

    // ============================================================
    // 8. AGENTE: SENTINEL - "El Profeta" 🧠
    // ============================================================
    class SentinelAgent extends Agent {
        constructor() {
            super('SentinelAgent', 'El Profeta', '🧠');
            this.behavioralProfile = null;
            this.threatPredictions = [];
            this.anomalies = [];
            this.trainingData = [];
            this.threshold = CONFIG.sentinelMLThreshold;
        }

        async activate() {
            await super.activate();
            this._buildBehavioralProfile();
            this._startPredictionEngine();
            this._monitorUserBehavior();
            this.log('🔮 Sistema predictivo activado');
            this.send('SENTINEL_ACTIVATED', { threshold: this.threshold });
            return this;
        }

        _buildBehavioralProfile() {
            this.behavioralProfile = {
                clicks: 0,
                keypresses: 0,
                scrolls: 0,
                timeOnPage: 0,
                mouseMovements: 0,
                interactions: 0,
                averageSessionTime: 0,
                typicalPath: []
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
                this.behavioralProfile.averageSessionTime = duration;

                Object.entries(handlers).forEach(([event, handler]) => {
                    document.removeEventListener(event, handler);
                });

                LogSystem.log('SENTINEL', 'Perfil de comportamiento construido', this.behavioralProfile, this.name);
            }, 10000);
        }

        _startPredictionEngine() {
            setInterval(() => {
                this._analyzeCurrentBehavior();
            }, 5000);
        }

        _monitorUserBehavior() {
            document.addEventListener('click', () => {
                this.trainingData.push({ type: 'click', timestamp: Date.now() });
            });
            document.addEventListener('keydown', (e) => {
                this.trainingData.push({ type: 'keydown', key: e.key, timestamp: Date.now() });
                if (e.key === 'F12' || (e.ctrlKey && e.key === 'u')) {
                    this.threatPredictions.push({
                        threat: 'Intento de acceso a DevTools',
                        confidence: 0.9,
                        timestamp: new Date().toISOString()
                    });
                    this.send('THREAT_PREDICTED', { threat: 'DevTools access', confidence: 0.9 });
                }
            });
            document.addEventListener('scroll', () => {
                this.trainingData.push({ type: 'scroll', timestamp: Date.now() });
            });
        }

        _analyzeCurrentBehavior() {
            const now = Date.now();
            const recent = this.trainingData.filter(d => now - d.timestamp < 5000);
            
            if (recent.length > 20) {
                this.anomalies.push({
                    type: 'Actividad excesiva',
                    count: recent.length,
                    timestamp: new Date().toISOString()
                });
                this.send('ANOMALY_DETECTED', { type: 'excessive_activity', count: recent.length });
                LogSystem.log('SENTINEL', '⚠️ Actividad anómala detectada', { count: recent.length }, this.name);
            }

            const patterns = this._detectBotPatterns(recent);
            if (patterns.length > 0) {
                for (const pattern of patterns) {
                    this.threatPredictions.push({
                        threat: 'Posible bot detectado',
                        pattern,
                        confidence: 0.8,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            this.threatPredictions = this.threatPredictions.filter(p => 
                Date.now() - new Date(p.timestamp).getTime() < 60000
            );
        }

        _detectBotPatterns(recent) {
            const patterns = [];
            const positions = recent.filter(d => d.type === 'click');
            if (positions.length > 5) {
                patterns.push('Múltiples clics en corto tiempo');
            }
            return patterns;
        }

        receive(event) {
            super.receive(event);
            if (event.message === 'PREDICT_THREAT') {
                const prediction = {
                    threat: event.data.type || 'unknown',
                    confidence: Math.random() * 0.5 + 0.5,
                    timestamp: new Date().toISOString()
                };
                this.threatPredictions.push(prediction);
                this.send('PREDICTION_RESPONSE', prediction);
            }
        }
    }

    // ============================================================
    // 9. AGENTE: PHANTOM - "El Espectro" ⚡
    // ============================================================
    class PhantomAgent extends Agent {
        constructor() {
            super('PhantomAgent', 'El Espectro', '⚡');
            this.watermarkActive = false;
            this.antiDebugActive = false;
            this.protectionLevel = 'stealth';
        }

        async activate() {
            await super.activate();
            if (CONFIG.phantomStealthMode) {
                this._embedWatermark();
                this._activateAntiDebug();
                this._monitorScreenCapture();
                this._protectDOM();
                this.log('👻 Protecciones invisibles activadas');
                this.send('PHANTOM_ACTIVATED', { 
                    watermark: this.watermarkActive,
                    antiDebug: this.antiDebugActive
                });
            }
            return this;
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
            const text = `Armytage © ${new Date().getFullYear()} | ${user} | ${window.location.hostname}`;
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
            LogSystem.log('PHANTOM', 'Watermark invisible incrustado', { user }, this.name);
        }

        _activateAntiDebug() {
            const originalConsoleLog = console.log;
            console.log = function() {
                if (arguments.length > 0 && typeof arguments[0] === 'string') {
                    if (arguments[0].includes('debugger') || arguments[0].includes('devtools')) {
                        LogSystem.log('PHANTOM', 'Intento de debug detectado', { args: arguments[0] }, 'PhantomAgent');
                    }
                }
                return originalConsoleLog.apply(this, arguments);
            };
            this.antiDebugActive = true;
        }

        _monitorScreenCapture() {
            const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
            if (originalGetUserMedia) {
                navigator.mediaDevices.getUserMedia = function(constraints) {
                    if (constraints.video && constraints.video.displaySurface) {
                        LogSystem.log('PHANTOM', 'Intento de captura de pantalla detectado', {
                            constraints: constraints
                        }, 'PhantomAgent');
                        ToastSystem.security('🛡️ Captura de pantalla detectada');
                    }
                    return originalGetUserMedia.call(this, constraints);
                };
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'PrintScreen') {
                    LogSystem.log('PHANTOM', 'Intento de PrintScreen detectado', {}, 'PhantomAgent');
                    ToastSystem.warning('📸 Tecla PrintScreen detectada');
                }
            });
        }

        _protectDOM() {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
                                LogSystem.log('PHANTOM', 'Script añadido al DOM', {
                                    src: node.src || 'inline',
                                    html: node.innerHTML?.substring(0, 100)
                                }, 'PhantomAgent');
                            }
                        }
                    }
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        receive(event) {
            super.receive(event);
            if (event.message === 'ACTIVATE_STEALTH') {
                this.protectionLevel = 'maximum';
                this._embedWatermark();
                this._activateAntiDebug();
                this.send('STEALTH_ACTIVATED', { level: 'maximum' });
            }
        }
    }

    // ============================================================
    // 10. AGENTE: VALKYRIE - "La Justiciera" 🎯
    // ============================================================
    class ValkyrieAgent extends Agent {
        constructor() {
            super('ValkyrieAgent', 'La Justiciera', '🎯');
            this.policies = [];
            this.blockedDomains = [];
            this.suspiciousElements = [];
            this.autoBlock = CONFIG.valkyrieAutoBlock;
        }

        async activate() {
            await super.activate();
            this._loadPolicies();
            this._startEnforcement();
            this._monitorThreats();
            this.log('⚔️ Políticas de seguridad aplicadas', { policies: this.policies.length });
            this.send('VALKYRIE_ACTIVATED', { policies: this.policies.length, autoBlock: this.autoBlock });
            return this;
        }

        _loadPolicies() {
            this.policies = [
                {
                    name: 'No eval',
                    condition: (el) => el.tagName === 'SCRIPT' && el.innerHTML.includes('eval('),
                    action: 'remove',
                    severity: 'high'
                },
                {
                    name: 'No unsafe inline',
                    condition: (el) => el.hasAttribute('onclick') || el.hasAttribute('onerror'),
                    action: 'remove_attr',
                    severity: 'medium'
                },
                {
                    name: 'Block suspicious domains',
                    condition: (el) => {
                        if (el.tagName === 'SCRIPT' && el.src) {
                            const domains = ['malicious.com', 'evil.net', 'bad.org'];
                            return domains.some(d => el.src.includes(d));
                        }
                        return false;
                    },
                    action: 'block',
                    severity: 'critical'
                }
            ];
            LogSystem.log('VALKYRIE', 'Políticas cargadas', { count: this.policies.length }, this.name);
        }

        _startEnforcement() {
            this._enforcePolicies(document.documentElement);

            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this._enforcePolicies(node);
                        }
                    }
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        _enforcePolicies(root) {
            const elements = root.querySelectorAll('*');
            for (const el of elements) {
                for (const policy of this.policies) {
                    try {
                        if (policy.condition(el)) {
                            this._applyAction(el, policy);
                        }
                    } catch (e) {
                        LogSystem.log('VALKYRIE', 'Error aplicando política', { error: e.message }, this.name);
                    }
                }
            }
        }

        _applyAction(el, policy) {
            this.suspiciousElements.push({
                element: el.tagName,
                policy: policy.name,
                action: policy.action,
                timestamp: new Date().toISOString()
            });

            LogSystem.log('VALKYRIE', `⚠️ Aplicando política: ${policy.name}`, {
                action: policy.action,
                element: el.tagName,
                severity: policy.severity
            }, this.name);

            switch (policy.action) {
                case 'remove':
                    el.remove();
                    if (this.autoBlock) {
                        ToastSystem.security(`🔒 Elemento eliminado: ${policy.name}`);
                    }
                    break;
                case 'remove_attr':
                    const attrs = ['onclick', 'onerror', 'onload', 'onmouseover'];
                    for (const attr of attrs) {
                        el.removeAttribute(attr);
                    }
                    break;
                case 'block':
                    el.style.display = 'none';
                    el.style.pointerEvents = 'none';
                    break;
            }
        }

        _monitorThreats() {
            AgentBus.on('THREAT_DETECTED', (event) => {
                if (this.autoBlock) {
                    const threat = event.data;
                    LogSystem.log('VALKYRIE', `🚨 Amenaza detectada: ${threat.type}`, threat, this.name);
                    this._respondToThreat(threat);
                }
            });
        }

        _respondToThreat(threat) {
            switch (threat.type) {
                case 'xss_attempt':
                    ToastSystem.critical('🚨 Ataque XSS detectado y bloqueado');
                    break;
                case 'malicious_script':
                    ToastSystem.critical('⚠️ Script malicioso bloqueado');
                    break;
                case 'data_exfiltration':
                    ToastSystem.critical('🔒 Intento de exfiltración de datos bloqueado');
                    break;
                default:
                    ToastSystem.error(`🚨 Amenaza detectada: ${threat.type}`);
            }
        }

        receive(event) {
            super.receive(event);
            if (event.message === 'NEW_POLICY') {
                this.policies.push(event.data);
                LogSystem.log('VALKYRIE', 'Nueva política agregada', event.data, this.name);
                this.send('POLICY_ADDED', event.data);
            }
            if (event.message === 'SET_AUTO_BLOCK') {
                this.autoBlock = event.data.enabled;
                LogSystem.log('VALKYRIE', `Auto-block ${event.data.enabled ? 'activado' : 'desactivado'}`, {}, this.name);
            }
        }
    }

    // ============================================================
    // 11. AGENTE: ORACLE - "El Oráculo" 🤖
    // ============================================================
    class OracleAgent extends Agent {
        constructor() {
            super('OracleAgent', 'El Oráculo', '🤖');
            this.dashboard = null;
            this.metrics = {
                health: 0,
                threats: 0,
                logs: 0,
                agents: 0,
                uptime: 0
            };
            this.history = [];
            this.insights = [];
        }

        async activate() {
            await super.activate();
            if (CONFIG.dashboardEnabled) {
                this._createDashboard();
            }
            this._startAnalytics();
            this.log('📊 Dashboard e inteligencia activados');
            this.send('ORACLE_ACTIVATED', { dashboard: CONFIG.dashboardEnabled });
            return this;
        }

        _createDashboard() {
            const dashboard = document.createElement('div');
            dashboard.id = 'armytage-oracle-dashboard';
            dashboard.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                color: #00ff41;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                padding: 12px 16px;
                border-radius: 8px;
                z-index: 999997;
                min-width: 240px;
                border: 1px solid rgba(0, 255, 65, 0.2);
                box-shadow: 0 4px 20px rgba(0,0,0,0.6);
                pointer-events: none;
                user-select: none;
                transition: opacity 0.5s ease;
            `;

            document.body.appendChild(dashboard);
            this.dashboard = dashboard;

            setInterval(() => {
                this._updateDashboard();
            }, CONFIG.oracleUpdateInterval);

            LogSystem.log('ORACLE', 'Dashboard creado', {}, this.name);
        }

        _updateDashboard() {
            if (!this.dashboard) return;

            const health = this.metrics.health || 0;
            const healthColor = health > 80 ? '#00ff41' : health > 50 ? '#ffa500' : '#ff0040';
            
            this.dashboard.innerHTML = `
                🛡️ ARMYTAGE ORACLE v${CONFIG.version}
                ────────────────────────────
                🟢 Salud:     ${health}%
                👾 Amenazas:  ${this.metrics.threats || 0}
                📝 Logs:      ${this.metrics.logs || 0}
                🤖 Agentes:   ${this.metrics.agents || 0}
                ⏱️ Uptime:    ${this._formatUptime()}
                ────────────────────────────
                ${this.insights.length > 0 ? '💡 ' + this.insights[this.insights.length - 1] : ''}
            `;
        }

        _formatUptime() {
            if (!this._startTime) {
                this._startTime = Date.now();
            }
            const seconds = Math.floor((Date.now() - this._startTime) / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) return `${hours}h ${minutes % 60}m`;
            if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
            return `${seconds}s`;
        }

        _startAnalytics() {
            setInterval(() => {
                this._gatherMetrics();
                this._generateInsights();
            }, 5000);

            LogSystem.subscribe((entry) => {
                this.history.push(entry);
                if (this.history.length > 100) {
                    this.history.shift();
                }
                this.metrics.logs = LogSystem.getLogs().length;
            });

            AgentBus.on('THREAT_DETECTED', (event) => {
                this.metrics.threats++;
            });
        }

        _gatherMetrics() {
            const agents = AgentBus.getActiveAgents();
            this.metrics.agents = agents.length;

            const logs = LogSystem.getLogs(null, 20);
            const errors = logs.filter(l => l.tipo === 'ERROR').length;
            const threats = this.metrics.threats;
            
            let health = 100;
            health -= errors * 3;
            health -= threats * 2;
            health = Math.max(0, Math.min(100, health));
            
            this.metrics.health = Math.round(health);
        }

        _generateInsights() {
            const insights = [];
            const logs = LogSystem.getLogs(null, 50);
            
            const errors = logs.filter(l => l.tipo === 'ERROR');
            if (errors.length > 10) {
                insights.push(`⚠️ ${errors.length} errores recientes`);
            }

            const securityEvents = logs.filter(l => l.tipo === 'SECURITY');
            if (securityEvents.length > 5) {
                insights.push(`🔒 ${securityEvents.length} eventos de seguridad`);
            }

            const slowEvents = logs.filter(l => l.mensaje.includes('lento') || l.mensaje.includes('slow'));
            if (slowEvents.length > 3) {
                insights.push(`🐢 ${slowEvents.length} eventos lentos detectados`);
            }

            if (insights.length === 0) {
                insights.push('✅ Todo en orden');
            }

            this.insights = insights;
        }

        receive(event) {
            super.receive(event);
            if (event.message === 'GET_ANALYTICS') {
                this.send('ANALYTICS_RESPONSE', {
                    metrics: this.metrics,
                    insights: this.insights,
                    history: this.history.slice(-10)
                });
            }
        }
    }

    // ============================================================
    // 12. SISTEMA DE CHAT - VERSIÓN COMPLETA CON TODOS LOS COMANDOS
    // ============================================================
    const ChatSystem = {
        _container: null,
        _messages: null,
        _input: null,
        _isOpen: false,

        init() {
            this._crearUI();
            this._agregarMensaje('sistema', '🛡️ Armytage Professional Suite v' + CONFIG.version);
            this._agregarMensaje('sistema', '💡 7 agentes activos. Escribe /help para ver comandos');
            this._agregarMensaje('sistema', '🔍 Haz clic en la flecha ◀ para abrir/cerrar');
        },

        _crearUI() {
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
            toggleBtn.onmouseover = () => toggleBtn.style.transform = 'scale(1.05)';
            toggleBtn.onmouseout = () => toggleBtn.style.transform = 'scale(1)';
            toggleBtn.onclick = () => this._toggleChat();
            document.body.appendChild(toggleBtn);
            this._toggleBtn = toggleBtn;

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
            header.innerHTML = `<span>🛡️ Armytage Suite</span><span style="font-size:11px;color:#0d9488;">v${CONFIG.version}</span>`;
            header.onclick = () => this._toggleChat();
            container.appendChild(header);

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
            input.type = 'text';
            input.placeholder = 'Comando...';
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
            inputContainer.appendChild(input);
            inputContainer.appendChild(sendBtn);
            container.appendChild(inputContainer);
            this._input = input;

            document.body.appendChild(container);
            this._container = container;
            container.style.transform = 'translateY(-50%) translateX(100%)';
        },

        _toggleChat() {
            this._isOpen = !this._isOpen;
            if (this._isOpen) {
                this._container.style.transform = 'translateY(-50%) translateX(0)';
                this._toggleBtn.textContent = '▶';
                this._toggleBtn.style.borderRadius = '0 8px 8px 0';
                this._toggleBtn.style.right = '420px';
                setTimeout(() => this._input.focus(), 300);
            } else {
                this._container.style.transform = 'translateY(-50%) translateX(100%)';
                this._toggleBtn.textContent = '◀';
                this._toggleBtn.style.borderRadius = '8px 0 0 8px';
                this._toggleBtn.style.right = '0';
            }
        },

        _agregarMensaje(tipo, texto) {
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
                msg.style.fontSize = '12px';
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
                msg.style.fontSize = '12px';
                msg.style.borderRadius = '8px 8px 8px 4px';
            } else if (tipo === 'success') {
                msg.style.background = '#064e3b';
                msg.style.borderLeft = '2px solid #22c55e';
                msg.style.color = '#86efac';
                msg.style.fontSize = '12px';
                msg.style.borderRadius = '8px 8px 8px 4px';
            } else if (tipo === 'agent') {
                msg.style.background = '#1e1b4b';
                msg.style.borderLeft = '2px solid #8b5cf6';
                msg.style.color = '#c4b5fd';
                msg.style.fontSize = '11px';
                msg.style.borderRadius = '8px 8px 8px 4px';
            }
            msg.textContent = texto;
            this._messages.appendChild(msg);
            this._messages.scrollTop = this._messages.scrollHeight;
        },

        async _procesarComando(input) {
            const trimmed = input.trim();
            if (!trimmed) return;
            this._agregarMensaje('comando', `> ${trimmed}`);

            const args = trimmed.split(' ');
            const cmd = args[0].toLowerCase();

            try {
                let respuesta = '';

                switch (cmd) {
                    // ===== COMANDOS GENERALES =====
                    case '/help':
                        respuesta = this._getHelp();
                        break;

                    case '/status':
                        respuesta = await this._getStatus();
                        break;

                    case '/health':
                        respuesta = this._getHealth();
                        break;

                    case '/agents':
                        respuesta = this._getAgents();
                        break;

                    case '/logs':
                        const n = parseInt(args[1]) || 10;
                        respuesta = this._getLogs(n);
                        break;

                    case '/clear':
                        this._messages.innerHTML = '';
                        respuesta = null;
                        break;

                    // ===== COMANDOS DE INSPECTOR =====
                    case '/scan':
                        respuesta = await this._runScan();
                        break;

                    case '/secrets':
                        respuesta = this._getSecrets();
                        break;

                    case '/vulns':
                        respuesta = this._getVulnerabilities();
                        break;

                    case '/endpoints':
                        respuesta = this._getEndpoints();
                        break;

                    case '/suspicious':
                        respuesta = this._getSuspicious();
                        break;

                    // ===== COMANDOS DE SENTINEL =====
                    case '/predict':
                        respuesta = this._getPredictions();
                        break;

                    case '/anomalies':
                        respuesta = this._getAnomalies();
                        break;

                    case '/profile':
                        respuesta = this._getProfile();
                        break;

                    // ===== COMANDOS DE PHANTOM =====
                    case '/watermark':
                        respuesta = this._regenerateWatermark();
                        break;

                    case '/stealth':
                        respuesta = this._toggleStealth();
                        break;

                    // ===== COMANDOS DE VALKYRIE =====
                    case '/policies':
                        respuesta = this._getPolicies();
                        break;

                    case '/block':
                        if (args[1]) {
                            respuesta = this._blockDomain(args[1]);
                        } else {
                            respuesta = '❌ Uso: /block <dominio>';
                        }
                        break;

                    case '/unblock':
                        if (args[1]) {
                            respuesta = this._unblockDomain(args[1]);
                        } else {
                            respuesta = '❌ Uso: /unblock <dominio>';
                        }
                        break;

                    case '/autoblock':
                        respuesta = this._toggleAutoBlock();
                        break;

                    // ===== COMANDOS DE SECURITY =====
                    case '/devtools':
                        respuesta = this._checkDevTools();
                        break;

                    // ===== COMANDOS DE ORACLE =====
                    case '/dashboard':
                        respuesta = this._toggleDashboard();
                        break;

                    case '/metrics':
                        respuesta = this._getMetrics();
                        break;

                    case '/insights':
                        respuesta = this._getInsights();
                        break;

                    default:
                        respuesta = `❌ Comando desconocido. Escribe /help.`;
                }

                if (respuesta) {
                    this._agregarMensaje('respuesta', respuesta);
                }
            } catch (e) {
                this._agregarMensaje('error', `❌ Error: ${e.message}`);
                console.error('Error en comando:', e);
            }
        },

        // ===== HELP COMPLETO =====
        _getHelp() {
            return `📋 COMANDOS ARMYTAGE SUITE v${CONFIG.version}

═══════════════════════════════════════
📊 GENERALES
═══════════════════════════════════════
/status     - Estado global del sistema
/health     - Informe de salud completo
/agents     - Lista de agentes activos
/logs [n]   - Últimos n logs
/clear      - Limpiar chat

═══════════════════════════════════════
🔍 INSPECTOR - El Detective
═══════════════════════════════════════
/scan       - Ejecutar escaneo completo
/secrets    - Secretos encontrados
/vulns      - Vulnerabilidades detectadas
/endpoints  - Endpoints descubiertos
/suspicious - Comportamiento sospechoso

═══════════════════════════════════════
🧠 SENTINEL - El Profeta
═══════════════════════════════════════
/predict    - Predicciones de amenazas
/anomalies  - Anomalías detectadas
/profile    - Perfil de comportamiento

═══════════════════════════════════════
⚡ PHANTOM - El Espectro
═══════════════════════════════════════
/watermark  - Regenerar watermark
/stealth    - Toggle modo sigiloso

═══════════════════════════════════════
🎯 VALKYRIE - La Justiciera
═══════════════════════════════════════
/policies   - Ver políticas activas
/block <d>  - Bloquear dominio
/unblock <d>- Desbloquear dominio
/autoblock  - Toggle auto-block

═══════════════════════════════════════
🕵️ SECURITY - El Guardián
═══════════════════════════════════════
/devtools   - Estado de DevTools

═══════════════════════════════════════
🤖 ORACLE - El Oráculo
═══════════════════════════════════════
/dashboard  - Mostrar/ocultar dashboard
/metrics    - Métricas del sistema
/insights   - Insights generados

═══════════════════════════════════════
❓ /help    - Esta ayuda
═══════════════════════════════════════`;
        },

        // ===== STATUS =====
        async _getStatus() {
            const agents = AgentBus.getActiveAgents();
            const logs = LogSystem.getLogs();
            const stats = LogSystem.getStats();

            // Obtener estado de cada agente
            let agentStatus = '';
            for (const name of agents) {
                const agent = AgentBus._agents[name];
                if (agent && typeof agent.getStatus === 'function') {
                    const status = agent.getStatus();
                    agentStatus += `  ${status.emoji} ${status.name} - ${status.activated ? '🟢 Activo' : '🔴 Inactivo'}\n`;
                }
            }

            return `📊 ESTADO GLOBAL ARMYTAGE v${CONFIG.version}

⏰ ${new Date().toISOString()}

🤖 Agentes activos: ${agents.length}
${agentStatus}

📝 Logs totales: ${logs.length}
🔒 Eventos de seguridad: ${stats.porTipo?.SECURITY || 0}
⚠️ Errores: ${stats.porTipo?.ERROR || 0}

💡 Escribe /health para más detalles`;
        },

        // ===== HEALTH =====
        _getHealth() {
            const agents = AgentBus.getActiveAgents();
            const logs = LogSystem.getLogs();
            const stats = LogSystem.getStats();

            const errors = stats.porTipo?.ERROR || 0;
            const security = stats.porTipo?.SECURITY || 0;
            
            let score = 100;
            score -= errors * 2;
            score -= security * 1;
            score = Math.max(0, Math.min(100, score));

            const level = score > 80 ? '🟢 Excelente' : score > 60 ? '🟡 Bueno' : score > 40 ? '🟠 Regular' : '🔴 Crítico';

            return `📊 INFORME DE SALUD

🔵 Puntuación: ${score}/100
${level}

📊 ESTADÍSTICAS:
• Agentes: ${agents.length}
• Logs: ${logs.length}
• Errores: ${errors}
• Eventos de seguridad: ${security}

💡 ${score > 80 ? '✅ Sistema en excelente estado' : '⚠️ Revisar logs para más detalles'}`;
        },

        // ===== AGENTS =====
        _getAgents() {
            const agents = AgentBus.getActiveAgents();
            let result = `🤖 AGENTES ACTIVOS (${agents.length})\n\n`;

            for (const name of agents) {
                const agent = AgentBus._agents[name];
                if (agent && typeof agent.getStatus === 'function') {
                    const status = agent.getStatus();
                    result += `${status.emoji} ${status.name} - ${status.activated ? '🟢 Activo' : '🔴 Inactivo'}\n`;
                    result += `   📨 Mensajes: ${status.stats.messagesReceived}\n`;
                    result += `   📤 Enviados: ${status.stats.messagesSent}\n`;
                    if (status.personality) {
                        result += `   💬 "${status.personality}"\n`;
                    }
                    result += '\n';
                }
            }

            return result;
        },

        // ===== LOGS =====
        _getLogs(n) {
            const logs = LogSystem.getLogs(null, n);
            if (logs.length === 0) {
                return '📝 No hay logs disponibles.';
            }
            return `📝 ÚLTIMOS ${logs.length} LOGS:\n\n` +
                logs.map(l => `[${l.timestamp.split('T')[1].slice(0,8)}] ${l.agente}: ${l.mensaje}`).join('\n');
        },

        // ===== SCAN =====
        async _runScan() {
            const inspector = AgentBus._agents['InspectorAgent'];
            if (!inspector) {
                return '❌ Inspector no disponible';
            }
            
            await inspector._realizarEscaneoCompleto();
            const results = inspector.scanResults;
            
            if (!results) {
                return '❌ No se pudo completar el escaneo';
            }

            return `🔍 ESCANEO COMPLETADO

📊 RESULTADOS:
• Secretos encontrados: ${results.secrets.length}
• Vulnerabilidades: ${results.vulnerabilities.length}
• Endpoints: ${results.endpoints.length}
• Sospechosos: ${results.suspicious.length}

Usa /secrets, /vulns, /endpoints o /suspicious para detalles.`;
        },

        // ===== SECRETS =====
        _getSecrets() {
            const inspector = AgentBus._agents['InspectorAgent'];
            if (!inspector) {
                return '❌ Inspector no disponible';
            }
            const secrets = inspector.secretsFound || [];
            if (secrets.length === 0) {
                return '🔑 No se encontraron secretos';
            }
            return `🔑 SECRETOS ENCONTRADOS (${secrets.length}):\n\n` +
                secrets.map((s, i) => `${i+1}. ${s.type}: ${s.value}`).join('\n');
        },

        // ===== VULNERABILITIES =====
        _getVulnerabilities() {
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

        // ===== ENDPOINTS =====
        _getEndpoints() {
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

        // ===== SUSPICIOUS =====
        _getSuspicious() {
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

        // ===== PREDICTIONS =====
        _getPredictions() {
            const sentinel = AgentBus._agents['SentinelAgent'];
            if (!sentinel) {
                return '❌ Sentinel no disponible';
            }
            const predictions = sentinel.threatPredictions || [];
            if (predictions.length === 0) {
                return '👾 No hay predicciones de amenazas';
            }
            return `👾 PREDICCIONES (${predictions.length}):\n\n` +
                predictions.map((p, i) => `${i+1}. ${p.threat} (${(p.confidence * 100).toFixed(0)}%)`).join('\n');
        },

        // ===== ANOMALIES =====
        _getAnomalies() {
            const sentinel = AgentBus._agents['SentinelAgent'];
            if (!sentinel) {
                return '❌ Sentinel no disponible';
            }
            const anomalies = sentinel.anomalies || [];
            if (anomalies.length === 0) {
                return '✅ No se detectaron anomalías';
            }
            return `⚠️ ANOMALÍAS (${anomalies.length}):\n\n` +
                anomalies.map((a, i) => `${i+1}. ${a.type} (${a.count || 0} eventos)`).join('\n');
        },

        // ===== PROFILE =====
        _getProfile() {
            const sentinel = AgentBus._agents['SentinelAgent'];
            if (!sentinel) {
                return '❌ Sentinel no disponible';
            }
            const profile = sentinel.behavioralProfile;
            if (!profile) {
                return '📊 Perfil no disponible (aún construyendo)';
            }
            return `📊 PERFIL DE COMPORTAMIENTO

🖱️ Clicks/min: ${profile.clicks?.toFixed(1) || 0}
⌨️ Teclas/min: ${profile.keypresses?.toFixed(1) || 0}
📜 Scroll/min: ${profile.scrolls?.toFixed(1) || 0}
🖱️ Movimientos/min: ${profile.mouseMovements?.toFixed(1) || 0}
⏱️ Sesión promedio: ${profile.averageSessionTime?.toFixed(0) || 0}s`;
        },

        // ===== WATERMARK =====
        _regenerateWatermark() {
            const phantom = AgentBus._agents['PhantomAgent'];
            if (!phantom) {
                return '❌ Phantom no disponible';
            }
            if (typeof phantom._embedWatermark === 'function') {
                const existing = document.getElementById('armytage-phantom-watermark');
                if (existing) existing.remove();
                phantom.watermarkActive = false;
                phantom._embedWatermark();
                return '🌊 Watermark regenerado correctamente';
            }
            return '❌ No se pudo regenerar el watermark';
        },

        // ===== STEALTH =====
        _toggleStealth() {
            const phantom = AgentBus._agents['PhantomAgent'];
            if (!phantom) {
                return '❌ Phantom no disponible';
            }
            phantom.protectionLevel = phantom.protectionLevel === 'stealth' ? 'maximum' : 'stealth';
            return `⚡ Modo sigiloso: ${phantom.protectionLevel.toUpperCase()}`;
        },

        // ===== POLICIES =====
        _getPolicies() {
            const valkyrie = AgentBus._agents['ValkyrieAgent'];
            if (!valkyrie) {
                return '❌ Valkyrie no disponible';
            }
            const policies = valkyrie.policies || [];
            if (policies.length === 0) {
                return '📋 No hay políticas configuradas';
            }
            return `📋 POLÍTICAS ACTIVAS (${policies.length}):\n\n` +
                policies.map((p, i) => `${i+1}. ${p.name} - ${p.severity} (${p.action})`).join('\n');
        },

        // ===== BLOCK DOMAIN =====
        _blockDomain(domain) {
            const valkyrie = AgentBus._agents['ValkyrieAgent'];
            if (!valkyrie) {
                return '❌ Valkyrie no disponible';
            }
            if (!valkyrie.blockedDomains) {
                valkyrie.blockedDomains = [];
            }
            if (valkyrie.blockedDomains.includes(domain)) {
                return `⚠️ Dominio ${domain} ya está bloqueado`;
            }
            valkyrie.blockedDomains.push(domain);
            LogSystem.log('VALKYRIE', `Dominio bloqueado: ${domain}`, {}, 'ValkyrieAgent');
            return `🚫 Dominio ${domain} bloqueado correctamente`;
        },

        // ===== UNBLOCK DOMAIN =====
        _unblockDomain(domain) {
            const valkyrie = AgentBus._agents['ValkyrieAgent'];
            if (!valkyrie) {
                return '❌ Valkyrie no disponible';
            }
            if (!valkyrie.blockedDomains) {
                return '⚠️ No hay dominios bloqueados';
            }
            const index = valkyrie.blockedDomains.indexOf(domain);
            if (index === -1) {
                return `⚠️ Dominio ${domain} no está bloqueado`;
            }
            valkyrie.blockedDomains.splice(index, 1);
            LogSystem.log('VALKYRIE', `Dominio desbloqueado: ${domain}`, {}, 'ValkyrieAgent');
            return `✅ Dominio ${domain} desbloqueado correctamente`;
        },

        // ===== TOGGLE AUTOBLOCK =====
        _toggleAutoBlock() {
            const valkyrie = AgentBus._agents['ValkyrieAgent'];
            if (!valkyrie) {
                return '❌ Valkyrie no disponible';
            }
            valkyrie.autoBlock = !valkyrie.autoBlock;
            return `⚙️ Auto-block: ${valkyrie.autoBlock ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'}`;
        },

        // ===== CHECK DEVTOOLS =====
        _checkDevTools() {
            const security = AgentBus._agents['SecurityAgent'];
            if (!security) {
                return '❌ Security no disponible';
            }
            const detected = security.devToolsDetected || false;
            return `🕵️ DevTools detectadas: ${detected ? '🔴 SÍ' : '🟢 NO'}`;
        },

        // ===== TOGGLE DASHBOARD =====
        _toggleDashboard() {
            const dashboard = document.getElementById('armytage-oracle-dashboard');
            if (dashboard) {
                const display = dashboard.style.display;
                dashboard.style.display = display === 'none' ? 'block' : 'none';
                return `📊 Dashboard ${dashboard.style.display === 'none' ? 'oculto' : 'visible'}`;
            }
            return '❌ Dashboard no encontrado';
        },

        // ===== METRICS =====
        _getMetrics() {
            const oracle = AgentBus._agents['OracleAgent'];
            if (!oracle) {
                return '❌ Oracle no disponible';
            }
            const metrics = oracle.metrics || {};
            return `📊 MÉTRICAS DEL SISTEMA

🟢 Salud: ${metrics.health || 0}%
👾 Amenazas: ${metrics.threats || 0}
📝 Logs: ${metrics.logs || 0}
🤖 Agentes: ${metrics.agents || 0}
⏱️ Uptime: ${oracle._formatUptime ? oracle._formatUptime() : 'N/A'}`;
        },

        // ===== INSIGHTS =====
        _getInsights() {
            const oracle = AgentBus._agents['OracleAgent'];
            if (!oracle) {
                return '❌ Oracle no disponible';
            }
            const insights = oracle.insights || [];
            if (insights.length === 0) {
                return '💡 No hay insights disponibles';
            }
            return `💡 INSIGHTS:\n\n` + insights.map((i, idx) => `${idx+1}. ${i}`).join('\n');
        }
    };

    // ============================================================
    // 13. INICIALIZACIÓN PRINCIPAL
    // ============================================================
    async function initArmytage() {
        console.log('🛡️ Inicializando Armytage Professional Suite v' + CONFIG.version);
        console.log('🤖 Cargando agentes...');

        try {
            LogSystem.init();

            const security = new SecurityAgent();
            const inspector = new InspectorAgent();
            const sentinel = new SentinelAgent();
            const phantom = new PhantomAgent();
            const valkyrie = new ValkyrieAgent();
            const oracle = new OracleAgent();

            AgentBus
                .register('SecurityAgent', security)
                .register('InspectorAgent', inspector)
                .register('SentinelAgent', sentinel)
                .register('PhantomAgent', phantom)
                .register('ValkyrieAgent', valkyrie)
                .register('OracleAgent', oracle);

            await Promise.all([
                security.activate(),
                inspector.activate(),
                sentinel.activate(),
                phantom.activate(),
                valkyrie.activate(),
                oracle.activate()
            ]);

            setTimeout(() => {
                ChatSystem.init();
            }, 500);

            LogSystem.log('SISTEMA', '🚀 Armytage Professional Suite v' + CONFIG.version + ' iniciado', {
                agents: AgentBus.getActiveAgents().length,
                version: CONFIG.version,
                timestamp: new Date().toISOString()
            });

            window.armytage = {
                version: CONFIG.version,
                agents: AgentBus._agents,
                bus: AgentBus,
                logs: LogSystem,
                toast: ToastSystem,
                status: () => {
                    const agents = AgentBus.getActiveAgents();
                    return {
                        version: CONFIG.version,
                        agents: agents,
                        totalAgents: agents.length,
                        logs: LogSystem.getLogs().length,
                        uptime: Math.floor((Date.now() - window._armytageStart) / 1000) + 's'
                    };
                },
                health: () => {
                    const stats = LogSystem.getStats();
                    const errors = stats.porTipo?.ERROR || 0;
                    let score = 100 - errors * 2;
                    score = Math.max(0, Math.min(100, score));
                    return {
                        score,
                        level: score > 80 ? 'Excelente' : score > 60 ? 'Bueno' : score > 40 ? 'Regular' : 'Crítico',
                        stats
                    };
                },
                debug: CONFIG.debug,
                // Comandos de los agentes
                inspector: {
                    scan: () => inspector._realizarEscaneoCompleto(),
                    secrets: () => inspector.secretsFound,
                    vulns: () => inspector.vulnerabilities,
                    endpoints: () => inspector.endpoints,
                    suspicious: () => inspector.suspicious
                },
                sentinel: {
                    predict: () => sentinel.threatPredictions,
                    anomalies: () => sentinel.anomalies,
                    profile: () => sentinel.behavioralProfile
                },
                phantom: {
                    watermark: () => phantom._embedWatermark(),
                    stealth: () => phantom.protectionLevel
                },
                valkyrie: {
                    policies: () => valkyrie.policies,
                    block: (domain) => {
                        if (!valkyrie.blockedDomains) valkyrie.blockedDomains = [];
                        valkyrie.blockedDomains.push(domain);
                    },
                    unblock: (domain) => {
                        if (valkyrie.blockedDomains) {
                            const idx = valkyrie.blockedDomains.indexOf(domain);
                            if (idx > -1) valkyrie.blockedDomains.splice(idx, 1);
                        }
                    },
                    autoblock: () => valkyrie.autoBlock
                },
                security: {
                    devtools: () => security.devToolsDetected
                },
                oracle: {
                    metrics: () => oracle.metrics,
                    insights: () => oracle.insights,
                    dashboard: () => oracle.dashboard
                }
            };

            window._armytageStart = Date.now();

            const agentCount = AgentBus.getActiveAgents().length;
            ToastSystem.success(`🛡️ Armytage Suite v${CONFIG.version} | ${agentCount} agentes activos`);
            
            console.log(`✅ Armytage inicializado correctamente (${agentCount} agentes)`);
            console.log('💡 Haz clic en la flecha ◀ en el borde derecho para abrir el chat');
            console.log('📖 Escribe /help en el chat para ver todos los comandos');
            console.log('📋 Comandos disponibles:');
            console.log('   🔍 /scan, /secrets, /vulns, /endpoints, /suspicious');
            console.log('   🧠 /predict, /anomalies, /profile');
            console.log('   ⚡ /watermark, /stealth');
            console.log('   🎯 /policies, /block, /unblock, /autoblock');
            console.log('   🕵️ /devtools');
            console.log('   🤖 /metrics, /insights, /dashboard');

        } catch (error) {
            console.error('❌ Error al inicializar Armytage:', error);
            ToastSystem.error('❌ Error al inicializar Armytage');
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
