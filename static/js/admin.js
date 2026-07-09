// ============================================
// ADMIN.JS - PANEL DE ADMINISTRACIÓN
// ============================================

function openAdminPanel() {
    if (!S.currentUser || S.currentUser.role !== 'admin') {
        showNotif('❌ Solo administradores pueden acceder', 'error');
        return;
    }
    document.getElementById('admin-panel').classList.add('active');
    renderAdminList();
    closeUserMenu();
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

// ============================================
// ADMIN - RENDER LIST
// ============================================
function renderAdminList() {
    const list = document.getElementById('admin-list');
    if (!list) return;
    document.getElementById('admin-count').textContent = S.pr.length;
    if (S.pr.length === 0) { 
        list.innerHTML = '<p class="text-center text-gray-400 py-8">Sin productos</p>'; 
        return; 
    }
    list.innerHTML = S.pr.map(p => `
        <div class="admin-list-item">
            <img src="${p.image || 'https://via.placeholder.com/60'}" alt="${p.name}">
            <div class="info">
                <div class="name">${p.name}</div>
                <div class="meta">$${p.price} | Stock: ${p.stock} | ${p.available !== false ? '✅ Disponible' : '❌ Agotado'}</div>
            </div>
            <div class="actions">
                <button class="${p.available !== false ? 'toggle-on' : 'toggle-off'}" onclick="toggleProductAvailability('${p.id}')" title="${p.available !== false ? 'Marcar como agotado' : 'Marcar como disponible'}">
                    <i class="fas ${p.available !== false ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                </button>
                <button class="edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ============================================
// ADMIN - USUARIOS
// ============================================
async function renderUsers() {
    const list = document.getElementById('users-list');
    if (!list) return;
    
    try {
        const usuarios = await apiRequest('/usuarios');
        S.users = usuarios;
        
        if (!usuarios || usuarios.length === 0) {
            list.innerHTML = '<p class="text-center text-gray-400 py-8">No hay usuarios registrados</p>';
            return;
        }
        
        list.innerHTML = usuarios.map(u => `
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
                    <span class="meta" style="font-size:0.7rem;color:#6b7280;margin-left:8px;">
                        ${S.orders ? S.orders.filter(o => o.usuario === u.username).length : 0} pedidos
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = `<p class="text-center text-red-500 py-8">❌ Error al cargar usuarios: ${error.message}</p>`;
    }
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
