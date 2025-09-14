// Funciones para cargar productos desde Google Sheets

// Objeto global para exponer las funciones de Google Sheets
window.googleSheetsUtils = {};

/**
 * Convierte los datos de Google Sheets en formato JSON a objetos de producto
 * @param {Array<Object>} entries - Las entradas de la hoja de Google Sheets en formato JSON
 * @returns {Array<Object>} - Array de objetos de producto
 */
window.googleSheetsUtils.convertGoogleSheetsToProducts = function(entries) {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        console.error('Datos de Google Sheets insuficientes o formato incorrecto');
        return [];
    }
    
    try {
        // Mapear las entradas a objetos de producto
        return entries.map(entry => {
            // Extraer los valores de las celdas
            const id = entry['gsx$id'] ? entry['gsx$id']['$t'] : '';
            const name = entry['gsx$nombre'] ? entry['gsx$nombre']['$t'] : '';
            const description = entry['gsx$descripcion'] ? entry['gsx$descripcion']['$t'] : '';
            const price = entry['gsx$precio'] ? parseFloat(entry['gsx$precio']['$t']) : 0;
            const imageUrl = entry['gsx$imagen'] ? entry['gsx$imagen']['$t'] : '';
            const category = entry['gsx$categoria'] ? entry['gsx$categoria']['$t'] : '';
            
            // Crear el objeto de producto
            return {
                id: id || String(Date.now() + Math.floor(Math.random() * 1000)),
                name: name || 'Producto sin nombre',
                description: description || 'Sin descripción',
                price: isNaN(price) ? 0 : price,
                image: imageUrl || 'images/placeholder.jpg',
                category: category || 'Sin categoría'
            };
        });
    } catch (error) {
        console.error('Error al convertir datos de Google Sheets a productos:', error);
        return [];
    }
};

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
 * Versión mejorada para cargar desde una hoja pública sin API key
 * Usa la exportación JSON que no requiere autenticación y evita problemas de CORS
 * @param {string} sheetIdOrUrl - El ID de la hoja de Google Sheets o URL completa
 * @param {number} gid - El ID de la subhoja (0 por defecto)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de productos
 */
