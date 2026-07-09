// ============================================
// MAIN.JS - LÓGICA PRINCIPAL
// ============================================

// ============================================
// ESTADO GLOBAL
// ============================================
const S = {
    pr: [],
    cart: [],
    currentUser: null,
    users: [],
    orders: [],
    config: {
        headerSubtitle: "Salud & Tecnología",
        categoriasTitle: "Explora por Categoría",
        categoriasSubtitle: "Encuentra exactamente lo que necesitas",
        productosTitle: "🌟 Productos Destacados",
        productosSubtitle: "Los más populares entre nuestros clientes",
        ofertasTitle: "🔥 Ofertas Especiales",
        ofertasSubtitle: "Aprovecha estos descuentos exclusivos",
        footerDescription: "Tu tienda confiable para medicamentos y hardware de última generación.",
        carousel: [
            { 
                image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=400&fit=crop", 
                title: "Medicamentos de Calidad", 
                subtitle: "Los mejores precios en productos farmacéuticos" 
            },
            { 
                image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&h=400&fit=crop", 
                title: "Tecnología de Última Generación", 
                subtitle: "Componentes de PC y hardware gaming" 
            },
            { 
                image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop", 
                title: "Ofertas Especiales", 
                subtitle: "Descuentos exclusivos por tiempo limitado" 
            }
        ],
        categorias: [
            { nombre: "Medicamentos", icono: "fa-pills", color: "from-teal-500 to-cyan-600", count: "+200 productos" },
            { nombre: "Tecnología", icono: "fa-laptop", color: "from-blue-500 to-indigo-600", count: "+150 productos" },
            { nombre: "Salud", icono: "fa-heart-pulse", color: "from-green-500 to-emerald-600", count: "+100 productos" },
            { nombre: "Gaming", icono: "fa-gamepad", color: "from-purple-500 to-pink-600", count: "+80 productos" }
        ],
        ofertas: [
            { titulo: "--%", descripcion: "Medicamentos", detalle: "En toda la línea de analgésicos" },
            { titulo: "--%", descripcion: "Hardware PC", detalle: "Componentes seleccionados" },
            { titulo: "ENVÍO", descripcion: "Con domicilio por costo adicional.", detalle: "Segun zona de residencia." }
        ]
    }
};


