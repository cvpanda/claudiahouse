// src/lib/googleDrive.ts
import { google } from 'googleapis';
import { loadGoogleCredentials } from './loadGoogleCredentials';

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export async function initializeGoogleDrive() {
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

export async function uploadFileToGoogleDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string
) {
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
        parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : undefined,
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

export async function deleteFileFromGoogleDrive(fileId: string) {
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
