// ============================================================
// 🛡️ ARMYTAGE 3.0 - SISTEMA MULTIAGENTE DE ÉLITE CON IA Y CSP
// ============================================================
// Versión con inteligencia adaptativa, CSP dinámica e interfaz de chat.
// Totalmente autónomo, sin dependencias externas.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. STEALTH LOADER (Carga sigilosa y autoprotección) - SIN CAMBIOS
    // ============================================================
    const StealthLoader = {
        _getKey: async function() {
            const encoder = new TextEncoder();
            const data = encoder.encode(window.location.hostname);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        },
        encrypt: async function(plaintext) {
            const key = await this._getKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(plaintext);
            const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(ciphertext), iv.length);
            return btoa(String.fromCharCode(...combined));
        },
        decrypt: async function(ciphertext) {
            const key = await this._getKey();
            const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
            return new TextDecoder().decode(decrypted);
        },
        verifyIntegrity: function() {
            const storedHash = localStorage.getItem('armytage_hash');
            if (!storedHash) return true;
            const currentCode = document.querySelector('script[src*="armytage"]')?.innerHTML || document.currentScript?.innerHTML || '';
            const hash = this._simpleHash(currentCode);
            if (hash !== storedHash) {
                console.error('Integridad comprometida');
                return false;
            }
            return true;
        },
        _simpleHash: function(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            return hash.toString();
        },
        checkDomain: function(allowedDomains = ['localhost', '127.0.0.1', 'tudominio.com']) {
            const host = window.location.hostname;
            if (!allowedDomains.includes(host)) {
                document.body.innerHTML = '<h1 style="color:red;">Dominio no autorizado</h1>';
                throw new Error('Dominio no permitido');
            }
        },
        load: async function() {
            this.checkDomain();
            if (!this.verifyIntegrity()) {
                console.warn('Integridad fallida, intentando recuperar...');
            }
            const encrypted = localStorage.getItem('armytage_encrypted');
            if (encrypted) {
                try {
                    const decrypted = await this.decrypt(encrypted);
                    const blob = new Blob([decrypted], { type: 'application/javascript' });
                    const url = URL.createObjectURL(blob);
                    const script = document.createElement('script');
                    script.src = url;
                    script.onload = () => URL.revokeObjectURL(url);
                    document.head.appendChild(script);
                    return;
                } catch (e) {
                    console.warn('Error al descifrar, cargando normal');
                }
            }
            setTimeout(async () => {
                const code = document.currentScript?.innerHTML || '';
                if (code) {
                    const encrypted = await this.encrypt(code);
                    localStorage.setItem('armytage_encrypted', encrypted);
                    const hash = this._simpleHash(code);
                    localStorage.setItem('armytage_hash', hash);
                }
            }, 100);
        }
    };
    StealthLoader.load();

    // ============================================================
    // 2. MÓDULO DE INTELIGENCIA (Risk Classifier con pesos adaptativos)
    // ============================================================
    const Intelligence = {
        pesos: {
            devtools: 0.3,
            copia: 0.2,
            paste: 0.2,
            xss: 0.5,
            clickjacking: 0.4,
            vm: 0.6,
            errores: 0.1
        },
        umbrales: {
            seguro: 0.2,
            moderado: 0.5,
            peligroso: 0.8,
            critico: 1.0
        },
        historial: [],
        maxHistorial: 100,

        // Cargar pesos guardados
        cargarPesos() {
            try {
                const data = localStorage.getItem('armytage_pesos');
                if (data) {
                    const parsed = JSON.parse(data);
                    this.pesos = { ...this.pesos, ...parsed };
                }
            } catch (e) {}
        },

        guardarPesos() {
            try {
                localStorage.setItem('armytage_pesos', JSON.stringify(this.pesos));
            } catch (e) {}
        },

        // Evaluar riesgo basado en eventos recientes
        evaluarRiesgo(eventos) {
            let puntuacion = 0;
            let totalPeso = 0;

            for (const evento of eventos) {
                let peso = 0;
                if (evento.tipo === 'SECURITY' && evento.mensaje) {
                    const msg = evento.mensaje.toLowerCase();
                    if (msg.includes('devtools')) peso = this.pesos.devtools;
                    else if (msg.includes('copy')) peso = this.pesos.copia;
                    else if (msg.includes('paste')) peso = this.pesos.paste;
                    else if (msg.includes('xss') || msg.includes('injection')) peso = this.pesos.xss;
                    else if (msg.includes('clickjacking')) peso = this.pesos.clickjacking;
                    else if (msg.includes('vm')) peso = this.pesos.vm;
                    else if (msg.includes('error')) peso = this.pesos.errores;
                }
                puntuacion += peso;
                totalPeso += 1;
            }

            const riesgo = totalPeso > 0 ? puntuacion / totalPeso : 0;
            // Normalizar entre 0 y 1
            return Math.min(riesgo, 1);
        },

        // Clasificar el riesgo
        clasificar(riesgo) {
            if (riesgo < this.umbrales.seguro) return 'Seguro';
            if (riesgo < this.umbrales.moderado) return 'Moderado';
            if (riesgo < this.umbrales.peligroso) return 'Peligroso';
            return 'Crítico';
        },

        // Actualizar pesos basados en nuevos eventos (aprendizaje)
        aprender(eventos) {
            const riesgo = this.evaluarRiesgo(eventos);
            // Si el riesgo es alto, incrementar pesos de las categorías que más contribuyeron
            if (riesgo > 0.7) {
                for (const evento of eventos) {
                    if (evento.tipo === 'SECURITY' && evento.mensaje) {
                        const msg = evento.mensaje.toLowerCase();
                        if (msg.includes('devtools')) this.pesos.devtools = Math.min(this.pesos.devtools + 0.05, 1);
                        else if (msg.includes('copy')) this.pesos.copia = Math.min(this.pesos.copia + 0.05, 1);
                        else if (msg.includes('paste')) this.pesos.paste = Math.min(this.pesos.paste + 0.05, 1);
                        else if (msg.includes('xss')) this.pesos.xss = Math.min(this.pesos.xss + 0.05, 1);
                        else if (msg.includes('clickjacking')) this.pesos.clickjacking = Math.min(this.pesos.clickjacking + 0.05, 1);
                        else if (msg.includes('vm')) this.pesos.vm = Math.min(this.pesos.vm + 0.05, 1);
                        else if (msg.includes('error')) this.pesos.errores = Math.min(this.pesos.errores + 0.05, 1);
                    }
                }
                this.guardarPesos();
            }
        },

        // Obtener recomendación de acción basada en el riesgo
        recomendar(riesgo) {
            const clasificacion = this.clasificar(riesgo);
            switch (clasificacion) {
                case 'Seguro': return 'Mantener protecciones estándar.';
                case 'Moderado': return 'Aumentar vigilancia y considerar CSP strict.';
                case 'Peligroso': return 'Activar modo de alta seguridad y notificar al root.';
                case 'Crítico': return 'Bloquear acciones sospechosas, notificar emergencia.';
                default: return '';
            }
        }
    };

    // ============================================================
    // 3. MÓDULO DE CSP DINÁMICO
    // ============================================================
    const CSPManager = {
        niveles: {
            relaxed: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
            strict: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;",
            lockdown: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self';"
        },
        nivelActual: 'relaxed',
        metaTag: null,

        init() {
            // Crear o obtener el meta tag CSP
            let meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.httpEquiv = 'Content-Security-Policy';
                document.head.appendChild(meta);
            }
            this.metaTag = meta;
            this.aplicar(this.nivelActual);
        },

        aplicar(nivel) {
            if (!this.niveles[nivel]) return false;
            this.nivelActual = nivel;
            this.metaTag.content = this.niveles[nivel];
            console.log(`[CSP] Política aplicada: ${nivel}`);
            return true;
        },

        // Ajustar automáticamente según riesgo
        ajustarPorRiesgo(riesgo) {
            if (riesgo < 0.2) {
                this.aplicar('relaxed');
            } else if (riesgo < 0.5) {
                this.aplicar('strict');
            } else {
                this.aplicar('lockdown');
            }
        }
    };

    // ============================================================
    // 4. MÓDULO DE FINGERPRINTING (sin cambios)
    // ============================================================
    const Fingerprinter = {
        async getFingerprint() {
            const components = {
                canvas: this._canvasFingerprint(),
                webgl: this._webglFingerprint(),
                audio: await this._audioFingerprint(),
                fonts: this._fontFingerprint(),
                plugins: this._pluginsFingerprint(),
                screen: this._screenFingerprint(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                hardware: this._hardwareFingerprint(),
                queueTiming: this._queueTiming()
            };
            return components;
        },
        _canvasFingerprint() {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Armytage', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('🛡️', 4, 17);
            return canvas.toDataURL();
        },
        _webglFingerprint() {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'no-webgl';
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                return `${vendor}||${renderer}`;
            }
            return 'webgl-no-debug';
        },
        async _audioFingerprint() {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const analyser = audioCtx.createAnalyser();
                oscillator.connect(analyser);
                analyser.connect(audioCtx.destination);
                oscillator.frequency.value = 1000;
                oscillator.start();
                const data = new Float32Array(analyser.frequencyBinCount);
                analyser.getFloatFrequencyData(data);
                oscillator.stop();
                audioCtx.close();
                return Array.from(data.slice(0, 10)).join(',');
            } catch (e) {
                return 'audio-error';
            }
        },
        _fontFingerprint() {
            const baseFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'];
            const testFonts = ['Comic Sans MS', 'Georgia', 'Impact', 'Tahoma', 'Trebuchet MS', 'Verdana'];
            const allFonts = baseFonts.concat(testFonts);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 500;
            canvas.height = 200;
            ctx.font = '14px Arial';
            const text = 'abcdefghijklmnopqrstuvwxyz';
            const baseline = ctx.measureText(text);
            const available = [];
            allFonts.forEach(font => {
                ctx.font = `14px "${font}", Arial`;
                const measure = ctx.measureText(text);
                if (measure.width !== baseline.width) available.push(font);
            });
            return available;
        },
        _pluginsFingerprint() {
            const plugins = [];
            for (let i = 0; i < navigator.plugins.length; i++) {
                plugins.push(navigator.plugins[i].name);
            }
            return plugins;
        },
        _screenFingerprint() {
            return `${screen.width}x${screen.height}x${screen.colorDepth}`;
        },
        _hardwareFingerprint() {
            const concurrency = navigator.hardwareConcurrency || 0;
            const memory = navigator.deviceMemory || 0;
            const platform = navigator.platform;
            const vendor = navigator.vendor;
            const userAgent = navigator.userAgent;
            const vmIndicators = ['VMware', 'VirtualBox', 'VBox', 'Parallels', 'Hyper-V', 'QEMU'];
            const isVM = vmIndicators.some(ind => userAgent.includes(ind) || platform.includes(ind));
            return { concurrency, memory, platform, vendor, isVM };
        },
        _queueTiming() {
            const start = performance.now();
            let sum = 0;
            for (let i = 0; i < 100000; i++) {
                sum += Math.sqrt(i);
            }
            const duration = performance.now() - start;
            return duration;
        }
    };

    // ============================================================
    // 5. MÓDULO DE SANDBOXING (sin cambios)
    // ============================================================
    const Sandbox = {
        _iframe: null,
        _queue: [],
        _ready: false,
        init() {
            if (this._iframe) return;
            this._iframe = document.createElement('iframe');
            this._iframe.style.display = 'none';
            this._iframe.sandbox = 'allow-scripts allow-same-origin';
            this._iframe.src = 'about:blank';
            document.body.appendChild(this._iframe);
            this._iframe.onload = () => {
                this._ready = true;
                this._processQueue();
            };
            const script = this._iframe.contentDocument.createElement('script');
            script.textContent = `
                window.addEventListener('message', function(e) {
                    if (e.data.type === 'execute') {
                        try {
                            const result = eval(e.data.code);
                            window.parent.postMessage({ type: 'result', id: e.data.id, result }, '*');
                        } catch (err) {
                            window.parent.postMessage({ type: 'error', id: e.data.id, error: err.message }, '*');
                        }
                    }
                });
            `;
            this._iframe.contentDocument.head.appendChild(script);
        },
        _processQueue() {
            while (this._queue.length > 0) {
                const task = this._queue.shift();
                this._execute(task);
            }
        },
        _execute(task) {
            if (!this._ready || !this._iframe) return;
            this._iframe.contentWindow.postMessage({ type: 'execute', code: task.code, id: task.id }, '*');
            const listener = (e) => {
                if (e.data.id === task.id) {
                    window.removeEventListener('message', listener);
                    if (e.data.type === 'result') {
                        task.resolve(e.data.result);
                    } else {
                        task.reject(e.data.error);
                    }
                }
            };
            window.addEventListener('message', listener);
        },
        exec(code) {
            return new Promise((resolve, reject) => {
                const id = Date.now() + Math.random();
                const task = { code, id, resolve, reject };
                if (this._ready) {
                    this._execute(task);
                } else {
                    this._queue.push(task);
                }
            });
        }
    };

    // ============================================================
    // 6. MÓDULO DE LOGGING DE SINKS (sin cambios)
    // ============================================================
    const SecurityMonitor = {
        _hooks: {},
        init(logger) {
            this.logger = logger;
            this._hookEval();
            this._hookFunction();
            this._hookSetTimeout();
            this._hookInnerHTML();
            this._hookDocumentWrite();
        },
        _hookEval() {
            const originalEval = window.eval;
            window.eval = function(code) {
                SecurityMonitor.logger.registrar('SINK', 'eval ejecutado', { code: code.substring(0, 100) });
                return originalEval(code);
            };
        },
        _hookFunction() {
            const originalFunction = window.Function;
            window.Function = function(...args) {
                const code = args[args.length - 1];
                SecurityMonitor.logger.registrar('SINK', 'Function constructor usado', { code: code.substring(0, 100) });
                return originalFunction.apply(this, args);
            };
        },
        _hookSetTimeout() {
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = function(callback, delay, ...args) {
                if (typeof callback === 'string') {
                    SecurityMonitor.logger.registrar('SINK', 'setTimeout con string', { code: callback.substring(0, 100) });
                }
                return originalSetTimeout(callback, delay, ...args);
            };
        },
        _hookInnerHTML() {
            const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            const originalSetter = descriptor.set;
            descriptor.set = function(value) {
                SecurityMonitor.logger.registrar('SINK', 'innerHTML modificado', { 
                    element: this.tagName,
                    value: value.substring(0, 100)
                });
                originalSetter.call(this, value);
            };
            Object.defineProperty(Element.prototype, 'innerHTML', descriptor);
        },
        _hookDocumentWrite() {
            const originalWrite = document.write;
            document.write = function(...args) {
                SecurityMonitor.logger.registrar('SINK', 'document.write ejecutado', { args: args.join(' ').substring(0, 100) });
                return originalWrite.apply(this, args);
            };
        }
    };

    // ============================================================
    // 7. MÓDULO DE PERSISTENCIA CON INDEXEDDB (sin cambios)
    // ============================================================
    const PersistentStore = {
        _db: null,
        _storeName: 'armytageStore',
        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('ArmytageDB', 1);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this._storeName)) {
                        const store = db.createObjectStore(this._storeName, { keyPath: 'id' });
                        store.createIndex('type', 'type', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
                request.onsuccess = (e) => {
                    this._db = e.target.result;
                    resolve();
                };
                request.onerror = (e) => {
                    reject(e.target.error);
                };
            });
        },
        async save(type, data) {
            if (!this._db) await this.init();
            const entry = {
                id: `${type}_${Date.now()}_${Math.random()}`,
                type,
                timestamp: Date.now(),
                data
            };
            return new Promise((resolve, reject) => {
                const tx = this._db.transaction(this._storeName, 'readwrite');
                const store = tx.objectStore(this._storeName);
                const request = store.put(entry);
                request.onsuccess = () => resolve(entry.id);
                request.onerror = () => reject(request.error);
            });
        },
        async getByType(type) {
            if (!this._db) await this.init();
            return new Promise((resolve, reject) => {
                const tx = this._db.transaction(this._storeName, 'readonly');
                const store = tx.objectStore(this._storeName);
                const index = store.index('type');
                const request = index.getAll(type);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        async getAll() {
            if (!this._db) await this.init();
            return new Promise((resolve, reject) => {
                const tx = this._db.transaction(this._storeName, 'readonly');
                const store = tx.objectStore(this._storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        async deleteOld(maxAge = 7 * 24 * 60 * 60 * 1000) {
            if (!this._db) await this.init();
            const all = await this.getAll();
            const now = Date.now();
            for (const entry of all) {
                if (now - entry.timestamp > maxAge) {
                    const tx = this._db.transaction(this._storeName, 'readwrite');
                    const store = tx.objectStore(this._storeName);
                    store.delete(entry.id);
                }
            }
        }
    };

    // ============================================================
    // 8. AGENTES MEJORADOS (con integración de inteligencia y CSP)
    // ============================================================

    // 8.1 Clase base Agente (sin cambios)
    class Agente {
        constructor(nombre, personalidad, sistema) {
            this.nombre = nombre;
            this.personalidad = personalidad;
            this.sistema = sistema;
        }
        log(mensaje) {
            console.log(`[${this.nombre}] ${mensaje}`);
        }
    }

    // 8.2 RootAgent (sin cambios)
    class RootAgent extends Agente {
        constructor(sistema) {
            super('RootAgent', 'Guardián de identidad', sistema);
            this.rootLogueado = false;
            this.verificarRoot();
        }
        verificarRoot() {
            try {
                const sessionData = localStorage.getItem('session');
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session.role === 'root' || session.isRoot === true) {
                        this.rootLogueado = true;
                        this.log('✅ Root logueado');
                        return;
                    }
                }
                this.rootLogueado = false;
                this.log('❌ Root no logueado');
            } catch (e) {
                this.rootLogueado = false;
            }
        }
        esRoot() {
            return this.rootLogueado;
        }
        async verificarIntegridad() {
            const integridad = {
                scripts: document.querySelectorAll('script').length,
                localStorageSize: new Blob(Object.values(localStorage)).size,
                modificaciones: 0
            };
            return integridad;
        }
    }

    // 8.3 SecurityAgent mejorado (con monitoreo de riesgo)
    class SecurityAgent extends Agente {
        constructor(sistema) {
            super('SecurityAgent', 'Vigilante', sistema);
            this.proteccionesActivas = false;
            this.watermarkElement = null;
            this.fingerprint = null;
            SecurityMonitor.init(this.sistema.logger);
        }

        async activarProtecciones() {
            if (this.proteccionesActivas) return;
            this.proteccionesActivas = true;
            this.log('🛡️ Activando protecciones de seguridad');

            this.fingerprint = await Fingerprinter.getFingerprint();
            this.sistema.logger.registrar('FINGERPRINT', 'Huella obtenida', this.fingerprint);

            if (this.fingerprint.hardware.isVM) {
                this.sistema.notifier.alertaRoot('⚠️ Posible máquina virtual detectada');
                this.sistema.logger.registrar('SEGURIDAD', 'VM detectada');
            }

            this.bloquearTeclas();
            this.bloquearContextMenu();
            this.bloquearCopiadoCortadoPegado();
            this.bloquearSeleccion();
            this.bloquearArrastre();
            this.detectarDevtools();
            this.crearWatermark();
            this.antiClickjacking();
            this.protegerImagenes();
            this.bloquearCaptura();
            this.prevenirXSS();
            this.auditoriaEventos();

            Sandbox.init();
            this.sistema.logger.registrar('SECURITY', 'Protecciones activadas');
        }

        // Métodos de protección (resumidos pero completos en esta versión)
        bloquearTeclas() {
            document.addEventListener('keydown', (e) => {
                if (this.sistema.rootAgent.esRoot()) return true;
                const key = e.key;
                const ctrl = e.ctrlKey;
                const shift = e.shiftKey;
                const alt = e.altKey;
                const bloqueadas = [
                    { key: 'F12' },
                    { key: 'u', ctrl: true },
                    { key: 's', ctrl: true },
                    { key: 'p', ctrl: true },
                    { key: 'i', ctrl: true, shift: true },
                    { key: 'j', ctrl: true, shift: true },
                    { key: 'c', ctrl: true, shift: true },
                    { key: 'k', ctrl: true, shift: true },
                    { key: 'u', ctrl: true, shift: true },
                    { key: 'e', ctrl: true, shift: true },
                    { key: 'h', ctrl: true },
                    { key: 'j', ctrl: true },
                    { key: 'r', ctrl: true },
                    { key: 'F5' },
                    { key: 'r', ctrl: true, shift: true },
                ];
                for (let b of bloqueadas) {
                    if (b.key === key &&
                        (b.ctrl === undefined || b.ctrl === ctrl) &&
                        (b.shift === undefined || b.shift === shift) &&
                        (b.alt === undefined || b.alt === alt)) {
                        e.preventDefault();
                        showToast('⚠️ Acción bloqueada por seguridad', 'warning', 2000);
                        this.sistema.logger.registrar('SECURITY', `Tecla bloqueada: ${key}`);
                        return false;
                    }
                }
                return true;
            });
        }

        bloquearContextMenu() {
            document.addEventListener('contextmenu', (e) => {
                if (this.sistema.rootAgent.esRoot()) return true;
                e.preventDefault();
                showToast('⚠️ Menú contextual deshabilitado', 'warning', 2000);
                this.sistema.logger.registrar('SECURITY', 'Intento de menú contextual');
                return false;
            });
        }

        bloquearCopiadoCortadoPegado() {
            ['copy', 'cut', 'paste'].forEach(accion => {
                document.addEventListener(accion, (e) => {
                    if (this.sistema.rootAgent.esRoot()) return true;
                    const target = e.target;
                    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                        return true;
                    }
                    e.preventDefault();
                    const mensajes = {
                        copy: '📋 Copia deshabilitada',
                        cut: '✂️ Corte deshabilitado',
                        paste: '📋 Pegado deshabilitado'
                    };
                    showToast(mensajes[accion] || 'Acción bloqueada', 'warning', 2000);
                    this.sistema.logger.registrar('SECURITY', `Intento de ${accion}`);
                    return false;
                });
            });
        }

        bloquearSeleccion() {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
            document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(el => {
                el.style.userSelect = 'text';
                el.style.webkitUserSelect = 'text';
                el.style.mozUserSelect = 'text';
                el.style.msUserSelect = 'text';
            });
            document.addEventListener('selectstart', (e) => {
                if (this.sistema.rootAgent.esRoot()) return true;
                const target = e.target;
                if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                    return true;
                }
                e.preventDefault();
                return false;
            });
        }

        bloquearArrastre() {
            document.addEventListener('dragstart', (e) => {
                if (this.sistema.rootAgent.esRoot()) return true;
                if (e.target.tagName === 'IMG') {
                    e.preventDefault();
                    showToast('🖼️ No se permite arrastrar imágenes', 'warning', 2000);
                    this.sistema.logger.registrar('SECURITY', 'Intento de arrastre de imagen');
                    return false;
                }
            });
        }

        detectarDevtools() {
            let devtoolsAbiertos = false;
            const umbral = 160;
            const detectar = () => {
                const diffWidth = window.outerWidth - window.innerWidth;
                const diffHeight = window.outerHeight - window.innerHeight;
                const esRoot = this.sistema.rootAgent.esRoot();
                if ((diffWidth > umbral || diffHeight > umbral) && !devtoolsAbiertos) {
                    devtoolsAbiertos = true;
                    if (esRoot) {
                        showToast('🔍 DevTools detectadas (modo root)', 'info', 3000);
                    } else {
                        showToast('🔍 DevTools detectadas - Acción registrada', 'error', 5000);
                        document.body.style.filter = 'blur(4px)';
                        document.body.style.pointerEvents = 'none';
                    }
                    this.sistema.logger.registrar('SECURITY', 'DevTools abiertas' + (esRoot ? ' (root)' : ''));
                } else if (diffWidth <= umbral && diffHeight <= umbral && devtoolsAbiertos) {
                    devtoolsAbiertos = false;
                    if (!esRoot) {
                        document.body.style.filter = '';
                        document.body.style.pointerEvents = '';
                    }
                }
            };
            setInterval(detectar, 1000);
            setInterval(() => {
                if (this.sistema.rootAgent.esRoot()) return;
                const element = new Image();
                Object.defineProperty(element, 'id', {
                    get: function() {
                        if (!devtoolsAbiertos) {
                            devtoolsAbiertos = true;
                            showToast('🔍 DevTools detectadas (debugger)', 'error', 5000);
                            document.body.style.filter = 'blur(4px)';
                            document.body.style.pointerEvents = 'none';
                            this.sistema.logger.registrar('SECURITY', 'DevTools detectadas por debugger');
                        }
                    }.bind(this)
                });
                console.log('%c', element);
            }, 3000);
        }

        crearWatermark() {
            if (this.watermarkElement) {
                this.watermarkElement.remove();
            }
            let usuario = 'Invitado';
            let nombre = 'Invitado';
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const user = JSON.parse(session);
                    usuario = user.username || 'Invitado';
                    nombre = user.name || 'Invitado';
                }
            } catch (e) {}
            const fecha = new Date().toLocaleString('es-ES');
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(0, 80, 158, 0.06)';
            ctx.textAlign = 'center';
            ctx.rotate(-25 * Math.PI / 180);
            ctx.fillText('Armytage - Sistema Seguro', 150, 50);
            ctx.fillText(`Usuario: ${usuario}`, 150, 80);
            ctx.fillText(`Nombre: ${nombre}`, 150, 105);
            ctx.fillText(`Fecha: ${fecha}`, 150, 130);
            const watermarkURL = canvas.toDataURL('image/png');
            const overlay = document.createElement('div');
            overlay.id = 'armytage-watermark';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 99999;
                background-image: url(${watermarkURL});
                background-repeat: repeat;
                opacity: 0.6;
            `;
            document.body.appendChild(overlay);
            this.watermarkElement = overlay;
            this.sistema.logger.registrar('SECURITY', 'Watermark generado');
        }

        antiClickjacking() {
            if (window.top !== window.self) {
                try {
                    if (window.top.location.hostname !== window.self.location.hostname) {
                        document.body.innerHTML = `
                            <div style="display:flex;align-items:center;justify-content:center;
                                        height:100vh;background:#1a1d29;color:#fff;
                                        font-family:sans-serif;text-align:center;padding:20px;">
                                <div>
                                    <h1 style="color:#ef4444;">⚠️ Acceso No Autorizado</h1>
                                    <p>Este sitio no puede ser cargado desde otro dominio.</p>
                                    <a href="${window.location.href}" 
                                       style="color:#38bdf8;text-decoration:underline;">
                                       Ir al sitio oficial →
                                    </a>
                                </div>
                            </div>
                        `;
                        this.sistema.logger.registrar('SECURITY', 'Clickjacking detectado - página bloqueada');
                    }
                } catch (e) {
                    document.body.innerHTML = '<h1>Acceso bloqueado</h1>';
                }
            }
        }

        protegerImagenes() {
            const observer = new MutationObserver(() => {
                document.querySelectorAll('img:not([data-armytage-protected])').forEach(img => {
                    img.setAttribute('data-armytage-protected', 'true');
                    img.addEventListener('contextmenu', (e) => {
                        if (this.sistema.rootAgent.esRoot()) return true;
                        e.preventDefault();
                        return false;
                    });
                    img.addEventListener('dragstart', (e) => {
                        if (this.sistema.rootAgent.esRoot()) return true;
                        e.preventDefault();
                        return false;
                    });
                    img.setAttribute('draggable', 'false');
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
            document.querySelectorAll('img').forEach(img => {
                img.setAttribute('data-armytage-protected', 'true');
                img.addEventListener('contextmenu', (e) => {
                    if (this.sistema.rootAgent.esRoot()) return true;
                    e.preventDefault();
                    return false;
                });
                img.addEventListener('dragstart', (e) => {
                    if (this.sistema.rootAgent.esRoot()) return true;
                    e.preventDefault();
                    return false;
                });
                img.setAttribute('draggable', 'false');
            });
        }

        bloquearCaptura() {
            document.addEventListener('keydown', (e) => {
                if (this.sistema.rootAgent.esRoot()) return true;
                if (e.key === 'PrintScreen') {
                    e.preventDefault();
                    showToast('🖼️ Captura de pantalla bloqueada', 'warning', 2000);
                    this.sistema.logger.registrar('SECURITY', 'Intento de PrintScreen');
                    return false;
                }
            });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && !this.sistema.rootAgent.esRoot()) {
                    this.sistema.logger.registrar('SECURITY', 'Página perdió visibilidad (posible captura)');
                }
            });
        }

        prevenirXSS() {
            document.querySelectorAll('input, textarea').forEach(el => {
                el.addEventListener('input', function() {
                    this.value = this.value.replace(/<script/g, '&lt;script').replace(/<\/script>/g, '&lt;/script&gt;');
                });
            });
        }

        auditoriaEventos() {
            document.addEventListener('beforeunload', () => {
                this.sistema.logger.registrar('SECURITY', 'Intento de cerrar o recargar página');
            });
        }

        actualizarWatermark() {
            this.crearWatermark();
        }

        async ejecutarEnSandbox(code) {
            if (this.sistema.rootAgent.esRoot()) {
                this.sistema.logger.registrar('SANDBOX', 'Root ejecuta código en sandbox', { code: code.substring(0, 100) });
                try {
                    return eval(code);
                } catch (e) {
                    this.sistema.logger.registrar('SANDBOX', 'Error en sandbox (root)', { error: e.message });
                    throw e;
                }
            } else {
                this.sistema.logger.registrar('SANDBOX', 'Código ejecutado en sandbox', { code: code.substring(0, 100) });
                return Sandbox.exec(code);
            }
        }
    }

    // 8.4 LoggerAgent (con IndexedDB)
    class LoggerAgent extends Agente {
        constructor(sistema) {
            super('LoggerAgent', 'Historiador', sistema);
            this.store = PersistentStore;
            this._initStore();
        }
        async _initStore() {
            await this.store.init();
            this.store.deleteOld(7 * 24 * 60 * 60 * 1000);
        }
        async registrar(tipo, mensaje, datos = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                usuario: this.obtenerUsuario()
            };
            await this.store.save('log', entry);
            console.log(`[LOG][${tipo}] ${mensaje}`, datos);
        }
        obtenerUsuario() {
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const user = JSON.parse(session);
                    return user.username || 'anon';
                }
            } catch (e) {}
            return 'anon';
        }
        async obtenerLogs(tipo = null) {
            const all = await this.store.getAll();
            if (tipo) {
                return all.filter(entry => entry.data.tipo === tipo);
            }
            return all;
        }
        async limpiar() {
            // Opcional: eliminar todos los logs
        }
    }

    // 8.5 NotifierAgent (con toasts)
    class NotifierAgent extends Agente {
        constructor(sistema) {
            super('NotifierAgent', 'Mensajero', sistema);
        }
        notificar(mensaje, tipo = 'info', duracion = 4000) {
            showToast(mensaje, tipo, duracion);
            this.sistema.logger.registrar('NOTIFICACION', `Notificación: ${mensaje}`, { tipo });
        }
        alertaRoot(mensaje) {
            this.notificar(`🔴 ${mensaje}`, 'error', 5000);
        }
        info(mensaje) {
            this.notificar(`ℹ️ ${mensaje}`, 'info', 3000);
        }
        exito(mensaje) {
            this.notificar(`✅ ${mensaje}`, 'success', 3000);
        }
        advertencia(mensaje) {
            this.notificar(`⚠️ ${mensaje}`, 'warning', 4000);
        }
    }

    // 8.6 LearnerAgent mejorado (con inteligencia y CSP)
    class LearnerAgent extends Agente {
        constructor(sistema) {
            super('LearnerAgent', 'Analista', sistema);
            this.reglas = [];
            this.intervalo = null;
            this.cargarReglas();
            Intelligence.cargarPesos();
        }

        async cargarReglas() {
            const stored = await PersistentStore.getByType('regla');
            if (stored && stored.length > 0) {
                this.reglas = stored.map(e => e.data);
            } else {
                this.reglas = [];
            }
        }

        async guardarReglas() {
            for (const regla of this.reglas) {
                await PersistentStore.save('regla', regla);
            }
        }

        iniciarAprendizaje() {
            this.intervalo = setInterval(() => {
                this.analizarPatrones();
            }, 30000); // Cada 30 segundos para mayor reactividad
            this.log('Aprendizaje iniciado');
        }

        async analizarPatrones() {
            const logs = await this.sistema.logger.obtenerLogs('SECURITY');
            if (logs.length === 0) return;

            // Tomar los últimos 30 logs
            const ultimos = logs.slice(-30);

            // Evaluar riesgo con inteligencia
            const eventos = ultimos.map(entry => entry.data);
            const riesgo = Intelligence.evaluarRiesgo(eventos);
            const clasificacion = Intelligence.clasificar(riesgo);

            // Registrar el riesgo
            await this.sistema.logger.registrar('INTELIGENCIA', `Riesgo: ${riesgo.toFixed(2)} - ${clasificacion}`);

            // Ajustar CSP según riesgo
            CSPManager.ajustarPorRiesgo(riesgo);

            // Aprender de los eventos
            Intelligence.aprender(eventos);

            // Crear reglas basadas en patrones
            const devtools = ultimos.filter(l => l.data.mensaje && l.data.mensaje.includes('DevTools'));
            if (devtools.length >= 3) {
                this.crearRegla('ALERTAR_ROOT_DEVTOOLS', 'Alerta root si se detectan DevTools repetidamente', 10, 'high');
            }

            const copias = ultimos.filter(l => l.data.mensaje && (l.data.mensaje.includes('copy') || l.data.mensaje.includes('paste')));
            if (copias.length >= 5) {
                this.crearRegla('BLOQUEO_INTENSIVO_COPIA', 'Aumentar bloqueo de copia', 30, 'medium');
            }

            // Limpiar reglas expiradas
            this.reglas = this.reglas.filter(r => r.duracion > 0);
            this.reglas.forEach(r => r.duracion--);
            await this.guardarReglas();

            // Notificar si riesgo crítico
            if (riesgo > 0.8) {
                this.sistema.notifier.alertaRoot(`🚨 Riesgo crítico (${riesgo.toFixed(2)}) - ${Intelligence.recomendar(riesgo)}`);
            }
        }

        crearRegla(nombre, descripcion, duracion = 0, prioridad = 'medium') {
            if (this.reglas.some(r => r.nombre === nombre)) return;
            this.reglas.push({ nombre, descripcion, duracion, prioridad, creada: Date.now() });
            this.sistema.notifier.info(`📊 Nueva regla: ${nombre}`);
            this.log(`Nueva regla: ${nombre}`);
            this.guardarReglas();
        }

        obtenerReglasActivas() {
            return this.reglas.filter(r => r.duracion > 0);
        }
    }

    // ============================================================
    // 9. INTERFAZ DE CHAT / COMANDOS
    // ============================================================
    const ChatInterface = {
        _container: null,
        _messages: null,
        _input: null,
        _isOpen: false,

        init(sistema) {
            this.sistema = sistema;
            this._crearUI();
            this._agregarMensaje('sistema', '🧠 Armytage 3.0 activo. Escribe /help para ver comandos.');
        },

        _crearUI() {
            // Contenedor principal
            const container = document.createElement('div');
            container.id = 'armytage-chat';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 360px;
                max-height: 500px;
                background: #1e293b;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                font-family: system-ui, -apple-system, sans-serif;
                z-index: 999998;
                border: 1px solid #334155;
                transition: all 0.3s ease;
                overflow: hidden;
            `;
            // Botón de toggle
            const toggle = document.createElement('button');
            toggle.textContent = '💬';
            toggle.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #0d9488;
                color: white;
                border: none;
                font-size: 28px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                z-index: 999999;
                transition: transform 0.2s;
            `;
            toggle.onmouseover = () => toggle.style.transform = 'scale(1.05)';
            toggle.onmouseout = () => toggle.style.transform = 'scale(1)';
            toggle.onclick = () => this._toggleChat();
            document.body.appendChild(toggle);
            this._toggleBtn = toggle;

            // Header
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 12px 16px;
                background: #0f172a;
                color: #f1f5f9;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #334155;
                cursor: pointer;
            `;
            header.innerHTML = `<span>🛡️ Armytage Chat</span><span style="font-size:12px;color:#94a3b8;">v3.0</span>`;
            header.onclick = () => this._toggleChat();
            container.appendChild(header);

            // Área de mensajes
            const messages = document.createElement('div');
            messages.id = 'armytage-chat-messages';
            messages.style.cssText = `
                flex: 1;
                padding: 12px;
                overflow-y: auto;
                max-height: 300px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                background: #0f172a;
            `;
            container.appendChild(messages);
            this._messages = messages;

            // Input
            const inputContainer = document.createElement('div');
            inputContainer.style.cssText = `
                display: flex;
                padding: 8px;
                border-top: 1px solid #334155;
                background: #0f172a;
            `;
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Escribe un comando...';
            input.style.cssText = `
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #334155;
                border-radius: 6px;
                background: #1e293b;
                color: #f1f5f9;
                font-size: 14px;
                outline: none;
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
                margin-left: 8px;
                padding: 8px 14px;
                background: #0d9488;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
            `;
            sendBtn.onclick = () => {
                this._procesarComando(input.value);
                input.value = '';
            };
            inputContainer.appendChild(input);
            inputContainer.appendChild(sendBtn);
            container.appendChild(inputContainer);
            this._input = input;

            this._container = container;
            document.body.appendChild(container);
            // Ocultar inicialmente
            container.style.display = 'none';
        },

        _toggleChat() {
            this._isOpen = !this._isOpen;
            this._container.style.display = this._isOpen ? 'flex' : 'none';
            if (this._isOpen) {
                this._input.focus();
                this._toggleBtn.textContent = '✕';
            } else {
                this._toggleBtn.textContent = '💬';
            }
        },

        _agregarMensaje(tipo, texto) {
            const msg = document.createElement('div');
            msg.style.cssText = `
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 13px;
                line-height: 1.5;
                word-wrap: break-word;
                color: #f1f5f9;
            `;
            if (tipo === 'sistema') {
                msg.style.background = '#1e293b';
                msg.style.color = '#94a3b8';
            } else if (tipo === 'comando') {
                msg.style.background = '#2d3748';
                msg.style.alignSelf = 'flex-end';
                msg.style.color = '#e2e8f0';
            } else if (tipo === 'respuesta') {
                msg.style.background = '#1e293b';
                msg.style.borderLeft = '3px solid #0d9488';
                msg.style.alignSelf = 'flex-start';
            } else if (tipo === 'error') {
                msg.style.background = '#450a0a';
                msg.style.borderLeft = '3px solid #ef4444';
                msg.style.color = '#fca5a5';
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
                        respuesta = `
📋 Comandos disponibles:
/status - Estado del sistema
/logs [n] - Últimos n logs (def. 10)
/rules - Reglas activas
/fingerprint - Huella del dispositivo
/csp [relaxed|strict|lockdown] - Cambiar CSP
/root on|off - Activar/desactivar modo root
/clear - Limpiar chat
/eval <código> - Ejecutar código (solo root)
/help - Esta ayuda
                        `;
                        break;

                    case '/status':
                        const riesgo = await this._calcularRiesgo();
                        const clasif = Intelligence.clasificar(riesgo);
                        const cspActual = CSPManager.nivelActual;
                        const root = this.sistema.rootAgent.esRoot() ? '✅ Sí' : '❌ No';
                        respuesta = `
📊 Estado de Armytage:
- Riesgo: ${riesgo.toFixed(2)} (${clasif})
- CSP: ${cspActual}
- Root: ${root}
- Protecciones: ${this.sistema.security.proteccionesActivas ? '🟢 Activas' : '🔴 Inactivas'}
- Reglas activas: ${this.sistema.learner.obtenerReglasActivas().length}
                        `;
                        break;

                    case '/logs': {
                        const n = parseInt(args[1]) || 10;
                        const logs = await this.sistema.logger.obtenerLogs();
                        const ultimos = logs.slice(-n);
                        if (ultimos.length === 0) {
                            respuesta = 'No hay logs disponibles.';
                        } else {
                            respuesta = `Últimos ${ultimos.length} logs:\n` +
                                ultimos.map(l => `[${l.data.timestamp}] ${l.data.tipo}: ${l.data.mensaje}`).join('\n');
                        }
                        break;
                    }

                    case '/rules': {
                        const reglas = this.sistema.learner.obtenerReglasActivas();
                        if (reglas.length === 0) {
                            respuesta = 'No hay reglas activas.';
                        } else {
                            respuesta = '📜 Reglas activas:\n' + reglas.map(r => `- ${r.nombre} (${r.descripcion}) [${r.prioridad}]`).join('\n');
                        }
                        break;
                    }

                    case '/fingerprint': {
                        const fp = this.sistema.security.fingerprint;
                        if (!fp) {
                            respuesta = 'Huella no disponible aún.';
                        } else {
                            respuesta = `🖐️ Huella del dispositivo:\n- Canvas: ${fp.canvas ? '✅' : '❌'}\n- WebGL: ${fp.webgl ? '✅' : '❌'}\n- Audio: ${fp.audio ? '✅' : '❌'}\n- Fuentes: ${fp.fonts.join(', ')}\n- VM: ${fp.hardware.isVM ? '⚠️ Posible VM' : 'No'}\n- Queue Timing: ${fp.queueTiming}ms`;
                        }
                        break;
                    }

                    case '/csp': {
                        const nivel = args[1];
                        if (!nivel || !['relaxed', 'strict', 'lockdown'].includes(nivel)) {
                            respuesta = 'Uso: /csp [relaxed|strict|lockdown]';
                        } else {
                            const ok = CSPManager.aplicar(nivel);
                            respuesta = ok ? `✅ CSP cambiado a ${nivel}` : '❌ Error al cambiar CSP';
                        }
                        break;
                    }

                    case '/root': {
                        const estado = args[1];
                        if (!estado || !['on', 'off'].includes(estado)) {
                            respuesta = 'Uso: /root on|off';
                        } else {
                            if (estado === 'on') {
                                localStorage.setItem('session', JSON.stringify({ role: 'root', username: 'root' }));
                            } else {
                                localStorage.removeItem('session');
                            }
                            this.sistema.actualizarRoot();
                            respuesta = `✅ Modo root ${estado === 'on' ? 'activado' : 'desactivado'}`;
                        }
                        break;
                    }

                    case '/eval': {
                        const code = trimmed.replace('/eval ', '');
                        if (!code) {
                            respuesta = 'Uso: /eval <código>';
                        } else if (!this.sistema.rootAgent.esRoot()) {
                            respuesta = '❌ Solo root puede ejecutar código.';
                        } else {
                            try {
                                const result = await this.sistema.security.ejecutarEnSandbox(code);
                                respuesta = `✅ Resultado: ${JSON.stringify(result)}`;
                            } catch (e) {
                                respuesta = `❌ Error: ${e.message}`;
                            }
                        }
                        break;
                    }

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

        async _calcularRiesgo() {
            const logs = await this.sistema.logger.obtenerLogs('SECURITY');
            const ultimos = logs.slice(-30);
            const eventos = ultimos.map(entry => entry.data);
            return Intelligence.evaluarRiesgo(eventos);
        }
    };

    // ============================================================
    // 10. SISTEMA PRINCIPAL ARMYTAGE 3.0
    // ============================================================
    class Armytage {
        constructor() {
            this.rootAgent = new RootAgent(this);
            this.logger = new LoggerAgent(this);
            this.notifier = new NotifierAgent(this);
            this.security = new SecurityAgent(this);
            this.learner = new LearnerAgent(this);
            this.inicializar();
        }

        async inicializar() {
            await this.logger.registrar('SISTEMA', 'Armytage 3.0 iniciado');

            // Inicializar CSP
            CSPManager.init();

            // Activar protecciones
            if (!this.rootAgent.esRoot()) {
                await this.security.activarProtecciones();
                this.notifier.info('🛡️ Sistema de seguridad activado');
            } else {
                await this.security.activarProtecciones();
                this.notifier.exito('🔓 Modo Root - Protecciones adaptadas');
            }

            // Iniciar aprendizaje
            this.learner.iniciarAprendizaje();
            await this.logger.registrar('SISTEMA', 'Armytage 3.0 completamente operativo');

            // Inicializar chat
            ChatInterface.init(this);

            // Exponer API pública
            window.armytage = {
                sistema: this,
                mostrarLogs: () => this.logger.obtenerLogs(),
                mostrarReglas: () => this.learner.obtenerReglasActivas(),
                actualizarWatermark: () => this.security.actualizarWatermark(),
                ejecutarEnSandbox: (code) => this.security.ejecutarEnSandbox(code),
                obtenerFingerprint: () => this.security.fingerprint,
                chat: ChatInterface
            };

            if (this.rootAgent.esRoot()) {
                this.notifier.exito('👑 Bienvenido Root - Sistema Armytage 3.0 activo');
            } else {
                this.notifier.advertencia('🔐 Modo seguro - Todas las protecciones activas');
            }
        }

        async actualizarRoot() {
            const eraRoot = this.rootAgent.esRoot();
            this.rootAgent.verificarRoot();
            const esRootAhora = this.rootAgent.esRoot();
            if (esRootAhora && !eraRoot) {
                this.notifier.exito('👑 Root logueado - Protecciones adaptadas');
                this.security.actualizarWatermark();
                await this.logger.registrar('SISTEMA', 'Root logueado - modo adaptado');
            } else if (!esRootAhora && eraRoot) {
                this.notifier.advertencia('🔐 Root cerró sesión - Activando protecciones completas');
                await this.security.activarProtecciones();
                this.security.actualizarWatermark();
                await this.logger.registrar('SISTEMA', 'Root cerró sesión - modo seguro');
            }
        }
    }

    // ============================================================
    // 11. FUNCIÓN DE TOAST (sin cambios)
    // ============================================================
    function crearContenedorToast() {
        let container = document.getElementById('armytage-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'armytage-toast-container';
            container.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 999999;
                display: flex; flex-direction: column; gap: 10px;
                max-width: 350px; width: 100%; pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('armytage-toast-container') || crearContenedorToast();
        const toast = document.createElement('div');
        const colors = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' };
        const bg = colors[type] || colors.info;
        toast.style.cssText = `
            background: #1e293b; color: #f1f5f9; padding: 12px 16px;
            border-radius: 8px; border-left: 4px solid ${bg};
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px; line-height: 1.5;
            pointer-events: auto; opacity: 0;
            transform: translateX(100%);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, duration);
    }

    // ============================================================
    // 12. INICIALIZACIÓN
    // ============================================================
    let armytageInstance = null;

    function initArmytage() {
        if (!armytageInstance) {
            armytageInstance = new Armytage();
            window.armytageInstance = armytageInstance;

            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
                originalSetItem.apply(this, arguments);
                if (key === 'session' && window.armytageInstance) {
                    window.armytageInstance.actualizarRoot();
                }
            };
            const originalRemoveItem = localStorage.removeItem;
            localStorage.removeItem = function(key) {
                originalRemoveItem.apply(this, arguments);
                if (key === 'session' && window.armytageInstance) {
                    window.armytageInstance.actualizarRoot();
                }
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArmytage);
    } else {
        initArmytage();
    }

})();