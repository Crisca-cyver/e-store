// Funciones para cargar productos desde Google Sheets

// Objeto global para exponer las funciones de Google Sheets
window.googleSheetsUtils = {};

/**
 * Carga productos desde una hoja de Google Sheets pública
 * @param {string} sheetId - El ID de la hoja de Google Sheets
 * @param {string} sheetName - El nombre de la hoja dentro del documento (opcional)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de productos
 */
window.googleSheetsUtils.loadProductsFromSheet = async function(sheetId, sheetName = 'Sheet1') {
    try {
        // Construir la URL para la API de Google Sheets
        // Usamos la API pública que no requiere autenticación
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=YOUR_API_KEY`;
        
        console.log('Cargando productos desde Google Sheets:', sheetId);
        
        // Realizar la solicitud a la API
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error al cargar datos de Google Sheets: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Convertir los datos de la hoja a objetos de producto
        return window.googleSheetsUtils.convertSheetDataToProducts(data.values);
    } catch (error) {
        console.error('Error al cargar productos desde Google Sheets:', error);
        return [];
    }
};

/**
 * Convierte los datos de la hoja de Google Sheets a objetos de producto
 * @param {Array<Array<string>>} values - Los valores de la hoja de cálculo
 * @returns {Array<Object>} - Array de objetos de producto
 */
window.googleSheetsUtils.convertSheetDataToProducts = function(values) {
    if (!values || values.length < 2) {
        console.error('Datos de hoja insuficientes o formato incorrecto');
        return [];
    }
    
    // La primera fila contiene los encabezados
    const headers = values[0];
    
    // Mapear los índices de las columnas requeridas
    const columnMap = {
        id: headers.indexOf('id'),
        name: headers.indexOf('name'),
        price: headers.indexOf('price'),
        currency: headers.indexOf('currency'),
        category: headers.indexOf('category'),
        featured: headers.indexOf('featured')
    };
    
    // Verificar que existan las columnas requeridas
    if (columnMap.id === -1 || columnMap.name === -1 || columnMap.price === -1) {
        console.error('Faltan columnas requeridas en la hoja de cálculo');
        return [];
    }
    
    // Convertir las filas de datos a objetos de producto
    const products = [];
    
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        
        // Saltar filas vacías
        if (!row || row.length === 0) continue;
        
        const product = {
            id: columnMap.id !== -1 ? (parseInt(row[columnMap.id]) || i) : i,
            name: row[columnMap.name] || 'Producto sin nombre',
            price: parseFloat(row[columnMap.price].replace(/[^0-9.-]+/g, '')) || 0,
            currency: (columnMap.currency !== -1 && row[columnMap.currency]) ? row[columnMap.currency] : '$',
            category: (columnMap.category !== -1 && row[columnMap.category]) ? row[columnMap.category] : 'Sin categoría',
            featured: (columnMap.featured !== -1 && row[columnMap.featured] === 'true'),
            description: columnMap.description !== -1 ? row[columnMap.description] : '',
            image: columnMap.image !== -1 && row[columnMap.image] ? row[columnMap.image] : 'images/placeholder.jpg'
        };
        
        console.log('Producto procesado:', product);
        
        products.push(product);
    }
    
    console.log(`Se cargaron ${products.length} productos desde Google Sheets`);
    return products;
};

/**
 * Versión simplificada para cargar desde una hoja pública sin API key
 * Usa la exportación CSV que no requiere autenticación
 * @param {string} sheetId - El ID de la hoja de Google Sheets
 * @param {number} gid - El ID de la subhoja (0 por defecto)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de productos
 */
window.googleSheetsUtils.loadProductsFromPublicSheet = async function(sheetId, gid = 0) {
    try {
        // Construir la URL para la exportación CSV pública
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        
        console.log('Cargando productos desde hoja pública:', sheetId);
        
        // Realizar la solicitud
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error al cargar datos de Google Sheets: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // Convertir CSV a array de productos
        return window.googleSheetsUtils.convertCsvToProducts(csvText);
    } catch (error) {
        console.error('Error al cargar productos desde Google Sheets:', error);
        return [];
    }
};

/**
 * Convierte texto CSV a objetos de producto
 * @param {string} csvText - El texto CSV de la hoja
 * @returns {Array<Object>} - Array de objetos de producto
 */
window.googleSheetsUtils.convertCsvToProducts = function(csvText) {
    if (!csvText) {
        console.error('Texto CSV vacío');
        return [];
    }
    
    // Dividir por líneas y eliminar líneas vacías
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
        console.error('Datos CSV insuficientes');
        return [];
    }
    
    console.log('Contenido CSV:', csvText.substring(0, 200) + '...');
    console.log('Líneas detectadas:', lines.length);
    
    // Función para analizar una línea CSV (maneja comillas y comas dentro de campos)
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current); // Añadir el último campo
        return result;
    };
    
    // Analizar encabezados
    const headers = parseCSVLine(lines[0]);
    console.log('Encabezados detectados:', headers);
    
    // Modo simple: usar las primeras dos columnas como nombre y precio
    // Esto funciona para cualquier CSV que tenga al menos dos columnas
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        
        // Saltar filas vacías o con menos de 2 columnas
        if (!row || row.length < 2) continue;
        
        // Crear producto con los datos disponibles
        const product = {
            id: i,
            name: row[0] || 'Producto sin nombre',
            price: parseFloat(row[1].replace(/[^0-9.-]+/g, '')) || 0,
            currency: '$',
            category: 'Sin categoría',
            featured: false,
            description: row.length > 2 ? row[2] : '',
            image: row.length > 3 && row[3] ? row[3] : 'images/placeholder.jpg'
        };
        
        console.log('Producto procesado:', product);
        products.push(product);
    }
    
    console.log(`Se cargaron ${products.length} productos desde Google Sheets CSV`);
    return products;
};