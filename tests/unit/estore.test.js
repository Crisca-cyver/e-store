/**
 * Unit Tests para EStore
 * Tests para la clase principal de la aplicación
 */

describe('EStore', () => {
    let estore;
    let mockConfig;

    beforeEach(() => {
        // Limpiar DOM
        document.body.innerHTML = '';

        // Crear elementos mock
        const container = document.createElement('div');
        container.id = 'products-container';
        document.body.appendChild(container);

        const counter = document.createElement('div');
        counter.id = 'results-count';
        document.body.appendChild(counter);

        const searchInput = document.createElement('input');
        searchInput.id = 'search-input';
        document.body.appendChild(searchInput);

        // Configuración mock
        mockConfig = {
            sheetId: 'test-sheet-id',
            gid: '0',
            containerId: 'products-container',
            counterElementId: 'results-count',
            searchInputId: 'search-input'
        };

        // Mock de GoogleSheetsUtils
        window.GoogleSheetsUtils = class {
            loadProductsFromPublicSheet() {
                return Promise.resolve([
                    { id: 1, name: 'Producto 1', price: 100, description: 'Descripción 1' },
                    { id: 2, name: 'Producto 2', price: 200, description: 'Descripción 2' }
                ]);
            }
        };

        estore = new EStore(mockConfig);
    });

    describe('constructor', () => {
        test('debe inicializar correctamente', () => {
            expect(estore.config.sheetId).toBe('test-sheet-id');
            expect(estore.config.gid).toBe('0');
            expect(estore.products).toEqual([]);
            expect(estore.isLoading).toBe(false);
        });

        test('debe usar configuración por defecto cuando no se proporciona', () => {
            const defaultEstore = new EStore();
            expect(defaultEstore.config.sheetId).toBe(window.EStoreConfig.googleSheets.defaultSheetId);
        });
    });

    describe('formatPrice', () => {
        test('debe formatear precios correctamente', () => {
            const result = estore.formatPrice(1234.56);
            expect(result).toContain('$');
            expect(result).toContain('1.234,56');
        });

        test('debe manejar precios inválidos', () => {
            const result = estore.formatPrice(null);
            expect(result).toBe('$0,00');
        });
    });

    describe('searchProducts', () => {
        beforeEach(() => {
            // Configurar productos de prueba
            estore.products = [
                { id: 1, name: 'Producto Uno', price: 100, description: 'Descripción uno' },
                { id: 2, name: 'Producto Dos', price: 200, description: 'Descripción dos' },
                { id: 3, name: 'Otro Producto', price: 300, description: 'Otra descripción' }
            ];
        });

        test('debe filtrar productos por nombre', () => {
            estore.searchProducts('Producto Uno');
            expect(estore.filteredProducts).toHaveLength(1);
            expect(estore.filteredProducts[0].name).toBe('Producto Uno');
        });

        test('debe filtrar productos por descripción', () => {
            estore.searchProducts('descripción uno');
            expect(estore.filteredProducts).toHaveLength(1);
            expect(estore.filteredProducts[0].description).toBe('Descripción uno');
        });

        test('debe mostrar todos los productos cuando no hay búsqueda', () => {
            estore.searchProducts('');
            expect(estore.filteredProducts).toHaveLength(3);
        });

        test('debe sanitizar entrada de búsqueda', () => {
            estore.searchProducts('<script>alert("xss")</script>Producto');
            expect(estore.filteredProducts).toHaveLength(2); // Debería encontrar "Producto Uno" y "Producto Dos"
        });
    });

    describe('updateProductCounter', () => {
        test('debe actualizar el contador correctamente', () => {
            estore.updateProductCounter(5);
            const counterElement = document.getElementById('results-count');
            expect(counterElement.textContent).toBe('5 productos encontrados');
        });
    });
});