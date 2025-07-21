// src/lib/loadGoogleCredentials.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface GoogleServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export function loadGoogleCredentials(): GoogleServiceAccountCredentials | null {
  try {
    // Intentar cargar desde variables de entorno primero (producción)
    if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      return {
        type: 'service_account',
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID!,
        private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID!,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL!,
        client_id: process.env.GOOGLE_CLOUD_CLIENT_ID!,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL!,
      };
    }

    // Si no están las variables de entorno, intentar cargar desde archivo local (desarrollo)
    const credentialsPath = join(process.cwd(), 'credentials', 'google-drive-service-account.json');
    
    if (existsSync(credentialsPath)) {
      const credentialsFile = readFileSync(credentialsPath, 'utf8');
      const credentials: GoogleServiceAccountCredentials = JSON.parse(credentialsFile);
      
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

export function validateGoogleCredentials(): boolean {
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
    if (!credentials[field as keyof GoogleServiceAccountCredentials]) {
      console.error(`❌ Campo faltante en credenciales: ${field}`);
      return false;
    }
  }

  console.log('✅ Credenciales de Google Drive validadas correctamente');
  return true;
}
