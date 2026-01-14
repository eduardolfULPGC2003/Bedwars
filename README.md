# Hotel Marketplace MVP

Un marketplace inverso de hoteles donde los usuarios crean intenciones de viaje y los hoteles hacen ofertas competitivas.

## Características

### Modo Usuario
- Crear intenciones de viaje con ciudad, fechas y precio máximo
- Ver todas las ofertas de los hoteles en tiempo real
- Seleccionar y aceptar una oferta (cierra la intención)
- **Retirar intenciones activas** cuando sea necesario

### Modo Hotel
- Ver intenciones activas en la ciudad del hotel
- Crear una oferta por intención
- Actualizar ofertas hasta 2 veces
- **Seleccionar servicios adicionales mediante checkboxes**
- Restricciones de precios aplicadas (por encima del precio mínimo, por debajo del precio máximo)

## Stack Tecnológico

- Backend: Node.js + Express
- Database: SQLite con sql.js (sin compilación necesaria)
- Frontend: HTML + JavaScript Vanilla con diseño moderno
- Sin autenticación (cambio simple de roles)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

## Ejecutar la Aplicación

1. Iniciar el servidor:
```bash
npm start
```

2. Abrir el navegador y navegar a:
```
http://localhost:3000
```

3. La base de datos se creará automáticamente con datos de prueba.

## Datos de Prueba

La aplicación viene con datos pre-cargados:

**Usuarios:**
- John Doe
- Jane Smith

**Hoteles:**
- Grand Hotel (París, precio mín: $100)
- Luxury Inn (París, precio mín: $150)
- Budget Stay (Londres, precio mín: $80)
- City Center Hotel (Londres, precio mín: $120)

## Uso

### Crear una Intención (Modo Usuario)

1. Seleccionar "Modo Usuario" desde la página principal
2. Elegir un usuario del menú desplegable
3. Completar el formulario:
   - Ciudad (ej. París)
   - Fecha de check-in
   - Fecha de check-out
   - Precio máximo que estás dispuesto a pagar
4. Clic en "Crear Intención"
5. Tu intención aparecerá abajo con las ofertas que hagan los hoteles

### Retirar una Intención (Modo Usuario)

1. En Modo Usuario, visualiza tus intenciones activas
2. Clic en el botón "Retirar Intención" en la intención que desees eliminar
3. Confirmar la acción
4. La intención y todas sus ofertas asociadas se eliminarán permanentemente

### Hacer una Oferta (Modo Hotel)

1. Seleccionar "Modo Hotel" desde la página principal
2. Elegir un hotel del menú desplegable
3. Ver intenciones activas en tu ciudad
4. Clic en "Hacer Oferta" en una intención
5. Ingresar precio (debe ser >= precio mínimo del hotel y <= precio máximo de la intención)
6. **Seleccionar servicios adicionales** de las opciones disponibles:
   - Desayuno incluido
   - WiFi gratis
   - Estacionamiento
   - Piscina
   - Gimnasio
   - Spa
   - Traslado aeropuerto
   - Servicio a habitación
7. Enviar la oferta

### Actualizar una Oferta (Modo Hotel)

- Cada hotel puede actualizar su oferta hasta 2 veces
- Clic en "Actualizar Oferta" en una oferta existente
- Cambiar el precio y/o los servicios seleccionados
- Guardar la actualización

### Aceptar una Oferta (Modo Usuario)

1. En Modo Usuario, ver tus intenciones
2. Clic en "Seleccionar Oferta" en tu oferta preferida
3. Confirmar la selección
4. La intención se marcará como "cerrada"
5. No se pueden hacer más ofertas en intenciones cerradas

## Reglas de Negocio

- Los hoteles solo pueden ver intenciones en su ciudad
- Los hoteles solo pueden hacer una oferta por intención
- El precio de la oferta debe ser >= precio mínimo del hotel
- El precio de la oferta debe ser <= precio máximo de la intención
- Los hoteles pueden actualizar ofertas máximo 2 veces
- Las intenciones cerradas no pueden recibir nuevas ofertas
- Las intenciones activas pueden ser retiradas por el usuario
- La coincidencia de ciudad es sensible a mayúsculas

## Endpoints de la API

### Usuarios y Hoteles
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/hotels` - Obtener todos los hoteles

### Intenciones
- `POST /api/intentions` - Crear intención
- `GET /api/intentions/user/:userId` - Obtener intenciones del usuario
- `GET /api/intentions/city/:city` - Obtener intenciones por ciudad
- `POST /api/intentions/:intentionId/close` - Cerrar intención
- `DELETE /api/intentions/:intentionId` - Retirar/eliminar intención

### Ofertas
- `GET /api/intentions/:intentionId/offers` - Obtener ofertas para una intención
- `POST /api/offers` - Crear oferta
- `PUT /api/offers/:offerId` - Actualizar oferta

## Estructura del Proyecto

```
MVP/
├── backend/
│   ├── server.js       # Servidor Express y endpoints API
│   └── db.js           # Configuración de base de datos y datos de prueba
├── frontend/
│   ├── index.html      # Página principal con selección de modo
│   ├── user.html       # Interfaz de modo usuario
│   └── hotel.html      # Interfaz de modo hotel
├── package.json
└── README.md
```

## Mejoras de la Interfaz

- Diseño moderno con gradientes y animaciones
- Interfaz completamente en español
- Checkboxes para seleccionar servicios adicionales
- Diseño responsivo para móviles
- Iconos para mejor visualización
- Mensajes de error y éxito con estilo
- Transiciones suaves en botones y tarjetas

## Notas

- Este es un MVP - sin medidas de seguridad para producción
- Sin autenticación real (solo cambio de roles)
- Archivo de base de datos SQLite creado en el directorio raíz
- Todos los precios están en USD
- Las fechas se almacenan como strings (formato YYYY-MM-DD)
