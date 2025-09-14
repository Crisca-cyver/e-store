// Variables globales
let products = [];
let filteredProducts = [];
let currentCategory = 'All';
let currentSort = 'Relevance';
let whatsappProducts = []; // Para almacenar productos importados de WhatsApp

// Actualizar el año actual en el footer
function updateCurrentYear() {
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
}

// Cargar productos desde Google Sheets o CSV local
async function loadProducts() {
    let loadedProducts = [];
    
    try {
        // Obtener parámetros de URL
        const urlParams = new URLSearchParams(window.location.search);
        const sheetId = urlParams.get('sheetId');
        const gid = urlParams.get('gid') || '0';
        const csvUrl = urlParams.get('csvUrl');
        
        console.log('Parámetros de URL detectados:', { sheetId, gid, csvUrl });
        
        // Mostrar mensaje de carga
        document.getElementById('products-container').innerHTML = '<div class="loading">Cargando productos...</div>';
        
        // Validar que tenemos al menos un parámetro válido
        if (!sheetId && !csvUrl) {
            console.error('No se proporcionó sheetId o csvUrl');
            document.getElementById('products-container').innerHTML = 
                '<div class="error-message">Error: No se proporcionó una URL de hoja de cálculo válida</div>';
            return [];
        }
        
        // Asegurarse de que el script de Google Sheets esté cargado primero
        if (!window.googleSheetsUtils || typeof window.googleSheetsUtils.convertCsvToProducts !== 'function') {
            console.log('Cargando script de Google Sheets primero...');
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'fix-google-sheets.js';
                script.onload = () => {
                    console.log('Script de Google Sheets cargado correctamente');
                    resolve();
                };
                script.onerror = () => {
                    console.error('No se pudo cargar fix-google-sheets.js');
                    resolve();
                };
                document.head.appendChild(script);
            });
        }
        
        // Intentar cargar desde Google Sheets si hay URL CSV
        if (csvUrl) {
            console.log('Intentando cargar desde URL CSV:', csvUrl);
            try {
                // Para URLs publicadas, necesitamos usar un enfoque diferente
                // En lugar de extraer el ID, usaremos directamente la URL del CSV
                // y la convertiremos a un formato que podamos usar
                
                // Verificar si es una URL de Google Sheets publicada
                if (csvUrl.includes('docs.google.com/spreadsheets') && csvUrl.includes('/pub')) {
                    console.log('Detectada URL de hoja publicada');
                    
                    // Extraer el ID completo de la URL (incluyendo la parte 'e' para hojas publicadas)
                    let fullSheetId = '';
                    let match;
                    
                    if (csvUrl.includes('/d/e/')) {
                        // Formato: https://docs.google.com/spreadsheets/d/e/[ID]/pub
                        match = csvUrl.match(/spreadsheets\/d\/e\/([\w-]+)/);
                        if (match && match[1]) {
                            fullSheetId = match[1];
                            console.log('ID completo extraído (formato publicado):', fullSheetId);
                            
                            // Para hojas publicadas, usamos un enfoque diferente
                            // Crear un iframe oculto que cargue la hoja
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.src = csvUrl;
                            
                            // Esperar a que se cargue y extraer los datos
                            document.body.appendChild(iframe);
                            
                            // Convertir URL de edición a URL de publicación CSV
                            let csvPublicUrl = csvUrl;
                            if (csvUrl.includes('/edit') || csvUrl.includes('/d/') && !csvUrl.includes('/pub')) {
                                // Extraer el ID de la hoja
                                const sheetIdMatch = csvUrl.match(/\/d\/([a-zA-Z0-9_-]+)/); 
                                if (sheetIdMatch && sheetIdMatch[1]) {
                                    const extractedId = sheetIdMatch[1];
                                    csvPublicUrl = `https://docs.google.com/spreadsheets/d/${extractedId}/export?format=csv`;
                                    if (gid && gid !== '0') {
                                        csvPublicUrl += `&gid=${gid}`;
                                    }
                                    console.log('URL convertida a formato de exportación:', csvPublicUrl);
                                }
                            }
                            
                            // Usar un proxy CORS para acceder a la URL CSV
                            const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(csvPublicUrl)}`;
                            console.log('Intentando cargar a través de proxy CORS:', corsProxyUrl);
                            
                            try {
                                console.log('Iniciando fetch de datos CSV...');
                                const response = await fetch(corsProxyUrl);
                                console.log('Respuesta recibida:', response.status, response.statusText);
                                
                                if (!response.ok) {
                                    throw new Error(`Error al cargar CSV: ${response.status} ${response.statusText}`);
                                }
                                
                                const csvText = await response.text();
                                console.log('CSV obtenido, longitud:', csvText.length);
                                console.log('Primeras líneas del CSV:', csvText.split('\n').slice(0, 3));
                                
                                if (!csvText || csvText.trim() === '') {
                                    throw new Error('El archivo CSV está vacío');
                                }
                                
                                if (window.googleSheetsUtils && typeof window.googleSheetsUtils.convertCsvToProducts === 'function') {
                                    console.log('Convirtiendo CSV a productos...');
                                    loadedProducts = window.googleSheetsUtils.convertCsvToProducts(csvText);
                                    console.log('Productos cargados desde CSV:', loadedProducts ? loadedProducts.length : 0);
                                    
                                    if (!loadedProducts || loadedProducts.length === 0) {
                                        console.warn('No se encontraron productos en el CSV');
                                        document.getElementById('products-container').innerHTML = 
                                            '<div class="error-message">No se encontraron productos en la hoja de cálculo</div>';
                                    }
                                    
                                    return loadedProducts;
                                } else {
                                    throw new Error('Función convertCsvToProducts no disponible');
                                }
                            } catch (error) {
                                console.error('Error al cargar CSV a través de proxy:', error);
                                document.getElementById('products-container').innerHTML = 
                                    `<div class="error-message">Error al cargar productos: ${error.message}</div>`;
                            }
                            
                            // Aunque no podamos leer la respuesta debido a no-cors,
                            // podemos intentar cargar el CSV como un script
                            const script = document.createElement('script');
                            script.src = csvUrl;
                            document.body.appendChild(script);
                            
                            // Esperar un momento para que se cargue
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Limpiar
                            document.body.removeChild(iframe);
                            document.body.removeChild(script);
                        }
                    } else if (csvUrl.includes('/d/')) {
                        // Formato estándar: https://docs.google.com/spreadsheets/d/[ID]/
                        match = csvUrl.match(/spreadsheets\/d\/([\w-]+)/);
                        if (match && match[1]) {
                            sheetId = match[1];
                            console.log('ID estándar extraído:', sheetId);
                        }
                    }
                }
                
                // Intentar usar el ID si lo tenemos, o usar directamente la URL del CSV
                if (window.googleSheetsUtils && typeof window.googleSheetsUtils.loadProductsFromPublicSheet === 'function') {
                    // Extraer gid si está presente en la URL
                    let gid = '0';
                    const gidMatch = csvUrl.match(/gid=([0-9]+)/);
                    if (gidMatch && gidMatch[1]) {
                        gid = gidMatch[1];
                    }
                    
                    // Usar el proxy CORS en lugar de intentar cargar directamente
                    console.log('Usando exclusivamente el proxy CORS para cargar los datos');
                    
                    // No intentamos cargar directamente para evitar problemas de CORS
                    // El proxy ya se encargó de esto en el código anterior
                    
                    // Si no tenemos productos todavía, intentar con la función de conversión CSV
                    if (!loadedProducts.length) {
                        try {
                            // Intentar cargar el CSV directamente
                            console.log('Intentando cargar CSV desde:', csvUrl);
                            const response = await fetch(csvUrl);
                            console.log('Respuesta CSV:', response.status, response.statusText);
                            
                            if (!response.ok) {
                                throw new Error(`Error al cargar CSV: ${response.status} ${response.statusText}`);
                            }
                            
                            const text = await response.text();
                            console.log('CSV cargado, longitud:', text.length);
                            console.log('Primeras líneas:', text.substring(0, 100));
                            
                            if (!text || text.trim() === '') {
                                throw new Error('El archivo CSV está vacío');
                            }
                            
                            // Verificar si la función de conversión está disponible
                            if (window.googleSheetsUtils && typeof window.googleSheetsUtils.convertCsvToProducts === 'function') {
                                console.log('Convirtiendo CSV a productos...');
                                loadedProducts = window.googleSheetsUtils.convertCsvToProducts(text);
                                console.log('Productos convertidos:', loadedProducts ? loadedProducts.length : 0);
                            } else {
                                console.error('Función convertCsvToProducts no disponible');
                                // Intentar cargar el script de Google Sheets si no está disponible
                                await new Promise((resolve) => {
                                    const script = document.createElement('script');
                                    script.src = 'fix-google-sheets.js';
                                    script.onload = () => {
                                        console.log('Script de Google Sheets cargado correctamente');
                                        resolve();
                                    };
                                    script.onerror = (e) => {
                                        console.error('No se pudo cargar fix-google-sheets.js', e);
                                        resolve();
                                    };
                                    document.head.appendChild(script);
                                });
                                
                                // Intentar nuevamente después de cargar el script
                                if (window.googleSheetsUtils && typeof window.googleSheetsUtils.convertCsvToProducts === 'function') {
                                    console.log('Función convertCsvToProducts disponible después de cargar script');
                                    loadedProducts = window.googleSheetsUtils.convertCsvToProducts(text);
                                    console.log('Productos convertidos después de cargar script:', loadedProducts ? loadedProducts.length : 0);
                                } else {
                                    console.error('Funciones de Google Sheets no disponibles después de cargar script');
                                    throw new Error('Funciones de Google Sheets no disponibles');
                                }
                            }
                            
                            if (!loadedProducts || loadedProducts.length === 0) {
                                throw new Error('No se encontraron productos en el CSV');
                            }
                        } catch (e) {
                            console.error('Error al cargar CSV directamente:', e);
                            document.getElementById('products-container').innerHTML = 
                                `<div class="error-message">No se encontraron productos. Verifica la URL de la hoja de cálculo.</div>`;
                        }
                    }
                    
                    console.log('Productos cargados desde Google Sheets:', loadedProducts ? loadedProducts.length : 0);
                } else {
                    throw new Error('Funciones de Google Sheets no disponibles');
                }
            } catch (error) {
                console.error('Error al cargar desde CSV URL:', error);
                // Mostrar error en la interfaz en lugar de alerta
                document.getElementById('products-container').innerHTML = 
                    `<div class="error-message">Error al cargar productos: ${error.message}</div>`;
                loadedProducts = [];
            }
        }
        // Intentar cargar desde Google Sheets si hay ID de hoja
        else if (sheetId) {
            console.log('Intentando cargar desde Google Sheets ID:', sheetId);
            try {
                // Construir URL de exportación
                let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
                if (gid !== '0') {
                    url += `&gid=${gid}`;
                }
                
                console.log('URL de Google Sheets construida:', url);
                
                // Usar proxy CORS para evitar problemas de CORS
                const corsProxyUrl = 'https://corsproxy.io/?';
                const proxiedUrl = corsProxyUrl + encodeURIComponent(url);
                console.log('URL con proxy CORS:', proxiedUrl);
                
                // Realizar solicitud a través del proxy
                console.log('Iniciando fetch de datos...');
                const response = await fetch(proxiedUrl);
                console.log('Respuesta recibida:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Error al cargar CSV: ${response.status} ${response.statusText}`);
                }
                
                const csvData = await response.text();
                console.log('Datos CSV cargados, longitud:', csvData.length);
                
                if (!csvData || csvData.trim() === '') {
                    throw new Error('El archivo CSV está vacío');
                }
                
                if (window.googleSheetsUtils && typeof window.googleSheetsUtils.convertCsvToProducts === 'function') {
                    console.log('Convirtiendo CSV a productos...');
                    loadedProducts = window.googleSheetsUtils.convertCsvToProducts(csvData);
                    console.log('Productos cargados desde Google Sheets ID:', loadedProducts ? loadedProducts.length : 0);
                } else {
                    throw new Error('Función convertCsvToProducts no disponible');
                }
            } catch (error) {
                console.error('Error al cargar desde Google Sheets ID:', error);
                // Mostrar error en la interfaz
                document.getElementById('products-container').innerHTML = 
                    `<div class="error-message">Error al cargar productos: ${error.message}</div>`;
                loadedProducts = [];
            }
        }
        // Mostrar mensaje si no hay parámetros de Google Sheets
        else {
            console.log('No se proporcionó URL de CSV o ID de hoja de Google Sheets');
            document.getElementById('products-container').innerHTML = 
                '<div class="error-message">No se encontraron productos. Verifica la URL de la hoja de cálculo.</div>';
            loadedProducts = [];
        }
    } catch (error) {
        console.error('Error general al cargar productos:', error);
        loadedProducts = [];
    }
    
    return loadedProducts;
}

