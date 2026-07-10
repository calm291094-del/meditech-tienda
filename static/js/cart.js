// ============================================================
// CART.JS - CARRITO DE COMPRAS (CON DEPURACIÓN)
// ============================================================

// ============================================================
// INICIALIZAR
// ============================================================
if (typeof S === 'undefined') {
    window.S = { cart: [], currentUser: null, pr: [] };
}

// ============================================================
// CARGAR Y GUARDAR
// ============================================================
function cargarCarrito() {
    try {
        const saved = localStorage.getItem('meditech_carrito');
        console.log('📦 localStorage raw:', saved);
        
        if (saved) {
            S.cart = JSON.parse(saved);
            console.log('✅ Carrito cargado desde localStorage:', S.cart.length, 'items');
        } else {
            S.cart = [];
            console.log('📦 No hay carrito guardado, iniciando vacío');
        }
        
        // FORZAR sincronización: si localStorage tiene datos pero S.cart está vacío
        if (S.cart.length > 0) {
            console.log('🛒 Carrito con items:', S.cart.map(i => `${i.producto?.name || 'unknown'} x${i.cantidad}`));
        } else {
            // Limpiar localStorage si S.cart está vacío
            localStorage.removeItem('meditech_carrito');
        }
        
        actualizarContadorCarrito();
    } catch (e) {
        console.error('❌ Error cargando carrito:', e);
        S.cart = [];
        localStorage.removeItem('meditech_carrito');
    }
}

function guardarCarrito() {
    try {
        console.log('💾 Guardando carrito:', S.cart.length, 'items');
        localStorage.setItem('meditech_carrito', JSON.stringify(S.cart));
        actualizarContadorCarrito();
    } catch (e) {
        console.error('❌ Error guardando carrito:', e);
    }
}

// ============================================================
// ACTUALIZAR CONTADOR
// ============================================================
function actualizarContadorCarrito() {
    // Calcular total de items
    const count = S.cart.reduce((sum, i) => sum + (i.cantidad || 0), 0);
    console.log('🔢 Actualizando contador:', count, 'items');
    
    const cartCountEl = document.getElementById('cart-count');
    const cartBtnEl = document.getElementById('cart-btn');
    
    if (cartCountEl) {
        cartCountEl.textContent = count;
        console.log('✅ Contador actualizado a:', count);
    } else {
        console.warn('⚠️ Elemento #cart-count no encontrado');
    }
    
    if (cartBtnEl) {
        if (count > 0) {
            cartBtnEl.classList.remove('hidden');
        } else {
            cartBtnEl.classList.add('hidden');
        }
    }
}

// ============================================================
// FUNCIÓN PRINCIPAL: addToCart
// ============================================================
function addToCart(productId) {
    console.log('🛒 addToCart llamado con ID:', productId);
    
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión para agregar productos', 'warning'); 
        if (typeof openLoginModal === 'function') openLoginModal();
        return; 
    }
    
    const producto = S.pr.find(p => p.id === productId || p.id == productId);
    if (!producto) { 
        console.error('❌ Producto no encontrado:', productId);
        showNotif('❌ Producto no encontrado', 'error'); 
        return; 
    }
    
    if (producto.available === false || producto.stock <= 0) { 
        showNotif(`❌ ${producto.name} está agotado`, 'error'); 
        return; 
    }
    
    // Buscar si ya está en el carrito
    const item = S.cart.find(i => i.producto?.id === productId || i.producto?.id == productId);
    if (item) {
        if (item.cantidad >= producto.stock) { 
            showNotif(`⚠️ Solo ${producto.stock} disponibles de ${producto.name}`, 'warning'); 
            return; 
        }
        item.cantidad++;
        showNotif(`✅ ${producto.name} +1 (${item.cantidad})`, 'success');
    } else {
        S.cart.push({ 
            producto: producto, 
            cantidad: 1 
        });
        showNotif(`✅ ${producto.name} agregado al carrito`, 'success');
    }
    
    guardarCarrito();
    console.log('🛒 Carrito actual:', S.cart.length, 'items');
    console.log('📋 Items:', S.cart.map(i => `${i.producto?.name} x${i.cantidad}`));
}

// ============================================================
// FUNCIONES DE MANIPULACIÓN
// ============================================================
function removeFromCart(productId) {
    console.log('🗑️ Eliminando producto:', productId);
    S.cart = S.cart.filter(i => i.producto?.id !== productId && i.producto?.id != productId);
    guardarCarrito();
    renderCartItems();
    showNotif('🗑️ Producto eliminado del carrito', 'info');
}

function updateCartQuantity(productId, change) {
    const item = S.cart.find(i => i.producto?.id === productId || i.producto?.id == productId);
    if (!item) return;
    
    const nueva = item.cantidad + change;
    if (nueva < 1) { 
        removeFromCart(productId); 
        return; 
    }
    if (nueva > item.producto.stock) { 
        showNotif(`⚠️ Solo ${item.producto.stock} disponibles`, 'warning'); 
        return; 
    }
    item.cantidad = nueva;
    guardarCarrito();
    renderCartItems();
}

