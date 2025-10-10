# E-Store: Tienda Online con Google Sheets

![E-Store Logo](assets/images/logo.svg)

## 📋 Descripción

E-Store es una aplicación web completa de e-commerce que utiliza Google Sheets como base de datos backend. Diseñada para pequeños negocios y emprendedores que necesitan una solución simple, económica y sin servidor para gestionar su catálogo de productos online.

La aplicación carga productos dinámicamente desde hojas de cálculo de Google Sheets públicas, procesa imágenes alojadas en Google Drive, y ofrece una interfaz moderna y responsive para la visualización del catálogo.

## ✨ Características Principales

### 🛍️ **Gestión de Productos**
- **Carga automática desde Google Sheets**: Sincronización en tiempo real con hojas de cálculo públicas
- **Múltiples imágenes por producto**: Soporte para hasta 3 imágenes por producto (imagen1, imagen2, imagen3)
- **Carrusel de imágenes**: Navegación intuitiva entre múltiples fotos de producto
- **Información completa**: Nombre, descripción, precio y stock de cada producto

### 🖼️ **Sistema de Imágenes Avanzado**
- **Integración con Google Drive**: Imágenes alojadas de forma gratuita y confiable
- **Proxy inteligente**: Uso de weserv.nl para evitar problemas de CORS
- **Fallo seguro**: Imágenes placeholder automáticas cuando las URLs fallan
- **Optimización**: Carga lazy loading para mejor rendimiento

### 🎨 **Interfaz de Usuario Moderna**
- **Diseño responsive**: Adaptable a móviles, tablets y desktop
- **Tema oscuro/claro**: Alternador de temas con persistencia local
- **Animaciones suaves**: Transiciones CSS optimizadas
- **Accesibilidad**: Soporte para navegación por teclado y lectores de pantalla

### 🔍 **Funcionalidades de Búsqueda**
- **Búsqueda en tiempo real**: Filtrado instantáneo por nombre, descripción o categoría
- **Debounced input**: Optimización de rendimiento para búsquedas
- **Contador dinámico**: Muestra el número de productos encontrados

### 🧪 **Suite de Testing Completa**
- **Tests unitarios**: Cobertura completa con Mocha y Chai
- **Tests de integración**: Validación de funcionalidades críticas
- **Test runner visual**: Interfaz web para ejecutar y visualizar tests

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js >= 14.0.0
- Navegador web moderno
- Cuenta de Google (para Google Sheets y Drive)

### Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/Crisca-cyver/e-store.git
   cd e-store
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura Google Sheets:**
   - Crea una nueva hoja de cálculo en [Google Sheets](https://sheets.google.com)
   - Configura las columnas según el formato requerido (ver sección "Formato de Datos")
   - Publica la hoja como CSV público

4. **Configura Google Drive para imágenes:**
   - Sigue la guía en `docs/GOOGLE_DRIVE_SETUP.md`
   - Sube las imágenes de productos a Google Drive
   - Configura permisos de acceso público

5. **Actualiza la configuración:**
   - Edita `src/js/config.js` con tu Sheet ID y configuraciones regionales
   - Ajusta los URLs de imágenes según sea necesario

### Ejecución

**Desarrollo:**
```bash
npm run dev
```
Abre [http://localhost:8080](http://localhost:8080) en tu navegador.

**Producción:**
```bash
npm start
```

**Tests:**
```bash
npm test
```
Abre [http://localhost:3001](http://localhost:3001) para ejecutar los tests en el navegador.

## 📊 Formato de Datos en Google Sheets

### Estructura de Columnas Requerida

| Columna | Nombre | Descripción | Requerido |
|---------|--------|-------------|-----------|
| A | producto/nombre | Nombre del producto | ✅ |
| B | precio | Precio numérico | ✅ |
| C | descripcion | Descripción detallada | ❌ |
| D | imagen1 | URL de la primera imagen | ❌ |
| E | imagen2 | URL de la segunda imagen | ❌ |
| F | imagen3 | URL de la tercera imagen | ❌ |
| G | categoria | Categoría del producto | ❌ |
| H | stock | Cantidad disponible | ❌ |

### Ejemplo de Datos

```
producto,precio,descripcion,imagen1,imagen2,imagen3,categoria,stock
Monocromado de cocina,26000,"Extensible, con flexible y kit de instalacion",https://drive.google.com/file/d/1ABC123/view?usp=sharing,,,Plomería,15
Ducha eléctrica,18000,"Ducha flor, 20cm de diametro",https://drive.google.com/file/d/1DEF456/view?usp=sharing,https://drive.google.com/file/d/1GHI789/view?usp=sharing,,Baño,8
```

### URLs de Imágenes

- **Google Drive**: `https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing`
- **GitHub**: `https://raw.githubusercontent.com/user/repo/branch/path/image.jpg`
- **URLs directas**: Cualquier URL HTTPS válida

## 🏗️ Arquitectura del Proyecto

```
e-store/
├── index.html              # Página principal
├── package.json            # Configuración de Node.js
├── README.md              # Esta documentación
├── assets/                # Recursos estáticos
│   └── images/           # Logo y placeholder
├── src/                  # Código fuente
│   ├── css/
│   │   └── main.css      # Estilos principales
│   ├── js/
│   │   ├── config.js     # Configuración centralizada
│   │   ├── google-sheets.js # Utilidades de Google Sheets
│   │   └── main.js       # Lógica principal de la aplicación
│   └── data/             # Datos de ejemplo
├── tests/                # Suite de testing
│   ├── test-runner.html  # Ejecutor de tests visual
│   └── unit/             # Tests unitarios
└── docs/                 # Documentación adicional
    └── GOOGLE_DRIVE_SETUP.md
```

## 🔧 Configuración Avanzada

### Variables de Configuración (`src/js/config.js`)

```javascript
const EStoreConfig = {
    googleSheets: {
        defaultSheetId: "TU_SHEET_ID_AQUI",
        defaultGid: "0"
    },
    images: {
        placeholder: "assets/images/placeholder.jpg",
        proxyUrl: "https://images.weserv.nl/"
    },
    formatting: {
        currency: "ARS",
        locale: "es-AR",
        priceDecimals: 2
    }
};
```

### Personalización de Temas

El proyecto incluye soporte para temas oscuro y claro. Los colores se definen en variables CSS en `src/css/main.css`:

```css
:root {
    --primary-color: #37a431;
    --dark-bg-primary: #1a1a1a;
    /* ... más variables ... */
}
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests en navegador (recomendado)
npm test

# Tests unitarios desde línea de comandos
npm run test:unit
```

### Cobertura de Tests

- ✅ **GoogleSheetsUtils**: Conversión de URLs, parsing CSV, validación de datos
- ✅ **EStore**: Formateo de precios, búsqueda, renderizado de productos
- ✅ **Integración**: Carga de datos desde Google Sheets

## 🚀 Despliegue

### Opciones de Despliegue

1. **GitHub Pages** (Recomendado para proyectos estáticos)
2. **Netlify** (CD automático desde Git)
3. **Vercel** (Excelente para SPAs)
4. **Servidor tradicional** con Apache/Nginx

### Configuración para Producción

1. **Actualiza URLs**: Cambia URLs locales por URLs de producción
2. **Optimización**: Minifica CSS y JavaScript
3. **SEO**: Agrega meta tags apropiados
4. **Monitoreo**: Configura analytics si es necesario

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue el estilo de código existente
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Usa commits descriptivos

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Google Sheets API](https://developers.google.com/sheets/api) - Por la API de hojas de cálculo
- [weserv.nl](https://images.weserv.nl/) - Por el servicio de proxy de imágenes
- [Font Awesome](https://fontawesome.com/) - Por los iconos
- [Mocha](https://mochajs.org/) y [Chai](https://www.chaijs.com/) - Por el framework de testing

## 📞 Soporte

Si encuentras problemas o tienes preguntas:

1. Revisa la [documentación](docs/)
2. Busca en los [issues](https://github.com/tu-usuario/e-store/issues) existentes
3. Crea un nuevo issue con detalles completos

## 🔄 Roadmap

- [ ] Integración con pasarelas de pago
- [ ] Sistema de carrito de compras
- [ ] Panel de administración
- [ ] API REST para gestión de productos
- [ ] Soporte para múltiples idiomas
- [ ] Integración con WhatsApp Business

---

**Desarrollado con ❤️ para emprendedores y pequeños negocios**
