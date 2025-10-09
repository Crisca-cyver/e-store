/**
 * Unit Tests para GoogleSheetsUtils
 * Tests para las utilidades de Google Sheets
 */

describe('GoogleSheetsUtils', () => {
    let utils;

    beforeEach(() => {
        // Crear instancia fresca para cada test
        utils = new window.GoogleSheetsUtils();
    });

    describe('convertGoogleDriveUrl', () => {
        test('debe convertir URL de Google Drive correctamente', () => {
            const input = 'https://drive.google.com/file/d/1ABC123/view';
            const expected = 'https://images.weserv.nl/?url=https%3A//drive.google.com/uc%3Fexport%3Dview%26id%3D1ABC123';

            const result = utils.convertGoogleDriveUrl(input);
            expect(result).toBe(expected);
        });

        test('debe retornar imagen placeholder para URLs inválidas', () => {
            const result = utils.convertGoogleDriveUrl(null);
            expect(result).toBe('assets/images/placeholder.jpg');
        });

        test('debe mantener URLs externas sin cambios', () => {
            const input = 'https://example.com/image.jpg';
            const result = utils.convertGoogleDriveUrl(input);
            expect(result).toBe(input);
        });
    });

    describe('extractFileId', () => {
        test('debe extraer ID de diferentes formatos de URL', () => {
            const testCases = [
                { input: 'https://drive.google.com/file/d/1ABC123/view', expected: '1ABC123' },
                { input: 'https://drive.google.com/open?id=1ABC123', expected: '1ABC123' },
                { input: 'https://drive.google.com/d/1ABC123', expected: '1ABC123' }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = utils.extractFileId(input);
                expect(result).toBe(expected);
            });
        });

        test('debe retornar null para URLs sin ID', () => {
            const result = utils.extractFileId('https://drive.google.com/');
            expect(result).toBeNull();
        });
    });

    describe('convertCsvToProducts', () => {
        test('debe convertir CSV válido a productos', () => {
            const csvText = 'Nombre,Precio,Descripción\nProducto 1,100,Descripción 1\nProducto 2,200,Descripción 2';
            const products = utils.convertCsvToProducts(csvText);

            expect(products).toHaveLength(2);
            expect(products[0]).toHaveProperty('name', 'Producto 1');
            expect(products[0]).toHaveProperty('price', 100);
            expect(products[1]).toHaveProperty('name', 'Producto 2');
            expect(products[1]).toHaveProperty('price', 200);
        });

        test('debe manejar CSV vacío', () => {
            const result = utils.convertCsvToProducts('');
            expect(result).toEqual([]);
        });

        test('debe validar productos requeridos', () => {
            const csvText = 'Nombre,Precio\nProducto 1,100\n,200'; // Segundo producto sin nombre
            const products = utils.convertCsvToProducts(csvText);

            expect(products).toHaveLength(1); // Solo el primer producto debería ser válido
            expect(products[0].name).toBe('Producto 1');
        });
    });

    describe('parsePrice', () => {
        test('debe parsear precios correctamente', () => {
            expect(utils.parsePrice('100')).toBe(100);
            expect(utils.parsePrice('$100')).toBe(100);
            expect(utils.parsePrice('100.50')).toBe(100.50);
            expect(utils.parsePrice('1,000.50')).toBe(1000.50);
        });

        test('debe retornar 0 para precios inválidos', () => {
            expect(utils.parsePrice('')).toBe(0);
            expect(utils.parsePrice('abc')).toBe(0);
            expect(utils.parsePrice(null)).toBe(0);
        });
    });

    describe('isValidProduct', () => {
        test('debe validar productos correctamente', () => {
            const validProduct = { name: 'Producto', price: 100 };
            const invalidProduct1 = { name: '', price: 100 };
            const invalidProduct2 = { name: 'Producto', price: -10 };
            const invalidProduct3 = { name: 'Producto' };

            expect(utils.isValidProduct(validProduct)).toBe(true);
            expect(utils.isValidProduct(invalidProduct1)).toBe(false);
            expect(utils.isValidProduct(invalidProduct2)).toBe(false);
            expect(utils.isValidProduct(invalidProduct3)).toBe(false);
        });
    });
});