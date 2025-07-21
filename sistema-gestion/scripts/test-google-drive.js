#!/usr/bin/env node
/**
 * Script de prueba para verificar la funcionalidad de Google Drive
 */

const { google } = require('googleapis');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

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

async function initializeGoogleDrive() {
  try {
    // Cargar credenciales desde archivo local o variables de entorno
    const credentials = loadGoogleCredentials();
    
    if (!credentials) {
      throw new Error('No se pudieron cargar las credenciales de Google Drive');
    }

    // Configurar autenticación
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    return drive;
  } catch (error) {
    console.error('Error initializing Google Drive:', error);
    throw error;
  }
}

async function uploadFileToGoogleDrive(buffer, fileName, mimeType) {
  try {
    const drive = await initializeGoogleDrive();
    const { Readable } = require('stream');

    // Convertir buffer a stream
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Subir archivo
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined,
      },
      media: {
        mimeType,
        body: stream,
      },
    });

    const fileId = response.data.id;

    if (!fileId) {
      throw new Error('No se pudo obtener el ID del archivo');
    }

    // Hacer el archivo público
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Generar URL público
    const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;

    return {
      url: publicUrl,
      publicId: fileId,
      fileName,
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

async function deleteFileFromGoogleDrive(fileId) {
  try {
    const drive = await initializeGoogleDrive();
    
    await drive.files.delete({
      fileId,
    });

    return true;
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    throw error;
  }
}

async function testGoogleDriveUpload() {
  console.log('🧪 Iniciando prueba de Google Drive...\n');

  // Validar credenciales
  const credentials = loadGoogleCredentials();
  if (!credentials) {
    console.error('❌ Credenciales no válidas');
    return;
  }

  try {
    console.log('📤 Subiendo archivo de prueba...');
    
    // Crear un buffer de prueba (imagen de 1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5b, 0x63, 0xf8, 0x0f, 0x00, 0x00,
      0x01, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);

    const fileName = `test-image-${Date.now()}.png`;

    // Subir archivo
    const uploadResult = await uploadFileToGoogleDrive(
      testImageBuffer,
      fileName,
      'image/png'
    );

    console.log('✅ Archivo subido exitosamente:');
    console.log(`   📄 Nombre: ${uploadResult.fileName}`);
    console.log(`   🆔 ID: ${uploadResult.publicId}`);
    console.log(`   🔗 URL: ${uploadResult.url}`);

    // Esperar un momento antes de eliminar
    console.log('\n⏳ Esperando 3 segundos antes de limpiar...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Eliminar archivo de prueba
    console.log('🗑️ Eliminando archivo de prueba...');
    await deleteFileFromGoogleDrive(uploadResult.publicId);
    console.log('✅ Archivo eliminado exitosamente');

    console.log('\n🎉 ¡Prueba completada con éxito!');
    console.log('   La integración con Google Drive está funcionando correctamente.\n');

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    console.error('\n🔧 Posibles soluciones:');
    console.error('   1. Verifica que Google Drive API esté habilitada');
    console.error('   2. Comprueba que la cuenta de servicio tenga permisos');
    console.error('   3. Revisa que las credenciales sean correctas');
    process.exit(1);
  }
}

testGoogleDriveUpload();
