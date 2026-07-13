// ============================================================
// CART.JS - CARRITO DE COMPRAS (VERSIÓN CORREGIDA)
// ============================================================

// ✅ Usar el S global, no crear uno nuevo
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
            
            // Convertir precios a números
            S.cart = S.cart.map(item => {
                if (item.producto && item.producto.price) {
                    item.producto.price = parseFloat(item.producto.price) || 0;
                }
                return item;
            });
            
            console.log('✅ Carrito cargado desde localStorage:', S.cart.length, 'items');
        } else {
            S.cart = [];
            console.log('📦 No hay carrito guardado, iniciando vacío');
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
    console.log('📦 S.pr:', S.pr);
    
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión para agregar productos', 'warning'); 
        if (typeof openLoginModal === 'function') openLoginModal();
        return; 
    }
    
    // ✅ Asegurar que S.pr existe y es un array
    if (!S.pr || !Array.isArray(S.pr) || S.pr.length === 0) {
        console.error('❌ S.pr está vacío o no es un array:', S.pr);
        showNotif('❌ No hay productos cargados. Recarga la página.', 'error');
        return;
    }
    
    const producto = S.pr.find(p => p.id === productId || p.id == productId);
    if (!producto) { 
        console.error('❌ Producto no encontrado:', productId);
        showNotif('❌ Producto no encontrado', 'error'); 
        return; 
    }
    
    if (producto.price) {
        producto.price = parseFloat(producto.price) || 0;
    }
    
    if (producto.available === false || producto.stock <= 0) { 
        showNotif(`❌ ${producto.name} está agotado`, 'error'); 
        return; 
    }
    
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
    
    if (item.producto && item.producto.price) {
        item.producto.price = parseFloat(item.producto.price) || 0;
    }
    
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
    
    // ✅ No filtrar ni modificar S.cart aquí
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
        return;
    }
    
    let total = 0;
    let html = '';
    
    S.cart.forEach((item) => {
        const price = parseFloat(item.producto.price) || 0;
        const subtotal = price * item.cantidad;
        total += subtotal;
        
        html += `
            <div class="flex items-center gap-4 py-4 border-b border-gray-200">
                <img src="${item.producto.image || 'https://via.placeholder.com/100'}" alt="${item.producto.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-semibold">${item.producto.name}</h4>
                    <p class="text-sm text-gray-500">$${price.toFixed(2)} c/u</p>
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
    
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión para ver tu carrito', 'warning'); 
        if (typeof openLoginModal === 'function') openLoginModal();
        return; 
    }
    
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('❌ Modal del carrito no encontrado');
        showNotif('❌ Error al abrir el carrito', 'error');
        return;
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
// FUNCIÓN PARA ENVIAR PEDIDO POR CORREO (EMAILJS)
// ============================================================
async function enviarPedidoPorCorreo() {
    console.log('📤 enviarPedidoPorCorreo llamada (EmailJS)');
    
    if (!S.cart || S.cart.length === 0) {
        showNotif('⚠️ El carrito está vacío', 'warning');
        return;
    }

    const user = S.currentUser || JSON.parse(localStorage.getItem('session') || '{}');
    const userEmail = user?.email || 'cliente@meditech.com';
    const userName = user?.name || 'Cliente';

    let total = 0;
    let subtotal = 0;
    const pedidoData = S.cart.map(item => {
        const producto = item.producto || {};
        const precio = parseFloat(producto.price) || 0;
        const cantidad = item.cantidad || 1;
        const itemSubtotal = precio * cantidad;
        subtotal += itemSubtotal;
        total += itemSubtotal;
        return {
            nombre: producto.name || 'Producto',
            cantidad: cantidad,
            precio: precio.toFixed(2),
            subtotal: itemSubtotal.toFixed(2)
        };
    });

    // ✅ Configuración de EmailJS
    const EMAILJS_PUBLIC_KEY = 'TU_PUBLIC_KEY'; // Reemplaza con tu clave
    const EMAILJS_SERVICE_ID = 'TU_SERVICE_ID'; // Reemplaza con tu Service ID
    const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID'; // Reemplaza con tu Template ID

    try {
        emailjs.init(EMAILJS_PUBLIC_KEY);

        const payload = {
            // ✅ Variables que espera la plantilla
            nombre: userName,
            email: userEmail,
            order_id: 'PED-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            fecha: new Date().toLocaleString(),
            items: pedidoData,
            subtotal: subtotal.toFixed(2),
            shipping: 'Gratis',
            total: total.toFixed(2),
            notes: 'Gracias por tu compra. Te contactaremos pronto.'
        };

        console.log('📤 Enviando pedido con EmailJS:', payload);

        showNotif('📤 Enviando pedido...', 'info');

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            payload
        );

        console.log('✅ EmailJS respuesta:', response);
        showNotif('✅ Pedido enviado correctamente', 'success');
        
        S.cart = [];
        guardarCarrito();
        actualizarContadorCarrito();
        closeCart();
        renderCartItems();

    } catch (error) {
        console.error('❌ Error con EmailJS:', error);
        showNotif(`❌ Error al enviar: ${error.text || error.message}`, 'error');
    }
}


// ============================================================
// NOTIFICACIONES
// ============================================================
function showNotif(msg, type = 'info') {
    // Eliminar notificaciones existentes
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const n = document.createElement('div');
    n.className = `toast ${type}`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
cargarCarrito();

// ============================================================
// ✅ EXPONER FUNCIONES GLOBALMENTE (DESPUÉS DE DEFINIRLAS)
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

console.log('✅ Cart.js cargado correctamente');
console.log('🔧 enviarPedidoPorCorreo disponible:', typeof window.enviarPedidoPorCorreo);
