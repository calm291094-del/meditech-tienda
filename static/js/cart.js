// ============================================================
// CART.JS - CARRITO DE COMPRAS (VERSIÓN UNIFICADA CON S)
// ============================================================

// ============================================================
// INICIALIZAR CARRITO EN S
// ============================================================
if (typeof S === 'undefined') {
    window.S = { cart: [], currentUser: null, pr: [] };
}

// Cargar carrito desde localStorage al iniciar
function cargarCarrito() {
    try {
        const saved = localStorage.getItem('meditech_carrito');
        if (saved) {
            S.cart = JSON.parse(saved);
        } else {
            S.cart = [];
        }
        actualizarContadorCarrito();
        console.log(`🛒 Carrito cargado: ${S.cart.length} items`);
    } catch (e) {
        console.error('Error cargando carrito:', e);
        S.cart = [];
    }
}

// Guardar carrito en localStorage
function guardarCarrito() {
    try {
        localStorage.setItem('meditech_carrito', JSON.stringify(S.cart));
    } catch (e) {
        console.error('Error guardando carrito:', e);
    }
}

// ============================================================
// FUNCIÓN PRINCIPAL: addToCart (la que usa main.js)
// ============================================================
function addToCart(productId) {
    console.log('🛒 addToCart llamado con ID:', productId);
    
    // Verificar usuario
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión para agregar productos', 'warning'); 
        if (typeof openLoginModal === 'function') openLoginModal();
        return; 
    }
    
    // Buscar producto
    const producto = S.pr.find(p => p.id === productId || p.id == productId);
    if (!producto) { 
        console.error('❌ Producto no encontrado:', productId);
        showNotif('❌ Producto no encontrado', 'error'); 
        return; 
    }
    
    // Verificar disponibilidad
    if (producto.available === false || producto.stock <= 0) { 
        showNotif(`❌ ${producto.name} está agotado`, 'error'); 
        return; 
    }
    
    // Buscar si ya está en el carrito
    const item = S.cart.find(i => i.producto.id === productId || i.producto.id == productId);
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
    actualizarContadorCarrito();
    if (typeof renderCartItems === 'function') renderCartItems();
    console.log(`🛒 Carrito actual: ${S.cart.length} items`);
}

// ============================================================
// FUNCIONES DE CARRITO (alias para compatibilidad)
// ============================================================
function agregarAlCarrito(productId) {
    addToCart(productId);
}

function removeFromCart(productId) {
    S.cart = S.cart.filter(i => i.producto.id !== productId && i.producto.id != productId);
    guardarCarrito();
    actualizarContadorCarrito();
    if (typeof renderCartItems === 'function') renderCartItems();
    showNotif('🗑️ Producto eliminado del carrito', 'info');
}

function updateCartQuantity(productId, change) {
    const item = S.cart.find(i => i.producto.id === productId || i.producto.id == productId);
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
    actualizarContadorCarrito();
    if (typeof renderCartItems === 'function') renderCartItems();
}

// ============================================================
// ACTUALIZAR UI DEL CARRITO
// ============================================================
function actualizarContadorCarrito() {
    const count = S.cart.reduce((sum, i) => sum + i.cantidad, 0);
    const cartCountEl = document.getElementById('cart-count');
    const cartBtnEl = document.getElementById('cart-btn');
    
    if (cartCountEl) {
        cartCountEl.textContent = count;
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
// ABRIR/CERRAR CARRITO
// ============================================================
function openCart() {
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión para ver tu carrito', 'warning'); 
        if (typeof openLoginModal === 'function') openLoginModal();
        return; 
    }
    
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('❌ Modal del carrito no encontrado');
        return;
    }
    
    if (typeof renderCartItems === 'function') {
        renderCartItems();
    } else {
        renderCartItemsFallback();
    }
    modal.classList.add('active');
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.remove('active');
}

// ============================================================
// RENDERIZAR ITEMS (fallback si no está en admin.js)
// ============================================================
function renderCartItemsFallback() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (!container) return;
    
    if (S.cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4 block"></i>
                <p class="text-gray-400 text-lg">Tu carrito está vacío</p>
                <p class="text-sm text-gray-400">¡Explora nuestros productos y comienza a comprar!</p>
            </div>
        `;
        if (totalElement) totalElement.textContent = '$0.00';
        return;
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
}

// ============================================================
// ENVIAR PEDIDO POR CORREO
// ============================================================
async function enviarPedidoPorCorreo() {
    if (S.cart.length === 0) {
        showNotif('⚠️ El carrito está vacío', 'warning');
        return;
    }
    
    const userEmail = S.currentUser?.email || 'cliente@meditech.com';
    const userName = S.currentUser?.name || 'Cliente';
    
    // Calcular total
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
        
        // Vaciar carrito
        S.cart = [];
        guardarCarrito();
        actualizarContadorCarrito();
        closeCart();
        if (typeof renderCartItems === 'function') renderCartItems();
        
    } catch (error) {
        console.error('❌ Error enviando pedido:', error);
        showNotif('❌ Error al enviar el pedido. Intenta nuevamente.', 'error');
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
cargarCarrito();

// ============================================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================================
window.addToCart = addToCart;
window.agregarAlCarrito = agregarAlCarrito;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.updateCartQuantity = updateCartQuantity;
window.enviarPedidoPorCorreo = enviarPedidoPorCorreo;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.cargarCarrito = cargarCarrito;
window.guardarCarrito = guardarCarrito;

console.log('✅ Cart.js cargado correctamente (unificado con S)');
