/**
 * Configuración centralizada de E-Store
 * Contiene todas las constantes y configuraciones de la aplicación
 *
 * @author Tu Nombre
 * @version 1.0.0
 */

// Implementar patrón de módulo con IIFE para mejor encapsulación
const EStoreConfig = (function() {
    'use strict';

    // Configuración interna del módulo
    const config = {
    // Configuración de Google Sheets
    googleSheets: {
        defaultSheetId: "1V517_5Mb2J3yJWYNSJz6jQrJf0alLOocBUcghgg1b7s",
        defaultGid: "0",
        exportFormat: "csv"
    },

    // Configuración de la aplicación
    app: {
        name: "E-Store",
        version: "1.0.0",
        defaultTheme: "light",
        themeStorageKey: "theme"
    },

    // Selectores de DOM
    selectors: {
        productsContainer: "products-container",
        resultsCounter: "results-count",
        searchInput: "search-input",
        themeToggle: "theme-toggle",
        currentYear: "current-year"
    },

    // Configuración de UI
    ui: {
        loadingMessage: "Cargando productos desde Google Sheets...",
        errorRetryText: "Reintentar",
        noProductsMessage: "No se encontraron productos",
        searchPlaceholder: "Buscar productos...",
        resultsText: (count) => `${count} productos encontrados`
    },

    // Configuración de imágenes
    images: {
        placeholder: "assets/images/placeholder.jpg",
        proxyUrl: "https://images.weserv.nl/"
    },

    // Configuración de formato
    formatting: {
        currency: "ARS",
        locale: "es-AR",
        priceDecimals: 2
    },

    // Configuración de búsqueda
    search: {
        debounceDelay: 300,
        minQueryLength: 1
    },

    // Configuración de API y timeouts
    api: {
        requestTimeout: 10000, // 10 segundos
        retryAttempts: 3,
        retryDelay: 1000 // 1 segundo
    }
};

// Retornar la configuración del módulo
return config;

})(); // Fin del IIFE

// Exportar configuración para uso global
window.EStoreConfig = EStoreConfig;

console.log('✅ Configuración de E-Store cargada');