// ============================================================
// RENDERIZAR ITEMS DEL CARRITO
// ============================================================
function renderCartItems() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    console.log('📋 Renderizando carrito. Items:', S.cart.length);
    
    if (!container) {
        console.warn('⚠️ contenedor cart-items no encontrado');
        return;
    }
    
    // FORZAR: Verificar consistencia
    if (S.cart.length === 0) {
        console.log('📦 Carrito vacío, mostrando mensaje');
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4 block"></i>
                <p class="text-gray-400 text-lg">Tu carrito está vacío</p>
                <p class="text-sm text-gray-400">¡Explora nuestros productos y comienza a comprar!</p>
            </div>
        `;
        if (totalElement) totalElement.textContent = '$0.00';
        // Limpiar localStorage si está vacío
        localStorage.removeItem('meditech_carrito');
        return;
    }
    
    // Validar que los items tengan producto
    const validItems = S.cart.filter(i => i.producto && i.producto.id);
    if (validItems.length !== S.cart.length) {
        console.warn('⚠️ Algunos items no tienen producto válido, limpiando...');
        S.cart = validItems;
        guardarCarrito();
        if (S.cart.length === 0) {
            renderCartItems();
            return;
        }
    }
    
    let total = 0;
    let html = '';
    
    S.cart.forEach((item, index) => {
        const subtotal = item.producto.price * item.cantidad;
        total += subtotal;
        
        html += `
            <div class="flex items-center gap-4 py-4 border-b border-gray-200">
                <img src="${item.producto.image || 'https://via.placeholder.com/100'}" alt="${item.producto.name}" class="w-16 h-16 object-cover rounded-lg" onerror="this.src='https://via.placeholder.com/100'">
                <div class="flex-1">
                    <h4 class="font-semibold">${item.producto.name}</h4>
                    <p class="text-sm text-gray-500">$${item.producto.price.toFixed(2)} c/u</p>
                    <p class="text-xs text-gray-400">📦 Stock: ${item.producto.stock}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="updateCartQuantity('${item.producto.id}', -1)" 
                            class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            ${item.cantidad <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus text-sm"></i>
                    </button>
                    <span class="font-bold w-8 text-center">${item.cantidad}</span>
                    <button onclick="updateCartQuantity('${item.producto.id}', 1)" 
                            class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            ${item.cantidad >= item.producto.stock ? 'disabled' : ''}>
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                </div>
                <div class="font-semibold text-teal-600 w-20 text-right">
                    $${subtotal.toFixed(2)}
                </div>
                <button onclick="removeFromCart('${item.producto.id}')" 
                        class="text-red-500 hover:text-red-700 transition">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
    console.log('✅ Carrito renderizado. Total:', total);
}

// ============================================================
// ABRIR/CERRAR CARRITO
// ============================================================
function openCart() {
    console.log('🛒 Abriendo carrito...');
    
    // Verificar usuario
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión para ver tu carrito', 'warning'); 
        if (typeof openLoginModal === 'function') openLoginModal();
        return; 
    }
    
    // Verificar modal
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('❌ Modal del carrito no encontrado');
        showNotif('❌ Error al abrir el carrito', 'error');
        return;
    }
    
    // FORZAR: Recargar carrito desde localStorage antes de mostrar
    const saved = localStorage.getItem('meditech_carrito');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.length > 0 && S.cart.length === 0) {
                console.log('🔄 Sincronizando carrito desde localStorage');
                S.cart = parsed;
            }
        } catch (e) {}
    }
    
    renderCartItems();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('✅ Carrito abierto con', S.cart.length, 'items');
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        console.log('✅ Carrito cerrado');
    }
}

// ============================================================
// ENVIAR PEDIDO
// ============================================================
async function enviarPedidoPorCorreo() {
    if (S.cart.length === 0) {
        showNotif('⚠️ El carrito está vacío', 'warning');
        return;
    }
    
    const userEmail = S.currentUser?.email || 'cliente@meditech.com';
    const userName = S.currentUser?.name || 'Cliente';
    const total = S.cart.reduce((sum, i) => sum + (i.producto.price * i.cantidad), 0);
    
    try {
        showNotif('📤 Procesando pedido...', 'info');
        
        const response = await fetch('/api/enviar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                nombre: userName,
                pedido: S.cart.map(i => ({ 
                    nombre: i.producto.name, 
                    cantidad: i.cantidad, 
                    precio: i.producto.price 
                })),
                total: total
            })
        });
        
        if (!response.ok) throw new Error('Error al enviar el pedido');
        
        const data = await response.json();
        showNotif('✅ Pedido enviado por correo. Revisa tu bandeja de entrada.', 'success');
        
        S.cart = [];
        guardarCarrito();
        closeCart();
        renderCartItems();
        
    } catch (error) {
        console.error('❌ Error enviando pedido:', error);
        showNotif('❌ Error al enviar el pedido. Intenta nuevamente.', 'error');
    }
}

// ============================================================
// NOTIFICACIONES
// ============================================================
function showNotif(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const n = document.createElement('div');
    n.className = `toast ${type}`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// ============================================================
// INICIALIZACIÓN Y DEPURACIÓN
// ============================================================
cargarCarrito();

// Función para forzar sincronización
function sincronizarCarrito() {
    console.log('🔄 Forzando sincronización...');
    const saved = localStorage.getItem('meditech_carrito');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            S.cart = parsed;
            guardarCarrito();
            actualizarContadorCarrito();
            console.log('✅ Carrito sincronizado:', S.cart.length, 'items');
        } catch (e) {
            console.error('❌ Error al sincronizar:', e);
        }
    } else {
        S.cart = [];
        actualizarContadorCarrito();
        console.log('📦 No hay carrito guardado');
    }
}

// ============================================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================================
window.addToCart = addToCart;
window.agregarAlCarrito = addToCart;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.updateCartQuantity = updateCartQuantity;
window.enviarPedidoPorCorreo = enviarPedidoPorCorreo;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.cargarCarrito = cargarCarrito;
window.guardarCarrito = guardarCarrito;
window.renderCartItems = renderCartItems;
window.showNotif = showNotif;
window.sincronizarCarrito = sincronizarCarrito;

console.log('✅ Cart.js cargado');
console.log('🔧 Usa sincronizarCarrito() para forzar sincronización');
