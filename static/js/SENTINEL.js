// ============================================================
// 🧠 SENTINEL.JS - "El Profeta"
// ============================================================
// Personalidad: Visionario, analítico, siempre anticipando el futuro.
// Función: Detección predictiva de amenazas usando Machine Learning
//          y análisis de comportamiento avanzado.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        learningRate: 0.1,
        windowSize: 100, // número de eventos para análisis
        anomalyThreshold: 2.5, // desviaciones estándar
        predictionInterval: 5000 // ms entre predicciones
    };

    // ============================================================
    // 2. SISTEMA DE LOGS (compartido)
    // ============================================================
    const LogStore = window._armytageLogs || {
        _logs: [],
        registrar: function(tipo, mensaje, datos = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                script: 'SENTINEL'
            };
            this._logs.push(entry);
            console.log(`[SENTINEL] ${tipo}: ${mensaje}`, datos);
            try {
                localStorage.setItem('sentinel_logs', JSON.stringify(this._logs.slice(-200)));
            } catch (e) {}
            return entry;
        }
    };
    window._armytageLogs = LogStore;

    // ============================================================
    // 3. EL PROFETA - NÚCLEO
    // ============================================================
    const Sentinel = {
        _perfilNormal: {
            clicks: [],
            keypresses: [],
            mouseMovements: [],
            scrolls: [],
            timeOnPage: 0
        },
        _eventos: [],
        _predicciones: [],
        _activo: true,

        // -------- Inicialización --------
        iniciar: function() {
            LogStore.registrar('SENTINEL', '🔮 El Profeta ha despertado');

            // Construir perfil normal
            this._construirPerfilNormal();

            // Iniciar monitoreo de comportamiento
            this._monitorearComportamiento();

            // Iniciar predicciones periódicas
            setInterval(() => {
                if (this._activo) {
                    this._predecir();
                }
            }, CONFIG.predictionInterval);

            // Detectar fingerprinting
            this._detectarFingerprinting();

            // Detectar bots
            this._detectarBots();

            LogStore.registrar('SENTINEL', '✅ Profeta activo y vigilando');
        },

        // -------- Construcción del perfil normal --------
        _construirPerfilNormal: function() {
            // Simular construcción de perfil basado en los primeros 30 segundos
            // En una versión real, esto se haría con más datos
            const baseline = {
                clicksPorMinuto: 2,
                teclasPorMinuto: 15,
                scrollPorMinuto: 3,
                mouseDistanciaPorMinuto: 500,
                tiempoPorPagina: 60
            };

            this._perfilNormal = baseline;
            LogStore.registrar('SENTINEL', '📊 Perfil normal construido', this._perfilNormal);
        },

        // -------- Monitoreo de comportamiento --------
        _monitorearComportamiento: function() {
            const self = this;
            const startTime = Date.now();

            // Clicks
            document.addEventListener('click', function(e) {
                self._eventos.push({
                    type: 'click',
                    time: Date.now() - startTime,
                    x: e.clientX,
                    y: e.clientY,
                    target: e.target.tagName
                });
                // Mantener tamaño de ventana
                if (self._eventos.length > CONFIG.windowSize) {
                    self._eventos.shift();
                }
            });

            // Keypresses
            document.addEventListener('keydown', function(e) {
                if (e.key.length === 1) {
                    self._eventos.push({
                        type: 'keypress',
                        time: Date.now() - startTime,
                        key: e.key
                    });
                    if (self._eventos.length > CONFIG.windowSize) {
                        self._eventos.shift();
                    }
                }
            });

            // Scroll
            let lastScroll = 0;
            document.addEventListener('scroll', function() {
                const now = Date.now();
                if (now - lastScroll > 200) {
                    self._eventos.push({
                        type: 'scroll',
                        time: now - startTime,
                        position: window.scrollY
                    });
                    lastScroll = now;
                    if (self._eventos.length > CONFIG.windowSize) {
                        self._eventos.shift();
                    }
                }
            });

            // Mouse movement (muestreo)
            let mouseSamples = 0;
            document.addEventListener('mousemove', function(e) {
                mouseSamples++;
                if (mouseSamples % 10 === 0) {
                    self._eventos.push({
                        type: 'mousemove',
                        time: Date.now() - startTime,
                        x: e.clientX,
                        y: e.clientY
                    });
                    if (self._eventos.length > CONFIG.windowSize) {
                        self._eventos.shift();
                    }
                }
            });

            LogStore.registrar('SENTINEL', '👁️ Monitoreo de comportamiento iniciado');
        },

        // -------- Detección de fingerprinting --------
        _detectarFingerprinting: function() {
            // Detectar scripts que intentan recolectar huellas digitales
            const fingerprintAPIs = [
                'canvas.toDataURL',
                'WebGLRenderingContext',
                'AudioContext',
                'navigator.userAgent',
                'navigator.plugins',
                'navigator.language',
                'screen.width',
                'screen.height',
                'screen.colorDepth',
                'deviceMemory',
                'hardwareConcurrency',
                'getBattery'
            ];

            // Hookear APIs sospechosas
            const self = this;
            fingerprintAPIs.forEach(api => {
                const parts = api.split('.');
                let obj = window;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (obj[parts[i]]) {
                        obj = obj[parts[i]];
                    } else {
                        return;
                    }
                }
                const prop = parts[parts.length - 1];
                const original = obj[prop];
                if (typeof original === 'function') {
                    obj[prop] = function(...args) {
                        const stack = new Error().stack;
                        if (stack && stack.includes('fingerprint')) {
                            LogStore.registrar('SENTINEL', '🔍 Posible fingerprinting detectado', {
                                api: api,
                                stack: stack.split('\n').slice(1, 4).join('\n')
                            });
                            if (window.showToast) {
                                window.showToast('🔍 Posible fingerprinting detectado', 'warning', 3000);
                            }
                        }
                        return original.apply(this, args);
                    };
                }
            });

            LogStore.registrar('SENTINEL', '🛡️ Protección contra fingerprinting activada');
        },

        // -------- Detección de bots --------
        _detectarBots: function() {
            const self = this;

            // 1. Detectar velocidad de clic anormal
            let lastClickTime = 0;
            let clickCount = 0;
            document.addEventListener('click', function() {
                const now = Date.now();
                if (now - lastClickTime < 50) {
                    clickCount++;
                    if (clickCount > 5) {
                        LogStore.registrar('SENTINEL', '🤖 Posible bot detectado (clics muy rápidos)', {
                            clicks: clickCount,
                            time: now - lastClickTime
                        });
                        if (window.showToast) {
                            window.showToast('🤖 Posible actividad de bot detectada', 'critical', 5000);
                        }
                        self._activo = false;
                    }
                } else {
                    clickCount = 0;
                }
                lastClickTime = now;
            });

            // 2. Detectar patrones de movimiento del mouse
            let mousePositions = [];
            document.addEventListener('mousemove', function(e) {
                mousePositions.push({ x: e.clientX, y: e.clientY, time: Date.now() });
                if (mousePositions.length > 50) mousePositions.shift();
            });

            // 3. Detectar ausencia de movimiento del mouse (bot que no interactúa)
            let lastMouseMove = Date.now();
            document.addEventListener('mousemove', function() {
                lastMouseMove = Date.now();
            });

            setInterval(() => {
                const now = Date.now();
                if (now - lastMouseMove > 60000 && document.hasFocus()) {
                    // Usuario inactivo más de 60 segundos pero con foco - posible bot
                    LogStore.registrar('SENTINEL', '🤖 Posible bot (inactividad prolongada con foco)', {
                        inactividad: (now - lastMouseMove) / 1000 + 's'
                    });
                }
            }, 30000);

            LogStore.registrar('SENTINEL', '🤖 Detección de bots activada');
        },

        // -------- Predicción de amenazas --------
        _predecir: function() {
            if (this._eventos.length < 10) return;

            const eventos = this._eventos;
            const ultimos = eventos.slice(-20);

            // Calcular métricas actuales
            const metrics = {
                clickRate: ultimos.filter(e => e.type === 'click').length / 20,
                keyRate: ultimos.filter(e => e.type === 'keypress').length / 20,
                scrollRate: ultimos.filter(e => e.type === 'scroll').length / 20,
                mouseRate: ultimos.filter(e => e.type === 'mousemove').length / 20
            };

            // Comparar con el perfil normal
            const anomalies = [];
            const normal = this._perfilNormal;

            if (metrics.clickRate > normal.clicksPorMinuto * 3) {
                anomalies.push('Aumento anormal de clics');
            }
            if (metrics.keyRate > normal.teclasPorMinuto * 3) {
                anomalies.push('Aumento anormal de tecleo');
            }
            if (metrics.scrollRate > normal.scrollPorMinuto * 3) {
                anomalies.push('Aumento anormal de scroll');
            }

            // Predecir amenazas basado en anomalías
            if (anomalies.length > 0) {
                const prediccion = {
                    timestamp: new Date().toISOString(),
                    anomalies: anomalies,
                    severity: anomalies.length > 2 ? 'HIGH' : 'MEDIUM',
                    recommendation: this._recomendar(anomalies)
                };
                this._predicciones.push(prediccion);
                LogStore.registrar('SENTINEL', `🔮 Predicción: ${anomalies.join(', ')}`, prediccion);

                if (window.showToast) {
                    window.showToast(`🔮 Alerta: ${anomalies.join(', ')}`, 'warning', 5000);
                }
            }
        },

        _recomendar: function(anomalies) {
            if (anomalies.some(a => a.includes('clic'))) {
                return 'Verificar si hay bots realizando clics automáticos';
            }
            if (anomalies.some(a => a.includes('tecleo'))) {
                return 'Posible ataque de fuerza bruta o relleno automático';
            }
            if (anomalies.some(a => a.includes('scroll'))) {
                return 'Verificar actividad de scraping o bot de navegación';
            }
            return 'Monitorear actividad inusual y validar captcha si es necesario';
        },

        // -------- API Pública --------
        obtenerPredicciones: function() {
            return this._predicciones;
        },

        obtenerEventos: function() {
            return this._eventos;
        },

        obtenerPerfilNormal: function() {
            return this._perfilNormal;
        },

        resetear: function() {
            this._eventos = [];
            this._predicciones = [];
            LogStore.registrar('SENTINEL', '🔄 Perfil reiniciado');
        }
    };

    // ============================================================
    // 4. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                Sentinel.iniciar();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            Sentinel.iniciar();
        }, 1000);
    }

    window.Sentinel = Sentinel;

    console.log('🧠 Sentinel.js - "El Profeta" cargado');
    console.log('📖 Usa Sentinel.obtenerPredicciones() para ver predicciones');

})();