// ============================================
// CART.JS - CARRITO DE COMPRAS
// ============================================

function addToCart(productId) {
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión', 'warning'); 
        openLoginModal(); 
        return; 
    }
    const producto = S.pr.find(p => p.id === productId);
    if (!producto) { 
        showNotif('❌ Producto no encontrado', 'error'); 
        return; 
    }
    if (producto.available === false || producto.stock <= 0) { 
        showNotif('❌ Producto agotado', 'error'); 
        return; 
    }
    const item = S.cart.find(i => i.producto.id === productId);
    if (item) {
        if (item.cantidad >= producto.stock) { 
            showNotif(`⚠️ Solo ${producto.stock} disponibles`, 'warning'); 
            return; 
        }
        item.cantidad++;
    } else {
        S.cart.push({ producto, cantidad: 1 });
    }
    updateCartUI();
    showNotif(`✅ ${producto.name} agregado`, 'success');
}

function removeFromCart(productId) {
    S.cart = S.cart.filter(i => i.producto.id !== productId);
    updateCartUI();
    renderCartItems();
}

function updateCartUI() {
    const count = S.cart.reduce((sum, i) => sum + i.cantidad, 0);
    document.getElementById('cart-count').textContent = count;
}

function openCart() {
    if (!S.currentUser) { 
        showNotif('⚠️ Inicia sesión', 'warning'); 
        openLoginModal(); 
        return; 
    }
    renderCartItems();
    document.getElementById('cart-modal').classList.add('active');
}

function closeCart() {
    document.getElementById('cart-modal').classList.remove('active');
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    if (S.cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4 block"></i>
                <p class="text-gray-400 text-lg">Tu carrito está vacío</p>
                <p class="text-sm text-gray-400">¡Explora nuestros productos y comienza a comprar!</p>
            </div>
        `;
        document.getElementById('cart-total').textContent = '$0.00';
        return;
    }
    let total = 0;
    container.innerHTML = S.cart.map(item => {
        const subtotal = item.producto.price * item.cantidad;
        total += subtotal;
        return `
            <div class="cart-item">
                <img src="${item.producto.image || 'https://via.placeholder.com/80'}" alt="${item.producto.name}">
                <div class="info">
                    <div class="name">${item.producto.name}</div>
                    <div class="price">$${item.producto.price} x ${item.cantidad}</div>
                    <div style="font-size:0.75rem;color:#9ca3af;">📦 Stock: ${item.producto.stock}</div>
                </div>
                <div class="actions">
                    <button onclick="updateCartQuantity('${item.producto.id}', -1)" ${item.cantidad <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty">${item.cantidad}</span>
                    <button onclick="updateCartQuantity('${item.producto.id}', 1)" ${item.cantidad >= item.producto.stock ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="subtotal">$${subtotal.toFixed(2)}</div>
                <button onclick="removeFromCart('${item.producto.id}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.9rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

function updateCartQuantity(productId, change) {
    const item = S.cart.find(i => i.producto.id === productId);
    if (!item) return;
    const nueva = item.cantidad + change;
    if (nueva < 1) { removeFromCart(productId); return; }
    if (nueva > item.producto.stock) { 
        showNotif(`⚠️ Solo ${item.producto.stock} disponibles`, 'warning'); 
        return; 
    }
    item.cantidad = nueva;
    updateCartUI();
    renderCartItems();
}

async function enviarPedidoPorCorreo() {
    if (S.cart.length === 0) { 
        showNotif('⚠️ Carrito vacío', 'warning'); 
        return; 
    }
    const items = S.cart.map(item => ({ id: item.producto.id, cantidad: item.cantidad }));
    try {
        showNotif('📤 Procesando pedido...', 'info');
        const resultado = await apiRequest('/pedidos', { 
            method: 'POST', 
            body: JSON.stringify({ items }) 
        });
        S.cart = [];
        updateCartUI();
        closeCart();
        renderProducts();
        showNotif(`✅ Pedido ${resultado.pedido.id} creado`, 'success');
    } catch (error) {
        showNotif(`❌ ${error.message}`, 'error');
    }
}