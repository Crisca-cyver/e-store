// Funciones para cargar productos desde Google Sheets

// Objeto global para exponer las funciones de Google Sheets
window.googleSheetsUtils = {};

/**
 * Función para asegurar que las URLs de imágenes sean correctas
 * @param {string} url - URL de la imagen
 * @returns {string} - URL corregida
 */
window.googleSheetsUtils.fixImageUrl = function(url) {
    if (!url) return 'images/placeholder.jpg';
    
    console.log('Procesando URL de imagen:', url);
    
    // Si la URL ya es una URL completa, procesarla
    if (url.startsWith('http')) {
        // Convertir URLs de GitHub a raw content si es necesario
        if (url.includes('github.com')) {
            console.log('URL de GitHub detectada:', url);
            // Primero reemplazar github.com con raw.githubusercontent.com
            let newUrl = url.replace('github.com', 'raw.githubusercontent.com');
            // Luego eliminar /blob/main/ o /blob/master/
            newUrl = newUrl.replace('/blob/main/', '/');
            newUrl = newUrl.replace('/blob/master/', '/');
            console.log('URL transformada:', newUrl);
            return newUrl;
        }
        return url;
    }
    
    // Si es una ruta relativa o solo el nombre del archivo, asegurarse de que tenga el prefijo 'images/'
    if (!url.startsWith('images/')) {
        // Extraer solo el nombre del archivo si contiene una ruta
        const fileName = url.includes('/') ? url.split('/').pop() : url;
        return `images/${fileName}`;
    }
    
    return url;
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
    if (lines.length > 1) {
        console.log('Segunda línea (primer producto):', lines[1]);
    }
    
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
        return result;
    };
    
    // Analizar encabezados
    const headers = parseCSVLine(lines[0]);
    console.log('Encabezados detectados:', headers);
    
    // Función para normalizar encabezados (minúsculas, sin acentos, sin espacios)
    const normalizeHeader = (header) => {
        return header.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
            .replace(/\s+/g, ""); // Eliminar espacios
    };
    
    // Mapear encabezados normalizados a índices
    const headerMap = {};
    headers.forEach((header, index) => {
        headerMap[normalizeHeader(header)] = index;
    });
    
    // Función para encontrar el índice de una columna basado en posibles nombres
    const findColumnIndex = (possibleNames) => {
        for (const name of possibleNames) {
            const normalizedName = normalizeHeader(name);
            if (headerMap[normalizedName] !== undefined) {
                return headerMap[normalizedName];
            }
        }
        return -1;
    };
    
    // Encontrar índices de columnas importantes
    const nameIndex = findColumnIndex(['nombre', 'name', 'producto', 'product', 'title', 'titulo']);
    const priceIndex = findColumnIndex(['precio', 'price', 'costo', 'cost', 'valor', 'value']);
    const descriptionIndex = findColumnIndex(['descripcion', 'description', 'desc', 'detalle', 'detail']);
    const imageIndex = findColumnIndex(['imagen', 'image', 'foto', 'photo', 'url', 'link']);
    const image2Index = findColumnIndex(['imagen2', 'image2', 'foto2', 'photo2', 'url2', 'link2', 'imagen_alt', 'image_alt']);
    const categoryIndex = findColumnIndex(['categoria', 'category', 'tipo', 'type', 'clase', 'class']);
    const currencyIndex = findColumnIndex(['moneda', 'currency', 'divisa']);
    
    console.log('Índices de columnas:', { nameIndex, priceIndex, descriptionIndex, imageIndex, image2Index, categoryIndex, currencyIndex });
    
    // Procesar filas para crear objetos de producto
    const products = [];
    console.log('Procesando filas para crear productos...');
    
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length === 0) continue;
        
        // Crear objeto de producto con valores predeterminados
        const product = {
            id: String(Date.now() + i),
            name: nameIndex >= 0 && nameIndex < row.length ? row[nameIndex] : `Producto ${i}`,
            price: 0,
            description: '',
            image: fixImageUrl(''), // Usar fixImageUrl para la imagen principal por defecto
            image2: fixImageUrl(''), // Usar fixImageUrl para la segunda imagen por defecto
            category: 'Sin categoría',
            currency: '$'
        };
        
        console.log(`Procesando producto ${i}:`, nameIndex >= 0 ? row[nameIndex] : `Producto ${i}`);
        
        // Asignar valores si existen
        if (priceIndex >= 0 && priceIndex < row.length) {
            const priceStr = row[priceIndex].replace(/[^\d.,]/g, '').replace(',', '.');
            product.price = parseFloat(priceStr) || 0;
        }
        
        if (descriptionIndex >= 0 && descriptionIndex < row.length) {
            product.description = row[descriptionIndex];
        }
        
        // Procesar la imagen principal
        if (imageIndex >= 0 && imageIndex < row.length && row[imageIndex].trim() !== '') {
            let imageUrl = row[imageIndex].trim();
            console.log('URL de imagen principal original:', imageUrl);
            
            // Convertir URLs de GitHub a raw content si es necesario
            if (imageUrl.includes('github.com')) {
                // Primero reemplazar github.com con raw.githubusercontent.com
                let newUrl = imageUrl.replace('github.com', 'raw.githubusercontent.com');
                // Luego eliminar /blob/main/ o /blob/master/
                newUrl = newUrl.replace('/blob/main/', '/');
                newUrl = newUrl.replace('/blob/master/', '/');
                console.log('URL de imagen principal transformada:', newUrl);
                imageUrl = newUrl;
            }
            
            // Verificar si la URL es válida
            try {
                // Validar que sea una URL válida
                const url = new URL(imageUrl);
                
                // Asegurarse de que la URL sea única para cada producto
                console.log(`Producto ${i}: URL de imagen principal válida:`, imageUrl);
                
                // Verificar si la URL es accesible (http/https)
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    product.image = imageUrl;
                } else {
                    console.warn(`Producto ${i}: URL con protocolo no soportado:`, url.protocol);
                    product.image = fixImageUrl('');
                }
            } catch (e) {
                // Si no es una URL válida, podría ser una ruta relativa o un nombre de archivo
                if (imageUrl.startsWith('http') || imageUrl.startsWith('https') || imageUrl.startsWith('//')) {
                    // Parece ser una URL pero no es válida
                    console.warn(`Producto ${i}: URL de imagen principal no válida:`, imageUrl);
                    product.image = fixImageUrl('');
                } else {
                    // Usar la función fixImageUrl para manejar rutas relativas
                    product.image = fixImageUrl(imageUrl);
                    console.log(`Producto ${i}: Usando ruta de imagen principal relativa:`, product.image);
                }
            }
        }
        
        // Procesar la segunda imagen
        if (image2Index >= 0 && image2Index < row.length && row[image2Index].trim() !== '') {
            let imageUrl = row[image2Index].trim();
            console.log('URL de imagen secundaria original:', imageUrl);
            
            // Convertir URLs de GitHub a raw content si es necesario
            if (imageUrl.includes('github.com')) {
                // Primero reemplazar github.com con raw.githubusercontent.com
                let newUrl = imageUrl.replace('github.com', 'raw.githubusercontent.com');
                // Luego eliminar /blob/main/ o /blob/master/
                newUrl = newUrl.replace('/blob/main/', '/');
                newUrl = newUrl.replace('/blob/master/', '/');
                console.log('URL de imagen secundaria transformada:', newUrl);
                imageUrl = newUrl;
            }
            
            // Usar la función fixImageUrl para la segunda imagen
            product.image2 = fixImageUrl(imageUrl);
            console.log(`Producto ${i}: Usando imagen secundaria:`, product.image2);
        } else if (product.image !== fixImageUrl('')) {
            // Si no hay segunda imagen pero hay primera imagen, intentar usar la primera imagen con sufijo 'a'
            const mainImage = product.image;
            const extension = mainImage.substring(mainImage.lastIndexOf('.'));
            const baseName = mainImage.substring(0, mainImage.lastIndexOf('.'));
            
            // Intentar crear una segunda imagen añadiendo 'a' al nombre base
            product.image2 = `${baseName}a${extension}`;
            console.log(`Producto ${i}: Generando segunda imagen a partir de la primera:`, product.image2);
        }
        
        if (categoryIndex >= 0 && categoryIndex < row.length && row[categoryIndex].trim() !== '') {
            product.category = row[categoryIndex];
        }
        
        if (currencyIndex >= 0 && currencyIndex < row.length && row[currencyIndex].trim() !== '') {
            product.currency = row[currencyIndex];
        }
        
        // Validar que el producto tenga al menos nombre
        if (product.name && product.name.trim() !== '') {
            // Asegurarse de que la imagen sea única para cada producto
        // Si la imagen es la misma que la predeterminada y hay un índice de imagen, intentar usar el nombre del producto
        if (product.image === fixImageUrl('') && nameIndex >= 0 && row[nameIndex].trim() !== '') {
            // Intentar usar el nombre del producto para buscar una imagen local
            const productName = row[nameIndex].trim().toLowerCase().replace(/\s+/g, '-');
            product.image = `images/${productName}.jpg`;
            console.log(`Producto ${i}: Usando imagen principal basada en nombre:`, product.image);
        }
        
        // Asegurarse de que la segunda imagen sea única para cada producto
        // Si la segunda imagen es la misma que la predeterminada y hay un índice de imagen, intentar usar el nombre del producto con sufijo
        if (product.image2 === fixImageUrl('') && nameIndex >= 0 && row[nameIndex].trim() !== '') {
            // Intentar usar el nombre del producto para buscar una imagen local con sufijo 'a'
            const productName = row[nameIndex].trim().toLowerCase().replace(/\s+/g, '-');
            product.image2 = `images/${productName}a.jpg`;
            console.log(`Producto ${i}: Usando segunda imagen basada en nombre:`, product.image2);
        }
            
            console.log('Producto procesado:', product);
            products.push(product);
        }
    }
    
    console.log(`Se cargaron ${products.length} productos desde CSV`);
    return products;
};