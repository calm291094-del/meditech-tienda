// ============================================================
// 🛡️ ARMYTAGE - PROFESSIONAL MONITOR v2.0
// ============================================================
// Herramienta de monitoreo profesional para páginas web.
// Detecta: estructura HTML, rendimiento, errores, seguridad,
// mutaciones DOM, interacciones de usuario y salud del sitio.
// Totalmente autónomo, sin dependencias externas.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        maxLogs: 500,
        mutationDebounce: 100,
        performanceSampleRate: 0.1,
        enableCSP: true,
        enableXSSDetection: true,
        enableInteractionTracking: true,
        enableNetworkMonitoring: true
    };

    // ============================================================
    // 2. SISTEMA DE LOGS (con persistencia)
    // ============================================================
    const LogStore = {
        _logs: [],
        _maxLogs: CONFIG.maxLogs,

        init() {
            try {
                const data = localStorage.getItem('armytage_logs');
                if (data) {
                    this._logs = JSON.parse(data);
                }
            } catch (e) {}
        },

        async registrar(tipo, mensaje, datos = {}) {
            const entry = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                url: window.location.href,
                usuario: this._obtenerUsuario()
            };
            this._logs.push(entry);
            if (this._logs.length > this._maxLogs) {
                this._logs = this._logs.slice(-this._maxLogs);
            }
            // Guardar en localStorage
            try {
                localStorage.setItem('armytage_logs', JSON.stringify(this._logs));
            } catch (e) {}
            // Notificar en consola (solo en desarrollo)
            if (window.armytage?.debug) {
                console.log(`[${tipo}] ${mensaje}`, datos);
            }
            return entry;
        },

        _obtenerUsuario() {
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const user = JSON.parse(session);
                    return user.username || user.email || 'anon';
                }
            } catch (e) {}
            return 'anon';
        },

        obtenerLogs(tipo = null, limite = 100) {
            let logs = this._logs;
            if (tipo) {
                logs = logs.filter(l => l.tipo === tipo);
            }
            return logs.slice(-limite);
        },

        limpiar() {
            this._logs = [];
            localStorage.removeItem('armytage_logs');
        }
    };

    // ============================================================
    // 3. SISTEMA DE NOTIFICACIONES
    // ============================================================
    function showToast(message, type = 'info', duration = 4000) {
        let container = document.getElementById('armytage-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'armytage-toast-container';
            container.style.cssText = `
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
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const colors = {
            info: '#3b82f6',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            critical: '#dc2626'
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
        container.appendChild(toast);
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
    }

    // ============================================================
    // 4. ANALIZADOR ESTRUCTURAL DEL HTML
    // ============================================================
    const StructureAnalyzer = {
        _cache: null,

        analizar() {
            const start = performance.now();
            const result = {
                timestamp: new Date().toISOString(),
                totalElements: 0,
                elementos: {},
                atributos: {},
                clases: {},
                ids: [],
                recursos: {
                    scripts: [],
                    styles: [],
                    images: [],
                    fonts: [],
                    iframes: []
                },
                elementosInseguros: [],
                elementosObsoletos: [],
                profundidadMaxima: 0,
                formularios: [],
                enlaces: [],
                metaTags: {}
            };

            // Recorrer todo el DOM
            const walker = document.createTreeWalker(
                document.body || document.documentElement,
                NodeFilter.SHOW_ELEMENT,
                null,
                false
            );

            let node;
            let profundidadActual = 0;
            const profundidades = [];

            while (node = walker.nextNode()) {
                const tag = node.tagName.toLowerCase();
                result.totalElements++;

                // Contar elementos por etiqueta
                result.elementos[tag] = (result.elementos[tag] || 0) + 1;

                // Analizar atributos
                for (const attr of node.attributes) {
                    const name = attr.name;
                    result.atributos[name] = (result.atributos[name] || 0) + 1;

                    // Detectar atributos inseguros
                    if (name.startsWith('on') && CONFIG.enableXSSDetection) {
                        result.elementosInseguros.push({
                            tag,
                            atributo: name,
                            valor: attr.value.substring(0, 50)
                        });
                    }

                    // Clases
                    if (name === 'class') {
                        const classes = attr.value.split(/\s+/);
                        for (const cls of classes) {
                            if (cls) {
                                result.clases[cls] = (result.clases[cls] || 0) + 1;
                            }
                        }
                    }

                    // ID
                    if (name === 'id' && attr.value) {
                        result.ids.push(attr.value);
                    }
                }

                // Recursos externos
                if (tag === 'script' && node.src) {
                    result.recursos.scripts.push(node.src);
                }
                if (tag === 'link' && node.rel === 'stylesheet' && node.href) {
                    result.recursos.styles.push(node.href);
                }
                if (tag === 'img' && node.src) {
                    result.recursos.images.push(node.src);
                }
                if (tag === 'link' && node.rel === 'preconnect' && node.href) {
                    // fuentes
                }
                if (tag === 'iframe') {
                    result.recursos.iframes.push(node.src || 'about:blank');
                }

                // Elementos obsoletos
                if (['font', 'center', 'marquee', 'blink', 'frame', 'frameset'].includes(tag)) {
                    result.elementosObsoletos.push(tag);
                }

                // Formularios
                if (tag === 'form') {
                    result.formularios.push({
                        action: node.action || '',
                        method: node.method || 'GET',
                        inputs: node.querySelectorAll('input, textarea, select').length
                    });
                }

                // Enlaces
                if (tag === 'a' && node.href) {
                    result.enlaces.push({
                        href: node.href,
                        target: node.target || '_self',
                        rel: node.rel || ''
                    });
                }

                // Meta tags
                if (tag === 'meta') {
                    const name = node.getAttribute('name') || node.getAttribute('property') || '';
                    const content = node.getAttribute('content') || '';
                    if (name) {
                        result.metaTags[name] = content;
                    }
                }

                // Profundidad
                let depth = 0;
                let parent = node.parentNode;
                while (parent && parent !== document.documentElement) {
                    depth++;
                    parent = parent.parentNode;
                }
                profundidades.push(depth);
                if (depth > result.profundidadMaxima) {
                    result.profundidadMaxima = depth;
                }
            }

            // Profundidad promedio
            result.profundidadPromedio = profundidades.length > 0 ?
                profundidades.reduce((a, b) => a + b, 0) / profundidades.length :
                0;

            result.tiempoAnalisis = (performance.now() - start).toFixed(2) + 'ms';
            this._cache = result;
            return result;
        },

        obtenerReporte() {
            if (!this._cache) {
                this.analizar();
            }
            return this._cache;
        },

        generarResumen() {
            const data = this.obtenerReporte();
            return {
                totalElementos: data.totalElements,
                totalEtiquetas: Object.keys(data.elementos).length,
                totalClases: Object.keys(data.clases).length,
                totalIds: data.ids.length,
                totalScripts: data.recursos.scripts.length,
                totalStyles: data.recursos.styles.length,
                totalImages: data.recursos.images.length,
                profundidadMaxima: data.profundidadMaxima,
                profundidadPromedio: data.profundidadPromedio.toFixed(1),
                elementosInseguros: data.elementosInseguros.length,
                elementosObsoletos: data.elementosObsoletos.length,
                formularios: data.formularios.length,
                enlaces: data.enlaces.length
            };
        }
    };

    // ============================================================
    // 5. MONITOR DE MUTACIONES DOM
    // ============================================================
    const DOMWatcher = {
        _observer: null,
        _mutations: [],
        _timeout: null,
        _enabled: true,

        iniciar() {
            if (!this._enabled) return;

            this._observer = new MutationObserver((mutations) => {
                this._mutations = this._mutations.concat(mutations);
                // Debounce para no saturar
                clearTimeout(this._timeout);
                this._timeout = setTimeout(() => {
                    this._procesarMutations();
                }, CONFIG.mutationDebounce);
            });

            this._observer.observe(document.documentElement || document.body, {
                childList: true,
                attributes: true,
                subtree: true,
                characterData: true,
                attributeOldValue: true,
                characterDataOldValue: true
            });

            LogStore.registrar('DOM_WATCHER', 'Monitoreo de DOM iniciado');
        },

        _procesarMutations() {
            const mutations = this._mutations;
            this._mutations = [];

            if (mutations.length === 0) return;

            const resumen = {
                total: mutations.length,
                added: 0,
                removed: 0,
                attributes: 0,
                characterData: 0,
                elementosAgregados: [],
                elementosEliminados: [],
                atributosModificados: [],
                timestamp: new Date().toISOString()
            };

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    resumen.added += mutation.addedNodes.length;
                    resumen.removed += mutation.removedNodes.length;

                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tag = node.tagName?.toLowerCase() || 'unknown';
                            resumen.elementosAgregados.push({
                                tag,
                                id: node.id || '',
                                classes: node.className || ''
                            });
                            // Detectar inyección de scripts
                            if (tag === 'script') {
                                LogStore.registrar('SECURITY', 'Script inyectado en DOM', {
                                    src: node.src || 'inline',
                                    html: node.innerHTML?.substring(0, 100)
                                });
                                showToast('⚠️ Script detectado en el DOM', 'warning', 3000);
                            }
                        }
                    }

                    for (const node of mutation.removedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            resumen.elementosEliminados.push({
                                tag: node.tagName?.toLowerCase() || 'unknown',
                                id: node.id || ''
                            });
                        }
                    }
                } else if (mutation.type === 'attributes') {
                    resumen.attributes++;
                    resumen.atributosModificados.push({
                        element: mutation.target.tagName?.toLowerCase() || 'unknown',
                        attribute: mutation.attributeName,
                        oldValue: mutation.oldValue,
                        newValue: mutation.target.getAttribute(mutation.attributeName)
                    });

                    // Detectar cambios sospechosos
                    if (mutation.attributeName === 'src' && mutation.target.tagName === 'SCRIPT') {
                        LogStore.registrar('SECURITY', 'Script src modificado', {
                            old: mutation.oldValue,
                            new: mutation.target.getAttribute('src')
                        });
                    }
                    if (mutation.attributeName && mutation.attributeName.startsWith('on')) {
                        LogStore.registrar('SECURITY', 'Atributo de evento modificado', {
                            element: mutation.target.tagName,
                            attribute: mutation.attributeName,
                            value: mutation.target.getAttribute(mutation.attributeName)
                        });
                    }
                } else if (mutation.type === 'characterData') {
                    resumen.characterData++;
                }
            }

            // Guardar resumen
            LogStore.registrar('DOM_MUTATION', `DOM mutado: ${resumen.total} cambios`, resumen);

            // Alertar si hay muchos cambios sospechosos
            if (resumen.elementosAgregados.length > 20) {
                showToast(`📦 ${resumen.elementosAgregados.length} elementos añadidos al DOM`, 'info', 3000);
            }

            return resumen;
        },

        detener() {
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }
            this._enabled = false;
            LogStore.registrar('DOM_WATCHER', 'Monitoreo de DOM detenido');
        },

        obtenerEstadisticas() {
            return {
                totalMutations: this._mutations.length,
                enabled: this._enabled
            };
        }
    };

    // ============================================================
    // 6. MONITOR DE RENDIMIENTO (PerformanceObserver)
    // ============================================================
    const PerformanceMonitor = {
        _observers: [],
        _metrics: {},

        iniciar() {
            if (!window.PerformanceObserver) {
                LogStore.registrar('PERFORMANCE', 'PerformanceObserver no soportado');
                return;
            }

            // 1. Métricas de navegación
            try {
                const navObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'navigation') {
                            this._metrics.navigation = {
                                ttfb: entry.responseStart - entry.requestStart,
                                domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
                                loadComplete: entry.loadEventEnd - entry.startTime,
                                domInteractive: entry.domInteractive - entry.startTime
                            };
                            LogStore.registrar('PERFORMANCE', 'Métrica de navegación', this._metrics.navigation);
                        }
                    }
                });
                navObserver.observe({ entryTypes: ['navigation'] });
                this._observers.push(navObserver);
            } catch (e) {}

            // 2. Paint metrics (FCP, LCP)
            try {
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'paint') {
                            this._metrics[entry.name] = entry.startTime;
                            LogStore.registrar('PERFORMANCE', `Paint: ${entry.name}`, { time: entry.startTime });
                        }
                    }
                });
                paintObserver.observe({ entryTypes: ['paint'] });
                this._observers.push(paintObserver);
            } catch (e) {}

            // 3. Largest Contentful Paint (LCP)
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const last = entries[entries.length - 1];
                    if (last) {
                        this._metrics.lcp = last.startTime;
                        this._metrics.lcpElement = last.element?.tagName || 'unknown';
                        LogStore.registrar('PERFORMANCE', 'LCP actualizado', {
                            time: last.startTime,
                            element: this._metrics.lcpElement
                        });
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this._observers.push(lcpObserver);
            } catch (e) {}

            // 4. Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this._metrics.cls = clsValue;
                    LogStore.registrar('PERFORMANCE', 'CLS actualizado', { value: clsValue });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this._observers.push(clsObserver);
            } catch (e) {}

            // 5. Event Timing (interacciones lentas)
            try {
                const eventObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 100) { // Eventos > 100ms
                            LogStore.registrar('PERFORMANCE', 'Evento lento detectado', {
                                type: entry.name,
                                duration: entry.duration,
                                target: entry.target?.tagName || 'unknown'
                            });
                        }
                    }
                });
                eventObserver.observe({ entryTypes: ['event'] });
                this._observers.push(eventObserver);
            } catch (e) {}

            // 6. Tamaño del DOM
            setInterval(() => {
                const totalElements = document.querySelectorAll('*').length;
                this._metrics.domSize = totalElements;
                if (totalElements > 2000) {
                    LogStore.registrar('PERFORMANCE', 'DOM grande detectado', { size: totalElements });
                }
            }, 30000);

            LogStore.registrar('PERFORMANCE', 'Monitoreo de rendimiento iniciado');
        },

        obtenerMetricas() {
            return {
                ...this._metrics,
                timestamp: new Date().toISOString()
            };
        },

        detener() {
            for (const observer of this._observers) {
                try {
                    observer.disconnect();
                } catch (e) {}
            }
            this._observers = [];
        }
    };

    // ============================================================
    // 7. MONITOR DE ERRORES
    // ============================================================
    const ErrorMonitor = {
        _errores: [],
        _maxErrors: 100,

        iniciar() {
            // Errores globales
            window.addEventListener('error', (event) => {
                const error = {
                    tipo: 'error',
                    mensaje: event.message,
                    archivo: event.filename,
                    linea: event.lineno,
                    columna: event.colno,
                    stack: event.error?.stack,
                    timestamp: new Date().toISOString()
                };
                this._errores.push(error);
                if (this._errores.length > this._maxErrors) {
                    this._errores.shift();
                }
                LogStore.registrar('ERROR', event.message, {
                    archivo: event.filename,
                    linea: event.lineno,
                    columna: event.colno
                });
                showToast(`❌ Error: ${event.message.substring(0, 60)}`, 'error', 5000);
            });

            // Promesas rechazadas
            window.addEventListener('unhandledrejection', (event) => {
                const error = {
                    tipo: 'unhandledrejection',
                    mensaje: event.reason?.message || String(event.reason),
                    stack: event.reason?.stack,
                    timestamp: new Date().toISOString()
                };
                this._errores.push(error);
                if (this._errores.length > this._maxErrors) {
                    this._errores.shift();
                }
                LogStore.registrar('ERROR', 'Promesa rechazada: ' + error.mensaje, {
                    reason: event.reason
                });
                showToast(`⚠️ Promesa rechazada: ${error.mensaje.substring(0, 60)}`, 'warning', 4000);
            });

            // Errores de recursos (imágenes, scripts, etc.)
            window.addEventListener('error', (event) => {
                if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                    LogStore.registrar('ERROR', `Error al cargar recurso: ${event.target.src || event.target.href}`, {
                        tag: event.target.tagName,
                        url: event.target.src || event.target.href
                    });
                    showToast(`❌ Error al cargar: ${event.target.tagName}`, 'error', 3000);
                }
            }, true);

            LogStore.registrar('ERROR_MONITOR', 'Monitoreo de errores iniciado');
        },

        obtenerErrores() {
            return this._errores;
        },

        obtenerResumen() {
            const errores = this._errores;
            const porTipo = {};
            for (const e of errores) {
                porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;
            }
            return {
                total: errores.length,
                porTipo,
                ultimo: errores[errores.length - 1] || null
            };
        }
    };

    // ============================================================
    // 8. MONITOR DE SEGURIDAD (CSP + XSS)
    // ============================================================
    const SecurityMonitor = {
        _violaciones: [],

        iniciar() {
            // 1. CSP Violations
            if (CONFIG.enableCSP) {
                document.addEventListener('securitypolicyviolation', (e) => {
                    const violation = {
                        tipo: 'csp',
                        policy: e.violatedDirective,
                        resource: e.blockedURI,
                        document: e.documentURI,
                        timestamp: new Date().toISOString()
                    };
                    this._violaciones.push(violation);
                    LogStore.registrar('SECURITY', `Violación de CSP: ${e.violatedDirective}`, violation);
                    showToast(`🔒 Violación de CSP: ${e.violatedDirective}`, 'critical', 5000);
                });
            }

            // 2. Detección de funciones peligrosas (XSS)
            if (CONFIG.enableXSSDetection) {
                this._hookDangerousFunctions();
            }

            // 3. Detección de DevTools (avanzada)
            this._detectDevTools();

            LogStore.registrar('SECURITY_MONITOR', 'Monitoreo de seguridad iniciado');
        },

        _hookDangerousFunctions() {
            // Hook eval
            const originalEval = window.eval;
            window.eval = function(code) {
                const stack = new Error().stack;
                LogStore.registrar('SECURITY', 'eval() ejecutado', {
                    code: typeof code === 'string' ? code.substring(0, 100) : 'non-string',
                    stack: stack?.split('\n').slice(1, 4).join('\n')
                });
                return originalEval(code);
            };

            // Hook innerHTML
            const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            if (descriptor) {
                const originalSetter = descriptor.set;
                descriptor.set = function(value) {
                    if (typeof value === 'string' && (value.includes('<script') || value.includes('javascript:'))) {
                        LogStore.registrar('SECURITY', 'innerHTML con contenido sospechoso', {
                            value: value.substring(0, 100),
                            element: this.tagName
                        });
                        showToast('⚠️ Contenido sospechoso detectado en innerHTML', 'warning', 4000);
                    }
                    return originalSetter.call(this, value);
                };
                Object.defineProperty(Element.prototype, 'innerHTML', descriptor);
            }

            // Hook document.write
            const originalWrite = document.write;
            document.write = function(...args) {
                const content = args.join('');
                if (content.includes('<script')) {
                    LogStore.registrar('SECURITY', 'document.write con script', {
                        content: content.substring(0, 100)
                    });
                    showToast('⚠️ document.write con script detectado', 'warning', 4000);
                }
                return originalWrite.apply(this, args);
            };
        },

        _detectDevTools() {
            let devtoolsAbiertos = false;

            // Método 1: Tamaño de ventana
            setInterval(() => {
                const diffWidth = window.outerWidth - window.innerWidth;
                const diffHeight = window.outerHeight - window.innerHeight;
                const threshold = 160;

                if ((diffWidth > threshold || diffHeight > threshold) && !devtoolsAbiertos) {
                    devtoolsAbiertos = true;
                    LogStore.registrar('SECURITY', 'DevTools detectadas (tamaño)');
                    showToast('🔍 DevTools detectadas', 'warning', 3000);
                } else if (diffWidth <= threshold && diffHeight <= threshold && devtoolsAbiertos) {
                    devtoolsAbiertos = false;
                    LogStore.registrar('SECURITY', 'DevTools cerradas');
                }
            }, 2000);

            // Método 2: Debugger
            const debuggerCheck = () => {
                const start = performance.now();
                debugger;
                const duration = performance.now() - start;
                if (duration > 100 && !devtoolsAbiertos) {
                    devtoolsAbiertos = true;
                    LogStore.registrar('SECURITY', 'DevTools detectadas (debugger)');
                    showToast('🔍 DevTools detectadas', 'warning', 3000);
                }
            };
            setInterval(debuggerCheck, 5000);
        },

        obtenerViolaciones() {
            return this._violaciones;
        }
    };

    // ============================================================
    // 9. MONITOR DE INTERACCIONES DE USUARIO
    // ============================================================
    const InteractionMonitor = {
        _interacciones: [],
        _maxInteracciones: 200,
        _enabled: CONFIG.enableInteractionTracking,

        iniciar() {
            if (!this._enabled) return;

            const events = ['click', 'keydown', 'scroll', 'mousemove', 'input', 'submit'];

            for (const eventType of events) {
                document.addEventListener(eventType, (e) => {
                    const interaccion = {
                        tipo: eventType,
                        target: e.target?.tagName || 'unknown',
                        id: e.target?.id || '',
                        classes: e.target?.className || '',
                        timestamp: new Date().toISOString(),
                        timeSinceLoad: performance.now()
                    };

                    // Para clicks, guardar posición
                    if (eventType === 'click' && e.clientX) {
                        interaccion.x = e.clientX;
                        interaccion.y = e.clientY;
                    }

                    // Para inputs, guardar valor (truncado)
                    if (eventType === 'input' && e.target?.value) {
                        interaccion.value = e.target.value.substring(0, 50);
                    }

                    this._interacciones.push(interaccion);
                    if (this._interacciones.length > this._maxInteracciones) {
                        this._interacciones.shift();
                    }

                    // Log solo para eventos importantes
                    if (['click', 'submit', 'keydown'].includes(eventType)) {
                        LogStore.registrar('INTERACTION', `${eventType} en ${interaccion.target}`, interaccion);
                    }
                }, { passive: true });
            }

            LogStore.registrar('INTERACTION_MONITOR', 'Monitoreo de interacciones iniciado');
        },

        obtenerInteracciones(ultimas = 50) {
            return this._interacciones.slice(-ultimas);
        },

        obtenerEstadisticas() {
            const stats = {
                total: this._interacciones.length,
                porTipo: {}
            };
            for (const i of this._interacciones) {
                stats.porTipo[i.tipo] = (stats.porTipo[i.tipo] || 0) + 1;
            }
            return stats;
        }
    };

    // ============================================================
    // 10. MONITOR DE RED
    // ============================================================
    const NetworkMonitor = {
        _peticiones: [],
        _maxPeticiones: 200,

        iniciar() {
            if (!CONFIG.enableNetworkMonitoring) return;

            // Hook fetch
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const start = performance.now();
                const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
                const method = args[1]?.method || 'GET';

                return originalFetch.apply(this, args)
                    .then(response => {
                        const duration = performance.now() - start;
                        const peticion = {
                            url,
                            method,
                            status: response.status,
                            statusText: response.statusText,
                            duration: duration,
                            timestamp: new Date().toISOString(),
                            type: 'fetch'
                        };
                        NetworkMonitor._registrar(peticion);
                        if (duration > 1000) {
                            LogStore.registrar('NETWORK', `Petición lenta: ${url} (${duration.toFixed(0)}ms)`, peticion);
                            showToast(`🐢 Petición lenta: ${url.split('/').pop()}`, 'warning', 3000);
                        }
                        return response;
                    })
                    .catch(error => {
                        const duration = performance.now() - start;
                        const peticion = {
                            url,
                            method,
                            error: error.message,
                            duration,
                            timestamp: new Date().toISOString(),
                            type: 'fetch'
                        };
                        NetworkMonitor._registrar(peticion);
                        LogStore.registrar('NETWORK', `Error en fetch: ${url}`, { error: error.message });
                        showToast(`❌ Error de red: ${url.split('/').pop()}`, 'error', 4000);
                        throw error;
                    });
            };

            // Hook XMLHttpRequest
            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                this._armytageUrl = url;
                this._armytageMethod = method;
                this._armytageStart = performance.now();
                return originalXHROpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function(...args) {
                this.addEventListener('load', function() {
                    const duration = performance.now() - this._armytageStart;
                    const peticion = {
                        url: this._armytageUrl,
                        method: this._armytageMethod,
                        status: this.status,
                        statusText: this.statusText,
                        duration: duration,
                        timestamp: new Date().toISOString(),
                        type: 'xhr'
                    };
                    NetworkMonitor._registrar(peticion);
                    if (duration > 1000) {
                        LogStore.registrar('NETWORK', `XHR lento: ${this._armytageUrl} (${duration.toFixed(0)}ms)`, peticion);
                    }
                });
                this.addEventListener('error', function() {
                    const duration = performance.now() - this._armytageStart;
                    const peticion = {
                        url: this._armytageUrl,
                        method: this._armytageMethod,
                        error: 'Network error',
                        duration,
                        timestamp: new Date().toISOString(),
                        type: 'xhr'
                    };
                    NetworkMonitor._registrar(peticion);
                    LogStore.registrar('NETWORK', `Error XHR: ${this._armytageUrl}`, { error: 'Network error' });
                });
                return originalXHRSend.call(this, ...args);
            };

            LogStore.registrar('NETWORK_MONITOR', 'Monitoreo de red iniciado');
        },

        _registrar(peticion) {
            this._peticiones.push(peticion);
            if (this._peticiones.length > this._maxPeticiones) {
                this._peticiones.shift();
            }
        },

        obtenerPeticiones(ultimas = 50) {
            return this._peticiones.slice(-ultimas);
        },

        obtenerEstadisticas() {
            const stats = {
                total: this._peticiones.length,
                exitosas: 0,
                fallidas: 0,
                avgDuration: 0,
                lentas: 0
            };
            let totalDuration = 0;
            for (const p of this._peticiones) {
                if (p.status && p.status < 400) {
                    stats.exitosas++;
                } else {
                    stats.fallidas++;
                }
                if (p.duration) {
                    totalDuration += p.duration;
                    if (p.duration > 1000) stats.lentas++;
                }
            }
            stats.avgDuration = stats.total > 0 ? (totalDuration / stats.total).toFixed(0) : 0;
            return stats;
        }
    };

    // ============================================================
    // 11. GENERADOR DE INFORME DE SALUD
    // ============================================================
    const HealthReport = {
        generar() {
            const estructura = StructureAnalyzer.obtenerReporte();
            const resumenEstructura = StructureAnalyzer.generarResumen();
            const performance = PerformanceMonitor.obtenerMetricas();
            const errores = ErrorMonitor.obtenerResumen();
            const interacciones = InteractionMonitor.obtenerEstadisticas();
            const red = NetworkMonitor.obtenerEstadisticas();
            const domWatcher = DOMWatcher.obtenerEstadisticas();

            // Calcular puntuación de salud (0-100)
            let score = 100;

            // Penalizaciones por estructura
            if (resumenEstructura.elementosInseguros > 5) score -= 5;
            if (resumenEstructura.elementosObsoletos > 3) score -= 3;
            if (resumenEstructura.profundidadMaxima > 20) score -= 5;
            if (resumenEstructura.totalElementos > 5000) score -= 10;

            // Penalizaciones por rendimiento
            if (performance.lcp && performance.lcp > 2500) score -= 10;
            if (performance.cls && performance.cls > 0.1) score -= 5;
            if (performance.domSize && performance.domSize > 3000) score -= 5;

            // Penalizaciones por errores
            if (errores.total > 10) score -= 10;
            if (errores.total > 50) score -= 15;

            // Penalizaciones por red
            if (red.fallidas > 5) score -= 5;
            if (red.lentas > 10) score -= 5;

            // Asegurar que score esté entre 0 y 100
            score = Math.max(0, Math.min(100, score));

            const nivel = score >= 80 ? 'Excelente' :
                score >= 60 ? 'Bueno' :
                score >= 40 ? 'Regular' : 'Crítico';

            const color = score >= 80 ? '#22c55e' :
                score >= 60 ? '#f59e0b' :
                score >= 40 ? '#f97316' : '#ef4444';

            return {
                score,
                nivel,
                color,
                timestamp: new Date().toISOString(),
                estructura: resumenEstructura,
                performance,
                errores: errores,
                interacciones,
                red,
                domWatcher,
                recomendaciones: this._generarRecomendaciones(score, resumenEstructura, performance, errores)
            };
        },

        _generarRecomendaciones(score, estructura, performance, errores) {
            const recomendaciones = [];

            if (estructura.elementosInseguros > 0) {
                recomendaciones.push('🔒 Eliminar atributos de evento inline (onclick, etc.)');
            }
            if (estructura.elementosObsoletos > 0) {
                recomendaciones.push('📦 Reemplazar elementos obsoletos (font, center, etc.)');
            }
            if (estructura.profundidadMaxima > 15) {
                recomendaciones.push('📐 Reducir la profundidad del DOM (anidación excesiva)');
            }
            if (estructura.totalElementos > 3000) {
                recomendaciones.push('📊 Reducir el número total de elementos DOM');
            }
            if (performance.lcp && performance.lcp > 2500) {
                recomendaciones.push('⚡ Optimizar LCP (cargar imágenes críticas antes)');
            }
            if (performance.cls && performance.cls > 0.1) {
                recomendaciones.push('📐 Reducir cambios de layout (CLS)');
            }
            if (errores.total > 5) {
                recomendaciones.push('🐛 Corregir los errores de JavaScript');
            }
            if (recomendaciones.length === 0) {
                recomendaciones.push('✅ El sitio está en buen estado. ¡Sigue así!');
            }

            return recomendaciones;
        }
    };

    // ============================================================
    // 12. INTERFAZ DE CHAT (con comandos avanzados)
    // ============================================================
    const ChatInterface = {
        _container: null,
        _messages: null,
        _input: null,
        _isOpen: false,

        init() {
            this._crearUI();
            this._agregarMensaje('sistema', '🧠 Armytage Professional Monitor v2.0');
            this._agregarMensaje('sistema', '💡 Escribe /help para ver todos los comandos');
        },

        _crearUI() {
            const container = document.createElement('div');
            container.id = 'armytage-chat';
            container.style.cssText = `
                position: fixed;
                top: 50%;
                right: 0;
                transform: translateY(-50%) translateX(100%);
                width: 380px;
                max-height: 520px;
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
                background: #0d9488;
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
                border-right: 2px solid #0d9488;
            `;
            toggleBtn.onmouseover = () => toggleBtn.style.background = '#0f766e';
            toggleBtn.onmouseout = () => toggleBtn.style.background = '#0d9488';
            toggleBtn.onclick = () => this._toggleChat();
            document.body.appendChild(toggleBtn);
            this._toggleBtn = toggleBtn;

            const header = document.createElement('div');
            header.style.cssText = `
                padding: 10px 14px;
                background: #0f172a;
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
            header.innerHTML = `<span>🛡️ Armytage Pro</span><span style="font-size:11px;color:#0d9488;">● Monitor</span>`;
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
                max-height: 360px;
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
            `;
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
                this._toggleBtn.style.right = '380px';
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
            } else if (tipo === 'comando') {
                msg.style.background = '#2d3748';
                msg.style.alignSelf = 'flex-end';
                msg.style.color = '#e2e8f0';
                msg.style.fontSize = '12px';
            } else if (tipo === 'respuesta') {
                msg.style.background = '#1e293b';
                msg.style.borderLeft = '2px solid #0d9488';
                msg.style.alignSelf = 'flex-start';
                msg.style.paddingLeft = '8px';
                msg.style.whiteSpace = 'pre-wrap';
                msg.style.fontSize = '12px';
                msg.style.maxWidth = '95%';
            } else if (tipo === 'error') {
                msg.style.background = '#450a0a';
                msg.style.borderLeft = '2px solid #ef4444';
                msg.style.color = '#fca5a5';
                msg.style.fontSize = '12px';
            } else if (tipo === 'success') {
                msg.style.background = '#064e3b';
                msg.style.borderLeft = '2px solid #22c55e';
                msg.style.color = '#86efac';
                msg.style.fontSize = '12px';
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
                    case '/help':
                        respuesta = this._getHelp();
                        break;

                    case '/status':
                        respuesta = await this._getStatus();
                        break;

                    case '/health':
                        respuesta = await this._getHealth();
                        break;

                    case '/structure':
                        respuesta = this._getStructure();
                        break;

                    case '/logs':
                        const n = parseInt(args[1]) || 10;
                        respuesta = this._getLogs(n);
                        break;

                    case '/errors':
                        respuesta = this._getErrors();
                        break;

                    case '/performance':
                        respuesta = this._getPerformance();
                        break;

                    case '/network':
                        respuesta = this._getNetwork();
                        break;

                    case '/security':
                        respuesta = this._getSecurity();
                        break;

                    case '/interactions':
                        respuesta = this._getInteractions();
                        break;

                    case '/clear':
                        this._messages.innerHTML = '';
                        respuesta = null;
                        break;

                    default:
                        respuesta = `❌ Comando desconocido. Escribe /help para ver la lista.`;
                }

                if (respuesta) {
                    this._agregarMensaje('respuesta', respuesta);
                }
            } catch (e) {
                this._agregarMensaje('error', `❌ Error: ${e.message}`);
            }
        },

        _getHelp() {
            return `📋 COMANDOS DISPONIBLES:

🟢 /status - Estado general del sistema
📊 /health - Informe completo de salud del sitio
📐 /structure - Análisis estructural del HTML
📋 /logs [n] - Últimos n logs (def: 10)
🐛 /errors - Resumen de errores
⚡ /performance - Métricas de rendimiento
🌐 /network - Estadísticas de red
🔒 /security - Violaciones de seguridad y alertas
👆 /interactions - Estadísticas de interacciones
🧹 /clear - Limpiar el chat
❓ /help - Esta ayuda`;
        },

        async _getStatus() {
            const health = HealthReport.generar();
            const logs = LogStore.obtenerLogs(null, 5);
            const ultimoLog = logs.length > 0 ? logs[logs.length - 1] : null;

            return `📊 ESTADO DE ARMYTAGE PRO

🟢 Salud: ${health.score}/100 (${health.nivel})
📝 Logs registrados: ${LogStore._logs.length}
🐛 Errores: ${health.errores.total}
🌐 Peticiones de red: ${health.red.total}
👆 Interacciones: ${health.interacciones.total}

Último evento: ${ultimoLog ? `${ultimoLog.tipo}: ${ultimoLog.mensaje}` : 'Ninguno'}
⏰ ${new Date().toISOString()}`;
        },

        async _getHealth() {
            const health = HealthReport.generar();
            let respuesta = `📊 INFORME DE SALUD

🔵 Puntuación: ${health.score}/100
🟢 Nivel: ${health.nivel}

📐 ESTRUCTURA:
• Elementos totales: ${health.estructura.totalElementos}
• Etiquetas únicas: ${health.estructura.totalEtiquetas}
• Clases únicas: ${health.estructura.totalClases}
• Profundidad máx: ${health.estructura.profundidadMaxima}
• Elementos inseguros: ${health.estructura.elementosInseguros}
• Elementos obsoletos: ${health.estructura.elementosObsoletos}

⚡ RENDIMIENTO:
• LCP: ${health.performance.lcp ? health.performance.lcp.toFixed(0) + 'ms' : 'N/A'}
• CLS: ${health.performance.cls ? health.performance.cls.toFixed(3) : 'N/A'}
• Tamaño DOM: ${health.performance.domSize || 'N/A'} elementos

🐛 ERRORES: ${health.errores.total}

🌐 RED: ${health.red.exitosas} OK / ${health.red.fallidas} FAIL

💡 RECOMENDACIONES:
${health.recomendaciones.map(r => '  • ' + r).join('\n')}`;
            return respuesta;
        },

        _getStructure() {
            const estructura = StructureAnalyzer.obtenerReporte();
            const resumen = StructureAnalyzer.generarResumen();

            // Top 10 etiquetas más comunes
            const topTags = Object.entries(estructura.elementos)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([tag, count]) => `  • ${tag}: ${count}`)
                .join('\n');

            return `📐 ANÁLISIS ESTRUCTURAL

📊 Resumen:
• Total elementos: ${resumen.totalElementos}
• Etiquetas únicas: ${resumen.totalEtiquetas}
• Clases únicas: ${resumen.totalClases}
• IDs: ${resumen.totalIds}
• Profundidad máxima: ${resumen.profundidadMaxima}
• Profundidad promedio: ${resumen.profundidadPromedio}

📦 Recursos:
• Scripts: ${resumen.totalScripts}
• Estilos: ${resumen.totalStyles}
• Imágenes: ${resumen.totalImages}
• Formularios: ${resumen.formularios}
• Enlaces: ${resumen.enlaces}

🔒 Seguridad:
• Elementos inseguros: ${resumen.elementosInseguros}
• Elementos obsoletos: ${resumen.elementosObsoletos}

🏷️ Top etiquetas:
${topTags}

⏱️ Tiempo análisis: ${estructura.tiempoAnalisis}`;
        },

        _getLogs(n) {
            const logs = LogStore.obtenerLogs(null, n);
            if (logs.length === 0) {
                return '📋 No hay logs disponibles.';
            }
            return `📋 ÚLTIMOS ${logs.length} LOGS:\n\n` +
                logs.map(l => `[${l.timestamp.split('T')[1].slice(0,8)}] ${l.tipo}: ${l.mensaje}`).join('\n');
        },

        _getErrors() {
            const errores = ErrorMonitor.obtenerResumen();
            const lista = ErrorMonitor.obtenerErrores().slice(-10);

            let respuesta = `🐛 RESUMEN DE ERRORES

• Total: ${errores.total}
• Por tipo: ${Object.entries(errores.porTipo).map(([tipo, count]) => `${tipo}: ${count}`).join(', ')}

${lista.length > 0 ? '\n📋 Últimos errores:\n' + lista.map(e => `  • ${e.mensaje.substring(0, 60)}`).join('\n') : ''}`;
            return respuesta;
        },

        _getPerformance() {
            const metrics = PerformanceMonitor.obtenerMetricas();
            return `⚡ MÉTRICAS DE RENDIMIENTO

🖥️ Navegación:
• TTFB: ${metrics.navigation?.ttfb ? metrics.navigation.ttfb.toFixed(0) + 'ms' : 'N/A'}
• DOM Interactive: ${metrics.navigation?.domInteractive ? metrics.navigation.domInteractive.toFixed(0) + 'ms' : 'N/A'}
• DOM Content Loaded: ${metrics.navigation?.domContentLoaded ? metrics.navigation.domContentLoaded.toFixed(0) + 'ms' : 'N/A'}
• Load Complete: ${metrics.navigation?.loadComplete ? metrics.navigation.loadComplete.toFixed(0) + 'ms' : 'N/A'}

🎨 Paint:
• FCP: ${metrics['first-contentful-paint'] ? metrics['first-contentful-paint'].toFixed(0) + 'ms' : 'N/A'}
• LCP: ${metrics.lcp ? metrics.lcp.toFixed(0) + 'ms' : 'N/A'}
• LCP Element: ${metrics.lcpElement || 'N/A'}

📐 Layout:
• CLS: ${metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
• Tamaño DOM: ${metrics.domSize || 'N/A'} elementos

⏱️ ${new Date().toISOString()}`;
        },

        _getNetwork() {
            const stats = NetworkMonitor.obtenerEstadisticas();
            const peticiones = NetworkMonitor.obtenerPeticiones(5);

            return `🌐 ESTADÍSTICAS DE RED

📊 Total peticiones: ${stats.total}
✅ Exitosas: ${stats.exitosas}
❌ Fallidas: ${stats.fallidas}
🐢 Lentas (>1s): ${stats.lentas}
⏱️ Duración promedio: ${stats.avgDuration}ms

${peticiones.length > 0 ? '\n📋 Últimas peticiones:\n' + peticiones.map(p =>
    `  • ${p.method} ${p.url.split('/').pop()} → ${p.status || 'Error'} (${p.duration ? p.duration.toFixed(0) + 'ms' : 'N/A'})`
).join('\n') : ''}`;
        },

        _getSecurity() {
            const violaciones = SecurityMonitor.obtenerViolaciones();
            return `🔒 MONITOREO DE SEGURIDAD

🛡️ Violaciones CSP: ${violaciones.length}

${violaciones.length > 0 ? '\n📋 Últimas violaciones:\n' + violaciones.slice(-5).map(v =>
    `  • ${v.policy}: ${v.resource || 'N/A'}`
).join('\n') : '✅ No se detectaron violaciones CSP'}

🔍 Monitoreo activo:
• eval() hook: ✅
• innerHTML hook: ✅
• document.write hook: ✅
• DevTools detection: ✅

⚠️ Recomendación: Mantener CSP habilitado y revisar regularmente.`;
        },

        _getInteractions() {
            const stats = InteractionMonitor.obtenerEstadisticas();
            const interacciones = InteractionMonitor.obtenerInteracciones(5);

            return `👆 ESTADÍSTICAS DE INTERACCIONES

📊 Total: ${stats.total}

📈 Por tipo:
${Object.entries(stats.porTipo).map(([tipo, count]) => `  • ${tipo}: ${count}`).join('\n')}

${interacciones.length > 0 ? '\n📋 Últimas interacciones:\n' + interacciones.map(i =>
    `  • ${i.tipo} en ${i.target}${i.id ? '#' + i.id : ''}`
).join('\n') : ''}`;
        }
    };

    // ============================================================
    // 13. INICIALIZACIÓN PRINCIPAL
    // ============================================================
    function initArmytage() {
        // Inicializar LogStore
        LogStore.init();

        // Iniciar todos los monitores
        StructureAnalyzer.analizar();
        DOMWatcher.iniciar();
        PerformanceMonitor.iniciar();
        ErrorMonitor.iniciar();
        SecurityMonitor.iniciar();
        InteractionMonitor.iniciar();
        NetworkMonitor.iniciar();

        // Registrar inicio
        LogStore.registrar('SISTEMA', 'Armytage Professional Monitor v2.0 iniciado');

        // Iniciar chat
        setTimeout(() => {
            ChatInterface.init();
        }, 500);

        // Exponer API pública
        window.armytage = {
            version: '2.0',
            // Monitores
            estructura: () => StructureAnalyzer.obtenerReporte(),
            salud: () => HealthReport.generar(),
            logs: (tipo = null, n = 100) => LogStore.obtenerLogs(tipo, n),
            errores: () => ErrorMonitor.obtenerErrores(),
            performance: () => PerformanceMonitor.obtenerMetricas(),
            red: () => NetworkMonitor.obtenerPeticiones(50),
            seguridad: () => SecurityMonitor.obtenerViolaciones(),
            interacciones: () => InteractionMonitor.obtenerInteracciones(50),
            // Utilidades
            limpiarLogs: () => LogStore.limpiar(),
            detener: () => {
                DOMWatcher.detener();
                PerformanceMonitor.detener();
                LogStore.registrar('SISTEMA', 'Monitores detenidos');
            },
            debug: false
        };

        // Mostrar mensaje de bienvenida
        const salud = HealthReport.generar();
        showToast(`🛡️ Armytage Pro v2.0 | Salud: ${salud.score}% (${salud.nivel})`, 'success', 4000);

        console.log('🛡️ Armytage Professional Monitor v2.0');
        console.log('📊 Salud del sitio:', salud.score + '% (' + salud.nivel + ')');
        console.log('💬 Haz clic en la flecha ◀ en el borde derecho para abrir el chat');
        console.log('📖 Escribe /help en el chat para ver todos los comandos');
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