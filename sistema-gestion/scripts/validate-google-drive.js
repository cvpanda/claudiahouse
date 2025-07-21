#!/usr/bin/env node
/**
 * Script para validar la configuración de Google Drive antes de iniciar la aplicación
 */

const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

console.log('🔍 Verificando configuración de Google Drive...\n');

function loadGoogleCredentials() {
  try {
    // Intentar cargar desde variables de entorno primero (producción)
    if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      return {
        type: 'service_account',
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
        private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
      };
    }

    // Si no están las variables de entorno, intentar cargar desde archivo local (desarrollo)
    const credentialsPath = join(process.cwd(), 'credentials', 'google-drive-service-account.json');
    
    if (existsSync(credentialsPath)) {
      const credentialsFile = readFileSync(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsFile);
      
      console.log('✅ Credenciales de Google Drive cargadas desde archivo local');
      return credentials;
    }

    console.warn('⚠️ No se encontraron credenciales de Google Drive');
    return null;
  } catch (error) {
    console.error('❌ Error cargando credenciales de Google Drive:', error);
    return null;
  }
}

function validateGoogleCredentials() {
  const credentials = loadGoogleCredentials();
  
  if (!credentials) {
    console.error('❌ Credenciales de Google Drive no configuradas');
    return false;
  }

  const requiredFields = [
    'project_id',
    'private_key_id', 
    'private_key',
    'client_email',
    'client_id'
  ];

  for (const field of requiredFields) {
    if (!credentials[field]) {
      console.error(`❌ Campo faltante en credenciales: ${field}`);
      return false;
    }
  }

  console.log('✅ Credenciales de Google Drive validadas correctamente');
  return true;
}

console.log('🔍 Verificando configuración de Google Drive...\n');

// Verificar si existe el archivo de credenciales
const credentialsPath = join(process.cwd(), 'credentials', 'google-drive-service-account.json');
const hasCredentialsFile = existsSync(credentialsPath);

// Verificar variables de entorno
const hasEnvVars = process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY;

console.log('📋 Estado de la configuración:');
console.log(`   📁 Archivo de credenciales: ${hasCredentialsFile ? '✅ Encontrado' : '❌ No encontrado'}`);
console.log(`   🌍 Variables de entorno: ${hasEnvVars ? '✅ Configuradas' : '❌ No configuradas'}`);

if (!hasCredentialsFile && !hasEnvVars) {
  console.log('\n❌ ERROR: No se encontró configuración de Google Drive');
  console.log('\n📝 Para configurar:');
  console.log('   1. Coloca el archivo JSON de credenciales en: ./credentials/google-drive-service-account.json');
  console.log('   2. O configura las variables de entorno (ver .env.example)');
  console.log('\n📖 Consulta MOBILE_IMAGE_UPLOAD.md para instrucciones detalladas');
  process.exit(1);
}

try {
  const isValid = validateGoogleCredentials();
  
  if (isValid) {
    console.log('\n🎉 ¡Configuración de Google Drive validada correctamente!');
    console.log('   La funcionalidad de carga de imágenes móvil está lista para usar.\n');
  } else {
    console.log('\n❌ ERROR: Las credenciales de Google Drive no son válidas');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ ERROR validando credenciales:', error.message);
  process.exit(1);
}
