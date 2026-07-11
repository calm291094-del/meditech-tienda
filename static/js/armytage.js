// ============================================================
// 🛡️ ARMYTAGE 3.0 - SISTEMA MULTIAGENTE DE SEGURIDAD (FLEXIBLE)
// ============================================================
// Versión optimizada para producción: no interfiere con el funcionamiento
// normal de la web, permite login, carga de imágenes, BD, etc.
// Botón de chat estilo AIMP (flecha lateral derecha).
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. STEALTH LOADER (Carga sigilosa y autoprotección) - SIMPLIFICADO
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
                console.warn('Integridad comprometida');
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
        checkDomain: function() {
            console.log(`🔒 Armytage ejecutándose en: ${window.location.hostname}`);
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
    // 2. MÓDULO DE INTELIGENCIA (simplificado)
    // ============================================================
    const Intelligence = {
        pesos: {
            devtools: 0.3,
            errores: 0.1
        },
        umbrales: {
            seguro: 0.2,
            moderado: 0.5,
            peligroso: 0.8,
            critico: 1.0
        },
        evaluarRiesgo(eventos) {
            let puntuacion = 0;
            let totalPeso = 0;
            for (const evento of eventos) {
                let peso = 0;
                if (evento.tipo === 'SECURITY' && evento.mensaje) {
                    const msg = evento.mensaje.toLowerCase();
                    if (msg.includes('devtools')) peso = this.pesos.devtools;
                    else if (msg.includes('error')) peso = this.pesos.errores;
                }
                puntuacion += peso;
                totalPeso += 1;
            }
            const riesgo = totalPeso > 0 ? puntuacion / totalPeso : 0;
            return Math.min(riesgo, 1);
        },
        clasificar(riesgo) {
            if (riesgo < this.umbrales.seguro) return 'Seguro';
            if (riesgo < this.umbrales.moderado) return 'Moderado';
            if (riesgo < this.umbrales.peligroso) return 'Peligroso';
            return 'Crítico';
        }
    };

    // ============================================================
    // 3. MÓDULO DE CSP (opcional, se puede desactivar)
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
            let meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.httpEquiv = 'Content-Security-Policy';
                document.head.appendChild(meta);
            }
            this.metaTag = meta;
            this.aplicar('relaxed'); // Por defecto relaxed para no bloquear
        },
        aplicar(nivel) {
            if (!this.niveles[nivel]) return false;
            this.nivelActual = nivel;
            this.metaTag.content = this.niveles[nivel];
            console.log(`[CSP] Política aplicada: ${nivel}`);
            return true;
        }
    };

    // ============================================================
    // 4. MÓDULO DE FINGERPRINTING (solo para info)
    // ============================================================
    const Fingerprinter = {
        async getFingerprint() {
            return {
                screen: `${screen.width}x${screen.height}`,
                language: navigator.language,
                hardware: { concurrency: navigator.hardwareConcurrency || 0 }
            };
        }
    };

    // ============================================================
    // 5. MÓDULO DE PERSISTENCIA (IndexedDB)
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
                request.onerror = (e) => reject(e.target.error);
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
        async getAll() {
            if (!this._db) await this.init();
            return new Promise((resolve, reject) => {
                const tx = this._db.transaction(this._storeName, 'readonly');
                const store = tx.objectStore(this._storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
    };

    // ============================================================
    // 6. AGENTES (solo lo esencial)
    // ============================================================

    class Agente {
        constructor(nombre, personalidad, sistema) {
            this.nombre = nombre;
            this.personalidad = personalidad;
            this.sistema = sistema;
        }
        log(mensaje) { console.log(`[${this.nombre}] ${mensaje}`); }
    }

    class RootAgent extends Agente {
        constructor(sistema) {
            super('RootAgent', 'Guardián', sistema);
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
        esRoot() { return this.rootLogueado; }
    }

    // SecurityAgent: solo monitoreo suave, sin bloqueos agresivos
    class SecurityAgent extends Agente {
        constructor(sistema) {
            super('SecurityAgent', 'Vigilante', sistema);
            this.proteccionesActivas = false;
            this.fingerprint = null;
        }

        async activarProtecciones() {
            if (this.proteccionesActivas) return;
            this.proteccionesActivas = true;
            this.log('🛡️ Activando monitoreo de seguridad (modo flexible)');

            this.fingerprint = await Fingerprinter.getFingerprint();
            this.sistema.logger.registrar('FINGERPRINT', 'Huella obtenida', this.fingerprint);

            // Solo bloqueamos F12 y DevTools (opcional)
            this.bloquearF12();
            this.detectarDevtools();
            // Creamos watermark (opcional)
            this.crearWatermark();

            this.sistema.logger.registrar('SECURITY', 'Protecciones activadas (modo flexible)');
        }

        bloquearF12() {
            document.addEventListener('keydown', (e) => {
                if (this.sistema.rootAgent.esRoot()) return true;
                if (e.key === 'F12') {
                    e.preventDefault();
                    showToast('⚠️ Herramientas de desarrollador deshabilitadas', 'warning', 2000);
                    this.sistema.logger.registrar('SECURITY', 'Intento de F12');
                    return false;
                }
                return true;
            });
        }

        detectarDevtools() {
            let devtoolsAbiertos = false;
            const umbral = 160;
            setInterval(() => {
                const diffWidth = window.outerWidth - window.innerWidth;
                const diffHeight = window.outerHeight - window.innerHeight;
                const esRoot = this.sistema.rootAgent.esRoot();
                if ((diffWidth > umbral || diffHeight > umbral) && !devtoolsAbiertos) {
                    devtoolsAbiertos = true;
                    if (!esRoot) {
                        showToast('🔍 DevTools detectadas (registrado)', 'error', 3000);
                        this.sistema.logger.registrar('SECURITY', 'DevTools abiertas');
                    }
                } else if (diffWidth <= umbral && diffHeight <= umbral && devtoolsAbiertos) {
                    devtoolsAbiertos = false;
                }
            }, 2000);
        }

        crearWatermark() {
            // Watermark muy sutil, no interfiere
            let usuario = 'Invitado';
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const user = JSON.parse(session);
                    usuario = user.username || 'Invitado';
                }
            } catch (e) {}
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            ctx.font = '14px Arial';
            ctx.fillStyle = 'rgba(0, 80, 158, 0.03)';
            ctx.textAlign = 'center';
            ctx.rotate(-25 * Math.PI / 180);
            ctx.fillText('Armytage', 150, 50);
            ctx.fillText(`Usuario: ${usuario}`, 150, 80);
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
                opacity: 0.3;
            `;
            document.body.appendChild(overlay);
        }
    }

    class LoggerAgent extends Agente {
        constructor(sistema) {
            super('LoggerAgent', 'Historiador', sistema);
            this.store = PersistentStore;
            this._initStore();
        }
        async _initStore() { await this.store.init(); }
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
    }

    class NotifierAgent extends Agente {
        constructor(sistema) {
            super('NotifierAgent', 'Mensajero', sistema);
        }
        notificar(mensaje, tipo = 'info', duracion = 4000) {
            showToast(mensaje, tipo, duracion);
            this.sistema.logger.registrar('NOTIFICACION', `Notificación: ${mensaje}`, { tipo });
        }
        alertaRoot(mensaje) { this.notificar(`🔴 ${mensaje}`, 'error', 5000); }
        info(mensaje) { this.notificar(`ℹ️ ${mensaje}`, 'info', 3000); }
        exito(mensaje) { this.notificar(`✅ ${mensaje}`, 'success', 3000); }
        advertencia(mensaje) { this.notificar(`⚠️ ${mensaje}`, 'warning', 4000); }
    }

    class LearnerAgent extends Agente {
        constructor(sistema) {
            super('LearnerAgent', 'Analista', sistema);
            this.reglas = [];
            this.intervalo = null;
            this.cargarReglas();
        }
        async cargarReglas() {
            const stored = await PersistentStore.getByType('regla');
            if (stored && stored.length > 0) {
                this.reglas = stored.map(e => e.data);
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
            }, 60000);
            this.log('Aprendizaje iniciado');
        }
        async analizarPatrones() {
            const logs = await this.sistema.logger.obtenerLogs('SECURITY');
            if (logs.length === 0) return;
            const ultimos = logs.slice(-20);
            const eventos = ultimos.map(entry => entry.data);
            const riesgo = Intelligence.evaluarRiesgo(eventos);
            const clasificacion = Intelligence.clasificar(riesgo);
            await this.sistema.logger.registrar('INTELIGENCIA', `Riesgo: ${riesgo.toFixed(2)} - ${clasificacion}`);
            if (riesgo > 0.8) {
                this.sistema.notifier.alertaRoot(`🚨 Riesgo crítico (${riesgo.toFixed(2)})`);
            }
        }
        obtenerReglasActivas() { return this.reglas; }
    }

    // ============================================================
    // 7. INTERFAZ DE CHAT ESTILO AIMP (Flecha lateral derecha)
    // ============================================================
    const ChatInterface = {
        _container: null,
        _messages: null,
        _input: null,
        _isOpen: false,

        init(sistema) {
            this.sistema = sistema;
            this._crearUI();
            this._agregarMensaje('sistema', '🧠 Armytage activo. Escribe /help para ver comandos.');
        },

        _crearUI() {
            // Contenedor del chat (se desliza desde la derecha)
            const container = document.createElement('div');
            container.id = 'armytage-chat';
            container.style.cssText = `
                position: fixed;
                top: 50%;
                right: 0;
                transform: translateY(-50%) translateX(100%);
                width: 340px;
                max-height: 500px;
                background: #1e293b;
                border-radius: 12px 0 0 12px;
                box-shadow: -5px 0 25px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                font-family: system-ui, -apple-system, sans-serif;
                z-index: 999998;
                border: 1px solid #334155;
                border-right: none;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            `;
            // Estado abierto: translateX(0)
            // Estado cerrado: translateX(100%) (fuera de pantalla)

            // Botón tipo AIMP (flecha lateral)
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'armytage-toggle-btn';
            toggleBtn.textContent = '◀'; // Flecha izquierda (mirando hacia la izquierda)
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
                box-shadow: -2px 0 8px rgba(0,0,0,0.3);
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

            // Header del chat
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
                user-select: none;
                flex-shrink: 0;
            `;
            header.innerHTML = `<span>🛡️ Armytage</span><span style="font-size:12px;color:#94a3b8;">v3.0</span>`;
            header.onclick = () => this._toggleChat();
            container.appendChild(header);

            // Área de mensajes
            const messages = document.createElement('div');
            messages.id = 'armytage-chat-messages';
            messages.style.cssText = `
                flex: 1;
                padding: 10px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 4px;
                background: #0f172a;
                min-height: 200px;
                max-height: 350px;
            `;
            container.appendChild(messages);
            this._messages = messages;

            // Input y botón enviar
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
                font-size: 13px;
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
                font-size: 14px;
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
            // Inicialmente cerrado
            container.style.transform = 'translateY(-50%) translateX(100%)';
        },

        _toggleChat() {
            this._isOpen = !this._isOpen;
            if (this._isOpen) {
                this._container.style.transform = 'translateY(-50%) translateX(0)';
                this._toggleBtn.textContent = '▶'; // Flecha derecha (mirando hacia la derecha)
                this._toggleBtn.style.borderRadius = '0 8px 8px 0';
                this._toggleBtn.style.right = '340px'; // Se mueve con el chat
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
                line-height: 1.4;
                word-wrap: break-word;
                color: #f1f5f9;
                max-width: 100%;
            `;
            if (tipo === 'sistema') {
                msg.style.background = '#1e293b';
                msg.style.color = '#94a3b8';
                msg.style.fontSize = '11px';
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
            } else if (tipo === 'error') {
                msg.style.background = '#450a0a';
                msg.style.borderLeft = '2px solid #ef4444';
                msg.style.color = '#fca5a5';
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
                        respuesta = `📋 Comandos:\n/status - Estado\n/logs [n] - Logs\n/rules - Reglas\n/fingerprint - Huella\n/root on|off - Modo root\n/clear - Limpiar\n/help - Ayuda`;
                        break;
                    case '/status':
                        const riesgo = await this._calcularRiesgo();
                        const clasif = Intelligence.clasificar(riesgo);
                        const root = this.sistema.rootAgent.esRoot() ? '✅ Sí' : '❌ No';
                        respuesta = `📊 Estado:\n- Riesgo: ${riesgo.toFixed(2)} (${clasif})\n- Root: ${root}\n- Protecciones: ${this.sistema.security.proteccionesActivas ? '🟢 Activas' : '🔴 Inactivas'}`;
                        break;
                    case '/logs': {
                        const n = parseInt(args[1]) || 5;
                        const logs = await this.sistema.logger.obtenerLogs();
                        const ultimos = logs.slice(-n);
                        if (ultimos.length === 0) {
                            respuesta = 'No hay logs.';
                        } else {
                            respuesta = `Últimos ${ultimos.length} logs:\n` +
                                ultimos.map(l => `[${l.data.timestamp.split('T')[1].slice(0,8)}] ${l.data.tipo}: ${l.data.mensaje}`).join('\n');
                        }
                        break;
                    }
                    case '/rules': {
                        const reglas = this.sistema.learner.obtenerReglasActivas();
                        respuesta = reglas.length === 0 ? 'No hay reglas.' : '📜 Reglas:\n' + reglas.map(r => `- ${r.nombre}`).join('\n');
                        break;
                    }
                    case '/fingerprint': {
                        const fp = this.sistema.security.fingerprint;
                        respuesta = fp ? `🖐️ Huella:\n- Pantalla: ${fp.screen}\n- Idioma: ${fp.language}` : 'No disponible.';
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
                    case '/clear':
                        this._messages.innerHTML = '';
                        respuesta = null;
                        break;
                    default:
                        respuesta = `❌ Comando desconocido. Escribe /help.`;
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
    // 8. SISTEMA PRINCIPAL ARMYTAGE
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
            await this.logger.registrar('SISTEMA', 'Armytage iniciado (modo flexible)');
            CSPManager.init();
            await this.security.activarProtecciones();
            this.learner.iniciarAprendizaje();
            ChatInterface.init(this);

            window.armytage = {
                sistema: this,
                mostrarLogs: () => this.logger.obtenerLogs(),
                mostrarReglas: () => this.learner.obtenerReglasActivas(),
                obtenerFingerprint: () => this.security.fingerprint
            };

            this.notifier.exito('🛡️ Armytage activo (modo flexible)');
        }

        async actualizarRoot() {
            const eraRoot = this.rootAgent.esRoot();
            this.rootAgent.verificarRoot();
            const esRootAhora = this.rootAgent.esRoot();
            if (esRootAhora && !eraRoot) {
                this.notifier.exito('👑 Root logueado');
                await this.logger.registrar('SISTEMA', 'Root logueado');
            } else if (!esRootAhora && eraRoot) {
                this.notifier.advertencia('🔐 Root cerró sesión');
                await this.logger.registrar('SISTEMA', 'Root cerró sesión');
            }
        }
    }

    // ============================================================
    // 9. FUNCIÓN DE TOAST (centrado arriba)
    // ============================================================
    function crearContenedorToast() {
        let container = document.getElementById('armytage-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'armytage-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 400px;
                width: 90%;
                pointer-events: none;
                align-items: center;
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
            background: #1e293b;
            color: #f1f5f9;
            padding: 10px 16px;
            border-radius: 8px;
            border-left: 4px solid ${bg};
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            line-height: 1.4;
            pointer-events: auto;
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            width: 100%;
            text-align: center;
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
    // 10. INICIALIZACIÓN AUTOMÁTICA
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