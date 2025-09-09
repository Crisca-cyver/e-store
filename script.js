// Variables globales
let products = [];
let filteredProducts = [];
let currentCategory = 'All';
let currentSort = 'Relevance';
let whatsappProducts = []; // Para almacenar productos importados de WhatsApp

// Cargar productos desde Google Sheets
async function loadProducts() {
    try {
        // Obtener el ID de la hoja de Google Sheets o URL CSV directa desde la URL
        const urlParams = new URLSearchParams(window.location.search);
        const sheetId = urlParams.get('sheetId');
        const gid = urlParams.get('gid') || 0;
        const csvUrl = urlParams.get('csvUrl');
        
        // Si hay una URL CSV directa, cargar desde ella
        if (csvUrl) {
            console.log('Cargando productos desde URL CSV directa:', csvUrl);
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error(`Error al cargar datos desde URL CSV: ${response.status}`);
            }
            const csvText = await response.text();
            products = window.googleSheetsUtils.convertCsvToProducts(csvText);
        }
        // Si hay un ID de hoja, cargar desde Google Sheets
        else if (sheetId) {
            console.log('Cargando productos desde Google Sheets:', sheetId);
            products = await window.googleSheetsUtils.loadProductsFromPublicSheet(sheetId, gid);
        }
        // Si no hay ni URL CSV ni ID de hoja, intentar cargar desde products.json
        else {
            console.log('No se especificó un origen de datos, cargando desde products.json');
            const response = await fetch('products.json');
            const data = await response.json();
            products = data.products;
        }
        
        filteredProducts = [...products];
        
        // Combinar con productos de WhatsApp si existen
        if (whatsappProducts.length > 0) {
            products = [...products, ...whatsappProducts];
            filteredProducts = [...products];
            updateCategoryFilters();
        }
        
        displayProducts();
        
        // Ocultar la sección del carrusel ya que no hay productos
        const carouselSection = document.querySelector('.carousel-container');
        if (carouselSection) {
            carouselSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al cargar los productos:', error);
    }
}