// Inicializar productos
async function initializeProducts() {
    try {
        products = await loadProducts();
        
        if (!products || products.length === 0) {
            console.warn('No se cargaron productos');
            document.getElementById('products-container').innerHTML = 
                '<div class="error-message">No se encontraron productos. Verifica la URL de la hoja de cálculo.</div>';
            return;
        }
        
        console.log('Productos inicializados correctamente:', products.length);
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
        
        // Crear la URL de la imagen alternativa (con sufijo 'a')
        let altImageSrc = '';
        if (imageSrc && imageSrc !== 'images/placeholder.jpg') {
            // Si la imagen es de la carpeta local 'images'
            if (imageSrc.startsWith('images/')) {
                const baseName = imageSrc.replace('.jpg', '').replace('.png', '');
                altImageSrc = `${baseName}a.jpg`;
            } 
            // Si es una URL externa
            else {
                altImageSrc = imageSrc.replace('.jpg', 'a.jpg').replace('.png', 'a.png');
            }
        } else {
            altImageSrc = 'images/placeholder.jpg';
        }
        
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
                ${isWhatsappProduct ? '<span class="whatsapp-badge">WhatsApp</span>' : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toFixed(2)} ${product.currency}</div>
                ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                ${product.category ? `<div class="product-category"><span>Categoría:</span> ${product.category}</div>` : ''}
            </div>
        `;
        
        // Añadir clase 'loaded' a las imágenes cuando se cargan completamente
        const images = productCard.querySelectorAll('img');
        images.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
            }
        });
        
        // Configurar los controles de imagen para alternar entre imágenes
        const imageDots = productCard.querySelectorAll('.image-dot');
        const mainImage = productCard.querySelector('.main-image');
        const altImage = productCard.querySelector('.alt-image');
        
        imageDots.forEach(dot => {
            dot.addEventListener('click', () => {
                // Quitar clase active de todos los puntos e imágenes
                imageDots.forEach(d => d.classList.remove('active'));
                mainImage.classList.remove('active');
                altImage.classList.remove('active');
                
                // Añadir clase active al punto seleccionado y su imagen correspondiente
                dot.classList.add('active');
                if (dot.dataset.image === 'main') {
                    mainImage.classList.add('active');
                } else {
                    altImage.classList.add('active');
                }
            });
        });
        
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
    
    initializeProducts();
    setupEventListeners();
    updateCurrentYear();
    
    // La funcionalidad de importación de WhatsApp ha sido eliminada
});