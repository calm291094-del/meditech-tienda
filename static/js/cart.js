// ============================================================
// CART.JS - CARRITO DE COMPRAS (VERSIÓN UNIFICADA)
// ============================================================

// ============================================================
// ESTADO GLOBAL DEL CARRITO
// ============================================================
let carrito = [];
let carritoTotal = 0;

// ============================================================
// FUNCIONES PRINCIPALES
// ============================================================

// Cargar carrito desde localStorage
function cargarCarrito() {
    try {
        const saved = localStorage.getItem('meditech_carrito');
        if (saved) {
            carrito = JSON.parse(saved);
            actualizarContadorCarrito();
        }
    } catch (e) {
        console.error('Error cargando carrito:', e);
        carrito = [];
    }
}

// Guardar carrito en localStorage
function guardarCarrito() {
    try {
        localStorage.setItem('meditech_carrito', JSON.stringify(carrito));
    } catch (e) {
        console.error('Error guardando carrito:', e);
    }
}

// ============================================================
// AGREGAR AL CARRITO (FUNCIÓN PRINCIPAL)
// ============================================================

function agregarAlCarrito(productoId) {
    console.log('🛒 Intentando agregar producto:', productoId);
    
    if (!productoId) {
        console.error('❌ ID de producto no válido');
        mostrarNotificacion('❌ Error: ID de producto no válido');
        return;
    }

    // Intentar obtener el producto desde la lista global
    let producto = null;
    
    // Buscar en window.productos (establecido por main.js)
    if (window.productos && Array.isArray(window.productos)) {
        producto = window.productos.find(p => p.id === productoId || p.id == productoId);
    }
    
    // Si no está en window.productos, buscar en window.productosData (alternativa)
    if (!producto && window.productosData && Array.isArray(window.productosData)) {
        producto = window.productosData.find(p => p.id === productoId || p.id == productoId);
    }
    
    // Si no se encuentra, intentar cargar desde la API
    if (!producto) {
        console.log('📡 Producto no encontrado en caché, buscando en API...');
        fetch(`/api/productos/${productoId}`)
            .then(res => {
                if (!res.ok) throw new Error('Producto no encontrado');
                return res.json();
            })
            .then(p => {
                if (p && p.id) {
                    agregarProductoAlCarrito(p);
                } else {
                    mostrarNotificacion('❌ Producto no encontrado');
                }
            })
            .catch(err => {
                console.error('❌ Error al buscar producto:', err);
                mostrarNotificacion('❌ Error al agregar producto');
            });
        return;
    }
    
    agregarProductoAlCarrito(producto);
}

function agregarProductoAlCarrito(producto) {
    // Verificar disponibilidad
    if (producto.available === false) {
        mostrarNotificacion(`❌ ${producto.name} no está disponible`);
        return;
    }
    
    if (producto.stock <= 0) {
        mostrarNotificacion(`❌ ${producto.name} está agotado`);
        return;
    }
    
    // Buscar si ya está en el carrito
    const existente = carrito.find(item => item.id === producto.id);
    
    if (existente) {
        // Verificar que no exceda el stock
        if (existente.cantidad >= producto.stock) {
            mostrarNotificacion(`⚠️ Solo ${producto.stock} unidades disponibles de ${producto.name}`);
            return;
        }
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            name: producto.name,
            price: producto.price,
            image: producto.image || 'https://via.placeholder.com/100',
            cantidad: 1,
            stock: producto.stock
        });
    }
    
    guardarCarrito();
    actualizarContadorCarrito();
    mostrarNotificacion(`✅ ${producto.name} agregado al carrito`);
}

// ============================================================
// ACTUALIZAR UI DEL CARRITO
// ============================================================

