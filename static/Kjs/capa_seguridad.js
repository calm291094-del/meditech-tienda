// ============================================================
// 🛡️ SECURITY.JS - CAPA DE PROTECCIÓN COMPLETA
// ============================================================
// Este archivo implementa múltiples capas de seguridad a nivel de navegador
// para disuadir inspección, copia, capturas y acciones maliciosas.
// 
// ⚠️ ADVERTENCIA: Ninguna protección del lado del cliente es infalible.
//    Un usuario determinado siempre puede sortearlas. Estas medidas son
//    disuasorias y añaden una capa extra de dificultad.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. BLOQUEO DE TECLAS PELIGROSAS
    // ============================================================
    function bloquearTeclas(e) {
        const key = e.key;
        const ctrl = e.ctrlKey;
        const shift = e.shiftKey;
        const alt = e.altKey;

        // F12 - Herramientas de desarrollador
        if (key === 'F12') {
            e.preventDefault();
            mostrarAlerta('⚠️ Las herramientas de desarrollador están deshabilitadas');
            return false;
        }

        // Ctrl+U - Ver código fuente
        if (ctrl && key.toLowerCase() === 'u') {
            e.preventDefault();
            mostrarAlerta('⚠️ La vista de código fuente está deshabilitada');
            return false;
        }

        // Ctrl+S - Guardar página
        if (ctrl && key.toLowerCase() === 's') {
            e.preventDefault();
            mostrarAlerta('⚠️ No se permite guardar esta página');
            return false;
        }

        // Ctrl+P - Imprimir
        if (ctrl && key.toLowerCase() === 'p') {
            e.preventDefault();
            mostrarAlerta('⚠️ La impresión está deshabilitada');
            return false;
        }

        // Ctrl+Shift+I / J / C - Abrir DevTools
        if (ctrl && shift && ['i', 'j', 'c'].includes(key.toLowerCase())) {
            e.preventDefault();
            mostrarAlerta('⚠️ Las herramientas de desarrollador están deshabilitadas');
            return false;
        }

        // Ctrl+Shift+K - Consola en Firefox
        if (ctrl && shift && key.toLowerCase() === 'k') {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+U - Accesibilidad en Chrome
        if (ctrl && shift && key.toLowerCase() === 'u') {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+E - Cambiar idioma (puede ser usado para ataques)
        if (ctrl && shift && key.toLowerCase() === 'e') {
            e.preventDefault();
            return false;
        }

        // Ctrl+H - Historial (puede ocultar actividad)
        if (ctrl && key.toLowerCase() === 'h') {
            e.preventDefault();
            return false;
        }

        // Ctrl+J - Descargas
        if (ctrl && key.toLowerCase() === 'j') {
            e.preventDefault();
            return false;
        }

        // Ctrl+W - Cerrar pestaña (puede ser usado para salir)
        if (ctrl && key.toLowerCase() === 'w') {
            // Permitimos cerrar, pero prevenimos si hay formularios sin guardar
            // e.preventDefault();
            // return false;
        }

        // Ctrl+R / F5 - Recargar (permitido)
        // if ((ctrl && key.toLowerCase() === 'r') || key === 'F5') {
        //     e.preventDefault();
        //     mostrarAlerta('⚠️ No se permite recargar la página');
        //     return false;
        // }

        // Ctrl+Shift+R - Recarga forzada (permitida)
        // if (ctrl && shift && key.toLowerCase() === 'r') {
        //     e.preventDefault();
        //     mostrarAlerta('⚠️ No se permite recargar la página');
        //     return false;
        // }

        // Alt+F4 - Cerrar ventana (solo en Windows)
        if (alt && key === 'F4') {
            e.preventDefault();
            return false;
        }

        // Ctrl+Tab / Ctrl+Shift+Tab - Cambiar pestaña
        if (ctrl && (key === 'Tab' || key === 'Escape')) {
            // Permitir cambio de pestaña, pero podríamos bloquear si es necesario
        }

        return true;
    }

    // ============================================================
    // 2. BLOQUEO DE CLICK DERECHO (MENÚ CONTEXTUAL)
    // ============================================================
    function bloquearContextMenu(e) {
        e.preventDefault();
        mostrarAlerta('⚠️ El menú contextual está deshabilitado');
        return false;
    }

    // ============================================================
    // 3. BLOQUEO DE COPIADO, CORTADO Y PEGADO
    // ============================================================
    function bloquearCopiado(e) {
        e.preventDefault();
        mostrarAlerta('📋 La copia de contenido está deshabilitada');
        return false;
    }

    function bloquearCortado(e) {
        e.preventDefault();
        mostrarAlerta('✂️ El cortado de contenido está deshabilitado');
        return false;
    }

    function bloquearPegado(e) {
        // Permitimos pegar en campos de formulario, pero podemos bloquear globalmente
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            // Permitir pegar en campos de formulario (opcional)
            return true;
        }
        e.preventDefault();
        mostrarAlerta('📋 El pegado de contenido está deshabilitado');
        return false;
    }

    // ============================================================
    // 4. BLOQUEO DE SELECCIÓN DE TEXTO (USER-SELECT)
    // ============================================================
    function bloquearSeleccion(e) {
        // Prevenir selección de texto en toda la página
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        // Pero permitimos selección en inputs y textareas
        const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        inputs.forEach(el => {
            el.style.userSelect = 'text';
            el.style.webkitUserSelect = 'text';
            el.style.mozUserSelect = 'text';
            el.style.msUserSelect = 'text';
        });
    }

    // ============================================================
    // 5. BLOQUEO DE ARRASTRE DE IMÁGENES
    // ============================================================
    function bloquearArrastre(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            mostrarAlerta('🖼️ No se permite arrastrar imágenes');
            return false;
        }
    }

    // ============================================================
    // 6. DETECCIÓN DE DEVTOOLS ABIERTOS (MÉTODO 1: TAMAÑO DE VENTANA)
    // ============================================================
    let devtoolsAbiertos = false;
    let intervaloDeteccion = null;

    function detectarDevtoolsPorTamano() {
        const umbral = 160; // Diferencia en píxeles sospechosa
        const diffWidth = window.outerWidth - window.innerWidth;
        const diffHeight = window.outerHeight - window.innerHeight;

        if ((diffWidth > umbral || diffHeight > umbral) && !devtoolsAbiertos) {
            devtoolsAbiertos = true;
            onDevtoolsAbiertos();
        } else if (diffWidth <= umbral && diffHeight <= umbral && devtoolsAbiertos) {
            devtoolsAbiertos = false;
            onDevtoolsCerrados();
        }
    }

    function onDevtoolsAbiertos() {
        console.clear();
        console.log('%c⚠️ DEVTOOLS DETECTADOS', 'background: red; color: white; font-size: 30px; padding: 10px;');
        console.log('%cEsta acción está siendo monitoreada y registrada.', 'color: orange; font-size: 16px;');
        
        // Opcional: Desenfocar la página o mostrar overlay
        document.body.style.filter = 'blur(4px)';
        document.body.style.pointerEvents = 'none';
        
        // Mostrar notificación si existe showNotif
        if (typeof showNotif === 'function') {
            showNotif('🔍 Se detectaron herramientas de desarrollador. La sesión está siendo monitoreada.', 'error', 5000);
        } else {
            alert('⚠️ Herramientas de desarrollador detectadas. La sesión está siendo monitoreada.');
        }
    }

    function onDevtoolsCerrados() {
        document.body.style.filter = '';
        document.body.style.pointerEvents = '';
    }

    // ============================================================
    // 7. DETECCIÓN DE DEVTOOLS CON DEBUGGER
    // ============================================================
    function detectarDevtoolsConDebugger() {
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtoolsAbiertos = true;
                onDevtoolsAbiertos();
            }
        });
        console.log('%c', element);
    }

    // ============================================================
    // 8. WATERMARK DINÁMICO CON DATOS DEL USUARIO
    // ============================================================
    function crearWatermark() {
        // Obtener datos del usuario desde localStorage o sesión
        let usuario = 'Invitado';
        let nombre = 'Invitado';
        try {
            const session = localStorage.getItem('session');
            if (session) {
                const user = JSON.parse(session);
                usuario = user.username || 'Invitado';
                nombre = user.name || 'Invitado';
            }
        } catch (e) {
            // No hacer nada
        }

        const fecha = new Date().toLocaleString('es-ES');
        const ip = 'cliente'; // No podemos obtener IP real del cliente

        // Crear canvas para el watermark
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');

        // Configurar texto
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(0, 80, 158, 0.06)'; // Muy transparente
        ctx.textAlign = 'center';
        ctx.rotate(-25 * Math.PI / 180);

        // Dibujar texto en varias líneas
        ctx.fillText('MediTech - Sistema Seguro', 150, 50);
        ctx.fillText(`Usuario: ${usuario}`, 150, 80);
        ctx.fillText(`Nombre: ${nombre}`, 150, 105);
        ctx.fillText(`Fecha: ${fecha}`, 150, 130);

        // Convertir a imagen
        const watermarkURL = canvas.toDataURL('image/png');

        // Crear elemento overlay
        const overlay = document.createElement('div');
        overlay.id = 'watermark-overlay';
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
    }

    // ============================================================
    // 9. ANTI-CLICKJACKING (DETECCIÓN DE IFRAME)
    // ============================================================
    function antiClickjacking() {
        if (window.top !== window.self) {
            try {
                if (window.top.location.hostname !== window.self.location.hostname) {
                    // Diferente dominio = posible clickjacking
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
                }
            } catch (e) {
                // Error de cross-origin = está embebido
                document.body.innerHTML = '<h1>Acceso bloqueado</h1>';
            }
        }
    }

    // ============================================================
    // 10. AUDITORÍA DE ACCIONES SOSPECHOSAS
    // ============================================================
    const auditLog = [];
    const MAX_LOGS = 100;

    function registrarAccionSeguridad(tipo, detalle) {
        const registro = {
            timestamp: new Date().toISOString(),
            usuario: localStorage.getItem('session') ? JSON.parse(localStorage.getItem('session')).username || 'anon' : 'anon',
            tipo: tipo,
            detalle: detalle,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        auditLog.push(registro);
        if (auditLog.length > MAX_LOGS) auditLog.shift();
        console.warn('🔍 [AUDIT]', registro);
        
        // Opcional: enviar al backend si existe
        // if (typeof apiRequest === 'function') {
        //     apiRequest('/audit', { method: 'POST', body: JSON.stringify(registro) }).catch(() => {});
        // }
    }

    // ============================================================
    // 11. PROTECCIÓN DE IMÁGENES (BLOQUEO DE CLIC DERECHO Y ARRASTRE)
    // ============================================================
    function protegerImagenes() {
        const imagenes = document.querySelectorAll('img');
        imagenes.forEach(img => {
            img.addEventListener('contextmenu', e => e.preventDefault());
            img.addEventListener('dragstart', e => e.preventDefault());
            img.addEventListener('selectstart', e => e.preventDefault());
            img.setAttribute('draggable', 'false');
            // Opcional: agregar un overlay transparente para evitar guardar con clic
            // img.style.pointerEvents = 'none';
        });
    }

    // ============================================================
    // 12. BLOQUEO DE CAPTURAS DE PANTALLA (LIMITADO)
    // ============================================================
    function bloquearCaptura() {
        // No es posible bloquear completamente las capturas de pantalla.
        // Podemos intentar detectar la combinación de teclas de captura
        document.addEventListener('keydown', function(e) {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                mostrarAlerta('🖼️ No se permite capturar pantalla');
                registrarAccionSeguridad('PRINTSCREEN', 'Intento de captura de pantalla');
                return false;
            }
        });

        // También podemos detectar el evento 'visibilitychange' que se dispara
        // cuando la página deja de ser visible (posible captura con apps externas)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                registrarAccionSeguridad('VISIBILITY_CHANGE', 'La página perdió visibilidad (posible captura)');
            }
        });
    }

