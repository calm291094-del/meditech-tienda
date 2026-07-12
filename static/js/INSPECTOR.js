// ============================================================
// 🔍 INSPECTOR.JS - "El Detective"
// ============================================================
// Personalidad: Metódico, curioso, obsesivo con los detalles.
// Función: Análisis estático y dinámico de JavaScript en tiempo real.
// Detecta: Secretos expuestos, librerías vulnerables, endpoints ocultos,
//          comportamiento anómalo y ofuscación maliciosa.
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURACIÓN
    // ============================================================
    const CONFIG = {
        maxResults: 100,
        enableDeepScan: true,
        enableVulnerabilityCheck: true,
        enableBehaviorAnalysis: true
    };

    // ============================================================
    // 2. SISTEMA DE LOGS (compartido con otros scripts)
    // ============================================================
    const LogStore = window._armytageLogs || {
        _logs: [],
        registrar: function(tipo, mensaje, datos = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                tipo,
                mensaje,
                datos,
                script: 'INSPECTOR'
            };
            this._logs.push(entry);
            console.log(`[INSPECTOR] ${tipo}: ${mensaje}`, datos);
            // Guardar en localStorage para persistencia
            try {
                localStorage.setItem('inspector_logs', JSON.stringify(this._logs.slice(-200)));
            } catch (e) {}
            return entry;
        },
        obtenerLogs: function(tipo = null) {
            if (tipo) {
                return this._logs.filter(l => l.tipo === tipo);
            }
            return this._logs;
        }
    };
    window._armytageLogs = LogStore;

    // ============================================================
    // 3. EL DETECTIVE - NÚCLEO
    // ============================================================
    const Inspector = {
        _resultados: {
            secrets: [],
            vulnerabilities: [],
            endpoints: [],
            suspicious: [],
            scripts: []
        },
        _scanned: false,

        // -------- Escáner principal --------
        scan: function() {
            if (this._scanned) return this._resultados;
            this._scanned = true;

            LogStore.registrar('INSPECTOR', '🔍 Iniciando escaneo completo de scripts');

            const scripts = document.querySelectorAll('script');
            const total = scripts.length;
            let processed = 0;

            scripts.forEach((script, index) => {
                const content = script.src ? this._fetchScript(script.src) : script.innerHTML;
                if (!content) return;

                const scriptInfo = {
                    src: script.src || 'inline',
                    type: script.type || 'text/javascript',
                    length: content.length,
                    index: index
                };

                // 1. Buscar secretos
                this._findSecrets(content, scriptInfo);

                // 2. Buscar endpoints
                this._findEndpoints(content, scriptInfo);

                // 3. Verificar vulnerabilidades
                if (CONFIG.enableVulnerabilityCheck) {
                    this._checkVulnerabilities(content, scriptInfo);
                }

                // 4. Analizar comportamiento
                if (CONFIG.enableBehaviorAnalysis) {
                    this._analyzeBehavior(script, scriptInfo);
                }

                processed++;
            });

            LogStore.registrar('INSPECTOR', `✅ Escaneo completado: ${processed} scripts analizados`, {
                total: processed,
                secrets: this._resultados.secrets.length,
                vulnerabilities: this._resultados.vulnerabilities.length,
                endpoints: this._resultados.endpoints.length,
                suspicious: this._resultados.suspicious.length
            });

            this._mostrarResumen();
            return this._resultados;
        },

        // -------- Búsqueda de secretos --------
        _findSecrets: function(content, scriptInfo) {
            const patterns = {
                'API Key (Generic)': /[a-zA-Z0-9_-]{32,}/g,
                'JWT Token': /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
                'AWS Key': /AKIA[0-9A-Z]{16}/g,
                'Google API Key': /AIza[0-9A-Za-z_-]{35}/g,
                'GitHub Token': /gh[ps]_[0-9a-zA-Z]{36}/g,
                'Stripe Key': /sk_live_[0-9a-zA-Z]{24}/g,
                'Password (hardcoded)': /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi,
                'Database URL': /(?:mysql|postgres|mongodb):\/\/[^'"\s]+/gi,
                'Private Key': /-----BEGIN (?:RSA|DSA|EC) PRIVATE KEY-----/g,
                'Access Token': /[Aa]ccess[_-]?[Tt]oken\s*[:=]\s*['"][^'"]+['"]/g
            };

            for (const [type, pattern] of Object.entries(patterns)) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const value = match[0];
                    // Evitar falsos positivos (ej: strings vacíos o muy cortos)
                    if (value.length > 10) {
                        this._resultados.secrets.push({
                            type: type,
                            value: value,
                            script: scriptInfo.src || 'inline',
                            line: this._getLineNumber(content, match.index),
                            confidence: this._calculateConfidence(type, value)
                        });
                    }
                }
            }
        },

        _calculateConfidence: function(type, value) {
            // Calcula nivel de confianza basado en el tipo y el valor
            const confidence = {
                'JWT Token': 95,
                'AWS Key': 98,
                'Google API Key': 95,
                'GitHub Token': 96,
                'Stripe Key': 97,
                'Private Key': 99,
                'API Key (Generic)': 70,
                'Password (hardcoded)': 85,
                'Database URL': 90,
                'Access Token': 80
            };
            return confidence[type] || 50;
        },

        // -------- Búsqueda de endpoints --------
        _findEndpoints: function(content, scriptInfo) {
            const patterns = [
                /(?:"|')(\/api\/[^"']+)(?:"|')/g,
                /(?:"|')(\/v\d+\/[^"']+)(?:"|')/g,
                /(?:"|')(https?:\/\/[^"']+\.(?:com|org|net|io)\/[^"']+)(?:"|')/g,
                /fetch\s*\(\s*["']([^"']+)["']/g,
                /axios\.(?:get|post|put|delete)\s*\(\s*["']([^"']+)["']/g,
                /\$\.(?:get|post|ajax)\s*\(\s*["']([^"']+)["']/g,
                /new\s+WebSocket\s*\(\s*["']([^"']+)["']/g,
                /EventSource\s*\(\s*["']([^"']+)["']/g
            ];

            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const url = match[1];
                    if (url && url.length > 5) {
                        this._resultados.endpoints.push({
                            url: url,
                            method: this._guessMethod(content, match.index),
                            script: scriptInfo.src || 'inline',
                            line: this._getLineNumber(content, match.index)
                        });
                    }
                }
            }
        },

        _guessMethod: function(content, position) {
            // Intenta adivinar el método HTTP basado en el contexto
            const context = content.substring(Math.max(0, position - 80), position + 20);
            if (context.includes('get') || context.includes('GET')) return 'GET';
            if (context.includes('post') || context.includes('POST')) return 'POST';
            if (context.includes('put') || context.includes('PUT')) return 'PUT';
            if (context.includes('delete') || context.includes('DELETE')) return 'DELETE';
            return 'UNKNOWN';
        },

        // -------- Verificación de vulnerabilidades --------
        _checkVulnerabilities: function(content, scriptInfo) {
            const vulnerabilities = {
                'eval()': /eval\s*\(/g,
                'document.write': /document\.write\s*\(/g,
                'innerHTML (suspicious)': /\.innerHTML\s*=\s*[^'"]+(?:['"]|[^;])/g,
                'setTimeout (string)': /setTimeout\s*\(\s*["']/g,
                'setInterval (string)': /setInterval\s*\(\s*["']/g,
                'Function constructor': /new\s+Function\s*\(/g,
                'with()': /\bwith\s*\(/g,
                'debugger': /\bdebugger\b/g,
                'location.href (redirect)': /location\.href\s*=\s*["'][^"']+["']/g
            };

            for (const [type, pattern] of Object.entries(vulnerabilities)) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    this._resultados.vulnerabilities.push({
                        type: type,
                        script: scriptInfo.src || 'inline',
                        line: this._getLineNumber(content, match.index),
                        context: content.substring(Math.max(0, match.index - 50), match.index + 50)
                    });
                }
            }
        },

        // -------- Análisis de comportamiento --------
        _analyzeBehavior: function(scriptElement, scriptInfo) {
            // Verificar si el script es inline o externo
            if (scriptElement.src) {
                // Script externo - verificar si está en una lista de confianza
                const trustedDomains = [
                    'cdnjs.cloudflare.com',
                    'code.jquery.com',
                    'cdn.jsdelivr.net',
                    'unpkg.com',
                    'cdn.jsdelivr.net',
                    'googleapis.com',
                    'gstatic.com',
                    'facebook.com',
                    'twitter.com',
                    'youtube.com',
                    'vimeo.com'
                ];

                const url = new URL(scriptElement.src);
                const isTrusted = trustedDomains.some(domain => url.hostname.includes(domain));

                if (!isTrusted) {
                    this._resultados.suspicious.push({
                        type: 'DOMAIN_UNTRUSTED',
                        detail: `Script de dominio no confiable: ${url.hostname}`,
                        script: scriptElement.src,
                        severity: 'MEDIUM'
                    });
                }

                // Verificar si el script usa HTTPS
                if (url.protocol !== 'https:') {
                    this._resultados.suspicious.push({
                        type: 'INSECURE_PROTOCOL',
                        detail: `Script cargado con HTTP: ${scriptElement.src}`,
                        script: scriptElement.src,
                        severity: 'HIGH'
                    });
                }
            }

            // Verificar atributos peligrosos
            if (scriptElement.hasAttribute('integrity') && !scriptElement.hasAttribute('crossorigin')) {
                this._resultados.suspicious.push({
                    type: 'INTEGRITY_WITHOUT_CORS',
                    detail: 'Script con integridad pero sin crossorigin',
                    script: scriptElement.src || 'inline',
                    severity: 'LOW'
                });
            }

            // Verificar scripts inline con contenido sospechoso
            if (!scriptElement.src && scriptElement.innerHTML) {
                const content = scriptElement.innerHTML;
                if (content.length > 5000) {
                    this._resultados.suspicious.push({
                        type: 'LARGE_INLINE_SCRIPT',
                        detail: `Script inline muy grande (${content.length} caracteres)`,
                        script: 'inline',
                        severity: 'LOW'
                    });
                }

                // Buscar ofuscación
                if (this._isObfuscated(content)) {
                    this._resultados.suspicious.push({
                        type: 'OBFUSCATED_CODE',
                        detail: 'Código potencialmente ofuscado detectado',
                        script: 'inline',
                        severity: 'HIGH'
                    });
                }
            }
        },

        _isObfuscated: function(content) {
            // Detectar ofuscación: muchos caracteres especiales, nombres de variables cortos, etc.
            const clean = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
            const lines = clean.split('\n').filter(l => l.trim());
            if (lines.length < 5) return false;

            // Calcular la longitud promedio de las líneas (sin espacios)
            const avgLength = clean.length / lines.length;
            // Calcular la proporción de caracteres especiales
            const specialChars = clean.match(/[^a-zA-Z0-9_\s]/g)?.length || 0;
            const specialRatio = specialChars / clean.length;

            // Si la línea promedio es muy corta y hay muchos caracteres especiales -> posible ofuscación
            return avgLength < 50 && specialRatio > 0.3;
        },

        // -------- Utilidades --------
        _fetchScript: function(src) {
            try {
                // Intentar obtener el contenido del script mediante fetch
                const xhr = new XMLHttpRequest();
                xhr.open('GET', src, false);
                xhr.send();
                if (xhr.status === 200) {
                    return xhr.responseText;
                }
            } catch (e) {
                // Fallback: intentar encontrar en el DOM
                const scriptElement = document.querySelector(`script[src="${src}"]`);
                if (scriptElement) {
                    return scriptElement.innerHTML;
                }
            }
            return null;
        },

        _getLineNumber: function(content, position) {
            const lines = content.substring(0, position).split('\n');
            return lines.length;
        },

        _mostrarResumen: function() {
            const resumen = {
                secrets: this._resultados.secrets.length,
                vulnerabilities: this._resultados.vulnerabilities.length,
                endpoints: this._resultados.endpoints.length,
                suspicious: this._resultados.suspicious.length
            };

            console.group('🔍 INFORME DEL DETECTIVE');
            console.log('📊 Resumen:', resumen);

            if (resumen.secrets > 0) {
                console.warn('🔑 Secretos encontrados:', this._resultados.secrets);
            }
            if (resumen.vulnerabilities > 0) {
                console.warn('⚠️ Vulnerabilidades detectadas:', this._resultados.vulnerabilities);
            }
            if (resumen.endpoints > 0) {
                console.log('🌐 Endpoints descubiertos:', this._resultados.endpoints);
            }
            if (resumen.suspicious > 0) {
                console.warn('🚨 Comportamiento sospechoso:', this._resultados.suspicious);
            }
            console.groupEnd();

            // Notificar mediante toast si existe
            if (window.showToast) {
                window.showToast(`🔍 Detective: ${resumen.secrets} secretos, ${resumen.vulnerabilities} vulnerabilidades`, 'info', 5000);
            }
        },

        // -------- API Pública --------
        obtenerResultados: function() {
            return this._resultados;
        },

        obtenerSecrets: function() {
            return this._resultados.secrets;
        },

        obtenerVulnerabilidades: function() {
            return this._resultados.vulnerabilities;
        },

        obtenerEndpoints: function() {
            return this._resultados.endpoints;
        },

        obtenerSospechosos: function() {
            return this._resultados.suspicious;
        },

        // Escanear en busca de cambios (para usar con MutationObserver)
        iniciarMonitoreo: function() {
            const observer = new MutationObserver(() => {
                // Re-escanear cuando se agreguen nuevos scripts
                const scripts = document.querySelectorAll('script:not([data-inspector-scanned])');
                if (scripts.length > 0) {
                    scripts.forEach(s => s.setAttribute('data-inspector-scanned', 'true'));
                    // Volver a escanear solo los nuevos
                    this._scanned = false;
                    this.scan();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            LogStore.registrar('INSPECTOR', 'Monitoreo de nuevos scripts iniciado');
            return observer;
        }
    };

    // ============================================================
    // 4. INICIALIZACIÓN AUTOMÁTICA
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                Inspector.scan();
                Inspector.iniciarMonitoreo();
            }, 500);
        });
    } else {
        setTimeout(() => {
            Inspector.scan();
            Inspector.iniciarMonitoreo();
        }, 500);
    }

    // Exponer API pública
    window.Inspector = Inspector;

    console.log('🔍 Inspector.js - "El Detective" cargado');
    console.log('📖 Usa Inspector.obtenerResultados() para ver el informe');

})();