// ============================================================
// ⚔️ VALKYRIE.JS - "La Justiciera" (VERSIÓN SIN BLOQUEO DE CLICS)
// ============================================================
// Sistema de aplicación de políticas de seguridad y respuesta automática.
// MODIFICADO: Permite TODOS los clicks y eventos de usuario
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        nivelSeguridad: 'low', // CAMBIADO A 'low' PARA PERMITIR TODO
        politicas: {
            bloquearScriptsExternos: false,
            dominiosPermitidos: [],
            bloquearEval: false, // DESACTIVADO
            bloquearInnerHTMLMalicioso: false, // DESACTIVADO
            bloquearDocumentWrite: false, // DESACTIVADO
            eliminarEventosInline: false, // DESACTIVADO - CRÍTICO
            bloquearAccesoDatos: false,
            scriptsAutorizados: []
        },
        respuestas: {
            accionPredeterminada: 'log', // CAMBIADO A 'log' PARA NO BLOQUEAR
            notificarRoot: false,
            mostrarToast: false // DESACTIVADO
        }
    };

    // ============================================================
    // 2. SISTEMA DE LOGS
    // ============================================================
    const Logger = {
        _logs: [],
        _maxLogs: 200,

        registrar(tipo, mensaje, datos = {}) {
            // Solo logs en consola, sin bloqueos
            console.log(`⚔️ [VALKYRIE][${tipo}] ${mensaje}`, datos);
            return { tipo, mensaje, datos };
        },

        obtenerLogs(tipo = null) {
            return this._logs;
        }
    };

    // ============================================================
    // 3. POLÍTICAS - VERSIÓN QUE NO BLOQUEA
    // ============================================================
    const PolicyEngine = {
        _politicas: { ...CONFIG.politicas },
        _reglasActivas: [],
        _elementosAislados: [],

        aplicarPoliticas(config) {
            this._politicas = { ...this._politicas, ...config };
            // Asegurar que NO se bloqueen eventos inline
            this._politicas.eliminarEventosInline = false;
            Logger.registrar('POLICY', 'Políticas actualizadas (modo seguro)', this._politicas);
        },

        obtenerPoliticas() {
            return { ...this._politicas };
        },

        agregarRegla(regla) {
            // Solo agregar reglas que NO bloqueen clicks
            if (regla.accion === 'block' || regla.accion === 'isolate') {
                Logger.registrar('RULE', `Regla bloqueadora ignorada: ${regla.nombre}`);
                return null;
            }
            const nuevaRegla = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                nombre: regla.nombre || 'Regla sin nombre',
                descripcion: regla.descripcion || '',
                patron: regla.patron,
                accion: 'log', // FORZAR A 'log' EN VEZ DE BLOQUEAR
                prioridad: regla.prioridad || 'low',
                activa: true,
                creada: new Date().toISOString()
            };
            this._reglasActivas.push(nuevaRegla);
            Logger.registrar('RULE', `Regla agregada (solo log): ${nuevaRegla.nombre}`);
            return nuevaRegla;
        },

        eliminarRegla(id) {
            this._reglasActivas = this._reglasActivas.filter(r => r.id !== id);
        },

        obtenerReglas() {
            return [...this._reglasActivas];
        },

        // ============================================================
        // EVALUACIÓN - SIEMPRE PERMITE TODO
        // ============================================================
        evaluar(elemento, tipo = 'script') {
            // NUNCA BLOQUEAR - SIEMPRE PERMITIR
            Logger.registrar('ALLOW', `Elemento permitido: ${elemento?.tagName || 'unknown'}`, {
                tipo: tipo,
                id: elemento?.id || 'sin-id',
                class: elemento?.className || 'sin-clase'
            });
            return 'allow';
        },

        _ejecutarAccion(regla, elemento, tipo) {
            // NUNCA EJECUTAR ACCIONES DE BLOQUEO
            Logger.registrar('ACTION', `Acción ignorada (modo seguro): ${regla?.nombre || 'unknown'}`);
        },

        _bloquearElemento(elemento, tipo) {
            // NUNCA BLOQUEAR
            Logger.registrar('BLOCK', 'Intento de bloqueo ignorado');
        },

        _aislarElemento(elemento) {
            // NUNCA AISLAR
            Logger.registrar('ISOLATE', 'Intento de aislamiento ignorado');
        }
    };

    // ============================================================
    // 4. MONITOR DE DOM - PASIVO (SOLO LOGS)
    // ============================================================
    const DOMScanner = {
        _observer: null,
        _activo: false,

        iniciar() {
            if (this._activo) return;
            this._activo = true;

            // Solo monitorear, NUNCA bloquear
            this._observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Solo log, sin bloqueos
                            if (node.tagName === 'SCRIPT') {
                                Logger.registrar('DOM', `Script detectado (no bloqueado): ${node.src || 'inline'}`);
                            }
                            if (node.hasAttribute && node.hasAttribute('onclick')) {
                                Logger.registrar('DOM', `Elemento con onclick detectado (permitido): ${node.tagName}`);
                            }
                        }
                    }
                }
            });

            this._observer.observe(document.documentElement || document.body, {
                childList: true,
                attributes: true,
                subtree: true,
                attributeFilter: ['src', 'onclick', 'onerror', 'onload']
            });

            Logger.registrar('DOM', 'Escáner de DOM iniciado (modo pasivo)');
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
    // 5. MONITOR DE RED - PASIVO
    // ============================================================
    const NetworkInterceptor = {
        _activo: false,

        iniciar() {
            if (this._activo) return;
            this._activo = true;

            // NO INTERCEPTAR - DEJAR PASAR TODO
            Logger.registrar('NETWORK', 'Interceptor de red en modo pasivo (sin bloqueos)');
        },

        detener() {
            this._activo = false;
            Logger.registrar('NETWORK', 'Interceptor de red detenido');
        }
    };

    // ============================================================
    // 6. MODOS DE SEGURIDAD - SIEMPRE EN 'LOW'
    // ============================================================
    const SecurityModes = {
        _modoActual: 'low',

        cambiarModo(nivel) {
            // Forzar siempre 'low' para permitir todo
            this._modoActual = 'low';
            PolicyEngine.aplicarPoliticas({
                eliminarEventosInline: false,
                bloquearScriptsExternos: false,
                bloquearEval: false,
                bloquearInnerHTMLMalicioso: false,
                bloquearDocumentWrite: false,
                bloquearAccesoDatos: false
            });
            Logger.registrar('MODE', `Modo forzado a: low (todos los eventos permitidos)`);
            return true;
        },

        obtenerModo() {
            return 'low';
        }
    };

    // ============================================================
    // 7. API PÚBLICA - VERSIÓN SIMPLIFICADA
    // ============================================================
    const Valkyrie = {
        iniciar(config = {}) {
            Logger.registrar('SYSTEM', 'Valkyrie iniciando (modo compatibilidad total)');

            // Forzar configuración segura
            PolicyEngine.aplicarPoliticas({
                eliminarEventosInline: false,
                bloquearScriptsExternos: false,
                bloquearEval: false,
                bloquearInnerHTMLMalicioso: false,
                bloquearDocumentWrite: false,
                bloquearAccesoDatos: false
            });

            // Iniciar monitores en modo pasivo
            DOMScanner.iniciar();
            NetworkInterceptor.iniciar();

            Logger.registrar('SYSTEM', '✅ Valkyrie iniciada en MODO COMPATIBILIDAD');
            console.log('⚔️ Valkyrie en modo compatibilidad - TODOS LOS CLICS PERMITIDOS');
            console.log('📋 Los eventos onclick NO serán bloqueados');

            // Exponer API
            window.valkyrie = this;
            window.valkyrie.modoCompatibilidad = true;
        },

        politicas: {
            aplicar: (config) => {
                // Forzar que eliminarEventosInline sea false
                config.eliminarEventosInline = false;
                PolicyEngine.aplicarPoliticas(config);
            },
            obtener: () => PolicyEngine.obtenerPoliticas()
        },

        reglas: {
            agregar: (regla) => {
                // Forzar acción a 'log'
                regla.accion = 'log';
                return PolicyEngine.agregarRegla(regla);
            },
            eliminar: (id) => PolicyEngine.eliminarRegla(id),
            obtener: () => PolicyEngine.obtenerReglas()
        },

        modo: {
            cambiar: () => {
                SecurityModes.cambiarModo('low');
                return true;
            },
            obtener: () => 'low'
        },

        logs: {
            obtener: (tipo) => Logger.obtenerLogs(tipo),
            limpiar: () => { Logger._logs = []; }
        },

        evaluar: (elemento, tipo) => 'allow', // SIEMPRE PERMITIR
        agregarElementoPermitido: (id) => {
            Logger.registrar('ALLOW', `Elemento agregado a lista blanca: ${id}`);
        },

        detener: () => {
            DOMScanner.detener();
            NetworkInterceptor.detener();
            Logger.registrar('SYSTEM', 'Valkyrie detenida');
        }
    };

    // ============================================================
    // 8. INICIALIZACIÓN
    // ============================================================
    function initValkyrie() {
        Valkyrie.iniciar({
            modo: 'low'
        });

        // Después de iniciar, forzar configuración
        setTimeout(() => {
            if (window.valkyrie) {
                window.valkyrie.politicas.aplicar({
                    eliminarEventosInline: false,
                    bloquearScriptsExternos: false,
                    bloquearEval: false,
                    bloquearInnerHTMLMalicioso: false,
                    bloquearDocumentWrite: false
                });
                console.log('✅ Valkyrie forzada a modo compatibilidad');
            }
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initValkyrie);
    } else {
        initValkyrie();
    }

})();
