import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function generateSaleNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `V${year}${month}${day}-${random}`;
}

export function calculateTax(subtotal: number, taxRate: number = 21): number {
  return subtotal * (taxRate / 100);
}

export function isLowStock(stock: number, minStock: number): boolean {
  return stock <= minStock;
}

export function getStockStatus(
  stock: number,
  minStock: number
): "low" | "normal" | "out" {
  if (stock === 0) return "out";
  if (stock <= minStock) return "low";
  return "normal";
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Convierte una URL de Google Drive al formato directo para mostrar imágenes
 * @param url - URL original de Google Drive
 * @returns URL convertida o la URL original si no es de Google Drive
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;

  // Patrones para diferentes formatos de Google Drive
  const patterns = [
    // Formato: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view(\?.*)?$/,
    // Formato: https://drive.google.com/open?id=FILE_ID
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    // Formato: https://drive.google.com/file/d/FILE_ID (sin /view)
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/?(\?.*)?$/,
    // Formato: https://drive.google.com/uc?id=FILE_ID
    /https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    // Extraer FILE_ID de cualquier URL que lo contenga
    /drive\.google\.com.*[?&]id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com.*\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Usar el formato más confiable para mostrar imágenes
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  return url;
}

/**
 * Obtiene URLs alternativas para Google Drive
 * @param url - URL original de Google Drive
 * @returns Array de URLs alternativas para intentar
 */
export function getGoogleDriveAlternatives(url: string): string[] {
  if (!url.includes("drive.google.com")) return [url];

  const patterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view(\?.*)?$/,
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/?(\?.*)?$/,
    /https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com.*[?&]id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com.*\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1];
      return [
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
        `https://lh3.googleusercontent.com/d/${fileId}`,
        url, // URL original como respaldo
      ];
    }
  }

  return [url];
}

/**
 * Valida si una URL es potencialmente una imagen válida
 * @param url - URL a validar
 * @returns true si la URL parece ser una imagen
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // Verificar si es una URL válida
  try {
    new URL(url);
  } catch {
    return false;
  }

  // Verificar extensiones de imagen comunes o servicios conocidos
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
  const knownServices = [
    "drive.google.com",
    "images.unsplash.com",
    "cloudinary.com",
    "imgur.com",
    "amazonaws.com",
    "githubusercontent.com",
  ];

  return (
    imageExtensions.test(url) ||
    knownServices.some((service) => url.includes(service))
  );
}

/**
 * Obtiene instrucciones para compartir imágenes desde diferentes servicios
 * @param url - URL para analizar
 * @returns Instrucciones específicas del servicio
 */
export function getImageSharingInstructions(url: string): string {
  if (url.includes("drive.google.com")) {
    return `Para Google Drive sigue estos pasos:
1. Abre el archivo en Google Drive
2. Haz clic derecho → "Compartir"
3. Cambia a "Cualquier persona con el enlace puede ver"
4. Copia el enlace compartido
5. O asegúrate de que el archivo sea público

Si el problema persiste, prueba subir la imagen a un servicio como Imgur o usar una URL directa de imagen.`;
  }

  if (url.includes("dropbox.com")) {
    return 'Para Dropbox: Haz clic derecho → "Copiar enlace" → Cambia "dl=0" por "raw=1" al final de la URL';
  }

  if (url.includes("onedrive.live.com") || url.includes("1drv.ms")) {
    return 'Para OneDrive: Comparte el archivo → "Cualquier persona con el enlace puede ver" → Agrega "&download=1" al final de la URL';
  }

  return "Asegúrate de que la URL sea pública y accesible. Recomendamos usar servicios como Imgur, Cloudinary, o URLs directas a imágenes.";
}

/**
 * Obtiene sugerencias de servicios alternativos para hosting de imágenes
 * @returns Lista de servicios recomendados con ejemplos
 */
export function getImageHostingAlternatives(): Array<{
  name: string;
  url: string;
  description: string;
  example: string;
}> {
  return [
    {
      name: "Imgur",
      url: "https://imgur.com",
      description: "Servicio gratuito, muy confiable para imágenes",
      example: "https://i.imgur.com/ejemplo.jpg",
    },
    {
      name: "Cloudinary",
      url: "https://cloudinary.com",
      description: "Servicio profesional con optimización automática",
      example: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    },
    {
      name: "GitHub",
      url: "https://github.com",
      description: "Sube imágenes a un repositorio público",
      example: "https://raw.githubusercontent.com/usuario/repo/main/imagen.jpg",
    },
    {
      name: "Unsplash",
      url: "https://unsplash.com",
      description: "Imágenes de stock gratuitas de alta calidad",
      example: "https://images.unsplash.com/photo-ejemplo",
    },
  ];
}

/**
 * Detecta si una URL de Google Drive puede tener problemas de acceso
 * @param url - URL a analizar
 * @returns Objeto con información sobre potenciales problemas
 */
export function analyzeGoogleDriveUrl(url: string): {
  isGoogleDrive: boolean;
  potentialIssues: string[];
  recommendations: string[];
} {
  const isGoogleDrive = url.includes("drive.google.com");
  const potentialIssues: string[] = [];
  const recommendations: string[] = [];

  if (!isGoogleDrive) {
    return { isGoogleDrive, potentialIssues, recommendations };
  }

  // Detectar problemas comunes
  if (
    url.includes("/view?usp=sharing") ||
    url.includes("/view?usp=drive_link")
  ) {
    potentialIssues.push(
      "La URL contiene parámetros de vista que pueden causar problemas"
    );
    recommendations.push("Asegúrate de que el archivo sea público");
  }

  if (!url.includes("export=view") && !url.includes("/uc?")) {
    potentialIssues.push("La URL no está en formato directo de imagen");
    recommendations.push(
      "El sistema intentará convertir automáticamente la URL"
    );
  }

  // Recomendaciones generales para Google Drive
  recommendations.push(
    "Verifica que el archivo sea público y no requiera permisos especiales"
  );
  recommendations.push(
    "Considera usar servicios especializados como Imgur para mejor rendimiento"
  );

  return { isGoogleDrive, potentialIssues, recommendations };
}
