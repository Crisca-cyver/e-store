/**
 * E-Store - Aplicación principal
 * Sistema de tienda online con integración a Google Sheets
 * 
 * @author Tu Nombre
 * @version 1.0.0
 * @description Aplicación de e-commerce que carga productos desde Google Sheets
 */

class EStore {
    constructor(config) {
        this.config = {
            sheetId: config.sheetId || "1V517_5Mb2J3yJWYNSJz6jQrJf0alLOocBUcghgg1b7s",
            gid: config.gid || "0",
            containerId: config.containerId || "products-container",
            counterElementId: config.counterElementId || "results-count",
            ...config
        };
        
        this.products = [];
        this.isLoading = false;
        
        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    // Dentro de la clase EStore, agregar el método:
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle.querySelector('i');
        
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
    
    // En el método init(), agregar:
    init() {
        this.setupEventListeners();
        this.setupThemeToggle(); // Agregar esta línea
        this.updateCurrentYear();
        this.loadProducts();
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM cargado, inicializando E-Store...');
            this.updateCurrentYear();
        });

        // Listener para recargar productos si es necesario
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });
    }

    /**
     * Actualiza el año actual en el footer
     */
    updateCurrentYear() {
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
            console.log('Año actualizado:', new Date().getFullYear());
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
            console.log('Ya hay una carga en progreso...');
            return;
        }

        try {
            this.isLoading = true;
            console.log('Iniciando carga de productos...');

            // Verificar dependencias
            if (!window.GoogleSheetsUtils) {
                throw new Error('GoogleSheetsUtils no está disponible');
            }

            // Mostrar mensaje de carga
            this.showLoadingMessage();

            // Construir URL de exportación
            const url = this.buildSheetUrl();
            console.log('Cargando desde URL:', url);

            // Cargar y procesar datos
            const csvText = await this.fetchCsvData(url);
            const products = window.GoogleSheetsUtils.convertCsvToProducts(csvText);

            if (products.length === 0) {
                throw new Error('No se encontraron productos en el CSV');
            }

            this.products = products;
            this.displayProducts(products);
            this.updateProductCounter(products.length);

            console.log(`✅ ${products.length} productos cargados exitosamente`);

        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            this.showErrorMessage(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Construye la URL de Google Sheets
     */
    buildSheetUrl() {
        let url = `https://docs.google.com/spreadsheets/d/${this.config.sheetId}/export?format=csv`;
        if (this.config.gid !== "0") {
            url += `&gid=${this.config.gid}`;
        }
        return url;
    }

    /**
     * Obtiene datos CSV desde Google Sheets
     */
    async fetchCsvData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log(`📄 CSV cargado, longitud: ${csvText.length} caracteres`);
        
        return csvText;
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
                    Cargando productos desde Google Sheets...
                </div>
            `;
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
     */
    updateProductCounter(count) {
        const counterElement = document.getElementById(this.config.counterElementId);
        if (counterElement) {
            counterElement.textContent = `${count} productos encontrados`;
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
     */
    processImageUrl(originalUrl, index) {
        try {
            if (!originalUrl) {
                return 'assets/images/placeholder.jpg';
            }

            const processedUrl = window.GoogleSheetsUtils.fixImageUrl(originalUrl);
            console.log(`🖼️ Producto ${index + 1} - URL procesada:`, processedUrl);
            return processedUrl;

        } catch (error) {
            console.error(`❌ Error procesando imagen para producto ${index + 1}:`, error);
            return 'assets/images/placeholder.jpg';
        }
    }

    /**
     * Configura event listeners para imágenes
     */
    setupImageEventListeners(img, index) {
        img.addEventListener('load', () => {
            console.log(`✅ Imagen cargada - Producto ${index + 1}:`, img.src);
            img.classList.add('loaded');
        });

        img.addEventListener('error', () => {
            console.error(`❌ Error cargando imagen - Producto ${index + 1}:`, img.src);
            img.src = 'assets/images/placeholder.jpg';
            img.classList.add('error');
        });
    }

    /**
     * Formatea el precio
     */
    formatPrice(price) {
        const numPrice = parseFloat(price || 0);
        return numPrice.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Busca productos
     */
    searchProducts(query) {
        if (!query.trim()) {
            this.displayProducts(this.products);
            return;
        }

        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );

        this.displayProducts(filteredProducts);
        this.updateProductCounter(filteredProducts.length);
    }

    /**
     * Filtra productos por categoría
     */
    filterByCategory(category) {
        if (!category || category === 'all') {
            this.displayProducts(this.products);
            return;
        }

        const filteredProducts = this.products.filter(product => 
            product.category && product.category.toLowerCase() === category.toLowerCase()
        );

        this.displayProducts(filteredProducts);
        this.updateProductCounter(filteredProducts.length);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Configuración de la aplicación
    const config = {
        sheetId: "1V517_5Mb2J3yJWYNSJz6jQrJf0alLOocBUcghgg1b7s",
        gid: "0"
    };

    // Crear instancia global de la aplicación
    window.estore = new EStore(config);
});