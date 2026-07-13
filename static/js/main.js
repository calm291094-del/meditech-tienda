// ============================================
// MAIN.JS - LÓGICA PRINCIPAL (CORREGIDA)
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
    history: [],
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
            { image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=400&fit=crop", title: "Medicamentos de Calidad", subtitle: "Los mejores precios en productos farmacéuticos" },
            { image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&h=400&fit=crop", title: "Tecnología de Última Generación", subtitle: "Componentes de PC y hardware gaming" },
            { image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop", title: "Ofertas Especiales", subtitle: "Descuentos exclusivos por tiempo limitado" }
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
// FUNCIONES SEGURAS PARA ELEMENTOS
// ============================================
function safeElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`⚠️ Elemento "${id}" no encontrado en el DOM`);
        return null;
    }
    return el;
}

// ============================================
// CARGAR PRODUCTOS
// ============================================
async function cargarProductos() {
    console.log('📦 Cargando productos desde backend...');
    try {
        const productos = await apiRequest('/productos');
        console.log('📦 Respuesta del backend:', productos);
        
        if (productos && productos.length > 0) {
            S.pr = productos;
            console.log(`✅ ${S.pr.length} productos cargados`);
            // Guardar en localStorage como backup
            localStorage.setItem('productos_backup', JSON.stringify(S.pr));
        } else {
            console.warn('⚠️ No hay productos en el backend');
            // Intentar cargar desde backup
            const backup = localStorage.getItem('productos_backup');
            if (backup) {
                try {
                    S.pr = JSON.parse(backup);
                    console.log(`✅ ${S.pr.length} productos cargados desde backup`);
                } catch (e) {
                    S.pr = getProductosPorDefecto();
                }
            } else {
                S.pr = getProductosPorDefecto();
            }
        }
        renderProducts();
        if (document.getElementById('admin-list')) {
            renderAdminList();
        }
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        // Fallback: usar backup o productos por defecto
        const backup = localStorage.getItem('productos_backup');
        if (backup) {
            try {
                S.pr = JSON.parse(backup);
                console.log(`✅ ${S.pr.length} productos cargados desde backup (fallback)`);
            } catch (e) {
                S.pr = getProductosPorDefecto();
            }
        } else {
            S.pr = getProductosPorDefecto();
        }
        renderProducts();
        if (document.getElementById('admin-list')) {
            renderAdminList();
        }
        showNotif('⚠️ Usando productos locales (fallback)', 'warning');
    }
}


