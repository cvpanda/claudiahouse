# 📱 Mobile Image Upload con Google Drive

Esta funcionalidad permite cargar imágenes desde dispositivos móviles (cámara o galería) y subirlas automáticamente a Google Drive para obtener URLs públicas que se almacenan en la base de datos.

## 🚀 Características

- ✅ **Detección automática** de dispositivos móviles
- ✅ **Captura desde cámara** en tiempo real
- ✅ **Selección desde galería** del dispositivo
- ✅ **Compresión automática** de imágenes para optimizar velocidad
- ✅ **Subida automática a Google Drive** con URLs públicas
- ✅ **Progreso de subida** en tiempo real
- ✅ **Interfaz responsive** optimizada para móvil y desktop

## 📋 Configuración de Google Drive API

### Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID**

### Paso 2: Habilitar Google Drive API

1. En la consola, ve a **APIs & Services > Library**
2. Busca "Google Drive API"
3. Haz clic en **Enable**

### Paso 3: Crear cuenta de servicio

1. Ve a **APIs & Services > Credentials**
2. Haz clic en **Create Credentials > Service Account**
3. Ingresa un nombre para la cuenta de servicio
4. Haz clic en **Create and Continue**
5. Asigna el rol **Editor** (o un rol más específico si prefieres)
6. Haz clic en **Done**

### Paso 4: Generar credenciales JSON

1. En la lista de cuentas de servicio, haz clic en la que creaste
2. Ve a la pestaña **Keys**
3. Haz clic en **Add Key > Create New Key**
4. Selecciona **JSON** y haz clic en **Create**
5. Se descargará un archivo JSON con las credenciales

### Paso 5: Configurar variables de entorno

Copia el contenido del archivo JSON descargado y extrae los siguientes valores para tu archivo `.env.local`:

```bash
# Google Drive API Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_CLIENT_ID=your-client-id
GOOGLE_CLOUD_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com

# Opcional: ID de carpeta específica en Google Drive
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### Paso 6: (Opcional) Crear carpeta dedicada en Google Drive

1. Ve a [Google Drive](https://drive.google.com/)
2. Crea una nueva carpeta para las imágenes del proyecto
3. Haz clic derecho en la carpeta > **Compartir**
4. Agrega el email de la cuenta de servicio (del paso 3) con permisos de **Editor**
5. Copia el ID de la carpeta desde la URL (la parte después de `folders/`)
6. Agrega el ID a `GOOGLE_DRIVE_FOLDER_ID` en tu `.env.local`

## 🔧 Uso en la aplicación

### En formularios de productos

El componente `ProductImageUploader` detecta automáticamente si el usuario está en móvil y muestra las opciones correspondientes:

**En móvil:**

- Botón "Cargar desde Móvil" que abre modal con opciones de cámara/galería
- Captura directa desde la cámara con preview
- Selección desde galería del dispositivo
- Compresión automática antes de subir

**En desktop:**

- Campo de URL manual (funcionalidad existente)
- Mensaje informativo sobre la funcionalidad móvil

### Flujo de trabajo

1. **Usuario móvil** hace clic en "Cargar desde Móvil"
2. **Selecciona** entre "Tomar Foto" o "Seleccionar de Galería"
3. **Captura/selecciona** la imagen
4. **La imagen se comprime** automáticamente para optimizar velocidad
5. **Se sube a Google Drive** con indicador de progreso
6. **Se genera URL público** y se guarda en el campo del formulario
7. **Se muestra preview** de la imagen cargada

## 📱 Componentes principales

### `useIsMobile.ts`

Hook para detectar dispositivos móviles basado en user agent y ancho de pantalla.

### `useImageUpload.ts`

Hook que maneja toda la lógica de:

- Captura desde cámara
- Selección desde galería
- Compresión de imágenes
- Subida a Google Drive

### `MobileImageUploader.tsx`

Modal responsivo con opciones de carga de imagen optimizado para móvil.

### `ProductImageUploader.tsx`

Componente híbrido que combina la funcionalidad existente (URL manual) con la nueva funcionalidad móvil.

## 🔒 Seguridad

- Las credenciales de Google Drive están protegidas en variables de entorno del servidor
- Los archivos se suben con permisos públicos de solo lectura
- La compresión de imágenes reduce el uso de ancho de banda
- Validación de tipos de archivo y tamaños máximos

## 🐛 Troubleshooting

### Error: "La cámara no está disponible"

- Verifica que estés usando HTTPS (requerido para acceso a cámara)
- Comprueba que el dispositivo tenga cámara disponible
- Asegúrate de dar permisos de cámara al navegador

### Error: "Error al subir la imagen"

- Verifica que las variables de entorno estén configuradas correctamente
- Comprueba que la cuenta de servicio tenga permisos en Google Drive
- Asegúrate de que Google Drive API esté habilitada

### Error: "Archivo demasiado grande"

- Las imágenes se comprimen automáticamente, pero el límite es 10MB
- Si persiste, ajusta la configuración de compresión en `useImageUpload.ts`

## 🔄 Próximas mejoras

- [ ] Soporte para múltiples imágenes por producto
- [ ] Edición básica de imágenes (recorte, rotación)
- [ ] Caché local para imágenes frecuentemente utilizadas
- [ ] Sincronización offline con cola de subida
- [ ] Integración con otros servicios de almacenamiento (AWS S3, Cloudinary)
