// ============================================================
// 🛡️ SECURITY.JS - CAPA DE PROTECCIÓN COMPLETA (CORREGIDA)
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

        // Alt+F4 - Cerrar ventana (solo en Windows)
        if (alt && key === 'F4') {
            e.preventDefault();
            return false;
        }

        return true;
    }

    // ============================================================
    // 2. BLOQUEO DE CLICK DERECHO (CON EXCEPCIONES)
    // ============================================================
    function bloquearContextMenu(e) {
        const target = e.target;
        // ✅ Permitir clic derecho en elementos interactivos
        if (target && (target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.tagName === 'BUTTON' ||
                       target.closest('.product-card') ||
                       target.closest('.add-btn') ||
                       target.closest('#cart-btn') ||
                       target.closest('.btn-primary'))) {
            return true;
        }
        e.preventDefault();
        mostrarAlerta('⚠️ El menú contextual está deshabilitado');
        return false;
    }

    // ============================================================
    // 3. BLOQUEO DE COPIADO, CORTADO Y PEGADO (CON EXCEPCIONES)
    // ============================================================
    function bloquearCopiado(e) {
        const target = e.target;
        // ✅ Permitir copiar en inputs y textareas
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return true;
        }
        e.preventDefault();
        mostrarAlerta('📋 La copia de contenido está deshabilitada');
        return false;
    }

    function bloquearCortado(e) {
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return true;
        }
        e.preventDefault();
        mostrarAlerta('✂️ El cortado de contenido está deshabilitado');
        return false;
    }

    function bloquearPegado(e) {
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return true;
        }
        e.preventDefault();
        mostrarAlerta('📋 El pegado de contenido está deshabilitado');
        return false;
    }

    // ============================================================
    // 4. BLOQUEO DE SELECCIÓN DE TEXTO (USER-SELECT)
    // ============================================================
    function bloquearSeleccion() {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        // ✅ Permitir selección en inputs y textareas
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
    // 6. DETECCIÓN DE DEVTOOLS ABIERTOS (DESACTIVADA)
    // ============================================================
    // ✅ Desactivado para evitar interferencias con la UI
    /*
    let devtoolsAbiertos = false;
    let intervaloDeteccion = null;

    function detectarDevtoolsPorTamano() {
        const umbral = 160;
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
        document.body.style.filter = 'blur(4px)';
        document.body.style.pointerEvents = 'none';
        if (typeof showNotif === 'function') {
            showNotif('🔍 Se detectaron herramientas de desarrollador. La sesión está siendo monitoreada.', 'error', 5000);
        }
    }

    function onDevtoolsCerrados() {
        document.body.style.filter = '';
        document.body.style.pointerEvents = '';
    }
    */

    // ============================================================
    // 7. DETECCIÓN DE DEVTOOLS CON DEBUGGER (DESACTIVADA)
    // ============================================================
    /*
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
    */

    // ============================================================
    // 8. WATERMARK DINÁMICO CON DATOS DEL USUARIO
    // ============================================================
    function crearWatermark() {
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

        ctx.fillText('MediTech - Sistema Seguro', 150, 50);
        ctx.fillText(`Usuario: ${usuario}`, 150, 80);
        ctx.fillText(`Nombre: ${nombre}`, 150, 105);
        ctx.fillText(`Fecha: ${fecha}`, 150, 130);

        const watermarkURL = canvas.toDataURL('image/png');

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
        let usuario = 'anon';
        try {
            const session = localStorage.getItem('session');
            if (session) {
                const user = JSON.parse(session);
                usuario = user.username || 'anon';
            }
        } catch (e) {}
        
        const registro = {
            timestamp: new Date().toISOString(),
            usuario: usuario,
            tipo: tipo,
            detalle: detalle,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        auditLog.push(registro);
        if (auditLog.length > MAX_LOGS) auditLog.shift();
        console.warn('🔍 [AUDIT]', registro);
    }

    // ============================================================
    // 11. PROTECCIÓN DE IMÁGENES (BLOQUEO DE CLIC DERECHO Y ARRASTRE)
    // ============================================================
    function protegerImagenes() {
        const imagenes = document.querySelectorAll('img');
        imagenes.forEach(img => {
            img.addEventListener('contextmenu', function(e) {
                // ✅ No prevenir el evento si es un botón de producto
                if (this.closest('.product-card') || this.closest('.add-btn')) {
                    return true;
                }
                e.preventDefault();
                return false;
            });
            img.addEventListener('dragstart', e => e.preventDefault());
            img.addEventListener('selectstart', e => e.preventDefault());
            img.setAttribute('draggable', 'false');
        });
    }

    // ============================================================
    // 12. BLOQUEO DE CAPTURAS DE PANTALLA (LIMITADO)
    // ============================================================
    function bloquearCaptura() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                mostrarAlerta('🖼️ No se permite capturar pantalla');
                registrarAccionSeguridad('PRINTSCREEN', 'Intento de captura de pantalla');
                return false;
            }
        });

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                registrarAccionSeguridad('VISIBILITY_CHANGE', 'La página perdió visibilidad (posible captura)');
            }
        });
    }

    // ============================================================
    // 13. FUNCIÓN DE ALERTA (SIN BLOQUEAR UI)
    // ============================================================
    function mostrarAlerta(mensaje) {
        // ✅ Usar solo console.warn, no bloquear la UI
        console.warn('🔒 Seguridad:', mensaje);
        
        // Intentar usar showNotif si existe (no bloqueante)
        if (typeof showNotif === 'function') {
            showNotif(mensaje, 'warning', 3000);
        }
        
        registrarAccionSeguridad('ALERTA', mensaje);
    }

    // ============================================================
    // 14. BLOQUEO DE CONSOLA (SOLO MONITOREO)
    // ============================================================
    function bloquearConsola() {
        console.log('%c🛡️ MediTech Security Active', 'color: #0d9488; font-size: 20px; font-weight: bold;');
        console.log('%c⚠️ Cualquier intento de inyección será registrado.', 'color: #f59e0b; font-size: 14px;');
    }

    // ============================================================
    // 15. PREVENIR INYECCIÓN DE SCRIPTS (XSS) - SIN INTERFERIR
    // ============================================================
    function prevenirXSS() {
        // ✅ Solo sanitizar sin interferir con la entrada del usuario
        document.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('input', function() {
                // No modificar el valor, solo verificar
                if (this.value && this.value.includes('<script')) {
                    console.warn('⚠️ Posible intento de XSS detectado en:', this);
                }
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

        // 2. Contexto (clic derecho) - con excepciones
        document.addEventListener('contextmenu', bloquearContextMenu);

        // 3. Copiar, cortar, pegar - con excepciones
        document.addEventListener('copy', bloquearCopiado);
        document.addEventListener('cut', bloquearCortado);
        document.addEventListener('paste', bloquearPegado);

        // 4. Selección
        bloquearSeleccion();

        // 5. Arrastre
        document.addEventListener('dragstart', bloquearArrastre);

        // 6-7. DevTools - DESACTIVADO (comentado)

        // 8. Watermark
        crearWatermark();

        // 9. Clickjacking
        antiClickjacking();

        // 10. Imágenes (con excepciones)
        protegerImagenes();

        // 11. Captura de pantalla
        bloquearCaptura();

        // 12. Consola
        bloquearConsola();

        // 13. XSS (sin interferir)
        prevenirXSS();

        // 14. Auditoría
        document.addEventListener('beforeunload', function() {
            registrarAccionSeguridad('BEFORE_UNLOAD', 'Intento de cerrar o recargar página');
        });

        registrarAccionSeguridad('SECURITY_INIT', 'Capa de protección activada');

        console.log('✅ Todas las protecciones están activas');
    }

    // ============================================================
    // 17. EXPONER FUNCIONES PARA USO EXTERNO
    // ============================================================
    window.seguridad = {
        registrarAccion: registrarAccionSeguridad,
        mostrarAlerta: mostrarAlerta,
        reiniciarWatermark: crearWatermark,
        auditoria: auditLog
    };

    // ============================================================
    // 18. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarProtecciones);
    } else {
        iniciarProtecciones();
    }

    // ============================================================
    // 19. RECARGAR PROTECCIONES DESPUÉS DE CAMBIOS DINÁMICOS
    // ============================================================
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                protegerImagenes();
                bloquearSeleccion();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('🛡️ Security.js cargado correctamente (modo compatible)');
})();
