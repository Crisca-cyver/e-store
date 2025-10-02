/**
 * E-Store - Aplicación principal
 * Sistema de tienda online con integración a Google Sheets
 * 
 * @author Tu Nombre
 * @version 1.0.0
 * @description Aplicación de e-commerce que carga productos desde Google Sheets
 */

class EStore {
    constructor(config = {}) {
        // Verificar que la configuración global esté disponible
        if (!window.EStoreConfig) {
            throw new Error('EStoreConfig no está disponible. Asegúrate de cargar config.js antes de main.js');
        }

        // Fusionar configuración proporcionada con valores por defecto
        this.config = {
            sheetId: config.sheetId || window.EStoreConfig.googleSheets.defaultSheetId,
            gid: config.gid || window.EStoreConfig.googleSheets.defaultGid,
            containerId: config.containerId || window.EStoreConfig.selectors.productsContainer,
            counterElementId: config.counterElementId || window.EStoreConfig.selectors.resultsCounter,
            searchInputId: config.searchInputId || window.EStoreConfig.selectors.searchInput,
            ...config
        };

        this.products = [];
        this.filteredProducts = [];
        this.isLoading = false;

        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        console.log('🚀 Inicializando E-Store...');
        this.setupEventListeners();
        this.setupThemeToggle();
        this.updateCurrentYear();
        this.loadProducts();
    }

