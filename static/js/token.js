// ============================================
// TOKEN.JS - GESTIÓN DE TOKENS
// ============================================

async function loadToken() {
    console.log('🔑 Cargando token desde la base de datos...');
    
    try {
        const response = await fetch(`${API_URL}/config/github-token-public`);
        if (response.ok) {
            const data = await response.json();
            if (data.token && data.token !== '') {
                localStorage.setItem('github_token', data.token);
                window.GITHUB_TOKEN = data.token;
                HEADERS['Authorization'] = `token ${data.token}`;
                console.log('✅ Token cargado desde la base de datos');
                return true;
            }
        }
        console.warn('⚠️ No hay token en la base de datos');
    } catch (error) {
        console.warn('⚠️ No se pudo cargar token desde la base de datos:', error.message);
    }
    
    const savedToken = localStorage.getItem('github_token');
    if (savedToken && savedToken !== '' && savedToken !== 'ghp_PEGA_AQUI_TU_NUEVO_TOKEN') {
        window.GITHUB_TOKEN = savedToken;
        console.log('✅ Token cargado desde localStorage (fallback)');
        return true;
    }
    
    console.warn('⚠️ No hay token configurado');
    return false;
}

async function saveToken(token) {
    try {
        await apiRequest('/config/github-token', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        localStorage.setItem('github_token', token);
        localStorage.setItem('github_token_date', new Date().toISOString());
        window.GITHUB_TOKEN = token;
        HEADERS['Authorization'] = `token ${token}`;
        console.log('✅ Token guardado en la base de datos');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar token:', error);
        localStorage.setItem('github_token', token);
        showNotif('⚠️ Token guardado solo localmente', 'warning');
        return false;
    }
}

function toggleTokenVisibility() {
    const input = document.getElementById('current-token-display');
    const icon = event.target.closest('button').querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

async function updateToken() {
    const newToken = document.getElementById('new-token-input').value.trim();
    const statusDiv = document.getElementById('token-status');

    if (!newToken) {
        showTokenStatus('❌ Ingresa un token válido', 'error');
        return;
    }

    if (!newToken.startsWith('ghp_') && !newToken.startsWith('github_pat_')) {
        showTokenStatus('❌ El token debe empezar con "ghp_" o "github_pat_"', 'error');
        return;
    }

    showTokenStatus('🔄 Guardando token...', 'info');

    const success = await saveToken(newToken);
    if (success) {
        showTokenStatus('✅ Token actualizado correctamente en la base de datos', 'success');
        document.getElementById('new-token-input').value = '';
        loadConfigInfo();
        if (typeof cargarProductos === 'function') {
            await cargarProductos();
        }
    } else {
        showTokenStatus('❌ Error al guardar el token', 'error');
    }
}

async function testToken() {
    const token = document.getElementById('new-token-input').value.trim() || localStorage.getItem('github_token');
    const statusDiv = document.getElementById('token-status');
    
    if (!token) {
        showTokenStatus('❌ No hay token para probar', 'error');
        return;
    }

    showTokenStatus('🔄 Probando token...', 'info');

    try {
        const result = await apiRequest('/config/test-github-token', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        if (result.valid) {
            showTokenStatus(`✅ ${result.message}`, 'success');
        } else {
            showTokenStatus(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        showTokenStatus(`❌ Error al probar: ${error.message}`, 'error');
    }
}

function showTokenStatus(message, type) {
    const statusDiv = document.getElementById('token-status');
    statusDiv.className = 'token-status ' + type;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
}

async function loadConfigInfo() {
    try {
        const response = await fetch(`${API_URL}/config/github-token-public`);
        let currentToken = '';
        if (response.ok) {
            const data = await response.json();
            currentToken = data.token || '';
        }
        
        if (!currentToken) {
            currentToken = localStorage.getItem('github_token') || '';
        }
        
        document.getElementById('current-token-display').value = currentToken;
        document.getElementById('info-repo').textContent = `${GITHUB_USER}/${GITHUB_REPO}`;

        const tokenType = currentToken.startsWith('github_pat_') ? 'Fine-Grained (Beta)' :
                          currentToken.startsWith('ghp_') ? 'Classic' : 'No configurado';
        document.getElementById('info-token-type').textContent = tokenType;

        const lastSync = localStorage.getItem('github_token_date');
        document.getElementById('info-last-sync').textContent = lastSync ?
            new Date(lastSync).toLocaleString('es-ES') : 'Nunca';

        if (currentToken) {
            try {
                const testResult = await apiRequest('/config/test-github-token', {
                    method: 'POST',
                    body: JSON.stringify({ token: currentToken })
                });
                const statusEl = document.getElementById('info-status');
                if (testResult.valid) {
                    statusEl.innerHTML = '<span style="color:#10b981;"><i class="fas fa-check-circle"></i> Conectado</span>';
                } else {
                    statusEl.innerHTML = '<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Token inválido</span>';
                }
            } catch (e) {
                document.getElementById('info-status').innerHTML = '<span style="color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i> No verificado</span>';
            }
        } else {
            document.getElementById('info-status').innerHTML = '<span style="color:#9ca3af;">No configurado</span>';
        }
    } catch (error) {
        console.error('Error al cargar configuración:', error);
        const currentToken = localStorage.getItem('github_token') || '';
        document.getElementById('current-token-display').value = currentToken;
    }
}

async function exportAllData() {
    const backup = {
        version: '2.0',
        fecha: new Date().toISOString(),
        productos: S.pr,
        usuarios: S.users,
        pedidos: S.orders,
        config: S.config
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meditech-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('✅ Backup descargado', 'success');
}

async function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            if (!confirm(`¿Importar backup del ${new Date(backup.fecha).toLocaleString('es-ES')}?`)) return;
            
            showNotif('📤 Importando backup...', 'info');
            
            if (backup.productos) {
                S.pr = backup.productos;
                for (const p of S.pr) {
                    await apiRequest('/productos', { method: 'POST', body: JSON.stringify(p) }).catch(() => {});
                }
            }
            if (backup.usuarios) {
                for (const u of backup.usuarios) {
                    await apiRequest('/register', { method: 'POST', body: JSON.stringify(u) }).catch(() => {});
                }
            }
            if (backup.pedidos) {
                for (const p of backup.pedidos) {
                    await apiRequest('/pedidos', { method: 'POST', body: JSON.stringify({ items: p.items }) }).catch(() => {});
                }
            }
            
            renderProducts();
            renderAdminList();
            showNotif('✅ Backup importado correctamente', 'success');
        } catch (err) {
            showNotif('❌ Error al importar: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

function forzarRecarga() {
    location.reload();
}

function realizarBackup() {
    exportAllData();
}