function actualizarContadorCarrito() {
    const count = carrito.reduce((sum, item) => sum + item.cantidad, 0);
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

function mostrarNotificacion(mensaje) {
    // Eliminar notificaciones antiguas
    document.querySelectorAll('.custom-notification').forEach(el => el.remove());
    
    const notif = document.createElement('div');
    notif.className = 'custom-notification fixed bottom-24 right-6 bg-teal-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transition-all duration-500 transform translate-y-0 max-w-sm';
    notif.innerHTML = mensaje;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(20px)';
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}

// ============================================================
// ABRIR/CERRAR CARRITO
// ============================================================

function openCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('❌ Modal del carrito no encontrado');
        return;
    }
    
    // Si el carrito está vacío y no hay usuario, pedir login
    if (carrito.length === 0) {
        // Verificar si hay usuario (opcional)
        const session = localStorage.getItem('session');
        if (!session) {
            mostrarNotificacion('⚠️ Inicia sesión para ver tu carrito');
            // Abrir modal de login si existe
            if (typeof openLoginModal === 'function') {
                openLoginModal();
            }
            return;
        }
    }
    
    renderCartItems();
    modal.classList.add('active');
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================================
// RENDERIZAR ITEMS DEL CARRITO
// ============================================================

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (!container) return;
    
    if (carrito.length === 0) {
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
    
    carrito.forEach((item, index) => {
        const subtotal = item.price * item.cantidad;
        total += subtotal;
        
        html += `
            <div class="flex items-center gap-4 py-4 border-b border-gray-200">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg" onerror="this.src='https://via.placeholder.com/100'">
                <div class="flex-1">
                    <h4 class="font-semibold">${item.name}</h4>
                    <p class="text-sm text-gray-500">$${item.price.toFixed(2)} c/u</p>
                    ${item.stock !== undefined ? `<p class="text-xs text-gray-400">📦 Stock: ${item.stock}</p>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="cambiarCantidad(${index}, -1)" 
                            class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            ${item.cantidad <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus text-sm"></i>
                    </button>
                    <span class="font-bold w-8 text-center">${item.cantidad}</span>
                    <button onclick="cambiarCantidad(${index}, 1)" 
                            class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            ${item.stock !== undefined && item.cantidad >= item.stock ? 'disabled' : ''}>
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                </div>
                <div class="font-semibold text-teal-600 w-20 text-right">
                    $${subtotal.toFixed(2)}
                </div>
                <button onclick="eliminarDelCarrito(${index})" 
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
    carritoTotal = total;
}

// ============================================================
// MODIFICAR CANTIDAD
// ============================================================

function cambiarCantidad(index, delta) {
    if (!carrito[index]) return;
    
    const item = carrito[index];
    const nuevaCantidad = item.cantidad + delta;
    
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
        return;
    }
    
    // Verificar stock disponible
    if (item.stock !== undefined && nuevaCantidad > item.stock) {
        mostrarNotificacion(`⚠️ Solo ${item.stock} unidades disponibles de ${item.name}`);
        return;
    }
    
    item.cantidad = nuevaCantidad;
    guardarCarrito();
    actualizarContadorCarrito();
    renderCartItems(); // Refrescar vista
}

function eliminarDelCarrito(index) {
    const item = carrito[index];
    if (item) {
        mostrarNotificacion(`🗑️ ${item.name} eliminado del carrito`);
    }
    carrito.splice(index, 1);
    guardarCarrito();
    actualizarContadorCarrito();
    renderCartItems(); // Refrescar vista
}

// ============================================================
// ENVIAR PEDIDO POR CORREO
// ============================================================

async function enviarPedidoPorCorreo() {
    if (carrito.length === 0) {
        mostrarNotificacion('⚠️ El carrito está vacío');
        return;
    }
    
    // Obtener usuario actual
    let user = null;
    try {
        const session = localStorage.getItem('session');
        if (session) {
            user = JSON.parse(session);
        }
    } catch (e) {
        console.error('Error al leer sesión:', e);
    }
    
    const userEmail = user?.email || 'cliente@meditech.com';
    const userName = user?.name || 'Cliente';
    
    // Construir mensaje
    let mensaje = `📋 *NUEVO PEDIDO - MediTech*\n\n`;
    mensaje += `👤 *Cliente:* ${userName}\n`;
    mensaje += `📧 *Email:* ${userEmail}\n`;
    mensaje += `📅 *Fecha:* ${new Date().toLocaleString()}\n\n`;
    mensaje += `📦 *Productos:*\n`;
    
    carrito.forEach(item => {
        mensaje += `  • ${item.name} x${item.cantidad} = $${(item.price * item.cantidad).toFixed(2)}\n`;
    });
    
    mensaje += `\n💰 *Total:* $${carritoTotal.toFixed(2)}`;
    
    try {
        mostrarNotificacion('📤 Enviando pedido...');
        
        const response = await fetch('/api/enviar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                nombre: userName,
                pedido: carrito,
                total: carritoTotal
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al enviar el pedido');
        }
        
        const data = await response.json();
        mostrarNotificacion('✅ Pedido enviado por correo. Revisa tu bandeja de entrada.');
        
        // Vaciar carrito
        carrito = [];
        guardarCarrito();
        actualizarContadorCarrito();
        closeCart();
        renderCartItems();
        
    } catch (error) {
        console.error('❌ Error enviando pedido:', error);
        mostrarNotificacion('❌ Error al enviar el pedido. Intenta nuevamente.');
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

// Cargar carrito al inicio
cargarCarrito();

// ============================================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================================

window.agregarAlCarrito = agregarAlCarrito;
window.openCart = openCart;
window.closeCart = closeCart;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.enviarPedidoPorCorreo = enviarPedidoPorCorreo;
window.cargarCarrito = cargarCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;

console.log('✅ Cart.js cargado correctamente');