function renderProducts() {
    const grid = safeElement('portada-productos');
    if (!grid) return;
    
    const category = safeElement('filter-category');
    const sort = safeElement('sort-by');
    const label = safeElement('product-total-label');
    
    const catValue = category ? category.value : '';
    const sortValue = sort ? sort.value : 'default';
    
    let filtered = [...S.pr];
    if (catValue) filtered = filtered.filter(p => p.category === catValue);
    if (sortValue === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortValue === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortValue === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    if (filtered.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center py-16 text-gray-400"><i class="fas fa-box-open text-5xl mb-4 block opacity-50"></i>No hay productos disponibles.</p>`;
        if (label) label.textContent = '0 productos';
        return;
    }
    
    const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23f3f4f6"/%3E%3Ctext x="150" y="105" font-family="Arial" font-size="16" fill="%239ca3af" text-anchor="middle"%3ESin imagen%3C/text%3E%3C/svg%3E';
    
    grid.innerHTML = filtered.map(p => {
        const isSoldOut = p.available === false || p.stock <= 0;
        const isLowStock = p.stock > 0 && p.stock <= 5;
        const stockClass = isSoldOut ? 'soldout' : (isLowStock ? 'low-stock' : 'in-stock');
        const stockText = isSoldOut ? '❌ Agotado' : `📦 ${p.stock} unidades`;
        const imgSrc = p.image && p.image.startsWith('http') ? p.image : fallbackImage;
        
        return `
            <div class="product-card" style="background:white;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 4px 20px rgba(0,0,0,0.06);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);">
                <div class="image-wrap" style="position:relative;height:200px;overflow:hidden;background:#f8fafc;cursor:pointer;" onclick="openQuickView('${p.id}')">
                    <img src="${imgSrc}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;" onerror="this.src='${fallbackImage}'">
                    ${p.feat ? `<span style="position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;padding:3px 12px;border-radius:9999px;font-size:0.5rem;font-weight:700;text-transform:uppercase;z-index:2;"><i class="fas fa-star mr-1"></i>Destacado</span>` : ''}
                    ${isSoldOut ? `<span style="position:absolute;top:10px;left:10px;background:rgba(220,38,38,0.9);color:white;padding:3px 12px;border-radius:9999px;font-size:0.5rem;font-weight:700;text-transform:uppercase;z-index:2;">❌ Agotado</span>` : `<span style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:3px 12px;border-radius:9999px;font-size:0.5rem;font-weight:700;text-transform:uppercase;z-index:2;">${stockText}</span>`}
                    <span style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);color:white;padding:2px 12px;border-radius:9999px;font-size:0.5rem;font-weight:600;z-index:2;">
                        ${p.category === 'medicamento' ? '💊' : p.category === 'tecnologia' ? '💻' : p.category === 'salud' ? '🩺' : '🎮'} ${p.category}
                    </span>
                </div>
                <div style="padding:14px 16px 16px;">
                    <div style="font-weight:700;font-size:0.95rem;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.name}">${p.name}</div>
                    <div style="font-size:0.75rem;color:#475569;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:34px;line-height:1.5;margin-bottom:10px;">${p.desc || ''}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #f1f5f9;">
                        <div>
                            <span style="font-size:1.2rem;font-weight:700;color:#0d9488;">$${parseFloat(p.price).toFixed(2)} <small style="font-size:0.55rem;font-weight:400;color:#94a3b8;">MN</small></span>
                            ${!isSoldOut ? `<div style="display:flex;align-items:center;gap:4px;font-size:0.6rem;color:#94a3b8;margin-top:2px;"><span style="width:6px;height:6px;border-radius:50%;display:inline-block;background:${stockClass === 'in-stock' ? '#10b981' : '#f59e0b'};${stockClass === 'low-stock' ? 'animation:pulse 1.5s infinite;' : ''}"></span> ${p.stock} disponibles</div>` : ''}
                        </div>
                        ${S.currentUser ? 
                            (isSoldOut ? 
                                `<button disabled style="width:38px;height:38px;border-radius:50%;background:#94a3b8;color:white;border:none;cursor:not-allowed;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;opacity:0.4;"><i class="fas fa-ban"></i></button>` :
                                `<button onclick="addToCart('${p.id}')" style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#0d9488,#06b6d4);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;box-shadow:0 4px 12px rgba(13,148,136,0.25);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);"><i class="fas fa-plus"></i></button>`) :
                            `<a href="#" onclick="if(typeof openLoginModal === 'function') openLoginModal(); return false;" style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#0d9488,#06b6d4);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;box-shadow:0 4px 12px rgba(13,148,136,0.25);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);" title="Inicia sesión"><i class="fas fa-lock"></i></a>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
    if (label) label.textContent = `${filtered.length} productos`;
}

function filterProducts() {
    renderProducts();
}

function searchProducts(query) {
    const results = safeElement('search-results');
    if (!results) return;
    
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

// ============================================
// CARRUSEL
// ============================================
let currentSlide = 0;
let carouselInterval = null;

function renderCarousel() {
    const inner = safeElement('carousel-inner');
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
    
    const dotsContainer = safeElement('carousel-dots');
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
    const inner = safeElement('carousel-inner');
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
    const grid = safeElement('categorias-grid');
    if (!grid) return;
    grid.innerHTML = S.config.categorias.map(cat => `
        <div class="category-card bg-gradient-to-br ${cat.color}" onclick="filtrarPorCategoria('${cat.nombre}')">
            <div class="icon"><i class="fas ${cat.icono}"></i></div>
            <div class="name">${cat.nombre}</div>
            <div class="count">${cat.count}</div>
        </div>
    `).join('');
}

function renderOfertas() {
    const grid = safeElement('ofertas-grid');
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
    const select = safeElement('filter-category');
    if (!select) return;
    const opciones = {
        'Medicamentos': 'medicamento',
        'Tecnología': 'tecnologia',
        'Salud': 'salud',
        'Gaming': 'gaming'
    };
    if (opciones[categoria]) {
        select.value = opciones[categoria];
        filterProducts();
        const productosSection = safeElement('productos');
        if (productosSection) productosSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ============================================
// TEXTOS
// ============================================
function applyTexts() {
    const elements = {
        header: safeElement('header-subtitle'),
        categoriasTitle: safeElement('categorias-title'),
        categoriasSubtitle: safeElement('categorias-subtitle'),
        productosTitle: safeElement('productos-title'),
        productosSubtitle: safeElement('productos-subtitle'),
        ofertasTitle: safeElement('ofertas-title'),
        ofertasSubtitle: safeElement('ofertas-subtitle'),
        footer: safeElement('footer-description')
    };
    if (elements.header) elements.header.textContent = S.config.headerSubtitle;
    if (elements.categoriasTitle) elements.categoriasTitle.textContent = S.config.categoriasTitle;
    if (elements.categoriasSubtitle) elements.categoriasSubtitle.textContent = S.config.categoriasSubtitle;
    if (elements.productosTitle) elements.productosTitle.textContent = S.config.productosTitle;
    if (elements.productosSubtitle) elements.productosSubtitle.textContent = S.config.productosSubtitle;
    if (elements.ofertasTitle) elements.ofertasTitle.textContent = S.config.ofertasTitle;
    if (elements.ofertasSubtitle) elements.ofertasSubtitle.textContent = S.config.ofertasSubtitle;
    if (elements.footer) elements.footer.textContent = S.config.footerDescription;
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
// QUICK VIEW
// ============================================
function openQuickView(id) {
    const p = S.pr.find(x => x.id === id);
    if (!p) return;
    const isAvailable = p.available !== false && p.stock > 0;
    const content = safeElement('quick-view-content');
    if (!content) return;
    
    // 🔧 SVG de respaldo para imágenes rotas
    const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="200" y="205" font-family="Arial" font-size="20" fill="%239ca3af" text-anchor="middle"%3ESin imagen%3C/text%3E%3C/svg%3E';
    const imgSrc = p.image && p.image.startsWith('http') ? p.image : fallbackImage;
    
    content.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6 p-6">
            <div><img src="${imgSrc}" class="w-full h-96 object-cover rounded-2xl" onerror="this.src='${fallbackImage}'"></div>
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
    const overlay = safeElement('quick-view');
    if (overlay) overlay.classList.add('active');
}

function closeQuickView() {
    const overlay = safeElement('quick-view');
    if (overlay) overlay.classList.remove('active');
}

// ============================================
// ADMIN - RENDER LIST
// ============================================
function renderAdminList() {
    const list = safeElement('admin-list');
    if (!list) return;
    const count = safeElement('admin-count');
    if (count) count.textContent = S.pr ? S.pr.length : 0;
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
// ESTADÍSTICAS - CORREGIDA (eliminadas referencias a stat-views y stat-today)
// ============================================
function renderEstadisticas() {
    const elements = {
        products: safeElement('stat-products'),
        users: safeElement('stat-users'),
        orders: safeElement('stat-orders'),
        revenue: safeElement('stat-revenue')
    };
    
    if (elements.products) elements.products.textContent = S.pr ? S.pr.length : 0;
    if (elements.users) elements.users.textContent = S.users ? S.users.length : 0;
    if (elements.orders) elements.orders.textContent = S.orders ? S.orders.length : 0;
    if (elements.revenue) {
        const revenue = S.orders ? S.orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) : 0;
        elements.revenue.textContent = `$${revenue.toFixed(2)}`;
    }
    console.log(`📊 Estadísticas: ${S.pr ? S.pr.length : 0} productos, ${S.users ? S.users.length : 0} usuarios, ${S.orders ? S.orders.length : 0} pedidos`);
}

function generarGraficos() {
    try {
        const ctx1 = safeElement('ventas-categoria');
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
                data: { labels: nombres, datasets: [{ data: ventas, backgroundColor: colores, borderWidth: 2, borderColor: '#fff' }] },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
        }
        const ctx2 = safeElement('pedidos-dia');
        if (ctx2 && typeof Chart !== 'undefined') {
            const dias = [], counts = [], hoy = new Date();
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date(hoy);
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                dias.push(fecha.toLocaleDateString('es-ES', { weekday: 'short' }));
                counts.push(S.orders ? S.orders.filter(o => o.fecha && o.fecha.startsWith(fechaStr)).length : 0);
            }
            new Chart(ctx2, {
                type: 'bar',
                data: { labels: dias, datasets: [{ label: 'Pedidos', data: counts, backgroundColor: '#0d9488', borderRadius: 6 }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        }
    } catch (e) {
        console.warn('Error generando gráficos:', e.message);
    }
}

function actualizarDashboard() {
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = S.orders ? S.orders.filter(o => o.fecha && o.fecha.startsWith(hoy)).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) : 0;
    const elVentas = safeElement('dashboard-ventas-hoy');
    if (elVentas) elVentas.textContent = `$${ventasHoy.toFixed(2)}`;
    const elPedidos = safeElement('dashboard-pedidos-pendientes');
    if (elPedidos) elPedidos.textContent = S.orders ? S.orders.length : 0;
    const critico = S.pr ? S.pr.filter(p => p.stock <= 5 && p.stock > 0).length : 0;
    const elStock = safeElement('dashboard-stock-critico');
    if (elStock) elStock.textContent = critico;
    const semana = new Date();
    semana.setDate(semana.getDate() - 7);
    const nuevos = S.users ? S.users.filter(u => u.fecha && new Date(u.fecha) > semana).length : 0;
    const elClientes = safeElement('dashboard-clientes-nuevos');
    if (elClientes) elClientes.textContent = nuevos;
}

function verificarNotificaciones() {
    const critico = S.pr ? S.pr.filter(p => p.stock <= 5 && p.stock > 0).length : 0;
    const textEl = safeElement('notif-text');
    if (textEl) {
        if (critico > 0) {
            textEl.textContent = `⚠️ ${critico} productos con stock crítico`;
            textEl.className = 'text-xs text-yellow-300';
        } else {
            textEl.textContent = '✅ Todo en orden';
            textEl.className = 'text-xs text-green-300';
        }
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
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
        
        if (S.currentUser && S.currentUser.role === 'admin') {
            if (safeElement('users-list')) {
                if (typeof cargarUsuarios === 'function') await cargarUsuarios();
            }
            if (safeElement('orders-list')) {
                if (typeof cargarPedidosAdmin === 'function') await cargarPedidosAdmin();
            }
            renderEstadisticas();
            if (safeElement('ventas-categoria')) {
                setTimeout(generarGraficos, 500);
            }
            if (safeElement('admin-dashboard')) {
                actualizarDashboard();
            }
        }
        
        renderCarousel();
        renderCategorias();
        renderOfertas();
        applyTexts();
        initCarousel();
        
        console.log('🎉 MediTech iniciado correctamente');
    } catch (error) {
        console.error('❌ Error en init:', error);
        showNotif('⚠️ Error al cargar la página', 'error');
    }
}

// ============================================
// EVENTOS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const year = safeElement('year');
    if (year) year.textContent = new Date().getFullYear();
    init();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    const year = safeElement('year');
    if (year) year.textContent = new Date().getFullYear();
    init();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const login = safeElement('login-modal');
        if (login) login.classList.remove('active');
        const register = safeElement('register-modal');
        if (register) register.classList.remove('active');
        const cart = safeElement('cart-modal');
        if (cart) cart.classList.remove('active');
        const quick = safeElement('quick-view');
        if (quick) quick.classList.remove('active');
        const admin = safeElement('admin-panel');
        if (admin) admin.classList.remove('active');
        const userMenu = safeElement('user-menu');
        if (userMenu) userMenu.classList.remove('open');
    }
});

document.addEventListener('click', (e) => {
    const userSection = safeElement('user-section');
    if (!userSection || !e.target.closest('#user-section')) {
        const userMenu = safeElement('user-menu');
        if (userMenu) userMenu.classList.remove('open');
    }
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !e.target.closest('.search-container')) {
        const results = safeElement('search-results');
        if (results) results.classList.remove('active');
    }
});

// ============================================
// EXPONER FUNCIONES GLOBALES (SOLO LAS QUE EXISTEN)
// ============================================
// Auth
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
// Cart
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.updateCartQuantity = updateCartQuantity;
window.enviarPedidoPorCorreo = enviarPedidoPorCorreo;
// UI
window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.moveCarousel = moveCarousel;
window.filterProducts = filterProducts;
window.searchProducts = searchProducts;
// Admin
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
window.renderProducts = renderProducts;
window.renderAdminList = renderAdminList;
window.cargarProductos = cargarProductos;
window.renderEstadisticas = renderEstadisticas;
window.generarGraficos = generarGraficos;
window.actualizarDashboard = actualizarDashboard;
window.verificarNotificaciones = verificarNotificaciones;
// Admin extra (solo si existen)
if (typeof cargarUsuarios !== 'undefined') window.cargarUsuarios = cargarUsuarios;
if (typeof cargarPedidosAdmin !== 'undefined') window.cargarPedidosAdmin = cargarPedidosAdmin;
if (typeof renderPedidos !== 'undefined') window.renderPedidos = renderPedidos;
if (typeof renderHistorial !== 'undefined') window.renderHistorial = renderHistorial;
if (typeof exportarReportePDF !== 'undefined') window.exportarReportePDF = exportarReportePDF;
if (typeof toggleChat !== 'undefined') window.toggleChat = toggleChat;
if (typeof sendMessage !== 'undefined') window.sendMessage = sendMessage;
