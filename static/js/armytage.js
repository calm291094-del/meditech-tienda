// ============================================================
// 🛡️ ARMYTAGE - VERSIÓN MÍNIMA (SOLO MONITOREO + CHAT)
// ============================================================
// No bloquea NADA: login, imágenes, formularios, etc.
// Solo monitorea eventos y proporciona interfaz de comandos.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. SISTEMA DE LOGS (en memoria)
    // ============================================================
    const LogStore = {
        _logs: [],
        maxLogs: 200,

        async registrar(tipo, mensaje, datos = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                usuario: this.obtenerUsuario()
            };
            this._logs.push(entry);
            if (this._logs.length > this.maxLogs) this._logs.shift();
            console.log(`[LOG][${tipo}] ${mensaje}`, datos);
            // Guardar en localStorage para persistencia
            try {
                localStorage.setItem('armytage_logs', JSON.stringify(this._logs.slice(-100)));
            } catch (e) {}
        },

        obtenerUsuario() {
            try {
                const session = localStorage.getItem('session');
                if (session) {
                    const user = JSON.parse(session);
                    return user.username || 'anon';
                }
            } catch (e) {}
            return 'anon';
        },

        obtenerLogs(tipo = null) {
            if (tipo) {
                return this._logs.filter(l => l.tipo === tipo);
            }
            return this._logs;
        },

        cargarLogs() {
            try {
                const data = localStorage.getItem('armytage_logs');
                if (data) {
                    this._logs = JSON.parse(data);
                }
            } catch (e) {}
        }
    };

    // ============================================================
    // 2. SISTEMA DE NOTIFICACIONES (TOAST)
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
                max-width: 400px;
                width: 90%;
                pointer-events: none;
                align-items: center;
            `;
            document.body.appendChild(container);
        }

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
    // 3. SISTEMA DE MONITOREO (solo registra, NO BLOQUEA)
    // ============================================================
    const Monitor = {
        iniciar() {
            LogStore.cargarLogs();
            
            // Monitorear errores globales
            window.addEventListener('error', (e) => {
                LogStore.registrar('ERROR', e.message, {
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno
                });
            });

            // Monitorear promesas rechazadas
            window.addEventListener('unhandledrejection', (e) => {
                LogStore.registrar('ERROR', 'Promesa rechazada', {
                    reason: e.reason?.message || e.reason
                });
            });

            // Monitorear si se abren DevTools (solo registra)
            let devtoolsAbiertos = false;
            setInterval(() => {
                const diffWidth = window.outerWidth - window.innerWidth;
                const diffHeight = window.outerHeight - window.innerHeight;
                const umbral = 160;
                
                if ((diffWidth > umbral || diffHeight > umbral) && !devtoolsAbiertos) {
                    devtoolsAbiertos = true;
                    LogStore.registrar('SECURITY', 'DevTools abiertas');
                    showToast('🔍 DevTools detectadas (registrado)', 'warning', 3000);
                } else if (diffWidth <= umbral && diffHeight <= umbral && devtoolsAbiertos) {
                    devtoolsAbiertos = false;
                    LogStore.registrar('SECURITY', 'DevTools cerradas');
                }
            }, 2000);

            LogStore.registrar('SISTEMA', 'Armytage iniciado (modo monitor)');
            showToast('🛡️ Armytage activo (modo monitor)', 'success', 2000);
        }
    };

    // ============================================================
    // 4. INTERFAZ DE CHAT ESTILO AIMP
    // ============================================================
    const ChatInterface = {
        _container: null,
        _messages: null,
        _input: null,
        _isOpen: false,

        init() {
            this._crearUI();
            this._agregarMensaje('sistema', '🧠 Armytage activo. Escribe /help para ver comandos.');
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
                width: 320px;
                max-height: 480px;
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

            // Botón tipo AIMP (flecha lateral)
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'armytage-toggle-btn';
            toggleBtn.textContent = '◀';
            toggleBtn.style.cssText = `
                position: fixed;
                top: 50%;
                right: 0;
                transform: translateY(-50%);
                width: 30px;
                height: 56px;
                background: #0d9488;
                color: white;
                border: none;
                border-radius: 8px 0 0 8px;
                cursor: pointer;
                font-size: 16px;
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

            // Header
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
            header.innerHTML = `<span>🛡️ Armytage</span><span style="font-size:11px;color:#94a3b8;">v1.0</span>`;
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
                min-height: 180px;
                max-height: 340px;
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
            // Inicialmente cerrado
            container.style.transform = 'translateY(-50%) translateX(100%)';
        },

        _toggleChat() {
            this._isOpen = !this._isOpen;
            if (this._isOpen) {
                this._container.style.transform = 'translateY(-50%) translateX(0)';
                this._toggleBtn.textContent = '▶';
                this._toggleBtn.style.borderRadius = '0 8px 8px 0';
                this._toggleBtn.style.right = '320px';
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
                        respuesta = `📋 Comandos disponibles:\n/status - Estado del sistema\n/logs [n] - Últimos n logs\n/clear - Limpiar chat\n/help - Esta ayuda`;
                        break;

                    case '/status': {
                        const logs = LogStore.obtenerLogs();
                        const ultimos = logs.slice(-10);
                        respuesta = `📊 Estado de Armytage:\n- Logs registrados: ${logs.length}\n- Últimos eventos:\n` +
                            ultimos.map(l => `  • ${l.timestamp.split('T')[1].slice(0,8)} - ${l.tipo}: ${l.mensaje}`).join('\n');
                        break;
                    }

                    case '/logs': {
                        const n = parseInt(args[1]) || 5;
                        const logs = LogStore.obtenerLogs();
                        const ultimos = logs.slice(-n);
                        if (ultimos.length === 0) {
                            respuesta = 'No hay logs disponibles.';
                        } else {
                            respuesta = `📋 Últimos ${ultimos.length} logs:\n` +
                                ultimos.map(l => `[${l.timestamp.split('T')[1].slice(0,8)}] ${l.tipo}: ${l.mensaje}`).join('\n');
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
        }
    };

    // ============================================================
    // 5. INICIALIZACIÓN
    // ============================================================
    function initArmytage() {
        // Iniciar monitor
        Monitor.iniciar();

        // Iniciar chat después de un pequeño delay
        setTimeout(() => {
            ChatInterface.init();
        }, 500);

        // Exponer API pública
        window.armytage = {
            logs: () => LogStore.obtenerLogs(),
            mostrarLogs: () => {
                console.table(LogStore.obtenerLogs());
                return LogStore.obtenerLogs();
            }
        };

        console.log('🛡️ Armytage cargado correctamente (modo monitor)');
        console.log('💬 Haz clic en la flecha ◀ en el borde derecho para abrir el chat');
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArmytage);
    } else {
        initArmytage();
    }

})();