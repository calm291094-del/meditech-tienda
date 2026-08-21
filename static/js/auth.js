// ============================================
// AUTH.JS - AUTENTICACIÓN
// ============================================

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('active');
    closeUserMenu();
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('active');
}

function openRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.add('active');
    closeUserMenu();
}

function closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.remove('active');
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
    
    // ✅ CORRECCIÓN: Verificar si existe antes de llamar para evitar el error
    if (typeof window.updateCartUI === 'function') {
        window.updateCartUI();
    }
    
    showNotif('👋 Sesión cerrada', 'info');
}

function updateUIForLoggedUser() {
    // Elementos que siempre deben existir
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) userNameDisplay.textContent = S.currentUser.name;

    const userMenuName = document.getElementById('user-menu-name');
    if (userMenuName) userMenuName.textContent = S.currentUser.name;

    const badge = document.getElementById('user-role-badge');
    if (badge) {
        if (S.currentUser.role === 'admin') {
            badge.textContent = '🔒 Administrador';
            badge.className = 'badge-role admin';
        } else {
            badge.textContent = '👤 Cliente';
            badge.className = 'badge-role user';
        }
    }

    // Elementos que pueden no existir (los protegemos con if)
    const adminMenu = document.getElementById('admin-menu-btn');
    const usersMenu = document.getElementById('users-menu-btn');
    const telegramBtn = document.getElementById('telegram-btn');
    const crudMenu = document.getElementById('crud-menu-btn');
    const agentOffice = document.getElementById('agent-office-btn');

    if (S.currentUser.role === 'admin') {
        if (adminMenu) adminMenu.classList.remove('hidden');
        if (usersMenu) usersMenu.classList.remove('hidden');
        if (telegramBtn) telegramBtn.classList.remove('hidden');
        if (crudMenu) crudMenu.classList.remove('hidden');
        if (agentOffice) agentOffice.classList.remove('hidden');
        document.body.classList.add('admin-mode');
    } else {
        if (adminMenu) adminMenu.classList.add('hidden');
        if (usersMenu) usersMenu.classList.add('hidden');
        if (telegramBtn) telegramBtn.classList.add('hidden');
        if (crudMenu) crudMenu.classList.add('hidden');
        if (agentOffice) agentOffice.classList.add('hidden');
        document.body.classList.remove('admin-mode');
    }

    const menuLoggedOut = document.getElementById('menu-logged-out');
    const menuLoggedIn = document.getElementById('menu-logged-in');
    const cartBtn = document.getElementById('cart-btn');

    if (menuLoggedOut) menuLoggedOut.classList.add('hidden');
    if (menuLoggedIn) menuLoggedIn.classList.remove('hidden');
    if (cartBtn) cartBtn.classList.remove('hidden');
}

function updateUIForLoggedOut() {
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) userNameDisplay.textContent = 'Iniciar Sesión';

    const menuLoggedOut = document.getElementById('menu-logged-out');
    const menuLoggedIn = document.getElementById('menu-logged-in');
    const cartBtn = document.getElementById('cart-btn');

    if (menuLoggedOut) menuLoggedOut.classList.remove('hidden');
    if (menuLoggedIn) menuLoggedIn.classList.add('hidden');
    if (cartBtn) cartBtn.classList.add('hidden');
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.toggle('open');
}

function closeUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.remove('open');
}

document.addEventListener('click', (e) => { 
    if (!e.target.closest('#user-section')) closeUserMenu(); 
});
