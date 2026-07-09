// ============================================
// ADMIN.JS - PANEL DE ADMINISTRACIÓN
// ============================================

// ============================================
// ADMIN - ABRIR PANEL
// ============================================
async function openAdminPanel() {
    if (!S.currentUser || S.currentUser.role !== 'admin') {
        showNotif('❌ Solo administradores pueden acceder', 'error');
        return;
    }
    
    document.getElementById('admin-panel').classList.add('active');
    renderAdminList();
    closeUserMenu();
    
    // 🔥 CARGAR DATOS PARA EL PANEL
    await cargarUsuarios();
    await cargarPedidosAdmin();
    renderEstadisticas();
    renderHistorial();
    
    // Generar gráficos después de cargar los datos
    setTimeout(generarGraficos, 300);
    setTimeout(actualizarDashboard, 400);
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.remove('active');
}

function showAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    if (tabName === 'config') {
        loadConfigInfo();
    }
    if (tabName === 'asistente') {
        renderAniaChat();
    }
}

// ============================================
// ADMIN - PRODUCTOS (CRUD)
// ============================================
function editProduct(id) {
    const p = S.pr.find(x => x.id === id);
    if (!p) return;
    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-desc').value = p.desc;
    document.getElementById('prod-image-url').value = p.image || '';
    document.getElementById('prod-feat').checked = p.feat || false;
    document.getElementById('prod-available').value = p.available !== false ? 'true' : 'false';
}

function resetProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('edit-product-id').value = '';
}