// ============================================================
// 13. FUNCIÓN DE ALERTA (TOAST O ALERT NATIVO)
// ============================================================
function mostrarAlerta(mensaje) {
    // ✅ No usar alert() que bloquea la UI
    // Intentar usar showNotif si existe (sistema de toasts)
    if (typeof showNotif === 'function') {
        showNotif(mensaje, 'warning', 3000);
    } else {
        // ✅ Usar console.warn en lugar de alert
        console.warn('🔒 Seguridad:', mensaje);
        // Si existe un elemento para notificaciones, usarlo
        const notifEl = document.getElementById('notification-area');
        if (notifEl) {
            notifEl.innerHTML = `<div class="toast warning">${mensaje}</div>`;
            setTimeout(() => { notifEl.innerHTML = ''; }, 3000);
        }
    }
    // Registrar en auditoría
    registrarAccionSeguridad('ALERTA', mensaje);
}

    // ============================================================
    // 14. BLOQUEO DE CONSOLA
    // ============================================================
    function bloquearConsola() {
        // Prevenir que se ejecute código en la consola
        // Esto no es 100% efectivo, pero añade otra capa
        // Object.defineProperty(window, 'console', {
        //     value: {
        //         log: function() {},
        //         warn: function() {},
        //         error: function() {},
        //         info: function() {},
        //         debug: function() {}
        //     },
        //     writable: false,
        //     configurable: false
        // });
        // La consola se puede restaurar, así que es mejor no bloquearla completamente
        // y en su lugar monitorear su uso.
        console.log('%c🛡️ MediTech Security Active', 'color: #0d9488; font-size: 20px; font-weight: bold;');
        console.log('%c⚠️ Cualquier intento de inyección será registrado.', 'color: #f59e0b; font-size: 14px;');
    }

    // ============================================================
    // 15. PREVENIR INYECCIÓN DE SCRIPTS (XSS)
    // ============================================================
    function prevenirXSS() {
        // Sanitizar entradas de usuario en formularios (opcional)
        document.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('input', function() {
                // Reemplazar caracteres peligrosos
                this.value = this.value.replace(/<script/g, '&lt;script').replace(/<\/script>/g, '&lt;/script&gt;');
            });
        });
    }

    // ============================================================
    // 16. INICIALIZAR TODAS LAS PROTECCIONES
    // ============================================================
    function iniciarProtecciones() {
        console.log('🛡️ Iniciando capa de protección...');

        // 1. Eventos de teclado
        document.addEventListener('keydown', bloquearTeclas);
        document.addEventListener('keyup', function(e) {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                mostrarAlerta('🖼️ No se permite capturar pantalla');
                return false;
            }
        });

        // 2. Contexto (clic derecho)
        document.addEventListener('contextmenu', bloquearContextMenu);

        // 3. Copiar, cortar, pegar
        document.addEventListener('copy', bloquearCopiado);
        document.addEventListener('cut', bloquearCortado);
        document.addEventListener('paste', bloquearPegado);

        // 4. Selección
        bloquearSeleccion();

        // 5. Arrastre
        document.addEventListener('dragstart', bloquearArrastre);

        // 6. DevTools por tamaño
        intervaloDeteccion = setInterval(detectarDevtoolsPorTamano, 1000);

        // 7. Debugger para detectar DevTools
        setInterval(detectarDevtoolsConDebugger, 3000);

        // 8. Watermark
        crearWatermark();

        // 9. Clickjacking
        antiClickjacking();

        // 10. Imágenes
        protegerImagenes();

        // 11. Captura de pantalla
        bloquearCaptura();

        // 12. Consola
        bloquearConsola();

        // 13. XSS
        prevenirXSS();

        // 14. Auditoría de eventos sospechosos adicionales
        document.addEventListener('beforeunload', function() {
            registrarAccionSeguridad('BEFORE_UNLOAD', 'Intento de cerrar o recargar página');
        });

        // Registrar inicio
        registrarAccionSeguridad('SECURITY_INIT', 'Capa de protección activada');

        console.log('✅ Todas las protecciones están activas');
    }

    // ============================================================
    // 17. EXPONER FUNCIONES PARA USO EXTERNO (OPCIONAL)
    // ============================================================
    window.seguridad = {
        registrarAccion: registrarAccionSeguridad,
        mostrarAlerta: mostrarAlerta,
        reiniciarWatermark: crearWatermark,
        auditoria: auditLog
    };

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarProtecciones);
    } else {
        iniciarProtecciones();
    }

    // ============================================================
    // 18. RECARGAR PROTECCIONES DESPUÉS DE CAMBIOS DINÁMICOS
    // ============================================================
    // Observar cambios en el DOM para re-aplicar protecciones a nuevos elementos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Re-proteger imágenes nuevas
                protegerImagenes();
                // Re-aplicar bloqueo de selección a nuevos inputs
                bloquearSeleccion();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('🛡️ Security.js cargado correctamente');
})();
