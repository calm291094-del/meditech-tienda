// ============================================
// AUTH.JS - AUTENTICACIÓN
// ============================================

function openLoginModal() { 
    document.getElementById('login-modal').classList.add('active');
    closeUserMenu();
}

function closeLoginModal() { 
    document.getElementById('login-modal').classList.remove('active');
}

function openRegisterModal() { 
    document.getElementById('register-modal').classList.add('active');
    closeUserMenu();
}

function closeRegisterModal() { 
    document.getElementById('register-modal').classList.remove('active');
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        showNotif('🔐 Iniciando sesión...', 'info');
        const data = await apiRequest('/login', { 
            method: 'POST', 
            body: JSON.stringify({ username, password }) 
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('session', JSON.stringify(data.usuario));
        S.currentUser = data.usuario;
        updateUIForLoggedUser();
        closeLoginModal();
        document.getElementById('login-form').reset();
        showNotif(`✅ Bienvenido, ${data.usuario.name}`, 'success');
    } catch (error) {
        showNotif(`❌ ${error.message}`, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        showNotif('📝 Creando cuenta...', 'info');
        const data = await apiRequest('/register', { 
            method: 'POST', 
            body: JSON.stringify({ username, password, name, email }) 
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('session', JSON.stringify(data.usuario));
        S.currentUser = data.usuario;
        updateUIForLoggedUser();
        closeRegisterModal();
        document.getElementById('register-form').reset();
        showNotif(`✅ Cuenta creada. Bienvenido, ${name}`, 'success');
    } catch (error) {
        showNotif(`❌ ${error.message}`, 'error');
    }
}

function logout() {
    S.currentUser = null;
    S.cart = [];
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    document.body.classList.remove('admin-mode');
    updateUIForLoggedOut();
    closeUserMenu();
    updateCartUI();
    showNotif('👋 Sesión cerrada', 'info');
}

function updateUIForLoggedUser() {
    document.getElementById('user-name-display').textContent = S.currentUser.name;
    document.getElementById('user-menu-name').textContent = S.currentUser.name;
    const badge = document.getElementById('user-role-badge');
    if (S.currentUser.role === 'admin') {
        badge.textContent = '🔒 Administrador';
        badge.className = 'badge-role admin';
        document.getElementById('admin-menu-btn').classList.remove('hidden');
        document.body.classList.add('admin-mode');
        document.getElementById('users-menu-btn').classList.remove('hidden');
        document.getElementById('telegram-btn').classList.remove('hidden');
        document.getElementById('crud-menu-btn').classList.remove('hidden');
        document.getElementById('agent-office-btn').classList.remove('hidden');
    } else {
        badge.textContent = '👤 Cliente';
        badge.className = 'badge-role user';
        document.getElementById('admin-menu-btn').classList.add('hidden');
        document.body.classList.remove('admin-mode');
        document.getElementById('users-menu-btn').classList.add('hidden');
        document.getElementById('telegram-btn').classList.add('hidden');
    }
    document.getElementById('menu-logged-out').classList.add('hidden');
    document.getElementById('menu-logged-in').classList.remove('hidden');
    document.getElementById('cart-btn').classList.remove('hidden');
}

function updateUIForLoggedOut() {
    document.getElementById('user-name-display').textContent = 'Iniciar Sesión';
    document.getElementById('menu-logged-out').classList.remove('hidden');
    document.getElementById('menu-logged-in').classList.add('hidden');
    document.getElementById('cart-btn').classList.add('hidden');
}

function toggleUserMenu() { 
    document.getElementById('user-menu').classList.toggle('open');
}

function closeUserMenu() { 
    document.getElementById('user-menu').classList.remove('open');
}

document.addEventListener('click', (e) => { 
    if (!e.target.closest('#user-section')) closeUserMenu(); 
});
