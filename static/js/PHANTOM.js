// ============================================================
// ⚡ PHANTOM.JS - "El Espectro"
// ============================================================
// Personalidad: Sigiloso, discreto, casi invisible.
// Función: Monitoreo invisible y protección pasiva.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        watermarkOpacity: 0.001,
        debugMode: false,
        enableAntiDebug: true,
        enableScreenRecordingDetection: true
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
                script: 'PHANTOM'
            };
            this._logs.push(entry);
            console.log(`[PHANTOM] ${tipo}: ${mensaje}`, datos);
            try {
                localStorage.setItem('phantom_logs', JSON.stringify(this._logs.slice(-200)));
            } catch (e) {}
            return entry;
        }
    };
    window._armytageLogs = LogStore;

    // ============================================================
    // 3. EL ESPECTRO - NÚCLEO
    // ============================================================
    const Phantom = {
        _watermarkActive: false,
        _debuggerCounter: 0,

        // -------- Inicialización --------
        iniciar: function() {
            LogStore.registrar('PHANTOM', '👻 El Espectro ha aparecido');

            // Marca de agua invisible
            this._embedWatermark();

            // Detección de capturas de pantalla
            if (CONFIG.enableScreenRecordingDetection) {
                this._detectScreenRecording();
            }

            // Anti-debugging avanzado
            if (CONFIG.enableAntiDebug) {
                this._antiDebugging();
            }

            // Protección de DOM
            this._protectDOM();

            LogStore.registrar('PHANTOM', '✅ Espectro activo y operando en silencio');
        },

        // -------- Marca de agua invisible --------
        _embedWatermark: function() {
            const self = this;
            if (this._watermarkActive) return;

            // Obtener datos del usuario para personalizar la marca
            let usuario = 'visitante';
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const user = JSON.parse(session);
                    usuario = user.username || user.email || 'visitante';
                }
            } catch (e) {}

            const fecha = new Date().toISOString();

            // Crear marca de agua con canvas
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');

            // Texto muy sutil
            ctx.font = '16px Arial';
            ctx.fillStyle = `rgba(0, 80, 158, ${CONFIG.watermarkOpacity})`;
            ctx.textAlign = 'center';
            ctx.rotate(-30 * Math.PI / 180);

            const textos = [
                `Armytage Phantom`,
                `Usuario: ${usuario}`,
                `Fecha: ${fecha}`,
                `IP: ${this._getClientIP()}`
            ];

            textos.forEach((texto, i) => {
                ctx.fillText(texto, 200, 50 + i * 30);
            });

            const watermarkURL = canvas.toDataURL('image/png');

            // Crear overlay invisible
            const overlay = document.createElement('div');
            overlay.id = 'armytage-phantom-watermark';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
                background-image: url(${watermarkURL});
                background-repeat: repeat;
                opacity: 1;
            `;

            document.body.appendChild(overlay);
            this._watermarkActive = true;

            LogStore.registrar('PHANTOM', '🌊 Marca de agua invisible incrustada', { usuario });

            // Opcional: en modo debug, mostrar un console.log
            if (CONFIG.debugMode) {
                console.log('💧 Marca de agua activa con datos:', { usuario, fecha });
            }
        },

        _getClientIP: function() {
            // No podemos obtener IP real desde el cliente, pero podemos generar una pseudo-IP basada en localStorage
            try {
                let ip = localStorage.getItem('phantom_ip');
                if (!ip) {
                    ip = '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
                    localStorage.setItem('phantom_ip', ip);
                }
                return ip;
            } catch (e) {
                return '0.0.0.0';
            }
        },

        // -------- Detección de grabación de pantalla --------
        _detectScreenRecording: function() {
            const self = this;

            // Hookear MediaRecorder
            const originalMediaRecorder = window.MediaRecorder;
            if (originalMediaRecorder) {
                window.MediaRecorder = function(...args) {
                    const instance = new originalMediaRecorder(...args);
                    // Verificar si está grabando la pantalla
                    if (args[0] && args[0].getVideoTracks) {
                        const tracks = args[0].getVideoTracks();
                        for (const track of tracks) {
                            if (track.kind === 'video' && track.label) {
                                LogStore.registrar('PHANTOM', '📹 Posible grabación de pantalla detectada', {
                                    trackLabel: track.label,
                                    settings: track.getSettings()
                                });
                                if (window.showToast) {
                                    window.showToast('📹 Grabación de pantalla detectada', 'warning', 4000);
                                }
                            }
                        }
                    }
                    return instance;
                };
                // Copiar propiedades estáticas
                Object.keys(originalMediaRecorder).forEach(key => {
                    if (typeof originalMediaRecorder[key] === 'function') {
                        window.MediaRecorder[key] = originalMediaRecorder[key];
                    }
                });
                window.MediaRecorder.prototype = originalMediaRecorder.prototype;
            }

            // Hookear getUserMedia para detectar captura de pantalla
            const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
            if (originalGetUserMedia) {
                navigator.mediaDevices.getUserMedia = function(constraints) {
                    // Verificar si está solicitando captura de pantalla
                    if (constraints.video && (constraints.video.displaySurface || constraints.video.mediaSource === 'screen')) {
                        LogStore.registrar('PHANTOM', '🖥️ Intento de captura de pantalla detectado', { constraints });
                        if (window.showToast) {
                            window.showToast('🖥️ Intento de captura de pantalla', 'warning', 3000);
                        }
                    }
                    return originalGetUserMedia.call(this, constraints);
                };
            }

            LogStore.registrar('PHANTOM', '📹 Detección de grabación activada');
        },

        // -------- Anti-debugging avanzado --------
        _antiDebugging: function() {
            const self = this;

            // 1. Detectar DevTools mediante temporización
            setInterval(() => {
                const start = performance.now();
                debugger;
                const duration = performance.now() - start;

                if (duration > 100) {
                    self._debuggerCounter++;
                    if (self._debuggerCounter > 3) {
                        LogStore.registrar('PHANTOM', '🕵️‍♂️ Herramientas de desarrollador activas', {
                            duration: duration + 'ms',
                            attempts: self._debuggerCounter
                        });

                        // Confundir al debugger
                        this._confuseDebugger();

                        if (window.showToast) {
                            window.showToast('🕵️‍♂️ Herramientas de desarrollador detectadas', 'warning', 3000);
                        }
                    }
                } else {
                    self._debuggerCounter = Math.max(0, self._debuggerCounter - 1);
                }
            }, 3000);

            // 2. Detectar cambio de tamaño de ventana (DevTools abiertas)
            let devtoolsOpen = false;
            const detectDevTools = () => {
                const threshold = 160;
                const widthDiff = window.outerWidth - window.innerWidth;
                const heightDiff = window.outerHeight - window.innerHeight;

                if ((widthDiff > threshold || heightDiff > threshold) && !devtoolsOpen) {
                    devtoolsOpen = true;
                    LogStore.registrar('PHANTOM', '🔍 DevTools abiertas detectadas por tamaño', {
                        widthDiff, heightDiff
                    });
                } else if (widthDiff <= threshold && heightDiff <= threshold && devtoolsOpen) {
                    devtoolsOpen = false;
                }
            };
            setInterval(detectDevTools, 1000);

            // 3. Ocultar funciones de debug
            console.log = function() {
                // Registrar pero no mostrar en consola
                const args = Array.from(arguments);
                LogStore.registrar('PHANTOM', 'console.log ejecutado', { args: args.slice(0, 3) });
            };

            LogStore.registrar('PHANTOM', '🛡️ Anti-debugging avanzado activado');
        },

        _confuseDebugger: function() {
            // Técnicas para confundir al debugger
            const originalEval = window.eval;
            window.eval = function(code) {
                // Si el código intenta inspeccionar variables, devolver datos falsos
                if (typeof code === 'string' && code.includes('inspector')) {
                    return 'No disponible';
                }
                return originalEval(code);
            };

            // Redefinir console.log para que no muestre nada importante
            const originalLog = console.log;
            console.log = function(...args) {
                if (args.some(a => typeof a === 'string' && a.includes('secret'))) {
                    return;
                }
                originalLog.apply(console, args);
            };
        },

        // -------- Protección de DOM --------
        _protectDOM: function() {
            // Prevenir modificación de elementos críticos
            const criticalElements = [
                document.documentElement,
                document.body,
                document.head
            ];

            criticalElements.forEach(el => {
                if (el) {
                    // Congelar algunas propiedades
                    try {
                        Object.freeze(el);
                    } catch (e) {
                        // Some browsers may not support freeze on DOM elements
                    }
                }
            });

            // Monitorear cambios en el DOM que afecten a elementos críticos
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.removedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE && 
                                (node === document.documentElement || node === document.body)) {
                                LogStore.registrar('PHANTOM', '🚨 Intento de eliminar elemento crítico', {
                                    element: node.tagName
                                });
                                // Restaurar
                                if (node === document.documentElement) {
                                    document.documentElement = document.createElement('html');
                                }
                            }
                        }
                    }
                }
            });

            observer.observe(document, { childList: true, subtree: true });

            LogStore.registrar('PHANTOM', '🛡️ DOM protegido');
        },

        // -------- API Pública --------
        obtenerEstado: function() {
            return {
                watermarkActive: this._watermarkActive,
                debuggerCounter: this._debuggerCounter,
                active: true
            };
        },

        regenerarWatermark: function() {
            // Eliminar watermark existente
            const existing = document.getElementById('armytage-phantom-watermark');
            if (existing) existing.remove();
            this._watermarkActive = false;
            this._embedWatermark();
            LogStore.registrar('PHANTOM', '🔄 Watermark regenerado');
        }
    };

    // ============================================================
    // 4. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                Phantom.iniciar();
            }, 500);
        });
    } else {
        setTimeout(() => {
            Phantom.iniciar();
        }, 500);
    }

    window.Phantom = Phantom;

    console.log('⚡ Phantom.js - "El Espectro" cargado');
    console.log('👻 Operando en modo sigiloso');

})();