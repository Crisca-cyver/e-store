/**
 * Google Sheets Utilities
 * Utilidades para trabajar con Google Sheets y Google Drive
 * 
 * @author Tu Nombre
 * @version 2.0.0
 * @description Manejo de URLs de Google Drive y conversión de datos CSV
 */

class GoogleSheetsUtils {
    constructor() {
        this.imageProxyUrl = 'https://images.weserv.nl/';
        this.placeholderImage = 'assets/images/placeholder.jpg';
    }

    /**
     * Convierte URL de Google Drive a formato accesible
     * @param {string} url - URL original de Google Drive
     * @returns {string} URL procesada
     */
    convertGoogleDriveUrl(url) {
        console.log('🔗 Procesando URL de Google Drive:', url);
        
        if (!url || typeof url !== 'string') {
            console.warn('⚠️ URL vacía o inválida, usando placeholder');
            return this.placeholderImage;
        }

        // Si ya es una URL de placeholder o externa válida, devolverla tal como está
        if (url.includes('placeholder') || url.startsWith('http') && !url.includes('drive.google.com')) {
            return url;
        }

        let fileId = this.extractFileId(url);
        
        if (fileId) {
            // Usar proxy CORS para evitar bloqueos
            const proxyUrl = `${this.imageProxyUrl}?url=drive.google.com/uc?export=view%26id=${fileId}`;
            console.log('✅ URL de Google Drive convertida con proxy:', proxyUrl);
            return proxyUrl;
        }
        
        console.warn('⚠️ No se pudo extraer el ID del archivo de la URL:', url);
        return this.placeholderImage;
    }

