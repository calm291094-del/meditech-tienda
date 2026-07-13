// ============================================================
// 🛡️ ARMYTAGE PROFESSIONAL SUITE v3.1 - MODO COMPATIBILIDAD
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN - TODOS LOS BLOQUEOS DESACTIVADOS
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
        phantomStealthMode: false, // DESACTIVADO
        valkyrieAutoBlock: false, // DESACTIVADO - CRÍTICO
        inspectorDeepScan: false
    };

    // ============================================================
    // 2. LOGS SIMPLIFICADOS
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
    // 4. TOAST SYSTEM - VERSIÓN SILENCIOSA
    // ============================================================
    const ToastSystem = {
        show(message, type = 'info', duration = 3000) {
            // Solo mostrar en consola
            console.log(`[Toast] ${message}`);
        },
        success(msg) { this.show(`✅ ${msg}`, 'success'); },
        error(msg) { this.show(`❌ ${msg}`, 'error'); },
        warning(msg) { this.show(`⚠️ ${msg}`, 'warning'); },
        info(msg) { this.show(`ℹ️ ${msg}`, 'info'); },
        security(msg) { this.show(`🔒 ${msg}`, 'security'); }
    };

    // ============================================================
    // 5. AGENTE: VALKYRIE - VERSIÓN QUE NO BLOQUEA
    // ============================================================
    class ValkyrieAgent {
        constructor() {
            this.name = 'ValkyrieAgent';
            this.personality = 'La Justiciera (Modo Compatibilidad)';
            this.emoji = '🎯';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.autoBlock = false; // NUNCA BLOQUEAR
            this.policies = [];
            this.blockedDomains = [];
            this.suspiciousElements = [];
            this._elementosPermitidos = ['*']; // PERMITIR TODO
        }

        activate() {
            this.activated = true;
            console.log('🎯 Valkyrie activada en MODO COMPATIBILIDAD - SIN BLOQUEOS');
            return this;
        }

        receive(event) {
            this.stats.messagesReceived++;
        }

        send(message, data = {}) {
            this.stats.messagesSent++;
            return AgentBus.broadcast(message, data, this.name);
        }

        log(msg, data = {}) {
            return LogSystem.log('AGENT', msg, data, this.name);
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

        // ============================================================
        // MÉTODOS DE VALKYRIE - VERSIÓN QUE NO BLOQUEA
        // ============================================================
        aplicarPoliticas(config) {
            // IGNORAR TODAS LAS POLÍTICAS - NUNCA BLOQUEAR
            console.log('🎯 Valkyrie: Políticas ignoradas (modo compatibilidad)');
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
            // NUNCA BLOQUEAR - solo log
            console.log('🎯 Regla agregada (solo log):', regla.nombre);
            return { id: 'regla-' + Date.now(), ...regla, accion: 'log' };
        }

        evaluar(elemento, tipo) {
            // SIEMPRE PERMITIR - NUNCA BLOQUEAR
            return 'allow';
        }

        agregarElementoPermitido(id) {
            console.log('🎯 Elemento permitido:', id);
        }

        // Métodos dummy para compatibilidad
        _enforcePolicies() { return true; }
        _applyAction() { return true; }
        _monitorThreats() { return true; }
        _respondToThreat() { return true; }
        _loadPolicies() { return true; }
        _startEnforcement() { return true; }
    }

    // ============================================================
    // 6. AGENTE: SECURITY - VERSIÓN QUE NO BLOQUEA
    // ============================================================
    class SecurityAgent {
        constructor() {
            this.name = 'SecurityAgent';
            this.personality = 'El Guardián (Modo Compatibilidad)';
            this.emoji = '🕵️';
            this.activated = false;
            this.stats = { messagesReceived: 0, messagesSent: 0 };
            this.protecciones = { teclas: false, devtools: false };
            this.devToolsDetected = false;
        }

        activate() {
            this.activated = true;
            console.log('🕵️ Security activado en MODO COMPATIBILIDAD');
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
    // 7. AGENTE: INSPECTOR - VERSIÓN PASIVA
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
            console.log('🔍 Inspector activado en MODO PASIVO');
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
    // 8. AGENTE: SENTINEL - VERSIÓN PASIVA
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
            console.log('🧠 Sentinel activado en MODO PASIVO');
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
    // 9. AGENTE: PHANTOM - VERSIÓN DESACTIVADA
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
            console.log('⚡ Phantom desactivado (modo compatibilidad)');
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
    // 10. AGENTE: ORACLE - VERSIÓN SIMPLIFICADA
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
            console.log('🤖 Oracle activado en MODO SIMPLIFICADO');
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
    // 11. SISTEMA DE CHAT - VERSIÓN SIMPLIFICADA
    // ============================================================
    const ChatSystem = {
        _isOpen: false,
        _messages: null,

        init() {
            console.log('💬 Chat desactivado (modo compatibilidad)');
            console.log('📋 TODOS LOS CLICS Y EVENTOS ESTÁN PERMITIDOS');
            console.log('🛡️ Seguridad en modo pasivo - sin bloqueos');
        }
    };

    // ============================================================
    // 12. INICIALIZACIÓN PRINCIPAL
    // ============================================================
    async function initArmytage() {
        console.log('🛡️ Inicializando Armytage en MODO COMPATIBILIDAD');
        console.log('📋 Los clics y eventos NO serán bloqueados');

        try {
            LogSystem.init();

            // Crear agentes
            const valkyrie = new ValkyrieAgent();
            const security = new SecurityAgent();
            const inspector = new InspectorAgent();
            const sentinel = new SentinelAgent();
            const phantom = new PhantomAgent();
            const oracle = new OracleAgent();

            // Registrar agentes
            AgentBus
                .register('ValkyrieAgent', valkyrie)
                .register('SecurityAgent', security)
                .register('InspectorAgent', inspector)
                .register('SentinelAgent', sentinel)
                .register('PhantomAgent', phantom)
                .register('OracleAgent', oracle);

            // Activar agentes
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

            // Exponer API
            window.armytage = {
                version: CONFIG.version,
                agents: AgentBus._agents,
                bus: AgentBus,
                logs: LogSystem,
                toast: ToastSystem,
                status: () => {
                    return {
                        version: CONFIG.version,
                        agents: AgentBus.getActiveAgents(),
                        totalAgents: AgentBus.getActiveAgents().length,
                        logs: LogSystem.getLogs().length,
                        modo: 'COMPATIBILIDAD - SIN BLOQUEOS'
                    };
                },
                health: () => {
                    return {
                        score: 100,
                        level: 'Excelente (Modo Compatibilidad)',
                        stats: LogSystem.getStats()
                    };
                },
                // Exponer Valkyrie directamente
                valkyrie: valkyrie,
                // Función para verificar si los clics funcionan
                testClick: () => {
                    console.log('🖱️ Prueba de click ejecutada');
                    return 'Los clics deberían funcionar correctamente';
                }
            };

            // Exponer Valkyrie globalmente
            window.valkyrie = valkyrie;

            console.log(`✅ Armytage inicializado en MODO COMPATIBILIDAD`);
            console.log(`🎯 Valkyrie: SIN BLOQUEOS DE CLICS`);
            console.log(`📋 ${AgentBus.getActiveAgents().length} agentes activos`);
            console.log('🖱️ Los clicks deberían funcionar ahora');

            // Verificar que los onclick existen
            const onclickElements = document.querySelectorAll('[onclick]');
            console.log(`📋 Elementos con onclick encontrados: ${onclickElements.length}`);
            
            // Mostrar indicador visual
            const badge = document.createElement('div');
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
                z-index: 999999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                pointer-events: none;
                user-select: none;
            `;
            badge.textContent = '🛡️ Modo Interactivo';
            document.body.appendChild(badge);

        } catch (error) {
            console.error('❌ Error al inicializar Armytage:', error);
        }
    }

    // ============================================================
    // 13. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArmytage);
    } else {
        initArmytage();
    }

    // ============================================================
    // 14. RECUPERACIÓN DE EMERGENCIA
    // ============================================================
    // Esto se ejecuta si algo sale mal y los clics siguen sin funcionar
    setTimeout(() => {
        console.log('🔄 Verificación de emergencia...');
        
        // Restaurar todos los onclick
        document.querySelectorAll('[onclick]').forEach(el => {
            const value = el.getAttribute('onclick');
            if (value) {
                el.removeAttribute('onclick');
                el.setAttribute('onclick', value);
                try {
                    el.onclick = new Function(value);
                } catch(e) {}
            }
        });

        // Restaurar elementos ocultos
        document.querySelectorAll('[style*="display: none"]').forEach(el => {
            if (el.hasAttribute('data-valkyrie-blocked')) {
                el.style.display = '';
                el.removeAttribute('data-valkyrie-blocked');
            }
        });

        console.log('✅ Recuperación de emergencia completada');
    }, 2000);

})();
