# Carpeta de Credenciales

Esta carpeta contiene archivos sensibles que **NO deben** subirse al repositorio.

## Archivos esperados:

- `google-drive-service-account.json` - Credenciales de la cuenta de servicio de Google Drive
- `README.md` - Este archivo de documentación

## ⚠️ IMPORTANTE

- Estos archivos están incluidos en `.gitignore`
- Nunca subas credenciales al repositorio
- Usa variables de entorno para producción
- Para desarrollo local, coloca aquí el archivo JSON descargado de Google Cloud Console

## Uso

El archivo JSON será leído automáticamente por la aplicación para configurar las variables de entorno durante el desarrollo.
