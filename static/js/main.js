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