// ============================================================
// ⚔️ VALKYRIE.JS - "La Justiciera" (VERSIÓN MODIFICADA)
// ============================================================
// Sistema de aplicación de políticas de seguridad y respuesta automática.
// Detecta, bloquea y aísla comportamientos maliciosos en tiempo real.
// MODIFICADO: Permite eventos click y menús sin bloqueos
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN Y POLÍTICAS
    // ============================================================
    const CONFIG = {
        // Nivel de rigor: 'low', 'medium', 'high', 'lockdown'
        nivelSeguridad: 'medium',
        
        // Políticas predeterminadas
        politicas: {
            // Bloqueo de scripts de terceros no autorizados
            bloquearScriptsExternos: false,
            // Dominios permitidos (lista blanca)
            dominiosPermitidos: [],
            // Bloquear eval() y funciones peligrosas
            bloquearEval: true,
            // Bloquear innerHTML con contenido sospechoso
            bloquearInnerHTMLMalicioso: true,
            // Bloquear document.write
            bloquearDocumentWrite: true,
            // Eliminar elementos con atributos onclick/inline - MODIFICADO: false por defecto
            eliminarEventosInline: false,
            // Bloquear acceso a localStorage/cookies no autorizado
            bloquearAccesoDatos: false,
            // Dominios de scripts autorizados (ej: 'cdn.jsdelivr.net')
            scriptsAutorizados: []
        },
        
        // Respuestas automáticas
        respuestas: {
            // Acción al detectar amenaza: 'log', 'block', 'isolate', 'notify'
            accionPredeterminada: 'block',
            // Notificar al root
            notificarRoot: true,
            // Mostrar toast al usuario
            mostrarToast: true
        }
    };

    // ============================================================
    // 2. SISTEMA DE LOGS (compartido con armytage)
    // ============================================================
    const Logger = {
        _logs: [],
        _maxLogs: 200,

        registrar(tipo, mensaje, datos = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo: `VALKYRIE_${tipo}`,
                mensaje,
                datos,
                usuario: this._obtenerUsuario()
            };
            this._logs.push(entry);
            if (this._logs.length > this._maxLogs) this._logs.shift();
            
            // Usar el logger de armytage si existe
            if (window.armytage?.logs) {
                window.armytage.logs(tipo, mensaje, datos);
            }
            
            console.log(`⚔️ [VALKYRIE][${tipo}] ${mensaje}`, datos);
            
            // Guardar en localStorage
            try {
                localStorage.setItem('valkyrie_logs', JSON.stringify(this._logs.slice(-100)));
            } catch (e) {}
        },

        _obtenerUsuario() {
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
                return this._logs.filter(l => l.tipo === `VALKYRIE_${tipo}`);
            }
            return this._logs;
        }
    };

    // ============================================================
    // 3. SISTEMA DE NOTIFICACIONES
    // ============================================================
    function showToast(message, type = 'warning', duration = 5000) {
        let container = document.getElementById('valkyrie-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'valkyrie-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999996;
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
        const bg = colors[type] || colors.warning;
        
        toast.style.cssText = `
            background: #1e293b;
            color: #f1f5f9;
            padding: 12px 18px;
            border-radius: 8px;
            border-left: 4px solid ${bg};
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
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
    // 4. SISTEMA DE POLÍTICAS Y REGLAS
    // ============================================================
    const PolicyEngine = {
        _politicas: { ...CONFIG.politicas },
        _reglasActivas: [],
        _elementosAislados: [],
        _dominiosBloqueados: [],
        _elementosPermitidos: ['cart', 'admin-menu', 'menu-toggle', 'dropdown', 'modal'], // ELEMENTOS PERMITIDOS

        // ============================================================
        // 4.1 Gestión de Políticas
        // ============================================================
        aplicarPoliticas(config) {
            this._politicas = { ...this._politicas, ...config };
            Logger.registrar('POLICY', 'Políticas actualizadas', this._politicas);
            this._aplicarCambios();
        },

        obtenerPoliticas() {
            return { ...this._politicas };
        },

        // ============================================================
        // 4.2 Reglas Dinámicas
        // ============================================================
        agregarRegla(regla) {
            const nuevaRegla = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                nombre: regla.nombre || 'Regla sin nombre',
                descripcion: regla.descripcion || '',
                patron: regla.patron,
                accion: regla.accion || 'block', // block, isolate, log, notify
                prioridad: regla.prioridad || 'medium',
                activa: true,
                creada: new Date().toISOString()
            };
            this._reglasActivas.push(nuevaRegla);
            Logger.registrar('RULE', `Regla agregada: ${nuevaRegla.nombre}`, nuevaRegla);
            return nuevaRegla;
        },

        eliminarRegla(id) {
            this._reglasActivas = this._reglasActivas.filter(r => r.id !== id);
            Logger.registrar('RULE', `Regla eliminada: ${id}`);
        },

        obtenerReglas() {
            return [...this._reglasActivas];
        },

        // ============================================================
        // 4.3 Evaluación de Amenazas - MODIFICADO
        // ============================================================
        evaluar(elemento, tipo = 'script') {
            // VERIFICAR SI EL ELEMENTO ESTÁ PERMITIDO
            if (this._elementoPermitido(elemento)) {
                Logger.registrar('ALLOW', `Elemento permitido: ${elemento?.id || elemento?.className || 'unknown'}`);
                return 'allow';
            }

            // Evaluar contra reglas activas
            for (const regla of this._reglasActivas) {
                if (!regla.activa) continue;
                
                let coincide = false;
                if (tipo === 'script') {
                    coincide = this._evaluarScript(elemento, regla);
                } else if (tipo === 'dom') {
                    coincide = this._evaluarDOM(elemento, regla);
                } else if (tipo === 'network') {
                    coincide = this._evaluarRed(elemento, regla);
                }

                if (coincide) {
                    this._ejecutarAccion(regla, elemento, tipo);
                    return regla.accion;
                }
            }

            // Políticas generales
            if (tipo === 'script') {
                return this._aplicarPoliticasScript(elemento);
            } else if (tipo === 'dom') {
                return this._aplicarPoliticasDOM(elemento);
            }

            return 'allow';
        },

        // NUEVO: Verificar si el elemento está permitido
        _elementoPermitido(elemento) {
            if (!elemento) return false;
            
            // Verificar por ID
            if (elemento.id && this._elementosPermitidos.some(p => elemento.id.includes(p))) {
                return true;
            }
            
            // Verificar por clase
            if (elemento.className && typeof elemento.className === 'string') {
                const clases = elemento.className.split(' ');
                for (const clase of clases) {
                    if (this._elementosPermitidos.some(p => clase.includes(p))) {
                        return true;
                    }
                }
            }
            
            // Verificar si está dentro de un elemento permitido
            let parent = elemento.parentElement;
            while (parent) {
                if (parent.id && this._elementosPermitidos.some(p => parent.id.includes(p))) {
                    return true;
                }
                if (parent.className && typeof parent.className === 'string') {
                    const clases = parent.className.split(' ');
                    for (const clase of clases) {
                        if (this._elementosPermitidos.some(p => clase.includes(p))) {
                            return true;
                        }
                    }
                }
                parent = parent.parentElement;
            }
            
            return false;
        },

        _evaluarScript(elemento, regla) {
            const src = elemento.src || '';
            const content = elemento.innerHTML || '';
            const patron = regla.patron;
            
            if (typeof patron === 'string') {
                return src.includes(patron) || content.includes(patron);
            } else if (patron instanceof RegExp) {
                return patron.test(src) || patron.test(content);
            } else if (typeof patron === 'function') {
                return patron(elemento);
            }
            return false;
        },

        _evaluarDOM(elemento, regla) {
            // Evaluar elementos del DOM
            const tag = elemento.tagName?.toLowerCase() || '';
            const content = elemento.innerHTML || '';
            const patron = regla.patron;
            
            if (typeof patron === 'function') {
                return patron(elemento);
            }
            
            if (tag === 'script' && (content.includes('eval') || content.includes('document.write'))) {
                return true;
            }
            
            if (tag === 'iframe' && elemento.src && this._dominiosBloqueados.some(d => elemento.src.includes(d))) {
                return true;
            }
            
            return false;
        },

        _evaluarRed(peticion, regla) {
            const url = peticion.url || '';
            const patron = regla.patron;
            
            if (typeof patron === 'string') {
                return url.includes(patron);
            } else if (patron instanceof RegExp) {
                return patron.test(url);
            } else if (typeof patron === 'function') {
                return patron(peticion);
            }
            return false;
        },

        // ============================================================
        // 4.4 Aplicación de Políticas Generales - MODIFICADO
        // ============================================================
        _aplicarPoliticasScript(elemento) {
            const src = elemento.src || '';
            
            // Bloquear scripts externos no autorizados
            if (this._politicas.bloquearScriptsExternos && src) {
                const dominio = this._extraerDominio(src);
                const autorizados = this._politicas.scriptsAutorizados;
                if (!autorizados.some(a => dominio.includes(a))) {
                    Logger.registrar('BLOCK', `Script externo bloqueado: ${src}`);
                    if (CONFIG.respuestas.mostrarToast) {
                        showToast(`🚫 Script bloqueado: ${dominio}`, 'warning');
                    }
                    return 'block';
                }
            }

            // Bloquear eval
            if (this._politicas.bloquearEval && elemento.innerHTML.includes('eval(')) {
                Logger.registrar('BLOCK', 'Script con eval() bloqueado');
                return 'block';
            }

            return 'allow';
        },

        _aplicarPoliticasDOM(elemento) {
            // MODIFICADO: Solo bloquear si el elemento no está permitido
            if (this._elementoPermitido(elemento)) {
                return 'allow';
            }

            // Verificar elementos con atributos inline peligrosos
            if (this._politicas.eliminarEventosInline) {
                const atributosPeligrosos = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus'];
                for (const attr of atributosPeligrosos) {
                    if (elemento.hasAttribute(attr)) {
                        Logger.registrar('BLOCK', `Atributo ${attr} eliminado de ${elemento.tagName}`);
                        elemento.removeAttribute(attr);
                    }
                }
            }

            // Bloquear innerHTML con scripts
            if (this._politicas.bloquearInnerHTMLMalicioso) {
                const content = elemento.innerHTML || '';
                if (content.includes('<script') || content.includes('javascript:')) {
                    Logger.registrar('BLOCK', `innerHTML malicioso bloqueado en ${elemento.tagName}`);
                    return 'block';
                }
            }

            return 'allow';
        },

        _extraerDominio(url) {
            try {
                const parsed = new URL(url);
                return parsed.hostname;
            } catch (e) {
                return url;
            }
        },

        // ============================================================
        // 4.5 Ejecución de Acciones
        // ============================================================
        _ejecutarAccion(regla, elemento, tipo) {
            const accion = regla.accion || CONFIG.respuestas.accionPredeterminada;
            
            Logger.registrar('ACTION', `Acción ejecutada: ${accion} en ${tipo}`, {
                regla: regla.nombre,
                elemento: elemento?.tagName || 'unknown'
            });

            switch (accion) {
                case 'block':
                    this._bloquearElemento(elemento, tipo);
                    break;
                case 'isolate':
                    this._aislarElemento(elemento);
                    break;
                case 'log':
                    // Solo registrar
                    break;
                case 'notify':
                    this._notificar(regla, elemento);
                    break;
                default:
                    break;
            }

            if (CONFIG.respuestas.notificarRoot) {
                this._notificarRoot(regla, elemento, accion);
            }

            if (CONFIG.respuestas.mostrarToast) {
                showToast(`⚔️ ${regla.nombre}: ${accion} aplicado`, 'warning');
            }
        },

        _bloquearElemento(elemento, tipo) {
            if (tipo === 'script' && elemento.parentNode) {
                elemento.remove();
                Logger.registrar('BLOCK', `Script eliminado del DOM`);
            } else if (tipo === 'dom' && elemento.parentNode) {
                // Ocultar en lugar de eliminar para no romper la página
                elemento.style.display = 'none';
                elemento.setAttribute('data-valkyrie-blocked', 'true');
                Logger.registrar('BLOCK', `Elemento oculto: ${elemento.tagName}`);
            }
        },

        _aislarElemento(elemento) {
            if (elemento.parentNode) {
                // Mover a un contenedor aislado
                const container = document.createElement('div');
                container.style.cssText = `
                    display: none;
                    position: fixed;
                    top: -9999px;
                    left: -9999px;
                    z-index: -9999;
                    pointer-events: none;
                `;
                container.id = 'valkyrie-isolation-' + Date.now();
                document.body.appendChild(container);
                container.appendChild(elemento);
                this._elementosAislados.push(elemento);
                Logger.registrar('ISOLATE', `Elemento aislado: ${elemento.tagName}`);
            }
        },

        _notificar(regla, elemento) {
            const mensaje = `⚔️ [VALKYRIE] Regla: ${regla.nombre}`;
            if (window.cubanNotifier?.mostrar) {
                window.cubanNotifier.mostrar(mensaje, 'alerta', 5000);
            } else {
                showToast(mensaje, 'critical');
            }
        },

        _notificarRoot(regla, elemento, accion) {
            // Usar el sistema de logs de armytage
            Logger.registrar('ROOT_ALERT', `Alerta para root: ${regla.nombre} - ${accion}`, {
                regla: regla,
                elemento: elemento?.tagName || 'unknown'
            });
        },

        // ============================================================
        // 4.6 Aplicación de Cambios en el DOM
        // ============================================================
        _aplicarCambios() {
            // Escanear scripts existentes
            document.querySelectorAll('script').forEach(script => {
                this.evaluar(script, 'script');
            });
            
            // Escanear elementos peligrosos - MODIFICADO: menos restrictivo
            document.querySelectorAll('[onclick], [onerror], [onload], [onmouseover]').forEach(el => {
                if (!this._elementoPermitido(el)) {
                    this.evaluar(el, 'dom');
                }
            });
        }
    };

    // ============================================================
    // 5. MONITOR DE RED (Interceptar peticiones)
    // ============================================================
    const NetworkInterceptor = {
        _activo: false,

        iniciar() {
            if (this._activo) return;
            this._activo = true;

            // Interceptar fetch
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                
                // Evaluar petición
                const peticion = { url, method: args[1]?.method || 'GET' };
                const resultado = PolicyEngine.evaluar(peticion, 'network');
                
                if (resultado === 'block') {
                    Logger.registrar('NETWORK', `Petición bloqueada: ${url}`);
                    return Promise.reject(new Error('Petición bloqueada por Valkyrie'));
                }
                
                return originalFetch.apply(this, args);
            };

            // Interceptar XMLHttpRequest
            const originalXHROpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                const peticion = { url, method };
                const resultado = PolicyEngine.evaluar(peticion, 'network');
                
                if (resultado === 'block') {
                    Logger.registrar('NETWORK', `XHR bloqueado: ${url}`);
                    throw new Error('Petición bloqueada por Valkyrie');
                }
                
                return originalXHROpen.call(this, method, url, ...rest);
            };

            Logger.registrar('NETWORK', 'Interceptor de red iniciado');
        },

        detener() {
            this._activo = false;
            Logger.registrar('NETWORK', 'Interceptor de red detenido');
        }
    };

    // ============================================================
    // 6. MONITOR DE DOM - MODIFICADO
    // ============================================================
    const DOMScanner = {
        _observer: null,
        _activo: false,

        iniciar() {
            if (this._activo) return;
            this._activo = true;

            this._observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    // Nuevos nodos añadidos
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this._analizarNodo(node);
                        }
                    }
                    
                    // Atributos modificados
                    if (mutation.type === 'attributes') {
                        const el = mutation.target;
                        // MODIFICADO: No bloquear atributos onclick de elementos permitidos
                        if (el.tagName === 'SCRIPT') {
                            PolicyEngine.evaluar(el, 'script');
                        } else if (mutation.attributeName && mutation.attributeName.startsWith('on')) {
                            if (!PolicyEngine._elementoPermitido(el)) {
                                PolicyEngine.evaluar(el, 'dom');
                            }
                        }
                    }
                }
            });

            this._observer.observe(document.documentElement || document.body, {
                childList: true,
                attributes: true,
                subtree: true,
                attributeFilter: ['src', 'onclick', 'onerror', 'onload', 'onmouseover', 'onfocus']
            });

            // Escanear elementos existentes
            this._escanearExistentes();

            Logger.registrar('DOM', 'Escáner de DOM iniciado');
        },

        _analizarNodo(node) {
            // Analizar scripts
            if (node.tagName === 'SCRIPT') {
                PolicyEngine.evaluar(node, 'script');
            }
            
            // Analizar iframes
            if (node.tagName === 'IFRAME') {
                PolicyEngine.evaluar(node, 'dom');
            }
            
            // MODIFICADO: Solo analizar elementos no permitidos
            if (!PolicyEngine._elementoPermitido(node)) {
                // Analizar elementos con atributos inline
                if (node.hasAttributes && node.hasAttributes()) {
                    for (const attr of node.attributes) {
                        if (attr.name.startsWith('on')) {
                            PolicyEngine.evaluar(node, 'dom');
                            break;
                        }
                    }
                }
            }
            
            // Recursivamente analizar hijos
            if (node.children) {
                for (const child of node.children) {
                    this._analizarNodo(child);
                }
            }
        },

        _escanearExistentes() {
            // Escanear todos los scripts
            document.querySelectorAll('script').forEach(el => {
                PolicyEngine.evaluar(el, 'script');
            });
            
            // Escanear iframes
            document.querySelectorAll('iframe').forEach(el => {
                PolicyEngine.evaluar(el, 'dom');
            });
            
            // MODIFICADO: Solo escanear elementos no permitidos
            document.querySelectorAll('[onclick], [onerror], [onload], [onmouseover], [onfocus]').forEach(el => {
                if (!PolicyEngine._elementoPermitido(el)) {
                    PolicyEngine.evaluar(el, 'dom');
                }
            });
        },

        detener() {
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }
            this._activo = false;
            Logger.registrar('DOM', 'Escáner de DOM detenido');
        }
    };

    // ============================================================
    // 7. MODOS DE SEGURIDAD - MODIFICADO
    // ============================================================
    const SecurityModes = {
        _modoActual: CONFIG.nivelSeguridad,

        cambiarModo(nivel) {
            const modos = {
                'low': {
                    bloquearScriptsExternos: false,
                    bloquearEval: false,
                    bloquearInnerHTMLMalicioso: false,
                    bloquearDocumentWrite: false,
                    eliminarEventosInline: false,
                    bloquearAccesoDatos: false
                },
                'medium': {
                    bloquearScriptsExternos: false, // MODIFICADO: false para permitir scripts
                    bloquearEval: true,
                    bloquearInnerHTMLMalicioso: true,
                    bloquearDocumentWrite: true,
                    eliminarEventosInline: false, // MODIFICADO: false para permitir clicks
                    bloquearAccesoDatos: false
                },
                'high': {
                    bloquearScriptsExternos: true,
                    bloquearEval: true,
                    bloquearInnerHTMLMalicioso: true,
                    bloquearDocumentWrite: true,
                    eliminarEventosInline: false, // MODIFICADO: false para permitir clicks
                    bloquearAccesoDatos: true
                },
                'lockdown': {
                    bloquearScriptsExternos: true,
                    bloquearEval: true,
                    bloquearInnerHTMLMalicioso: true,
                    bloquearDocumentWrite: true,
                    eliminarEventosInline: false, // MODIFICADO: false para permitir clicks
                    bloquearAccesoDatos: true
                }
            };

            if (modos[nivel]) {
                this._modoActual = nivel;
                CONFIG.nivelSeguridad = nivel;
                PolicyEngine.aplicarPoliticas(modos[nivel]);
                Logger.registrar('MODE', `Modo cambiado a: ${nivel}`);
                showToast(`⚔️ Modo de seguridad: ${nivel.toUpperCase()}`, 'info');
                return true;
            }
            return false;
        },

        obtenerModo() {
            return this._modoActual;
        }
    };

    // ============================================================
    // 8. DASHBOARD VISUAL (opcional)
    // ============================================================
    const Dashboard = {
        _activo: false,
        _elemento: null,

        mostrar() {
            if (this._activo) return;
            this._activo = true;

            const dashboard = document.createElement('div');
            dashboard.id = 'valkyrie-dashboard';
            dashboard.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0,0,0,0.85);
                color: #f1f5f9;
                font-family: monospace;
                font-size: 11px;
                padding: 12px;
                border-radius: 8px;
                z-index: 999995;
                max-width: 260px;
                backdrop-filter: blur(10px);
                border: 1px solid #8b5cf644;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                pointer-events: none;
            `;

            this._elemento = dashboard;
            document.body.appendChild(dashboard);
            
            this._actualizar();
            this._intervalo = setInterval(() => this._actualizar(), 3000);
            
            Logger.registrar('DASHBOARD', 'Dashboard activado');
        },

        ocultar() {
            if (this._elemento) {
                this._elemento.remove();
                this._elemento = null;
            }
            if (this._intervalo) {
                clearInterval(this._intervalo);
                this._intervalo = null;
            }
            this._activo = false;
            Logger.registrar('DASHBOARD', 'Dashboard ocultado');
        },

        _actualizar() {
            if (!this._elemento) return;
            
            const logs = Logger.obtenerLogs();
            const ultimo = logs[logs.length - 1];
            const reglas = PolicyEngine.obtenerReglas();
            const politicas = PolicyEngine.obtenerPoliticas();
            
            const stats = {
                logs: logs.length,
                reglas: reglas.length,
                modo: SecurityModes.obtenerModo(),
                bloqueos: logs.filter(l => l.tipo === 'VALKYRIE_BLOCK').length,
                aislados: PolicyEngine._elementosAislados.length
            };

            this._elemento.innerHTML = `
                ⚔️ VALKYRIE (Modo Interactivo)
                ├─ Modo: ${stats.modo.toUpperCase()}
                ├─ Reglas: ${stats.reglas}
                ├─ Bloqueos: ${stats.bloqueos}
                ├─ Aislados: ${stats.aislados}
                └─ Último: ${ultimo ? ultimo.mensaje.substring(0, 30) : '...'}
            `;
        }
    };

    // ============================================================
    // 9. API PÚBLICA DE VALKYRIE
    // ============================================================
    const Valkyrie = {
        // ============================================================
        // 9.1 Inicialización - MODIFICADO
        // ============================================================
        iniciar(config = {}) {
            Logger.registrar('SYSTEM', 'Valkyrie iniciando (Modo Interactivo)...');

            // Aplicar configuración
            if (config.politicas) {
                PolicyEngine.aplicarPoliticas(config.politicas);
            }
            
            // Por defecto, asegurar que eliminarEventosInline sea false
            PolicyEngine.aplicarPoliticas({
                eliminarEventosInline: false
            });
            
            if (config.modo) {
                SecurityModes.cambiarModo(config.modo);
            }
            if (config.reglas) {
                config.reglas.forEach(regla => PolicyEngine.agregarRegla(regla));
            }

            // Iniciar monitores
            DOMScanner.iniciar();
            NetworkInterceptor.iniciar();

            // Mostrar dashboard si está configurado
            if (config.dashboard) {
                Dashboard.mostrar();
            }

            Logger.registrar('SYSTEM', 'Valkyrie iniciada (Modo Interactivo)');
            showToast('⚔️ Valkyrie activa - Modo Interactivo', 'success');

            // Exponer API global
            window.valkyrie = this;
        },

        // ============================================================
        // 9.2 Gestión de Políticas
        // ============================================================
        politicas: {
            aplicar: (config) => PolicyEngine.aplicarPoliticas(config),
            obtener: () => PolicyEngine.obtenerPoliticas()
        },

        // ============================================================
        // 9.3 Gestión de Reglas
        // ============================================================
        reglas: {
            agregar: (regla) => PolicyEngine.agregarRegla(regla),
            eliminar: (id) => PolicyEngine.eliminarRegla(id),
            obtener: () => PolicyEngine.obtenerReglas()
        },

        // ============================================================
        // 9.4 Modos de Seguridad
        // ============================================================
        modo: {
            cambiar: (nivel) => SecurityModes.cambiarModo(nivel),
            obtener: () => SecurityModes.obtenerModo()
        },

        // ============================================================
        // 9.5 Logs
        // ============================================================
        logs: {
            obtener: (tipo) => Logger.obtenerLogs(tipo),
            limpiar: () => {
                Logger._logs = [];
                localStorage.removeItem('valkyrie_logs');
            }
        },

        // ============================================================
        // 9.6 Dashboard
        // ============================================================
        dashboard: {
            mostrar: () => Dashboard.mostrar(),
            ocultar: () => Dashboard.ocultar()
        },

        // ============================================================
        // 9.7 Utilidades
        // ============================================================
        evaluar: (elemento, tipo) => PolicyEngine.evaluar(elemento, tipo),
        bloquearDominio: (dominio) => {
            PolicyEngine._dominiosBloqueados.push(dominio);
            Logger.registrar('DOMAIN', `Dominio bloqueado: ${dominio}`);
        },
        desbloquearDominio: (dominio) => {
            PolicyEngine._dominiosBloqueados = PolicyEngine._dominiosBloqueados.filter(d => d !== dominio);
            Logger.registrar('DOMAIN', `Dominio desbloqueado: ${dominio}`);
        },
        
        // NUEVO: Agregar elementos permitidos
        agregarElementoPermitido: (id) => {
            PolicyEngine._elementosPermitidos.push(id);
            Logger.registrar('ALLOW', `Elemento permitido agregado: ${id}`);
        },

        // ============================================================
        // 9.8 Detener Valkyrie
        // ============================================================
        detener: () => {
            DOMScanner.detener();
            NetworkInterceptor.detener();
            Dashboard.ocultar();
            Logger.registrar('SYSTEM', 'Valkyrie detenida');
            showToast('⚔️ Valkyrie detenida', 'info');
        }
    };

    // ============================================================
    // 10. INICIALIZACIÓN AUTOMÁTICA - MODIFICADO
    // ============================================================
    function initValkyrie() {
        // Iniciar con configuración para permitir interacciones
        Valkyrie.iniciar({
            modo: 'medium',
            dashboard: false,
            politicas: {
                eliminarEventosInline: false,  // IMPORTANTE: Permitir clicks
                bloquearScriptsExternos: false, // Permitir scripts externos
                bloquearEval: true,
                bloquearInnerHTMLMalicioso: true,
                bloquearDocumentWrite: true,
                bloquearAccesoDatos: false
            }
        });

        // Agregar elementos comunes de UI como permitidos
        setTimeout(() => {
            if (window.valkyrie) {
                // Elementos típicos de carrito y menú
                window.valkyrie.agregarElementoPermitido('cart');
                window.valkyrie.agregarElementoPermitido('menu');
                window.valkyrie.agregarElementoPermitido('admin');
                window.valkyrie.agregarElementoPermitido('toggle');
                window.valkyrie.agregarElementoPermitido('dropdown');
                window.valkyrie.agregarElementoPermitido('modal');
                window.valkyrie.agregarElementoPermitido('button');
                window.valkyrie.agregarElementoPermitido('link');
                
                console.log('✅ Valkyrie configurada para permitir interacciones');
            }
        }, 100);
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initValkyrie);
    } else {
        initValkyrie();
    }

})();