function renderProducts() {
    const grid = document.getElementById('portada-productos');
    if (!grid) return;
    
    const category = document.getElementById('filter-category')?.value || '';
    const sort = document.getElementById('sort-by')?.value || 'default';
    
    let filtered = [...S.pr];
    if (category) filtered = filtered.filter(p => p.category === category);
    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    if (filtered.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center py-16 text-gray-400"><i class="fas fa-box-open text-5xl mb-4 block opacity-50"></i>No hay productos disponibles.</p>`;
        document.getElementById('product-total-label').textContent = '0 productos';
        return;
    }
    
    grid.innerHTML = filtered.map(p => {
        const isSoldOut = p.available === false || p.stock <= 0;
        const isLowStock = p.stock > 0 && p.stock <= 5;
        const stockClass = isSoldOut ? 'soldout' : (isLowStock ? 'low-stock' : 'in-stock');
        const stockText = isSoldOut ? '❌ Agotado' : `📦 ${p.stock} unidades`;
        
        return `
            <div class="product-card">
                <div class="image-wrap" onclick="openQuickView('${p.id}')">
                    <img src="${p.image || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Error'">
                    ${p.feat ? '<span class="badge badge-featured"><i class="fas fa-star mr-1"></i>Destacado</span>' : ''}
                    ${isSoldOut ? '<span class="badge badge-soldout">❌ Agotado</span>' : `<span class="badge badge-stock">${stockText}</span>`}
                    <span class="badge-category">${p.category === 'medicamento' ? '💊' : p.category === 'tecnologia' ? '💻' : p.category === 'salud' ? '🩺' : '🎮'} ${p.category}</span>
                </div>
                <div class="body">
                    <div class="name" title="${p.name}">${p.name}</div>
                    <div class="desc">${p.desc || ''}</div>
                    <div class="footer">
                        <div class="price-block">
                            <span class="price">$${parseFloat(p.price).toFixed(2)} <small>MXN</small></span>
                            ${!isSoldOut ? `<span class="stock-info"><span class="dot ${stockClass}"></span> ${p.stock} disponibles</span>` : ''}
                        </div>
                        ${S.currentUser ? 
                            (isSoldOut ? 
                                `<button class="add-btn" disabled><i class="fas fa-ban"></i></button>` :
                                `<button class="add-btn" onclick="addToCart('${p.id}')"><i class="fas fa-plus"></i></button>`) :
                            `<button class="add-btn" onclick="openLoginModal(); return false;"><i class="fas fa-lock"></i></button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('product-total-label').textContent = `${filtered.length} productos`;
}


// ============================================
// CARRUSEL
// ============================================
let currentSlide = 0;
let carouselInterval = null;

function renderCarousel() {
    const inner = document.getElementById('carousel-inner');
    if (!inner) return;
    
    if (!S.config.carousel || S.config.carousel.length === 0) {
        S.config.carousel = [
            { image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=400&fit=crop", title: "Medicamentos de Calidad", subtitle: "Los mejores precios" },
            { image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&h=400&fit=crop", title: "Tecnología de Última Generación", subtitle: "Componentes de PC" },
            { image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop", title: "Ofertas Especiales", subtitle: "Descuentos exclusivos" }
        ];
    }
    
    inner.innerHTML = S.config.carousel.map((slide) => `
        <div class="carousel-item">
            <img src="${slide.image || 'https://via.placeholder.com/1200x400?text=Sin+Imagen'}" alt="${slide.title}" onerror="this.src='https://via.placeholder.com/1200x400?text=Error'">
            <div class="carousel-caption">
                <h3>${slide.title}</h3>
                <p>${slide.subtitle}</p>
            </div>
        </div>
    `).join('');
    
    const dotsContainer = document.getElementById('carousel-dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < S.config.carousel.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => { currentSlide = i; updateCarousel(); };
            dotsContainer.appendChild(dot);
        }
    }
    currentSlide = 0;
    updateCarousel();
}

function moveCarousel(direction) {
    if (!S.config.carousel || S.config.carousel.length === 0) return;
    currentSlide = (currentSlide + direction + S.config.carousel.length) % S.config.carousel.length;
    updateCarousel();
}

function updateCarousel() {
    const inner = document.getElementById('carousel-inner');
    if (!inner) return;
    inner.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function initCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => moveCarousel(1), 5000);
}

// ============================================
// CATEGORÍAS Y OFERTAS
// ============================================
function renderCategorias() {
    const grid = document.getElementById('categorias-grid');
    if (!grid) return;
    grid.innerHTML = S.config.categorias.map(cat => `
        <div class="category-card bg-gradient-to-br ${cat.color}" onclick="filtrarPorCategoria('${cat.nombre}')">
            <div class="icon">
                <i class="fas ${cat.icono}"></i>
            </div>
            <div class="name">${cat.nombre}</div>
            <div class="count">${cat.count}</div>
        </div>
    `).join('');
}

function renderOfertas() {
    const grid = document.getElementById('ofertas-grid');
    if (!grid) return;
    grid.innerHTML = S.config.ofertas.map(oferta => `
        <div class="offer-card">
            <div class="title">${oferta.titulo}</div>
            <div class="desc">${oferta.descripcion}</div>
            <div class="detail">${oferta.detalle}</div>
            <button class="btn" onclick="document.getElementById('productos').scrollIntoView({ behavior: 'smooth' })">Ver productos</button>
        </div>
    `).join('');
}

function filtrarPorCategoria(categoria) {
    const select = document.getElementById('filter-category');
    const opciones = {
        'Medicamentos': 'medicamento',
        'Tecnología': 'tecnologia',
        'Salud': 'salud',
        'Gaming': 'gaming'
    };
    if (opciones[categoria]) {
        select.value = opciones[categoria];
        filterProducts();
        document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
    }
}

// ============================================
// TEXTOS
// ============================================
function applyTexts() {
    document.getElementById('header-subtitle').textContent = S.config.headerSubtitle;
    document.getElementById('categorias-title').textContent = S.config.categoriasTitle;
    document.getElementById('categorias-subtitle').textContent = S.config.categoriasSubtitle;
    document.getElementById('productos-title').textContent = S.config.productosTitle;
    document.getElementById('productos-subtitle').textContent = S.config.productosSubtitle;
    document.getElementById('ofertas-title').textContent = S.config.ofertasTitle;
    document.getElementById('ofertas-subtitle').textContent = S.config.ofertasSubtitle;
    document.getElementById('footer-description').textContent = S.config.footerDescription;
}

// ============================================
// NOTIFICACIONES
// ============================================
function showNotif(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const n = document.createElement('div');
    n.className = `toast ${type}`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// ============================================
// INICIALIZACIÓN
// ============================================
async function init() {
    console.log('🚀 Iniciando MediTech...');
    try {
        await loadToken();
        
        const session = localStorage.getItem('session');
        if (session) {
            S.currentUser = JSON.parse(session);
            updateUIForLoggedUser();
        }
        
        await cargarProductos();
        
        // 🔥 Cargar datos adicionales
        if (S.currentUser && S.currentUser.role === 'admin') {
            await renderUsers();
            await renderEstadisticas();
            setTimeout(generarGraficos, 500);
            actualizarDashboard();
        }
        
        renderCarousel();
        renderCategorias();
        renderOfertas();
        applyTexts();
        initCarousel();
        updateCartUI();
        
        console.log('🎉 MediTech iniciado correctamente');
    } catch (error) {
        console.error('❌ Error en init:', error);
        showNotif('⚠️ Error al cargar la página', 'error');
    }
}

// EVENTOS
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('year').textContent = new Date().getFullYear();
    init();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.getElementById('year').textContent = new Date().getFullYear();
    init();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
        closeCart();
        closeQuickView();
        closeAdminPanel();
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.getElementById('search-results').classList.remove('active');
    }
});


// ============================================
// FUNCIONES FALTANTES PARA COMPATIBILIDAD
// ============================================

// ---- PRODUCTOS ----
async function cargarProductos() {
    console.log('📦 Cargando productos desde backend...');
    try {
        const productos = await apiRequest('/productos');
        if (productos && productos.length > 0) {
            S.pr = productos;
            console.log(`✅ ${S.pr.length} productos cargados`);
        } else {
            console.warn('⚠️ No hay productos en el backend');
            S.pr = [];
        }
        renderProducts();
        renderAdminList();
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        S.pr = [];
        renderProducts();
        renderAdminList();
        showNotif('⚠️ Error al cargar productos del servidor', 'error');
    }
}

function filterProducts() {
    renderProducts();
}

function searchProducts(query) {
    const results = document.getElementById('search-results');
    if (!query.trim()) {
        results.classList.remove('active');
        return;
    }
    const filtered = S.pr.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        (p.desc && p.desc.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);
    if (filtered.length === 0) {
        results.innerHTML = '<p class="p-4 text-center text-gray-400">No se encontraron resultados</p>';
    } else {
        results.innerHTML = filtered.map(p => `
            <div class="search-result-item" onclick="openQuickView('${p.id}'); document.getElementById('search-results').classList.remove('active'); document.getElementById('search-input').value='';">
                <img src="${p.image || 'https://via.placeholder.com/50'}" alt="${p.name}">
                <div class="info">
                    <div class="name">${p.name}</div>
                    <div class="price">$${p.price}</div>
                </div>
            </div>
        `).join('');
    }
    results.classList.add('active');
}

// ---- QUICK VIEW ----
function openQuickView(id) {
    const p = S.pr.find(x => x.id === id);
    if (!p) return;
    const isAvailable = p.available !== false && p.stock > 0;
    document.getElementById('quick-view-content').innerHTML = `
        <div class="grid md:grid-cols-2 gap-6 p-6">
            <div><img src="${p.image || 'https://via.placeholder.com/400'}" class="w-full h-96 object-cover rounded-2xl" onerror="this.src='https://via.placeholder.com/400?text=Error'"></div>
            <div>
                <button onclick="closeQuickView()" class="float-right w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i class="fas fa-times"></i></button>
                <span class="inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold mb-3">${p.category}</span>
                <h2 class="text-3xl font-bold text-gray-900 mb-3">${p.name}</h2>
                <p class="text-gray-600 mb-4">${p.desc || ''}</p>
                <div class="flex items-center gap-4 mb-6">
                    <span class="text-4xl font-bold gradient-text">$${p.price}</span>
                    ${!isAvailable ? '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">❌ Agotado</span>' : `<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">✅ En stock (${p.stock})</span>`}
                </div>
                ${S.currentUser && isAvailable ? `<button onclick="addToCart('${p.id}'); closeQuickView();" class="btn-primary w-full">Agregar al Carrito</button>` : ''}
            </div>
        </div>
    `;
    document.getElementById('quick-view').classList.add('active');
}

function closeQuickView() {
    document.getElementById('quick-view').classList.remove('active');
}

// ---- ESTADÍSTICAS ----
function renderEstadisticas() {
    document.getElementById('stat-products').textContent = S.pr.length || 0;
    document.getElementById('stat-users').textContent = S.users ? S.users.length : 0;
    document.getElementById('stat-views').textContent = S.history ? S.history.length : 0;
    document.getElementById('stat-orders').textContent = S.orders ? S.orders.length : 0;
    const revenue = S.orders ? S.orders.reduce((sum, o) => sum + (o.total || 0), 0) : 0;
    document.getElementById('stat-revenue').textContent = `$${revenue.toFixed(2)}`;
    document.getElementById('stat-today').textContent = 0;
}

function generarGraficos() {
    // Placeholder para gráficos
}

// ---- DASHBOARD ----
function actualizarDashboard() {
    document.querySelectorAll('#admin-dashboard .value').forEach(el => {
        if (el.id === 'dashboard-ventas-hoy') el.textContent = '$0';
        else if (el.id === 'dashboard-pedidos-pendientes') el.textContent = '0';
        else if (el.id === 'dashboard-stock-critico') {
            const critico = S.pr.filter(p => p.stock <= 5 && p.stock > 0).length;
            el.textContent = critico;
        } else if (el.id === 'dashboard-clientes-nuevos') el.textContent = '0';
    });
}

function verificarNotificaciones() {
    const critico = S.pr.filter(p => p.stock <= 5 && p.stock > 0);
    const textEl = document.getElementById('notif-text');
    if (textEl) {
        if (critico.length > 0) {
            textEl.textContent = `⚠️ ${critico.length} productos con stock crítico`;
            textEl.className = 'text-xs text-yellow-300';
        } else {
            textEl.textContent = '✅ Todo en orden';
            textEl.className = 'text-xs text-green-300';
        }
    }
}

function registrarAccesoAdmin() {
    // Placeholder
}

// ---- USUARIOS ----
function buscarUsuarios(query) {
    // Placeholder
}

function exportarClientesCSV() {
    // Placeholder
}

function verPerfilCliente(username) {
    // Placeholder
}

function cerrarPerfilCliente() {
    // Placeholder
}

// ---- LOGS ----
function mostrarLogs() {
    const container = document.getElementById('logs-container');
    if (container) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">No hay registros de actividad</p>';
    }
}

function limpiarLogs() {
    showNotif('🗑️ Logs limpiados', 'success');
}

// ---- ANIA ----
function aniaEnviarAWhatsApp() {
    const mensaje = `📊 *REPORTE DE MediTech* 🤖\n\n*Productos:* ${S.pr.length} productos\n*Pedidos:* ${S.orders ? S.orders.length : 0}\n\n_Enviado desde MediTech_ ☕️`;
    window.open(`https://wa.me/535XXXXXXXX?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function aniaEnviarATelegram() {
    const mensaje = `📊 *REPORTE DE MediTech* 🤖\n\n*Productos:* ${S.pr.length} productos\n*Pedidos:* ${S.orders ? S.orders.length : 0}\n\n_Enviado desde MediTech_ ☕️`;
    window.open(`https://t.me/AniaAsistenteBot?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function renderAniaChat() {
    const container = document.getElementById('ania-chat-container');
    if (!container) return;
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                <h4 class="font-bold flex items-center gap-2"><span>🤖</span> Ania - Asistente IA</h4>
            </div>
            <div id="ania-chat-messages" class="h-60 p-4 overflow-y-auto bg-gray-50 space-y-3">
                <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] border border-gray-100">
                    <p class="text-sm text-gray-700">¡Hola! Soy Ania ☕️<br>¿En qué puedo ayudarte hoy?</p>
                </div>
            </div>
            <div class="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input type="text" id="ania-chat-input" placeholder="Escribe tu mensaje para Ania..." class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full text-sm outline-none focus:border-purple-500">
                <button onclick="sendAniaMessage()" class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition">Enviar</button>
            </div>
        </div>
    `;
    document.getElementById('ania-chat-input')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendAniaMessage();
    });
}