    /**
     * Extrae el ID de archivo de diferentes formatos de URL de Google Drive
     * @param {string} url - URL de Google Drive
     * @returns {string|null} ID del archivo o null si no se encuentra
     */
    extractFileId(url) {
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9_-]+)/,           // /file/d/ID
            /id=([a-zA-Z0-9_-]+)/,                   // id=ID
            /\/open\?id=([a-zA-Z0-9_-]+)/,          // /open?id=ID
            /\/d\/([a-zA-Z0-9_-]+)/                  // /d/ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                console.log('🎯 ID de archivo extraído:', match[1]);
                return match[1];
            }
        }

        return null;
    }

    /**
     * Alias para mantener compatibilidad con código existente
     * @param {string} url - URL a procesar
     * @returns {string} URL procesada
     */
    fixImageUrl(url) {
        return this.convertGoogleDriveUrl(url);
    }

    /**
     * Convierte texto CSV a array de productos
     * @param {string} csvText - Texto CSV
     * @returns {Array} Array de objetos producto
     */
    convertCsvToProducts(csvText) {
        console.log('📊 Iniciando conversión de CSV a productos...');
        
        if (!csvText || typeof csvText !== 'string') {
            throw new Error('CSV text is required and must be a string');
        }

        try {
            const lines = this.parseCsvLines(csvText);
            
            if (lines.length < 2) {
                throw new Error('CSV debe tener al menos una fila de encabezados y una fila de datos');
            }

            const headers = this.parseHeaders(lines[0]);
            const products = this.parseDataRows(lines.slice(1), headers);

            console.log(`✅ ${products.length} productos convertidos exitosamente`);
            return products;

        } catch (error) {
            console.error('❌ Error convirtiendo CSV:', error);
            throw new Error(`Error procesando CSV: ${error.message}`);
        }
    }

    /**
     * Parsea las líneas del CSV
     * @param {string} csvText - Texto CSV
     * @returns {Array} Array de líneas
     */
    parseCsvLines(csvText) {
        return csvText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    /**
     * Parsea los encabezados del CSV
     * @param {string} headerLine - Línea de encabezados
     * @returns {Object} Mapeo de índices a nombres de columnas
     */
    parseHeaders(headerLine) {
        const rawHeaders = this.parseCsvRow(headerLine);
        const headerMap = {};

        rawHeaders.forEach((header, index) => {
            const cleanHeader = header.toLowerCase().trim();
            headerMap[index] = this.mapHeaderName(cleanHeader);
        });

        console.log('📋 Encabezados mapeados:', headerMap);
        return headerMap;
    }

    /**
     * Mapea nombres de encabezados a nombres estándar
     * @param {string} header - Nombre del encabezado
     * @returns {string} Nombre estándar
     */
    mapHeaderName(header) {
        const headerMappings = {
            'nombre': 'name',
            'name': 'name',
            'producto': 'name',
            'title': 'name',
            
            'descripcion': 'description',
            'description': 'description',
            'desc': 'description',
            
            'precio': 'price',
            'price': 'price',
            'cost': 'price',
            'valor': 'price',
            
            'imagen': 'image',
            'image': 'image',
            'imagenurl': 'image',
            'imageurl': 'image',
            'img': 'image',
            
            'categoria': 'category',
            'category': 'category',
            'cat': 'category',
            
            'stock': 'stock',
            'cantidad': 'stock',
            'inventory': 'stock',
            
            'id': 'id',
            'codigo': 'id',
            'sku': 'id'
        };

        return headerMappings[header] || header;
    }

    /**
     * Parsea las filas de datos
     * @param {Array} dataLines - Líneas de datos
     * @param {Object} headers - Mapeo de encabezados
     * @returns {Array} Array de productos
     */
    parseDataRows(dataLines, headers) {
        const products = [];

        dataLines.forEach((line, index) => {
            try {
                const row = this.parseCsvRow(line);
                const product = this.createProductFromRow(row, headers, index);
                
                if (this.isValidProduct(product)) {
                    products.push(product);
                } else {
                    console.warn(`⚠️ Producto inválido en fila ${index + 2}:`, product);
                }
            } catch (error) {
                console.error(`❌ Error procesando fila ${index + 2}:`, error);
            }
        });

        return products;
    }

    /**
     * Parsea una fila CSV individual
     * @param {string} row - Fila CSV
     * @returns {Array} Array de valores
     */
    parseCsvRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Crea un objeto producto desde una fila de datos
     * @param {Array} row - Fila de datos
     * @param {Object} headers - Mapeo de encabezados
     * @param {number} index - Índice de la fila
     * @returns {Object} Objeto producto
     */
    createProductFromRow(row, headers, index) {
        const product = {
            id: index + 1, // ID por defecto
            name: '',
            description: '',
            price: 0,
            image: '',
            category: '',
            stock: null
        };

        // Mapear datos de la fila al producto
        Object.keys(headers).forEach(colIndex => {
            const fieldName = headers[colIndex];
            const value = row[colIndex] || '';
            
            if (fieldName && value) {
                product[fieldName] = this.processFieldValue(fieldName, value);
            }
        });

        // Procesar imagen
        if (product.image) {
            product.image = this.convertGoogleDriveUrl(product.image);
        }

        console.log(`🏷️ Producto creado:`, {
            id: product.id,
            name: product.name,
            price: product.price
        });

        return product;
    }

    /**
     * Procesa el valor de un campo específico
     * @param {string} fieldName - Nombre del campo
     * @param {string} value - Valor del campo
     * @returns {any} Valor procesado
     */
    processFieldValue(fieldName, value) {
        switch (fieldName) {
            case 'price':
                return this.parsePrice(value);
            case 'stock':
                return this.parseStock(value);
            case 'id':
                return value.toString();
            default:
                return value.toString().trim();
        }
    }

    /**
     * Parsea el precio
     * @param {string} priceStr - String del precio
     * @returns {number} Precio numérico
     */
    parsePrice(priceStr) {
        if (!priceStr) return 0;
        
        // Remover símbolos de moneda y espacios
        const cleanPrice = priceStr
            .toString()
            .replace(/[$€£¥₹₽]/g, '')
            .replace(/[,\s]/g, '')
            .trim();
        
        const price = parseFloat(cleanPrice);
        return isNaN(price) ? 0 : price;
    }

    /**
     * Parsea el stock
     * @param {string} stockStr - String del stock
     * @returns {number|null} Stock numérico o null
     */
    parseStock(stockStr) {
        if (!stockStr) return null;
        
        const stock = parseInt(stockStr.toString().trim());
        return isNaN(stock) ? null : stock;
    }

    /**
     * Valida si un producto es válido
     * @param {Object} product - Objeto producto
     * @returns {boolean} True si es válido
     */
    isValidProduct(product) {
        return product && 
               product.name && 
               product.name.trim().length > 0 &&
               typeof product.price === 'number' &&
               product.price >= 0;
    }

    /**
     * Obtiene estadísticas de los productos
     * @param {Array} products - Array de productos
     * @returns {Object} Estadísticas
     */
    getProductStats(products) {
        if (!Array.isArray(products) || products.length === 0) {
            return {
                total: 0,
                withImages: 0,
                categories: [],
                priceRange: { min: 0, max: 0, avg: 0 }
            };
        }

        const stats = {
            total: products.length,
            withImages: products.filter(p => p.image && !p.image.includes('placeholder')).length,
            categories: [...new Set(products.map(p => p.category).filter(Boolean))],
            priceRange: this.calculatePriceRange(products)
        };

        console.log('📊 Estadísticas de productos:', stats);
        return stats;
    }

    /**
     * Calcula el rango de precios
     * @param {Array} products - Array de productos
     * @returns {Object} Rango de precios
     */
    calculatePriceRange(products) {
        const prices = products.map(p => p.price).filter(p => p > 0);
        
        if (prices.length === 0) {
            return { min: 0, max: 0, avg: 0 };
        }

        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
        };
    }
}

// Crear instancia global para compatibilidad
window.GoogleSheetsUtils = new GoogleSheetsUtils();

// También mantener la referencia anterior para compatibilidad
window.googleSheetsUtils = {
    fixImageUrl: (url) => window.GoogleSheetsUtils.fixImageUrl(url),
    convertGoogleDriveUrl: (url) => window.GoogleSheetsUtils.convertGoogleDriveUrl(url),
    convertCsvToProducts: (csv) => window.GoogleSheetsUtils.convertCsvToProducts(csv)
};

console.log('✅ Google Sheets Utilities cargadas correctamente');