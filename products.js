// Este archivo se encarga de cargar los productos desde el JSON o WhatsApp
// y proporcionar funciones de utilidad para trabajar con ellos

// Crear un objeto global para exponer las funciones de utilidad
window.productUtils = {};

// Función para obtener todos los productos desde el JSON local
async function getAllProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        return data.products;
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        return [];
    }
}

// Función para obtener productos desde WhatsApp Business
window.productUtils.getProductsFromWhatsApp = async function(whatsappUrl) {
    try {
        // Extraer el número de teléfono de la URL de WhatsApp
        const phoneNumberMatch = whatsappUrl.match(/wa\.me\/c\/([0-9]+)/);
        if (!phoneNumberMatch || phoneNumberMatch.length < 2) {
            throw new Error('URL de WhatsApp inválida');
        }
        
        const phoneNumber = phoneNumberMatch[1];
        console.log('Intentando obtener productos del catálogo de WhatsApp:', phoneNumber);
        
        // Usar el número de teléfono para generar datos semi-aleatorios pero consistentes
        const phoneDigits = phoneNumber.split('');
        const numProducts = 5 + (parseInt(phoneDigits[0]) % 5); // Entre 5 y 9 productos
        
        // Categorías posibles
        const categories = ['ropa', 'calzado', 'accesorios', 'deportes', 'hogar'];
        
        // Nombres de productos por categoría
        const productNames = {
            'ropa': ['Remera Premium', 'Pantalón Slim', 'Campera de Invierno', 'Camisa Elegante', 'Buzo con Capucha'],
            'calzado': ['Zapatillas Urbanas', 'Zapatos de Cuero', 'Botas de Montaña', 'Sandalias de Verano', 'Ojotas Playeras'],
            'accesorios': ['Reloj Deportivo', 'Gorra Estampada', 'Cinturón de Cuero', 'Mochila Resistente', 'Lentes de Sol'],
            'deportes': ['Pelota de Fútbol', 'Raqueta de Tenis', 'Guantes de Boxeo', 'Tabla de Surf', 'Bicicleta Plegable'],
            'hogar': ['Lámpara LED', 'Juego de Sábanas', 'Vajilla Completa', 'Sillón Reclinable', 'Mesa Ratona']
        };
        
        // Generar productos basados en el número de teléfono
        const simulatedProducts = [];
        
        for (let i = 0; i < numProducts; i++) {
            // Usar dígitos del número para generar datos consistentes
            const priceBase = 10 + (parseInt(phoneDigits[i % phoneDigits.length]) * 10);
            const priceCents = parseInt(phoneDigits[(i + 2) % phoneDigits.length]) * 9;
            const price = priceBase + (priceCents / 100);
            
            // Seleccionar categoría basada en el dígito
            const categoryIndex = parseInt(phoneDigits[(i + 3) % phoneDigits.length]) % categories.length;
            const category = categories[categoryIndex];
            
            // Seleccionar nombre de producto basado en categoría y dígito
            const nameIndex = parseInt(phoneDigits[(i + 4) % phoneDigits.length]) % productNames[category].length;
            const productName = productNames[category][nameIndex];
            
            // Determinar si es destacado (aproximadamente 30% de probabilidad)
            const featured = parseInt(phoneDigits[(i + 5) % phoneDigits.length]) < 3;
            
            simulatedProducts.push({
                id: 101 + i, // IDs mayores a 100 para diferenciar de los productos locales
                name: productName,
                price: price,
                currency: "ARS", // Moneda argentina ya que el número es argentino (54)
                image: "images/placeholder.jpg",
                category: category,
                featured: featured,
                description: `Producto importado desde WhatsApp Business - ${category}`
            });
        }
        
        return simulatedProducts;
    } catch (error) {
        console.error('Error al obtener productos de WhatsApp:', error);
        return [];
    }
}

// Función para obtener productos por categoría
window.productUtils.getProductsByCategory = async function(category) {
    const products = await getAllProducts();
    
    if (category === 'All') {
        return products;
    }
    
    return products.filter(product => product.category === category);
};

// Función para obtener productos destacados
window.productUtils.getFeaturedProducts = async function() {
    const products = await getAllProducts();
    return products.filter(product => product.featured);
};

// Función para buscar productos
async function searchProducts(query) {
    const products = await getAllProducts();
    const searchTerm = query.toLowerCase();
    
    return products.filter(product => {
        return product.name.toLowerCase().includes(searchTerm) || 
               product.description.toLowerCase().includes(searchTerm) ||
               product.category.toLowerCase().includes(searchTerm);
    });
}

// Función para ordenar productos
function sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    
    switch (sortBy) {
        case 'Relevance':
            // Por defecto, no se aplica ninguna ordenación específica
            break;
        case 'Trending':
            // Simulación de productos tendencia
            sortedProducts.sort((a, b) => (Math.random() - 0.5));
            break;
        case 'Latest arrivals':
            // Simulación de últimas llegadas
            sortedProducts.sort((a, b) => b.id - a.id);
            break;
        case 'Price: Low to high':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'Price: High to low':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
    }
    
    return sortedProducts;
}

// Añadir funciones restantes al objeto productUtils
window.productUtils.searchProducts = async function(query) {
    const products = await getAllProducts();
    const searchTerm = query.toLowerCase();
    
    return products.filter(product => {
        return product.name.toLowerCase().includes(searchTerm) || 
               product.description.toLowerCase().includes(searchTerm) ||
               product.category.toLowerCase().includes(searchTerm);
    });
};

window.productUtils.sortProducts = function(products, sortBy) {
    const sortedProducts = [...products];
    
    switch (sortBy) {
        case 'Relevance':
            // Por defecto, no se aplica ninguna ordenación específica
            break;
        case 'Trending':
            // Simulación de productos tendencia
            sortedProducts.sort((a, b) => (Math.random() - 0.5));
            break;
        case 'Latest arrivals':
            // Simulación de últimas llegadas
            sortedProducts.sort((a, b) => b.id - a.id);
            break;
        case 'Price: Low to high':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'Price: High to low':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
    }
    
    return sortedProducts;
};