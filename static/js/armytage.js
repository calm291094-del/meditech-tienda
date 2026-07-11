// ============================================================
// 🛡️ ARMYTAGE.JS - SISTEMA MULTIAGENTE DE SEGURIDAD
// ============================================================
// Versión 1.0 - Totalmente autónomo, sin dependencias externas.
// Incluye: agentes de Root, Seguridad, Logs, Notificaciones y Aprendizaje.
// Persistencia en localStorage, notificaciones toast integradas.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. SISTEMA DE NOTIFICACIONES (TOAST)
    // ============================================================
    function crearContenedorToast() {
        let container = document.getElementById('armytage-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'armytage-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
                width: 100%;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('armytage-toast-container') || crearContenedorToast();
        const toast = document.createElement('div');
        const colors = {
            info: '#3b82f6',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        const bg = colors[type] || colors.info;
        toast.style.cssText = `
            background: #1e293b;
            color: #f1f5f9;
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 4px solid ${bg};
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            pointer-events: auto;
            opacity: 0;
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

    // Exponer globalmente para uso interno
    window.armytageToast = showToast;

    // ============================================================
    // 2. CLASE BASE AGENTE
    // ============================================================
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

    // ============================================================
    // 3. AGENTE DE AUTENTICACIÓN (ROOT)
    // ============================================================
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
                    // Ajusta según tu estructura de sesión
                    if (session.role === 'root' || session.isRoot === true) {
                        this.rootLogueado = true;
                        this.log('✅ Root logueado detectado');
                        showToast('🔐 Modo Root activado - Protecciones reducidas', 'success', 3000);
                        return;
                    }
                }
                this.rootLogueado = false;
                this.log('❌ Root no logueado - Activando protecciones completas');
                showToast('🛡️ Modo seguro activado - Protecciones completas', 'warning', 3000);
            } catch (e) {
                this.rootLogueado = false;
                this.log('⚠️ Error al verificar sesión, modo seguro por defecto');
            }
        }

        esRoot() {
            return this.rootLogueado;
        }
    }

    // ============================================================
    // 4. AGENTE DE SEGURIDAD (TODAS LAS PROTECCIONES)
    // ============================================================
    class SecurityAgent extends Agente {
        constructor(sistema) {
            super('SecurityAgent', 'Vigilante', sistema);
            this.proteccionesActivas = false;
            this.watermarkElement = null;
        }

        activarProtecciones() {
            if (this.proteccionesActivas) return;
            this.proteccionesActivas = true;
            this.log('🛡️ Activando protecciones de seguridad');

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

            this.sistema.logger.registrar('SECURITY', 'Protecciones activadas');
        }

        // Los handlers consultan en tiempo real si es root
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

            // Detección por debugger
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
            // Proteger las ya existentes
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
    }

    // ============================================================
    // 5. AGENTE DE LOGS
    // ============================================================
    class LoggerAgent extends Agente {
        constructor(sistema) {
            super('LoggerAgent', 'Historiador', sistema);
            this.logs = [];
            this.maxLogs = 500;
            this.cargarLogs();
        }

        cargarLogs() {
            try {
                const data = localStorage.getItem('armytage_logs');
                if (data) {
                    this.logs = JSON.parse(data);
                    this.log(`Cargados ${this.logs.length} logs`);
                }
            } catch (e) {
                this.logs = [];
            }
        }

        guardarLogs() {
            try {
                localStorage.setItem('armytage_logs', JSON.stringify(this.logs));
            } catch (e) {}
        }

        registrar(tipo, mensaje, datos = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                usuario: this.obtenerUsuario()
            };
            this.logs.push(entry);
            if (this.logs.length > this.maxLogs) this.logs.shift();
            this.guardarLogs();
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

        obtenerLogs(tipo = null) {
            return tipo ? this.logs.filter(l => l.tipo === tipo) : this.logs;
        }

        limpiar() {
            this.logs = [];
            this.guardarLogs();
        }
    }

    // ============================================================
    // 6. AGENTE DE NOTIFICACIONES
    // ============================================================
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

    // ============================================================
    // 7. AGENTE DE APRENDIZAJE
    // ============================================================
    class LearnerAgent extends Agente {
        constructor(sistema) {
            super('LearnerAgent', 'Analista', sistema);
            this.reglas = this.cargarReglas();
            this.intervalo = null;
        }

        cargarReglas() {
            try {
                const data = localStorage.getItem('armytage_reglas');
                return data ? JSON.parse(data) : { reglas: [] };
            } catch (e) {
                return { reglas: [] };
            }
        }

        guardarReglas() {
            try {
                localStorage.setItem('armytage_reglas', JSON.stringify(this.reglas));
            } catch (e) {}
        }

        iniciarAprendizaje() {
            this.intervalo = setInterval(() => {
                this.analizarPatrones();
            }, 60000);
            this.log('Aprendizaje iniciado');
        }

        analizarPatrones() {
            const logs = this.sistema.logger.obtenerLogs('SECURITY');
            if (logs.length === 0) return;

            const ultimos = logs.slice(-10);
            const copias = ultimos.filter(l => l.mensaje.includes('copy') || l.mensaje.includes('paste'));
            if (copias.length >= 5) {
                if (!this.reglas.reglas.includes('AUMENTAR_BLOQUEO_COPIA')) {
                    this.reglas.reglas.push('AUMENTAR_BLOQUEO_COPIA');
                    this.guardarReglas();
                    this.sistema.notifier.advertencia('📊 Nueva regla: Bloqueo intensificado de copia');
                    this.log('Nueva regla: AUMENTAR_BLOQUEO_COPIA');
                }
            }

            const devtools = ultimos.filter(l => l.mensaje.includes('DevTools'));
            if (devtools.length >= 3) {
                if (!this.reglas.reglas.includes('ALERTAR_ROOT_DEVTOOLS')) {
                    this.reglas.reglas.push('ALERTAR_ROOT_DEVTOOLS');
                    this.guardarReglas();
                    this.sistema.notifier.alertaRoot('⚠️ Actividad sospechosa: múltiples detecciones de DevTools');
                    this.log('Nueva regla: ALERTAR_ROOT_DEVTOOLS');
                }
            }
        }
    }

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

        inicializar() {
            this.logger.registrar('SISTEMA', 'Armytage iniciado');

            if (!this.rootAgent.esRoot()) {
                this.security.activarProtecciones();
                this.notifier.info('🛡️ Sistema de seguridad activado');
            } else {
                this.security.activarProtecciones();
                this.notifier.exito('🔓 Modo Root - Protecciones adaptadas');
            }

            this.learner.iniciarAprendizaje();
            this.logger.registrar('SISTEMA', 'Armytage completamente operativo');

            window.armytage = {
                sistema: this,
                mostrarLogs: () => this.logger.obtenerLogs(),
                mostrarReglas: () => this.learner.reglas,
                actualizarWatermark: () => this.security.actualizarWatermark()
            };

            if (this.rootAgent.esRoot()) {
                this.notifier.exito('👑 Bienvenido Root - Sistema Armytage activo');
            } else {
                this.notifier.advertencia('🔐 Modo seguro - Todas las protecciones activas');
            }
        }

        actualizarRoot() {
            const eraRoot = this.rootAgent.esRoot();
            this.rootAgent.verificarRoot();
            const esRootAhora = this.rootAgent.esRoot();
            if (esRootAhora && !eraRoot) {
                this.notifier.exito('👑 Root logueado - Protecciones adaptadas');
                this.security.actualizarWatermark();
                this.logger.registrar('SISTEMA', 'Root logueado - modo adaptado');
            } else if (!esRootAhora && eraRoot) {
                this.notifier.advertencia('🔐 Root cerró sesión - Activando protecciones completas');
                this.security.activarProtecciones();
                this.security.actualizarWatermark();
                this.logger.registrar('SISTEMA', 'Root cerró sesión - modo seguro');
            }
        }
    }

    // ============================================================
    // 9. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    let armytageInstance = null;

    function initArmytage() {
        if (!armytageInstance) {
            armytageInstance = new Armytage();
            window.armytageInstance = armytageInstance;

            // Escuchar cambios en la sesión (localStorage)
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