async function sendAniaMessage() {
    const input = document.getElementById('ania-chat-input');
    const messages = document.getElementById('ania-chat-messages');
    const message = input.value.trim();
    if (!message) return;
    messages.innerHTML += `<div class="flex justify-end"><div class="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]"><p class="text-sm">${message}</p></div></div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'system', content: 'Eres Ania, asistente de MediTech. Alegre, entusiasta, hablas español con emojis.' }, { role: 'user', content: message }],
                model: 'openai'
            })
        });
        let respuesta = 'Lo siento, no pude procesar tu pregunta.';
        if (response.ok) {
            respuesta = await response.text();
            respuesta = respuesta.replace(/```[\s\S]*?```/g, '').trim();
        }
        messages.innerHTML += `<div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] border border-gray-100"><p class="text-sm text-gray-700">${respuesta}</p></div>`;
    } catch (error) {
        messages.innerHTML += `<div class="bg-red-50 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] border border-red-200"><p class="text-sm text-red-700">❌ Error de conexión</p></div>`;
    }
    messages.scrollTop = messages.scrollHeight;
}

function exportarReportePDF(tipo) {
    showNotif('📄 Generando PDF... (funcionalidad en desarrollo)', 'info');
}

// ============================================
// ESTADÍSTICAS
// ============================================
function renderEstadisticas() {
    document.getElementById('stat-products').textContent = S.pr.length || 0;
    document.getElementById('stat-users').textContent = S.users ? S.users.length : 0;
    document.getElementById('stat-views').textContent = S.history ? S.history.length : 0;
    document.getElementById('stat-orders').textContent = S.orders ? S.orders.length : 0;
    
    const revenue = S.orders ? S.orders.reduce((sum, o) => sum + (o.total || 0), 0) : 0;
    document.getElementById('stat-revenue').textContent = `$${revenue.toFixed(2)}`;
    
    const today = new Date().toDateString();
    const todayViews = S.history ? S.history.filter(h => new Date(h.fecha).toDateString() === today).length : 0;
    document.getElementById('stat-today').textContent = todayViews;
}