window.googleSheetsUtils.loadProductsFromPublicSheet = async function(sheetIdOrUrl, gid = 0) {
    return new Promise((resolve, reject) => {
        try {
            console.log('Cargando productos desde hoja pública:', sheetIdOrUrl);
            
            // Determinar si es una URL completa o solo un ID
            let sheetId = sheetIdOrUrl;
            let isFullUrl = false;
            
            if (sheetIdOrUrl.includes('docs.google.com/spreadsheets')) {
                isFullUrl = true;
                // Extraer el ID de la URL si es posible
                let match;
                if (sheetIdOrUrl.includes('/d/e/')) {
                    // Formato publicado: https://docs.google.com/spreadsheets/d/e/[ID]/pub
                    match = sheetIdOrUrl.match(/spreadsheets\/d\/e\/(([\w-]+))/); 
                } else if (sheetIdOrUrl.includes('/d/')) {
                    // Formato estándar: https://docs.google.com/spreadsheets/d/[ID]/
                    match = sheetIdOrUrl.match(/spreadsheets\/d\/(([\w-]+))/); 
                }
                
                if (match && match[1]) {
                    sheetId = match[1];
                    console.log('ID extraído de URL:', sheetId);
                }
                
                // Extraer gid de la URL si está presente
                const gidMatch = sheetIdOrUrl.match(/gid=([0-9]+)/);
                if (gidMatch && gidMatch[1]) {
                    gid = gidMatch[1];
                    console.log('GID extraído de URL:', gid);
                }
            }
            
            // Intentar primero con método CSV usando proxy CORS
            if (isFullUrl || (sheetId && gid !== undefined)) {
                // Construir URL de exportación CSV
                let csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
                if (gid !== 0) {
                    csvUrl += `&gid=${gid}`;
                }
                
                console.log('Intentando cargar CSV con proxy CORS:', csvUrl);
                
                // Usar proxy CORS para evitar problemas de CORS
                const corsProxyUrl = 'https://corsproxy.io/?';
                const proxiedUrl = corsProxyUrl + encodeURIComponent(csvUrl);
                
                fetch(proxiedUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error al cargar CSV: ${response.status} ${response.statusText}`);
                        }
                        return response.text();
                    })
                    .then(csvData => {
                        if (!csvData || csvData.trim() === '') {
                            throw new Error('El archivo CSV está vacío');
                        }
                        console.log('CSV cargado correctamente, longitud:', csvData.length);
                        const products = window.googleSheetsUtils.convertCsvToProducts(csvData);
                        resolve(products);
                    })
                    .catch(error => {
                        console.error('Error al cargar CSV, intentando con JSONP:', error);
                        // Si falla el método CSV, continuar con JSONP
                        loadWithJsonp();
                    });
            } else {
                // Si no tenemos suficiente información para CSV, usar JSONP directamente
                loadWithJsonp();
            }
            
            // Función para cargar con JSONP (método alternativo)
            function loadWithJsonp() {
                // Usar JSONP para evitar problemas de CORS
                // Crear un elemento script para cargar los datos
                const script = document.createElement('script');
                const callbackName = 'googleSheetsCallback_' + Math.floor(Math.random() * 1000000);
                
                // Definir la función de callback global
                window[callbackName] = function(data) {
                    try {
                        console.log('Datos recibidos de Google Sheets:', data ? 'Sí' : 'No');
                        
                        // Procesar los datos recibidos
                        if (data && data.feed && data.feed.entry) {
                            const entries = data.feed.entry;
                            console.log('Entradas encontradas:', entries.length);
                            
                            // Convertir entradas a productos
                            const products = [];
                            
                            for (let i = 0; i < entries.length; i++) {
                                const entry = entries[i];
                                const cells = {};
                                
                                // Extraer todas las propiedades que comienzan con 'gsx$'
                                for (const key in entry) {
                                    if (key.startsWith('gsx$')) {
                                        const propName = key.substring(4); // Eliminar 'gsx$'
                                        cells[propName] = entry[key]['$t'];
                                    }
                                }
                                
                                // Crear producto con los datos disponibles
                                const product = {
                                    id: cells.id || i + 1,
                                    name: cells.producto || cells.productos || cells.nombre || cells.name || 'Producto ' + (i + 1),
                                    price: parseFloat(cells.precio || cells.price || 0),
                                    description: cells.descripcion || cells.description || '',
                                    image: cells.imagenurl || cells.imagen || cells.image || 'images/placeholder.jpg',
                                    category: cells.categoria || cells.category || 'Sin categoría'
                                };
                                
                                products.push(product);
                            }
                            
                            console.log('Productos convertidos desde Google Sheets:', products.length);
                            resolve(products);
                        } else {
                            console.error('Formato de datos de Google Sheets inesperado');
                            resolve([]);
                        }
                    } catch (error) {
                        console.error('Error al procesar datos de Google Sheets:', error);
                        resolve([]);
                    } finally {
                        // Limpiar
                        document.body.removeChild(script);
                        delete window[callbackName];
                    }
                };
                
                // Construir la URL para la API de Google Sheets en formato JSONP
                let url;
                
                if (isFullUrl && sheetIdOrUrl.includes('output=csv')) {
                    // Si es una URL completa con formato CSV, intentar convertirla a formato JSONP
                    console.log('Convirtiendo URL CSV a formato JSONP');
                    
                    // Intentar extraer el ID y gid de la URL
                    if (sheetId && gid) {
                        const worksheetId = parseInt(gid) + 1; // Convertir gid a worksheetId (gid 0 = worksheetId 1)
                        url = `https://spreadsheets.google.com/feeds/list/${sheetId}/${worksheetId}/public/values?alt=json-in-script&callback=${callbackName}`;
                    } else {
                        // Si no podemos extraer el ID y gid, usar la URL original pero cambiar el formato
                        url = sheetIdOrUrl.replace('output=csv', `output=json&callback=${callbackName}`);
                    }
                } else {
                    // Formato estándar JSONP
                    const worksheetId = parseInt(gid) + 1; // Convertir gid a worksheetId (gid 0 = worksheetId 1)
                    url = `https://spreadsheets.google.com/feeds/list/${sheetId}/${worksheetId}/public/values?alt=json-in-script&callback=${callbackName}`;
                }
                
                console.log('URL JSONP generada:', url);
                
                // Configurar el script
                script.src = url;
                script.async = true;
                script.onerror = function() {
                    console.error('Error al cargar el script de Google Sheets');
                    document.body.removeChild(script);
                    delete window[callbackName];
                    resolve([]);
                };
                
                // Añadir el script al documento
                document.body.appendChild(script);
                
                // Establecer un timeout por si la solicitud no se completa
                setTimeout(() => {
                    if (window[callbackName]) {
                        console.error('Timeout al cargar datos de Google Sheets');
                        document.body.removeChild(script);
                        delete window[callbackName];
                        resolve([]);
                    }
                }, 10000); // 10 segundos de timeout
            }
            
        } catch (error) {
            console.error('Error al configurar la carga de Google Sheets:', error);
            reject(error);
        }
    });
}
};

/**
 * Convierte texto CSV a objetos de producto
 * @param {string} csvText - El texto CSV de la hoja
 * @returns {Array<Object>} - Array de objetos de producto
 */