async function toggleProductAvailability(id) {
    const p = S.pr.find(x => x.id === id);
    if (!p) return;
    const newVal = p.available === false ? true : false;
    try {
        await apiRequest(`/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ available: newVal })
        });
        p.available = newVal;
        renderProducts();
        renderAdminList();
        showNotif(`✅ Estado cambiado: ${newVal ? 'Disponible' : 'Agotado'}`, 'success');
    } catch (error) {
        showNotif(`❌ ${error.message}`, 'error');
    }
}

async function saveProduct(e) {
    e.preventDefault();
    if (!S.currentUser || S.currentUser.role !== 'admin') {
        showNotif('❌ Solo administradores pueden agregar productos', 'error');
        return;
    }
    const editId = document.getElementById('edit-product-id').value;
    const productData = {
        name: document.getElementById('prod-name').value,
        category: document.getElementById('prod-category').value,
        price: parseFloat(document.getElementById('prod-price').value),
        desc: document.getElementById('prod-desc').value,
        stock: parseInt(document.getElementById('prod-stock').value) || 0,
        image: document.getElementById('prod-image-url').value || 'https://via.placeholder.com/300x200',
        feat: document.getElementById('prod-feat').checked,
        available: document.getElementById('prod-available').value === 'true'
    };

    try {
        let result;
        if (editId) {
            result = await apiRequest(`/productos/${editId}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            const idx = S.pr.findIndex(p => p.id === editId);
            if (idx >= 0) S.pr[idx] = result;
            showNotif('✅ Producto actualizado', 'success');
        } else {
            result = await apiRequest('/productos', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            S.pr.push(result);
            showNotif('✅ Producto creado', 'success');
        }
        resetProductForm();
        renderProducts();
        renderAdminList();
    } catch (error) {
        showNotif(`❌ ${error.message}`, 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;
    try {
        await apiRequest(`/productos/${id}`, { method: 'DELETE' });
        S.pr = S.pr.filter(p => p.id !== id);
        renderProducts();
        renderAdminList();
        showNotif('✅ Producto eliminado', 'success');
    } catch (error) {
        showNotif(`❌ ${error.message}`, 'error');
    }
}

// ============================================
// ADMIN - CARRUSEL
// ============================================
function editCarousel() {
    openAdminPanel();
    showAdminTab('carrusel');
    renderCarouselEditor();
}

function renderCarouselEditor() {
    const container = document.getElementById('carousel-editor');
    if (!container) return;
    if (!S.config.carousel || S.config.carousel.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-4">No hay slides en el carrusel</p>';
        return;
    }
    container.innerHTML = S.config.carousel.map((slide, index) => `
        <div class="admin-list-item">
            <img src="${slide.image || 'https://via.placeholder.com/120x80'}" alt="Slide ${index + 1}">
            <div class="info">
                <div class="name">${slide.title || 'Sin título'}</div>
                <div class="meta">${slide.subtitle || ''}</div>
            </div>
            <div class="actions">
                <button class="edit" onclick="editCarouselSlide(${index})"><i class="fas fa-edit"></i></button>
                <button class="delete" onclick="deleteCarouselSlide(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function addCarouselSlide() {
    S.config.carousel.push({
        image: 'https://via.placeholder.com/1200x400/0d9488/ffffff?text=Nuevo+Slide',
        title: 'Nuevo Slide',
        subtitle: 'Descripción del nuevo slide'
    });
    renderCarouselEditor();
    showNotif('📤 Slide agregado', 'info');
}

function editCarouselSlide(index) {
    const slide = S.config.carousel[index];
    if (!slide) return;
    const title = prompt('Título:', slide.title);
    if (title !== null) slide.title = title;
    const subtitle = prompt('Subtítulo:', slide.subtitle);
    if (subtitle !== null) slide.subtitle = subtitle;
    const image = prompt('URL de la imagen:', slide.image);
    if (image !== null) slide.image = image;
    renderCarouselEditor();
    showNotif('✅ Slide actualizado', 'success');
}

function deleteCarouselSlide(index) {
    if (!confirm('¿Eliminar este slide?')) return;
    S.config.carousel.splice(index, 1);
    renderCarouselEditor();
    showNotif('🗑️ Slide eliminado', 'info');
}

async function saveCarousel() {
    localStorage.setItem('config_backup', JSON.stringify(S.config));
    renderCarousel();
    initCarousel();
    showNotif('✅ Carrusel guardado', 'success');
}

// ============================================
// ADMIN - TEXTOS
// ============================================
function editSection(section) {
    openAdminPanel();
    showAdminTab('textos');
    loadTextsToEditor();
}

function loadTextsToEditor() {
    document.getElementById('edit-header-subtitle').value = S.config.headerSubtitle;
    document.getElementById('edit-categorias-title').value = S.config.categoriasTitle;
    document.getElementById('edit-categorias-subtitle').value = S.config.categoriasSubtitle;
    document.getElementById('edit-productos-title').value = S.config.productosTitle;
    document.getElementById('edit-productos-subtitle').value = S.config.productosSubtitle;
    document.getElementById('edit-ofertas-title').value = S.config.ofertasTitle;
    document.getElementById('edit-ofertas-subtitle').value = S.config.ofertasSubtitle;
    document.getElementById('edit-footer-description').value = S.config.footerDescription;
}

async function saveTexts() {
    S.config.headerSubtitle = document.getElementById('edit-header-subtitle').value;
    S.config.categoriasTitle = document.getElementById('edit-categorias-title').value;
    S.config.categoriasSubtitle = document.getElementById('edit-categorias-subtitle').value;
    S.config.productosTitle = document.getElementById('edit-productos-title').value;
    S.config.productosSubtitle = document.getElementById('edit-productos-subtitle').value;
    S.config.ofertasTitle = document.getElementById('edit-ofertas-title').value;
    S.config.ofertasSubtitle = document.getElementById('edit-ofertas-subtitle').value;
    S.config.footerDescription = document.getElementById('edit-footer-description').value;
    
    // Guardar en localStorage (respaldo)
    localStorage.setItem('config_backup', JSON.stringify(S.config));
    applyTexts();
    showNotif('✅ Textos actualizados localmente', 'success');
}

function renderAdminList() {
    const list = document.getElementById('admin-list');
    if (!list) return;
    document.getElementById('admin-count').textContent = S.pr ? S.pr.length : 0;
    
    if (!S.pr || S.pr.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 py-8">Sin productos</p>';
        return;
    }
    
    list.innerHTML = S.pr.map(p => {
        const isAvailable = p.available !== false;
        return `
            <div class="admin-list-item">
                <img src="${p.image || 'https://via.placeholder.com/60'}" alt="${p.name}">
                <div class="info">
                    <div class="name">${p.name}</div>
                    <div class="meta">$${p.price} | Stock: ${p.stock} | <span style="color:${isAvailable ? '#10b981' : '#ef4444'};font-weight:600;">${isAvailable ? '✅ Disponible' : '❌ Agotado'}</span></div>
                </div>
                <div class="actions">
                    <button class="${isAvailable ? 'toggle-on' : 'toggle-off'}" onclick="toggleProductAvailability('${p.id}')" title="${isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}">
                        <i class="fas ${isAvailable ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                    </button>
                    <button class="edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// ADMIN - RENDER USUARIOS
// ============================================
function renderUsers() {
    const list = document.getElementById('users-list');
    if (!list) return;
    
    // Si no hay usuarios, mostrar mensaje
    if (!S.users || S.users.length === 0) {
        list.innerHTML = `
            <div class="admin-list-item" style="justify-content:center;padding:20px;color:#6b7280;">
                <i class="fas fa-users" style="font-size:2rem;opacity:0.3;display:block;text-align:center;width:100%;margin-bottom:8px;"></i>
                No hay usuarios registrados
            </div>
        `;
        return;
    }
    
    list.innerHTML = S.users.map(u => `
        <div class="admin-list-item" onclick="verPerfilCliente('${u.username}')" style="cursor:pointer;">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0d9488,#06b6d4);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1.2rem;flex-shrink:0;">
                ${u.name ? u.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="info">
                <div class="name">${u.name || u.username}</div>
                <div class="meta">@${u.username} | ${u.email || 'Sin email'}</div>
            </div>
            <div>
                <span class="badge-role ${u.role === 'admin' ? 'admin' : 'user'}">${u.role === 'admin' ? '🔒 Admin' : '👤 Cliente'}</span>
            </div>
        </div>
    `).join('');
}

function verPerfilCliente(username) {
    showNotif(`📊 Perfil de ${username}`, 'info');
}

function buscarUsuarios(query) {
    const list = document.getElementById('users-list');
    if (!list) return;
    
    if (!query.trim()) {
        renderUsers();
        return;
    }
    
    const filtrados = S.users.filter(u =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(query.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(query.toLowerCase()))
    );
    
    if (filtrados.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 py-8">No se encontraron usuarios</p>';
        return;
    }
    
    list.innerHTML = filtrados.map(u => `
        <div class="admin-list-item" onclick="verPerfilCliente('${u.username}')" style="cursor:pointer;">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0d9488,#06b6d4);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1.2rem;flex-shrink:0;">
                ${u.name ? u.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="info">
                <div class="name">${u.name || u.username}</div>
                <div class="meta">@${u.username} | ${u.email || 'Sin email'}</div>
            </div>
            <div>
                <span class="badge-role ${u.role === 'admin' ? 'admin' : 'user'}">${u.role === 'admin' ? '🔒 Admin' : '👤 Cliente'}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// ADMIN - HISTORIAL Y PEDIDOS
// ============================================
function renderHistorial() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    if (!S.history || S.history.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 py-8">Sin historial</p>';
        return;
    }
    
    list.innerHTML = S.history.slice(0, 50).map(h => `
        <div class="admin-list-item">
            <div class="info">
                <div class="name"><i class="fas fa-user text-teal-600"></i> ${h.usuario || 'Anónimo'}</div>
                <div class="meta"><i class="fas fa-link text-gray-400"></i> ${h.pagina || '/'}</div>
            </div>
            <div style="font-size:0.7rem;color:#6b7280;">${new Date(h.fecha).toLocaleString('es-ES')}</div>
        </div>
    `).join('');
}

// ============================================
// ADMIN - RENDER PEDIDOS
// ============================================
function renderPedidos() {
    const list = document.getElementById('orders-list');
    if (!list) return;
    
    if (!S.orders || S.orders.length === 0) {
        list.innerHTML = `
            <div class="admin-list-item" style="justify-content:center;padding:20px;color:#6b7280;">
                <i class="fas fa-receipt" style="font-size:2rem;opacity:0.3;display:block;text-align:center;width:100%;margin-bottom:8px;"></i>
                No hay pedidos registrados
            </div>
        `;
        return;
    }
    
    list.innerHTML = S.orders.slice(0, 20).map(o => `
        <div class="admin-list-item" style="flex-direction:column;align-items:stretch;gap:4px;padding:10px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                <div>
                    <div class="name" style="font-size:0.85rem;">${o.id || 'Sin ID'}</div>
                    <div class="meta"><i class="fas fa-user"></i> ${o.usuario || 'Anónimo'}</div>
                </div>
                <div>
                    <span style="font-weight:700;color:#0d9488;">$${o.total ? parseFloat(o.total).toFixed(2) : '0.00'}</span>
                    <span class="badge-role ${o.estado === 'pendiente' ? 'user' : 'admin'}" style="margin-left:8px;font-size:0.6rem;">${o.estado || 'Pendiente'}</span>
                </div>
            </div>
            <div class="meta" style="font-size:0.7rem;">
                ${o.items && o.items.length > 0 ? o.items.map(i => `${i.nombre || 'Producto'} x${i.cantidad || 0}`).join(', ') : 'Sin items'}
            </div>
            <div style="font-size:0.6rem;color:#9ca3af;">${o.fecha ? new Date(o.fecha).toLocaleString('es-ES') : 'Fecha desconocida'}</div>
        </div>
    `).join('');
}

// ============================================
// ADMIN - CARGAR USUARIOS DESDE EL BACKEND
// ============================================
async function cargarUsuarios() {
    try {
        const usuarios = await apiRequest('/usuarios');
        S.users = usuarios || [];
        console.log(`✅ ${S.users.length} usuarios cargados`);
        renderUsers();
        return S.users;
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error.message);
        S.users = [];
        renderUsers();
        return [];
    }
}

// ============================================
// ESTADÍSTICAS
// ============================================
function renderEstadisticas() {
    const totalProductos = S.pr ? S.pr.length : 0;
    const totalUsuarios = S.users ? S.users.length : 0;
    const totalPedidos = S.orders ? S.orders.length : 0;
    const totalVistas = S.history ? S.history.length : 0;
    
    document.getElementById('stat-products').textContent = totalProductos;
    document.getElementById('stat-users').textContent = totalUsuarios;
    document.getElementById('stat-views').textContent = totalVistas;
    document.getElementById('stat-orders').textContent = totalPedidos;
    
    const revenue = S.orders ? S.orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) : 0;
    document.getElementById('stat-revenue').textContent = `$${revenue.toFixed(2)}`;
    
    const today = new Date().toDateString();
    const todayViews = S.history ? S.history.filter(h => h.fecha && new Date(h.fecha).toDateString() === today).length : 0;
    document.getElementById('stat-today').textContent = todayViews;
    
    console.log(`📊 Estadísticas: ${totalProductos} productos, ${totalUsuarios} usuarios, ${totalPedidos} pedidos`);
}

// ============================================
// ADMIN - CARGAR PEDIDOS DESDE EL BACKEND
// ============================================
async function cargarPedidosAdmin() {
    try {
        const pedidos = await apiRequest('/pedidos');
        S.orders = pedidos || [];
        console.log(`✅ ${S.orders.length} pedidos cargados`);
        renderPedidos();
        return S.orders;
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error.message);
        S.orders = [];
        renderPedidos();
        return [];
    }
}