// Mostrar productos en la cuadrícula
function displayProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) {
        console.error('No se encontró el contenedor de productos');
        return;
    }
    productsContainer.innerHTML = '';

    // Aplicar filtros y ordenación
    applyFiltersAndSort();

    // Actualizar contador total de productos
    const totalProductsElement = document.querySelector('.total-products span');
    if (totalProductsElement) {
        totalProductsElement.textContent = products.length;
    }

    // Crear tarjetas de productos
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Verificar si el producto es de WhatsApp (ID > 100 según nuestra implementación)
        const isWhatsappProduct = product.id > 100;
        
        // Usar la imagen del producto si está disponible, o la imagen de placeholder
        const imageSrc = product.image && product.image.trim() !== '' ? product.image : 'images/placeholder.jpg';
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${imageSrc}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
                ${isWhatsappProduct ? '<span class="whatsapp-badge">WhatsApp</span>' : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toFixed(2)} ${product.currency}</div>
                ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
            </div>
        `;
        
        // Añadir clase 'loaded' cuando la imagen se carga completamente
        const img = productCard.querySelector('img');
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
        }
        
        productCard.addEventListener('click', () => {
            // Aquí se podría implementar la vista detallada del producto
            console.log('Producto seleccionado:', product);
        });
        
        productsContainer.appendChild(productCard);
    });
    
    // Si no hay productos, mostrar mensaje
    if (filteredProducts.length === 0) {
        const noProductsMessage = document.createElement('div');
        noProductsMessage.className = 'no-products-message';
        noProductsMessage.textContent = 'No se encontraron productos que coincidan con los criterios de búsqueda.';
        productsContainer.appendChild(noProductsMessage);
    }
}

// Aplicar filtros y ordenación
function applyFiltersAndSort() {
    // Filtrar por categoría
    if (currentCategory === 'All') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === currentCategory);
    }

    // Aplicar ordenación
    sortProducts(filteredProducts, currentSort);
    
    // Actualizar contador de resultados
    updateResultsCount();
}

// Función para ordenar productos según el criterio seleccionado
function sortProducts(products, sortCriteria) {
    switch (sortCriteria) {
        case 'Relevance':
            // Por defecto, no se aplica ninguna ordenación específica
            break;
        case 'Trending':
            // Simulación de productos tendencia (podría basarse en ventas, visitas, etc.)
            products.sort((a, b) => (Math.random() - 0.5));
            break;
        case 'Latest arrivals':
            // Simulación de últimas llegadas (en un caso real, se usaría una fecha de creación)
            products.sort((a, b) => b.id - a.id);
            break;
        case 'Price: Low to high':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'Price: High to low':
            products.sort((a, b) => b.price - a.price);
            break;
    }
}

// Actualizar contador de resultados
function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `${filteredProducts.length} productos encontrados`;
    }
    
    // Actualizar el contador en la barra lateral
    const sidebarCount = document.getElementById('sidebar-count');
    if (sidebarCount) {
        sidebarCount.textContent = `(${filteredProducts.length})`;
    }
    
    // Actualizar el contador en el encabezado de categoría
    const categoryHeader = document.getElementById('category-header');
    if (categoryHeader) {
        categoryHeader.textContent = `${currentCategory} (${filteredProducts.length})`;
    }
}

// Filtrar productos por búsqueda
function filterBySearch(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        // Si la búsqueda está vacía, mostrar todos los productos según la categoría actual
        if (currentCategory === 'All') {
            filteredProducts = [...products];
        } else {
            filteredProducts = products.filter(product => product.category === currentCategory);
        }
    } else {
        // Filtrar productos por término de búsqueda
        const searchResults = products.filter(product => {
            return (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                   product.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
                   (currentCategory === 'All' || product.category === currentCategory);
        });
        
        filteredProducts = searchResults;
    }
    
    // Aplicar ordenación a los resultados filtrados
    sortProducts(filteredProducts, currentSort);
    
    // Actualizar contador de resultados
    updateResultsCount();
}

// La funcionalidad del carrusel ha sido eliminada ya que no hay productos

// Configurar eventos de filtrado y ordenación
function setupEventListeners() {
    // Menú móvil
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;
    
    if (menuToggle && sidebar) {
        // Crear overlay para el menú móvil
        const sidebarOverlay = document.createElement('div');
        sidebarOverlay.classList.add('sidebar-overlay');
        body.appendChild(sidebarOverlay);
        
        // Evento para mostrar/ocultar el menú móvil
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        });
        
        // Cerrar menú al hacer clic en el overlay
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            body.style.overflow = '';
        });
        
        // Cerrar menú al cambiar el tamaño de la ventana
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }
    
    // Navegación de categorías en la barra lateral
    const categoryLinks = document.querySelectorAll('.collections ul li a');
    if (categoryLinks.length > 0) {
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentCategory = link.textContent;
                
                // Actualizar estado activo
                categoryLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                displayProducts();
            });
        });
    }
    
    // Enlaces de navegación superior
    const navLinks = document.querySelectorAll('.nav-links a');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.textContent;
                currentCategory = category;
                
                // Actualizar estado activo en la barra lateral
                if (categoryLinks.length > 0) {
                    categoryLinks.forEach(l => {
                        if (l.textContent === category) {
                            l.classList.add('active');
                        } else {
                            l.classList.remove('active');
                        }
                    });
                }
                
                // Actualizar estado activo en la navegación
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                displayProducts();
            });
        });
    }
    
    // Opciones de ordenación
    const sortLinks = document.querySelectorAll('.sort-by ul li a');
    if (sortLinks.length > 0) {
        sortLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentSort = link.textContent;
                
                // Actualizar estado activo
                sortLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                displayProducts();
            });
        });
    }
    
    // La funcionalidad de búsqueda ha sido eliminada
    // Mantenemos esta sección vacía para posibles implementaciones futuras
}

// Función para importar productos desde WhatsApp
async function importProductsFromWhatsApp() {
    const whatsappUrlInput = document.getElementById('whatsapp-url');
    const whatsappStatusElement = document.getElementById('whatsapp-status');
    const importButton = document.getElementById('import-whatsapp');
    
    const whatsappUrl = whatsappUrlInput.value.trim();
    
    if (!whatsappUrl) {
        whatsappStatusElement.textContent = 'Por favor, ingresa una URL de WhatsApp válida';
        whatsappStatusElement.style.color = '#ff6b6b';
        return;
    }
    
    // Validar formato de URL de WhatsApp
    if (!whatsappUrl.match(/wa\.me\/c\/[0-9]+/)) {
        whatsappStatusElement.textContent = 'La URL debe tener el formato wa.me/c/NÚMERO';
        whatsappStatusElement.style.color = '#ff6b6b';
        return;
    }
    
    try {
        // Cambiar estado del botón y mostrar mensaje de carga
        importButton.disabled = true;
        whatsappStatusElement.textContent = 'Importando productos...';
        whatsappStatusElement.style.color = '#aaa';
        
        // Obtener productos desde WhatsApp usando la función de products.js
        whatsappProducts = await window.productUtils.getProductsFromWhatsApp(whatsappUrl);
        
        if (whatsappProducts.length === 0) {
            whatsappStatusElement.textContent = 'No se encontraron productos en el catálogo de WhatsApp';
            whatsappStatusElement.style.color = '#ff6b6b';
        } else {
            // Combinar productos existentes con los nuevos de WhatsApp
            // Asegurarse de que los IDs no se dupliquen
            const maxId = products.reduce((max, product) => Math.max(max, product.id), 0);
            
            whatsappProducts = whatsappProducts.map((product, index) => {
                return {
                    ...product,
                    id: maxId + index + 1 // Asignar nuevos IDs secuenciales
                };
            });
            
            // Añadir productos de WhatsApp al array principal
            products = [...products, ...whatsappProducts];
            filteredProducts = [...products];
            
            // Actualizar la visualización
            displayProducts();
            setupCarousel(); // Actualizar carrusel con nuevos productos destacados
            
            // Actualizar contador de productos en la interfaz
            const totalProductsElement = document.querySelector('.total-products span');
            if (totalProductsElement) {
                totalProductsElement.textContent = products.length;
            }
            
            // Actualizar filtros de categorías con las nuevas categorías
            updateCategoryFilters();
            
            // Mostrar mensaje de éxito más detallado
            whatsappStatusElement.textContent = `¡Éxito! Se importaron ${whatsappProducts.length} productos desde WhatsApp`;
            whatsappStatusElement.style.color = '#25D366';
            
            // Resaltar brevemente los productos importados
            setTimeout(() => {
                const whatsappBadges = document.querySelectorAll('.whatsapp-badge');
                whatsappBadges.forEach(badge => {
                    badge.classList.add('highlight');
                    setTimeout(() => badge.classList.remove('highlight'), 2000);
                });
            }, 500);
        }
    } catch (error) {
        console.error('Error al importar productos de WhatsApp:', error);
        whatsappStatusElement.textContent = `Error: ${error.message}`;
        whatsappStatusElement.style.color = '#ff6b6b';
    } finally {
        importButton.disabled = false;
    }
}

// Función para actualizar los filtros de categorías basados en todos los productos disponibles
function updateCategoryFilters() {
    // Obtener todas las categorías únicas de todos los productos
    const categories = [...new Set(products.map(product => product.category))];
    
    // Obtener el contenedor de categorías en la barra lateral
    const categoryContainer = document.querySelector('.collections ul');
    if (!categoryContainer) return;
    
    // Mantener la opción "All" y eliminar las demás
    const allOption = categoryContainer.querySelector('li:first-child');
    categoryContainer.innerHTML = '';
    if (allOption) categoryContainer.appendChild(allOption);
    
    // Añadir cada categoría
    categories.forEach(category => {
        const categoryElement = document.createElement('li');
        const categoryLink = document.createElement('a');
        categoryLink.href = '#';
        categoryLink.textContent = category;
        if (currentCategory === category) {
            categoryLink.classList.add('active');
        }
        categoryElement.appendChild(categoryLink);
        categoryContainer.appendChild(categoryElement);
    });
    
    // Volver a configurar los event listeners para las categorías
    const categoryLinks = document.querySelectorAll('.collections ul li a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.textContent;
            
            // Actualizar estado activo
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // La funcionalidad de búsqueda ha sido eliminada
            // No es necesario limpiar el campo de búsqueda
            
            displayProducts();
        });
    });
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Ocultar la sección del carrusel
    const carouselSection = document.querySelector('.carousel-container');
    if (carouselSection) {
        carouselSection.style.display = 'none';
    }
    
    loadProducts();
    setupEventListeners();
    
    // La funcionalidad de importación de WhatsApp ha sido eliminada
});