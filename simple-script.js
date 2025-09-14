// Variables globales
let products = [];
let filteredProducts = [];
let currentCategory = 'All';
let currentSort = 'Relevance';

// Actualizar el año actual en el footer
function updateCurrentYear() {
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
}

// Cargar productos desde CSV local
async function loadProducts() {
    let loadedProducts = [];
    
    try {
        // Obtener parámetros de URL
        const urlParams = new URLSearchParams(window.location.search);
        const csvUrl = urlParams.get('csvUrl');
        
        console.log('Parámetros de URL detectados:', { csvUrl });
        
        // Mostrar mensaje de carga
        document.getElementById('products-container').innerHTML = '<div class="loading">Cargando productos...</div>';
        
        // Validar que tenemos un parámetro válido
        if (!csvUrl) {
            console.error('No se proporcionó csvUrl');
            document.getElementById('products-container').innerHTML = 
                '<div class="error-message">Error: No se proporcionó una URL de CSV válida</div>';
            return [];
        }
        
        // Cargar el script de utilidades primero
        if (!window.googleSheetsUtils || typeof window.googleSheetsUtils.convertCsvToProducts !== 'function') {
            console.log('Cargando script de utilidades...');
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'fix-google-sheets.js';
                script.onload = () => {
                    console.log('Script de utilidades cargado correctamente');
                    resolve();
                };
                script.onerror = (e) => {
                    console.error('No se pudo cargar fix-google-sheets.js', e);
                    resolve();
                };
                document.head.appendChild(script);
            });
        }
        
        // Verificar que las utilidades estén disponibles
        if (!window.googleSheetsUtils || typeof window.googleSheetsUtils.convertCsvToProducts !== 'function') {
            throw new Error('Las utilidades de conversión CSV no están disponibles');
        }
        
        // Cargar el CSV
        console.log('Cargando CSV desde:', csvUrl);
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`Error al cargar CSV: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('CSV cargado, longitud:', csvText.length);
        
        if (!csvText || csvText.trim() === '') {
            throw new Error('El archivo CSV está vacío');
        }
        
        // Convertir CSV a productos
        loadedProducts = window.googleSheetsUtils.convertCsvToProducts(csvText);
        console.log('Productos cargados:', loadedProducts.length);
        
        if (loadedProducts.length === 0) {
            throw new Error('No se encontraron productos en el CSV');
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('products-container').innerHTML = 
            `<div class="error-message">Error: ${error.message}</div>`;
        return [];
    }
    
    return loadedProducts;
}

// Inicializar productos
async function initializeProducts() {
    products = await loadProducts();
    
    if (products.length > 0) {
        // Actualizar filtros de categoría
        updateCategoryFilters();
        
        // Aplicar filtros y mostrar productos
        applyFiltersAndSort();
        displayProducts();
        
        // Ocultar el carrusel si hay productos
        const carouselSection = document.querySelector('.carousel-container');
        if (carouselSection) {
            carouselSection.style.display = 'none';
        }
    } else {
        console.warn('No se cargaron productos');
        document.getElementById('products-container').innerHTML = 
            '<div class="error-message">No se encontraron productos. Verifica la URL del CSV.</div>';
    }
}

// Mostrar productos
function displayProducts() {
    const productsContainer = document.getElementById('products-container');
    productsContainer.innerHTML = '';
    
    // Aplicar filtros y ordenación
    applyFiltersAndSort();
    
    // Crear tarjetas de producto
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Preparar URLs de imagen
        let imageSrc = product.image || 'images/placeholder.jpg';
        let altImageSrc = product.altImage || 'images/placeholder.jpg';
        
        productCard.innerHTML = `
            <div class="product-image">
                <div class="image-container">
                    <img src="${imageSrc}" alt="${product.name}" class="main-image active loaded" onerror="this.src='images/placeholder.jpg'">
                    <img src="${altImageSrc}" alt="${product.name} - Alternativa" class="alt-image" onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="image-controls">
                    <span class="image-dot active" data-image="main"></span>
                    <span class="image-dot" data-image="alt"></span>
                </div>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toFixed(2)} ${product.currency || 'USD'}</div>
                ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                ${product.category ? `<div class="product-category"><span>Categoría:</span> ${product.category}</div>` : ''}
            </div>
        `;
        
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
        case 'Price: Low to high':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'Price: High to low':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'Latest arrivals':
            // Por defecto, no hacemos nada especial
            break;
        case 'Trending':
            // Por defecto, no hacemos nada especial
            break;
        case 'Relevance':
        default:
            // Por defecto, no hacemos nada especial
            break;
    }
}

// Actualizar contador de resultados
function updateResultsCount() {
    const resultsCountElement = document.getElementById('results-count');
    if (resultsCountElement) {
        resultsCountElement.textContent = `${filteredProducts.length} productos encontrados`;
    }
}

// Actualizar filtros de categoría
function updateCategoryFilters() {
    // Obtener todas las categorías únicas
    const categories = ['All', ...new Set(products.map(product => product.category).filter(Boolean))];
    
    // Actualizar el menú de categorías
    const categoryMenu = document.getElementById('category-menu');
    if (categoryMenu) {
        categoryMenu.innerHTML = '';
        
        categories.forEach(category => {
            const categoryElement = document.createElement('li');
            const categoryLink = document.createElement('a');
            categoryLink.href = '#';
            categoryLink.textContent = category === 'All' ? 'Todas' : category;
            categoryLink.dataset.category = category;
            
            if (currentCategory === category) {
                categoryLink.classList.add('active');
            }
            
            categoryElement.appendChild(categoryLink);
            categoryMenu.appendChild(categoryElement);
        });
        
        // Añadir event listeners a los enlaces de categoría
        const categoryLinks = categoryMenu.querySelectorAll('a');
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentCategory = link.dataset.category;
                
                // Actualizar clases activas
                categoryLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Actualizar productos mostrados
                displayProducts();
            });
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Event listeners para ordenación
    const sortLinks = document.querySelectorAll('.sort-options a');
    sortLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentSort = link.textContent.trim();
            
            // Actualizar clases activas
            sortLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Actualizar productos mostrados
            displayProducts();
        });
    });
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    initializeProducts();
    setupEventListeners();
    updateCurrentYear();
});