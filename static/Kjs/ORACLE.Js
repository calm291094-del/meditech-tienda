// ============================================================
// 🤖 ORACLE.JS - "El Oráculo"
// ============================================================
// Personalidad: Sabio, analítico, con visión global.
// Función: Dashboard de inteligencia y análisis global.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        updateInterval: 3000, // ms entre actualizaciones
        maxMetrics: 60, // historial de métricas
        dashboardPosition: 'bottom-left',
        showAdvanced: false
    };

    // ============================================================
    // 2. SISTEMA DE LOGS
    // ============================================================
    const LogStore = window._armytageLogs || {
        _logs: [],
        registrar: function(tipo, mensaje, datos = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                script: 'ORACLE'
            };
            this._logs.push(entry);
            console.log(`[ORACLE] ${tipo}: ${mensaje}`, datos);
            try {
                localStorage.setItem('oracle_logs', JSON.stringify(this._logs.slice(-200)));
            } catch (e) {}
            return entry;
        }
    };
    window._armytageLogs = LogStore;

    // ============================================================
    // 3. EL ORÁCULO - NÚCLEO
    // ============================================================
    const Oracle = {
        _dashboard: null,
        _metrics: [],
        _stats: {},
        _active: true,

        // -------- Inicialización --------
        iniciar: function() {
            LogStore.registrar('ORACLE', '🧙‍♂️ El Oráculo ha llegado');

            // Crear dashboard
            this._crearDashboard();

            // Iniciar monitoreo de métricas
            this._iniciarMonitoreo();

            // Integrar con otros scripts (si están disponibles)
            this._integrarConArmytage();

            LogStore.registrar('ORACLE', '✅ Oráculo activo y vigilando');
        },

        // -------- Crear dashboard --------
        _crearDashboard: function() {
            // Eliminar dashboard existente
            const existing = document.getElementById('armytage-oracle-dashboard');
            if (existing) existing.remove();

            const dashboard = document.createElement('div');
            dashboard.id = 'armytage-oracle-dashboard';
            dashboard.style.cssText = `
                position: fixed;
                ${CONFIG.dashboardPosition === 'bottom-left' ? 'bottom: 10px; left: 10px;' : ''}
                ${CONFIG.dashboardPosition === 'bottom-right' ? 'bottom: 10px; right: 10px;' : ''}
                ${CONFIG.dashboardPosition === 'top-left' ? 'top: 10px; left: 10px;' : ''}
                ${CONFIG.dashboardPosition === 'top-right' ? 'top: 10px; right: 10px;' : ''}
                background: rgba(0, 0, 0, 0.88);
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                padding: 12px 16px;
                border-radius: 10px;
                z-index: 999997;
                max-width: 320px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 255, 0, 0.15);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
                pointer-events: none;
                user-select: none;
                line-height: 1.6;
                min-width: 260px;
                transition: all 0.3s ease;
            `;

            // Header con estado
            const header = document.createElement('div');
            header.style.cssText = `
                font-weight: bold;
                font-size: 14px;
                color: #00ff88;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            header.innerHTML = `
                <span>🛡️ ARMYTAGE</span>
                <span style="font-size: 10px; color: #88ff88;">
                    ${new Date().toLocaleTimeString()}
                </span>
            `;
            dashboard.appendChild(header);

            // Contenido
            const content = document.createElement('div');
            content.id = 'oracle-content';
            content.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
            `;
            dashboard.appendChild(content);

            document.body.appendChild(dashboard);
            this._dashboard = dashboard;

            // Actualizar contenido inicial
            this._actualizarDashboard();

            LogStore.registrar('ORACLE', '📊 Dashboard creado');
        },

        // -------- Actualizar dashboard --------
        _actualizarDashboard: function() {
            if (!this._dashboard) return;

            const content = document.getElementById('oracle-content');
            if (!content) return;

            const stats = this._obtenerEstadisticas();

            content.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <span>📊 Salud:</span>
                    <span style="color: ${stats.healthColor}">${stats.healthScore}%</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>🛡️ Estado:</span>
                    <span style="color: ${stats.statusColor}">${stats.status}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>📝 Logs:</span>
                    <span>${stats.logs}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>🚨 Alertas:</span>
                    <span style="color: ${stats.alerts > 0 ? '#ff4444' : '#88ff88'}">${stats.alerts}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>👤 Usuario:</span>
                    <span>${stats.user}</span>
                </div>
                ${CONFIG.showAdvanced ? `
                <div style="border-top: 1px solid #334455; margin-top: 6px; padding-top: 6px; font-size: 10px; color: #88aacc;">
                    <div>🔍 Scripts: ${stats.scripts}</div>
                    <div>📦 DOM: ${stats.domSize}</div>
                    <div>⚡ Memoria: ${stats.memory}</div>
                </div>
                ` : ''}
                <div style="border-top: 1px solid #334455; margin-top: 4px; padding-top: 4px; font-size: 9px; color: #667788; text-align: center;">
                    ${new Date().toLocaleTimeString()} · v2.0
                </div>
            `;
        },

        // -------- Obtener estadísticas --------
        _obtenerEstadisticas: function() {
            // Intentar obtener datos de otros scripts
            let healthScore = 85;
            let status = 'Estable';
            let statusColor = '#88ff88';
            let logs = 0;
            let alerts = 0;
            let user = 'Visitante';
            let scripts = document.querySelectorAll('script').length;
            let domSize = document.querySelectorAll('*').length;
            let memory = 'N/A';

            // Obtener logs totales
            try {
                const allLogs = LogStore.obtenerLogs ? LogStore.obtenerLogs() : [];
                logs = allLogs.length;
                alerts = allLogs.filter(l => l.tipo === 'SECURITY' || l.tipo === 'ERROR').length;
            } catch (e) {}

            // Obtener usuario
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const userData = JSON.parse(session);
                    user = userData.username || userData.email || 'Usuario';
                }
            } catch (e) {}

            // Obtener salud de Armytage si existe
            if (window.armytage && window.armytage.salud) {
                try {
                    const salud = window.armytage.salud();
                    healthScore = salud.score || 85;
                    status = salud.nivel || 'Estable';
                    statusColor = salud.color || '#88ff88';
                } catch (e) {}
            } else {
                // Calcular salud basada en métricas
                healthScore = 100 - Math.min(alerts * 2, 30);
                if (healthScore > 80) {
                    status = 'Excelente';
                    statusColor = '#00ff88';
                } else if (healthScore > 60) {
                    status = 'Bueno';
                    statusColor = '#88ff00';
                } else if (healthScore > 40) {
                    status = 'Regular';
                    statusColor = '#ffaa00';
                } else {
                    status = 'Crítico';
                    statusColor = '#ff4444';
                }
            }

            // Memoria (solo en navegadores que lo soporten)
            if (window.performance && window.performance.memory) {
                const mem = window.performance.memory;
                memory = (mem.usedJSHeapSize / 1048576).toFixed(1) + 'MB';
            }

            return {
                healthScore,
                healthColor: this._getColorForScore(healthScore),
                status,
                statusColor,
                logs,
                alerts,
                user,
                scripts,
                domSize,
                memory
            };
        },

        _getColorForScore: function(score) {
            if (score >= 80) return '#00ff88';
            if (score >= 60) return '#88ff00';
            if (score >= 40) return '#ffaa00';
            return '#ff4444';
        },

        // -------- Iniciar monitoreo de métricas --------
        _iniciarMonitoreo: function() {
            const self = this;

            // Actualizar cada intervalo
            setInterval(() => {
                if (this._active) {
                    this._actualizarDashboard();

                    // Guardar métricas
                    this._metrics.push({
                        timestamp: Date.now(),
                        ...this._obtenerEstadisticas()
                    });
                    if (this._metrics.length > CONFIG.maxMetrics) {
                        this._metrics.shift();
                    }
                }
            }, CONFIG.updateInterval);

            // Actualizar al hacer scroll (para mantener información actualizada)
            document.addEventListener('scroll', () => {
                if (this._active) {
                    this._actualizarDashboard();
                }
            });

            LogStore.registrar('ORACLE', '📊 Monitoreo de métricas iniciado');
        },

        // -------- Integrar con Armytage --------
        _integrarConArmytage: function() {
            // Si el objeto armytage existe, registrar este script
            if (window.armytage) {
                if (typeof window.armytage.registerAgent === 'function') {
                    window.armytage.registerAgent('oracle', this);
                }
                LogStore.registrar('ORACLE', '🔗 Integrado con Armytage');
            }

            // Escuchar eventos de otros scripts
            document.addEventListener('armytage:security', (e) => {
                this._stats.lastSecurityEvent = e.detail;
                this._actualizarDashboard();
            });

            document.addEventListener('armytage:error', (e) => {
                this._stats.lastError = e.detail;
                this._actualizarDashboard();
            });
        },

        // -------- API Pública --------
        obtenerDashboard: function() {
            return this._dashboard;
        },

        obtenerMetricas: function() {
            return this._metrics;
        },

        obtenerEstadisticasActuales: function() {
            return this._obtenerEstadisticas();
        },

        mostrar: function() {
            if (this._dashboard) {
                this._dashboard.style.display = 'block';
            }
        },

        ocultar: function() {
            if (this._dashboard) {
                this._dashboard.style.display = 'none';
            }
        },

        toggle: function() {
            if (this._dashboard) {
                const display = this._dashboard.style.display;
                this._dashboard.style.display = display === 'none' ? 'block' : 'none';
            }
        },

        setPosition: function(position) {
            const validPositions = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
            if (validPositions.includes(position)) {
                CONFIG.dashboardPosition = position;
                // Recrear dashboard
                this._crearDashboard();
                LogStore.registrar('ORACLE', `📊 Posición cambiada a: ${position}`);
            }
        }
    };

    // ============================================================
    // 4. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                Oracle.iniciar();
            }, 1500);
        });
    } else {
        setTimeout(() => {
            Oracle.iniciar();
        }, 1500);
    }

    window.Oracle = Oracle;

    console.log('🤖 Oracle.js - "El Oráculo" cargado');
    console.log('📊 Dashboard visible en la esquina inferior izquierda');

})();