function generarGraficos() {
    try {
        // Gráfico de ventas por categoría
        const ctx1 = document.getElementById('ventas-categoria');
        if (ctx1 && typeof Chart !== 'undefined') {
            const categorias = ['medicamento', 'tecnologia', 'salud', 'gaming'];
            const nombres = ['💊 Medicamentos', '💻 Tecnología', '🩺 Salud', '🎮 Gaming'];
            const colores = ['#0d9488', '#3b82f6', '#10b981', '#8b5cf6'];
            
            const ventas = categorias.map(cat => 
                S.orders ? S.orders.reduce((sum, o) => {
                    const items = o.items ? o.items.filter(i => {
                        const producto = S.pr.find(p => p.name === i.nombre);
                        return producto && producto.category === cat;
                    }) : [];
                    return sum + items.reduce((s, i) => s + (i.subtotal || 0), 0);
                }, 0) : 0
            );
            
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: nombres,
                    datasets: [{
                        data: ventas,
                        backgroundColor: colores,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
        
        // Gráfico de pedidos por día
        const ctx2 = document.getElementById('pedidos-dia');
        if (ctx2 && typeof Chart !== 'undefined') {
            const dias = [];
            const counts = [];
            const hoy = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date(hoy);
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                dias.push(fecha.toLocaleDateString('es-ES', { weekday: 'short' }));
                
                const count = S.orders ? S.orders.filter(o => o.fecha && o.fecha.startsWith(fechaStr)).length : 0;
                counts.push(count);
            }
            
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: dias,
                    datasets: [{
                        label: 'Pedidos',
                        data: counts,
                        backgroundColor: '#0d9488',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
        }
    } catch (e) {
        console.warn('Error generando gráficos:', e.message);
    }
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================
// Estas funciones se exponen para ser usadas desde HTML (onclick)
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.updateCartQuantity = updateCartQuantity;
window.enviarPedidoPorCorreo = enviarPedidoPorCorreo;
window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.moveCarousel = moveCarousel;
window.filterProducts = filterProducts;
window.searchProducts = searchProducts;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.showAdminTab = showAdminTab;
window.editProduct = editProduct;
window.resetProductForm = resetProductForm;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.toggleProductAvailability = toggleProductAvailability;
window.editSection = editSection;
window.editCarousel = editCarousel;
window.addCarouselSlide = addCarouselSlide;
window.editCarouselSlide = editCarouselSlide;
window.deleteCarouselSlide = deleteCarouselSlide;
window.saveCarousel = saveCarousel;
window.exportAllData = exportAllData;
window.importBackup = importBackup;
window.updateToken = updateToken;
window.testToken = testToken;
window.toggleTokenVisibility = toggleTokenVisibility;
window.loadConfigInfo = loadConfigInfo;
window.renderUsers = renderUsers;
window.renderPedidos = renderPedidos;
window.renderHistorial = renderHistorial;
window.renderEstadisticas = renderEstadisticas;
window.generarGraficos = generarGraficos;
window.cargarUsuarios = cargarUsuarios;
window.cargarPedidosAdmin = cargarPedidosAdmin;
window.renderEstadisticas = renderEstadisticas;
window.renderHistorial = renderHistorial;