window.googleSheetsUtils.convertCsvToProducts = function(csvText) {
    if (!csvText) {
        console.error('Texto CSV vacío o nulo');
        return [];
    }
    
    console.log('Iniciando conversión de CSV a productos');
    console.log('Muestra del CSV recibido:', csvText.substring(0, 100) + '...');
    
    // Dividir por líneas y eliminar líneas vacías
    // Manejar diferentes tipos de saltos de línea (\n, \r, \r\n)
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim().length > 0);
    console.log('Número de líneas en CSV:', lines.length);
    
    if (lines.length < 2) {
        console.error('CSV insuficiente: se necesitan al menos encabezados y una fila de datos');
        return [];
    }
    
    // Mostrar la primera línea para depuración
    console.log('Primera línea (encabezados):', lines[0]);
    console.log('Segunda línea (primer producto):', lines[1]);
    
    // Función para analizar una línea CSV (maneja comillas y comas dentro de campos)
    const parseCSVLine = (line) => {
        if (!line || line.trim() === '') {
            return [];
        }
        
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // Si encontramos comillas escapadas (""), las añadimos como una sola comilla
                if (i + 1 < line.length && line[i + 1] === '"' && inQuotes) {
                    current += '"';
                    i++; // Saltar la siguiente comilla
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim()); // Añadir el último campo
        
        // Depuración
        console.log('Línea parseada:', line, '→', result);
        return result;
    };
    
    // Analizar encabezados
    const headers = parseCSVLine(lines[0]);
    console.log('Encabezados detectados:', headers);
    
    // Función para normalizar encabezados (minúsculas, sin acentos, sin espacios)
    const normalizeHeader = (header) => {
        return header.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "");
    };
    
    // Mapear encabezados a índices de columnas
    const headerMap = {};
    headers.forEach((header, index) => {
        const normalizedHeader = normalizeHeader(header);
        headerMap[normalizedHeader] = index;
        console.log(`Encabezado normalizado: '${header}' -> '${normalizedHeader}' en índice ${index}`);
    });
    
    console.log('Mapa de encabezados:', headerMap);
    
    // Posibles nombres de columnas para cada campo
    const nameColumns = ['producto', 'productos', 'nombre', 'nombreproducto', 'name', 'product', 'articulo'];
    const priceColumns = ['precio', 'costo', 'valor', 'price', 'cost'];
    const descColumns = ['descripcion', 'descripción', 'detalle', 'detalles', 'description', 'detail'];
    const imageColumns = ['imagen', 'imagenurl', 'imagen url', 'url', 'foto', 'image', 'picture'];
    
    // Función para encontrar el índice de columna basado en posibles nombres
    const findColumnIndex = (possibleNames, defaultIndex) => {
        for (const name of possibleNames) {
            const normalizedName = normalizeHeader(name);
            if (headerMap[normalizedName] !== undefined) {
                console.log(`Columna '${name}' encontrada en índice ${headerMap[normalizedName]}`);
                return headerMap[normalizedName];
            }
        }
        console.log(`No se encontró columna para ${possibleNames[0]}, usando índice por defecto ${defaultIndex}`);
        return defaultIndex;
    };
    
    // Identificar columnas por sus nombres
    const nameIndex = findColumnIndex(nameColumns, 0);
    const priceIndex = findColumnIndex(priceColumns, 1);
    const descIndex = findColumnIndex(descColumns, 2);
    const imageIndex = findColumnIndex(imageColumns, 3);
    
    console.log('Índices de columnas:', { nameIndex, priceIndex, descIndex, imageIndex });
    
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Saltar líneas vacías
        
        const row = parseCSVLine(lines[i]);
        console.log(`Procesando fila ${i}:`, row);
        
        // Saltar filas vacías o con menos columnas que el índice máximo necesario
        const maxIndex = Math.max(nameIndex, priceIndex, descIndex, imageIndex);
        if (!row || row.length <= maxIndex) {
            console.log(`Fila ${i} ignorada: datos insuficientes`, row);
            continue;
        }
        
        // Obtener valores con validación adicional
        const name = row[nameIndex] !== undefined ? row[nameIndex].trim() : '';
        let price = 0;
        try {
            // Limpiar el valor de precio (quitar símbolos de moneda, espacios, etc.)
            const priceStr = row[priceIndex] !== undefined ? 
                row[priceIndex].toString().replace(/[^0-9.,]/g, '').replace(',', '.') : '0';
            price = parseFloat(priceStr) || 0;
        } catch (e) {
            console.error(`Error al procesar precio en fila ${i}:`, e);
            price = 0;
        }
        
        // Crear producto con los datos disponibles
        const product = {
            id: i.toString(),
            name: name || 'Producto sin nombre',
            price: price,
            currency: '$',
            category: 'Sin categoría',
            featured: false,
            description: row[descIndex] !== undefined ? row[descIndex].trim() : '',
            image: 'images/placeholder.jpg' // Usar imagen placeholder por defecto
        };
        
        // Verificar que el producto tenga datos válidos
        if (!product.name) {
            console.log(`Producto en fila ${i} no tiene nombre, usando valor por defecto`);
            product.name = 'Producto ' + i;
        }
        
        // Procesar URL de imagen si existe
        if (row[imageIndex] && row[imageIndex].trim() !== '') {
            let imageUrl = row[imageIndex].trim();
            // Convertir URLs de GitHub a raw.githubusercontent.com
            if (imageUrl.includes('github.com')) {
                imageUrl = imageUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            }
            product.image = imageUrl;
        }
        
        console.log('Producto procesado:', product);
        products.push(product);
    }
    
    console.log(`Se cargaron ${products.length} productos desde Google Sheets CSV`);
    return products;
};