    /**
     * Configura el alternador de tema oscuro/claro
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById(window.EStoreConfig.selectors.themeToggle);
        if (!themeToggle) {
            console.warn(`⚠️ Elemento '${window.EStoreConfig.selectors.themeToggle}' no encontrado`);
            return;
        }

        const themeIcon = themeToggle.querySelector('i');
        if (!themeIcon) {
            console.warn('⚠️ Icono del theme-toggle no encontrado');
            return;
        }

        // Cargar tema guardado o usar tema por defecto
        const savedTheme = localStorage.getItem(window.EStoreConfig.app.themeStorageKey) ||
                          window.EStoreConfig.app.defaultTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

        // Configurar event listener
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem(window.EStoreConfig.app.themeStorageKey, newTheme);
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

            console.log(`🎨 Tema cambiado a: ${newTheme}`);
        });

        console.log('✅ Theme toggle configurado');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Event listener para DOM cargado
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM cargado completamente');
        });

        // Listener para cambios de hash (navegación)
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Configurar búsqueda en tiempo real
        this.setupSearchFunctionality();

        console.log('✅ Event listeners configurados');
    }

    /**
     * Configura la funcionalidad de búsqueda
     */
    setupSearchFunctionality() {
        const searchInput = document.getElementById(this.config.searchInputId);
        if (!searchInput) {
            console.warn(`⚠️ Elemento de búsqueda '${this.config.searchInputId}' no encontrado`);
            return;
        }

        let searchTimeout;

        searchInput.addEventListener('input', (event) => {
            const query = event.target.value.trim();

            // Debounce para evitar búsquedas excesivas
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchProducts(query);
            }, window.EStoreConfig.search.debounceDelay);
        });

        console.log('🔍 Funcionalidad de búsqueda configurada');
    }

    /**
     * Actualiza el año actual en el footer
     */
    updateCurrentYear() {
        const yearElement = document.getElementById(window.EStoreConfig.selectors.currentYear);
        if (yearElement) {
            const currentYear = new Date().getFullYear();
            yearElement.textContent = currentYear;
            console.log(`📅 Año actualizado: ${currentYear}`);
        } else {
            console.warn(`⚠️ Elemento '${window.EStoreConfig.selectors.currentYear}' no encontrado`);
        }
    }

    /**
     * Maneja cambios de ruta
     */
    handleRouteChange() {
        const urlParams = new URLSearchParams(window.location.search);
        const newSheetId = urlParams.get('sheetId');
        const newGid = urlParams.get('gid');

        if (newSheetId && newSheetId !== this.config.sheetId) {
            this.config.sheetId = newSheetId;
            this.config.gid = newGid || "0";
            this.loadProducts();
        }
    }

    /**
     * Carga productos desde Google Sheets
     */
    async loadProducts() {
        if (this.isLoading) {
            console.log('⏳ Ya hay una carga en progreso, ignorando solicitud...');
            return;
        }

        try {
            this.isLoading = true;
            console.log('🚀 Iniciando carga de productos desde Google Sheets...');

            // Verificar dependencias
            if (!window.GoogleSheetsUtils) {
                throw new Error('GoogleSheetsUtils no está disponible. Verifica que el script esté cargado correctamente.');
            }

            // Mostrar mensaje de carga
            this.showLoadingMessage();

            // Usar el método mejorado de GoogleSheetsUtils
            const products = await window.GoogleSheetsUtils.loadProductsFromPublicSheet(
                this.config.sheetId,
                parseInt(this.config.gid) || 0
            );

            if (!products || products.length === 0) {
                throw new Error('No se encontraron productos válidos en la hoja de Google Sheets');
            }

            // Almacenar productos y filtrados
            this.products = products;
            this.filteredProducts = [...products];

            // Mostrar productos
            this.displayProducts(products);
            this.updateProductCounter(products.length);

            console.log(`✅ ${products.length} productos cargados y mostrados exitosamente`);

        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            this.showErrorMessage(error.message || 'Error desconocido al cargar productos');
        } finally {
            this.isLoading = false;
        }
    }


    /**
     * Muestra mensaje de carga
     */
    showLoadingMessage() {
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i>
                    ${window.EStoreConfig.ui.loadingMessage}
                </div>
            `;
            console.log('⏳ Mostrando mensaje de carga');
        }
    }

    /**
     * Muestra mensaje de error
     */
    showErrorMessage(message) {
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar productos</h3>
                    <p>${message}</p>
                    <button onclick="window.estore.loadProducts()" class="retry-btn">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Actualiza el contador de productos
     * @param {number} count - Número de productos a mostrar
     */
    updateProductCounter(count) {
        const counterElement = document.getElementById(this.config.counterElementId);
        if (counterElement) {
            counterElement.textContent = window.EStoreConfig.ui.resultsText(count);
            console.log(`📊 Contador actualizado: ${count} productos`);
        }
    }

    /**
     * Muestra los productos en el DOM
     */
    displayProducts(products) {
        console.log(`🎨 Renderizando ${products.length} productos...`);
        const container = document.getElementById(this.config.containerId);
        
        if (!container) {
            console.error('❌ Contenedor de productos no encontrado');
            return;
        }

        container.innerHTML = "";

        products.forEach((product, index) => {
            const productCard = this.createProductCard(product, index);
            container.appendChild(productCard);
        });

        console.log('✅ Productos renderizados en el DOM');
    }

    /**
     * Crea una tarjeta de producto
     */
    createProductCard(product, index) {
        console.log(`🏷️ Creando tarjeta para producto ${index + 1}:`, product.name);

        const card = document.createElement("div");
        card.className = "product-card";
        card.setAttribute('data-product-id', product.id || index);

        // Procesar URL de imagen
        const imageUrl = this.processImageUrl(product.image, index);

        card.innerHTML = `
            <div class="product-image">
                <img src="${imageUrl}" 
                     alt="${product.name || "Producto"}" 
                     loading="lazy" 
                     data-product-id="${product.id || index}"
                     data-original-url="${product.image || ''}"
                     onerror="this.handleImageError(${index})"
                     onload="this.handleImageLoad(${index})">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name || "Producto sin nombre"}</div>
                <div class="product-description">${product.description || "Sin descripción"}</div>
                <div class="product-price">$${this.formatPrice(product.price)}</div>
                ${product.stock ? `<div class="product-stock">Stock: ${product.stock}</div>` : ''}
            </div>
        `;

        // Agregar event listeners a la imagen
        const img = card.querySelector('img');
        this.setupImageEventListeners(img, index);

        return card;
    }

    /**
     * Procesa la URL de imagen
     * @param {string} originalUrl - URL original de la imagen
     * @param {number} index - Índice del producto
     * @returns {string} URL procesada
     */
    processImageUrl(originalUrl, index) {
        try {
            if (!originalUrl) {
                return window.EStoreConfig.images.placeholder;
            }

            const processedUrl = window.GoogleSheetsUtils.fixImageUrl(originalUrl);
            console.log(`🖼️ Producto ${index + 1} - URL procesada:`, processedUrl);
            return processedUrl;

        } catch (error) {
            console.error(`❌ Error procesando imagen para producto ${index + 1}:`, error);
            return window.EStoreConfig.images.placeholder;
        }
    }

    /**
     * Configura event listeners para imágenes
     * @param {HTMLImageElement} img - Elemento de imagen
     * @param {number} index - Índice del producto
     */
    setupImageEventListeners(img, index) {
        img.addEventListener('load', () => {
            console.log(`✅ Imagen cargada - Producto ${index + 1}:`, img.src);
            img.classList.add('loaded');
        });

        img.addEventListener('error', () => {
            console.error(`❌ Error cargando imagen - Producto ${index + 1}:`, img.src);
            img.src = window.EStoreConfig.images.placeholder;
            img.classList.add('error');
        });
    }

    /**
     * Formatea el precio según la configuración regional
     * @param {number|string} price - Precio a formatear
     * @returns {string} Precio formateado
     */
    formatPrice(price) {
        const numPrice = parseFloat(price || 0);
        try {
            return numPrice.toLocaleString(window.EStoreConfig.formatting.locale, {
                style: 'currency',
                currency: window.EStoreConfig.formatting.currency,
                minimumFractionDigits: window.EStoreConfig.formatting.priceDecimals,
                maximumFractionDigits: window.EStoreConfig.formatting.priceDecimals
            });
        } catch (error) {
            // Fallback si la configuración regional no es válida
            console.warn('⚠️ Error en formato de precio, usando fallback:', error);
            return `$${numPrice.toFixed(window.EStoreConfig.formatting.priceDecimals)}`;
        }
    }

    /**
     * Busca productos por nombre o descripción
     * @param {string} query - Término de búsqueda
     */
    searchProducts(query) {
        // Validar y sanitizar la entrada
        if (typeof query !== 'string') {
            console.warn('⚠️ Query de búsqueda debe ser un string');
            query = '';
        }

        // Sanitizar: remover caracteres potencialmente peligrosos y limitar longitud
        const sanitizedQuery = query
            .trim()
            .replace(/[<>]/g, '') // Remover caracteres HTML
            .substring(0, 100); // Limitar a 100 caracteres

        console.log(`🔍 Buscando productos con query sanitizado: "${sanitizedQuery}"`);

        if (!sanitizedQuery) {
            // Mostrar todos los productos si no hay búsqueda
            this.filteredProducts = [...this.products];
            this.displayProducts(this.products);
            this.updateProductCounter(this.products.length);
            return;
        }

        // Validar que tenemos productos para buscar
        if (!Array.isArray(this.products) || this.products.length === 0) {
            console.warn('⚠️ No hay productos disponibles para búsqueda');
            this.filteredProducts = [];
            this.displayProducts([]);
            this.updateProductCounter(0);
            return;
        }

        // Filtrar productos que coincidan con la búsqueda
        this.filteredProducts = this.products.filter(product => {
            // Validar que el producto tenga las propiedades necesarias
            if (!product || typeof product !== 'object') {
                return false;
            }

            const searchTerm = sanitizedQuery.toLowerCase();
            const nameMatch = product.name && typeof product.name === 'string' &&
                            product.name.toLowerCase().includes(searchTerm);
            const descriptionMatch = product.description && typeof product.description === 'string' &&
                                   product.description.toLowerCase().includes(searchTerm);
            const categoryMatch = product.category && typeof product.category === 'string' &&
                                product.category.toLowerCase().includes(searchTerm);

            return nameMatch || descriptionMatch || categoryMatch;
        });

        console.log(`📊 ${this.filteredProducts.length} productos encontrados para "${sanitizedQuery}"`);

        this.displayProducts(this.filteredProducts);
        this.updateProductCounter(this.filteredProducts.length);
    }

}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Iniciando E-Store...');

        // Verificar dependencias críticas
        if (!window.EStoreConfig) {
            throw new Error('Configuración no cargada. Verifica que config.js esté incluido.');
        }

        if (!window.GoogleSheetsUtils) {
            throw new Error('GoogleSheetsUtils no disponible. Verifica que google-sheets.js esté incluido.');
        }

        // Configuración de la aplicación desde URL o valores por defecto
        const urlParams = new URLSearchParams(window.location.search);
        const config = {
            sheetId: validateSheetId(urlParams.get('sheetId')) || window.EStoreConfig.googleSheets.defaultSheetId,
            gid: validateGid(urlParams.get('gid')) || window.EStoreConfig.googleSheets.defaultGid
        };

        console.log('⚙️ Configuración aplicada:', config);

        // Funciones de validación
        function validateSheetId(sheetId) {
            if (!sheetId || typeof sheetId !== 'string') return null;
            // Validar formato de ID de Google Sheets (alphanumeric + hyphens + underscores)
            if (!/^[a-zA-Z0-9_-]+$/.test(sheetId)) {
                console.warn('⚠️ ID de hoja inválido en URL, usando valor por defecto');
                return null;
            }
            return sheetId;
        }

        function validateGid(gid) {
            if (!gid) return null;
            const numGid = parseInt(gid);
            if (isNaN(numGid) || numGid < 0) {
                console.warn('⚠️ GID inválido en URL, usando valor por defecto');
                return null;
            }
            return numGid.toString();
        }

        // Crear instancia global de la aplicación
        window.estore = new EStore(config);

        console.log('✅ E-Store inicializado correctamente');

    } catch (error) {
        console.error('❌ Error crítico al inicializar E-Store:', error);

        // Mostrar error crítico en la UI
        const container = document.getElementById(window.EStoreConfig?.selectors?.productsContainer || 'products-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al inicializar la aplicación</h3>
                    <p>${error.message}</p>
                    <p>Por favor, recarga la página o contacta al soporte técnico.</p>
                </div>
            `;
        }
    }
});