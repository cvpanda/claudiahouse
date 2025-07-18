// Script de prueba para URLs de Google Drive
// Ejecutar con: node test-drive-url.js

const testUrls = [
  "https://drive.google.com/file/d/1rrSgNSsYYRm83bRgca16JNprBREMXRGK/view?usp=sharing",
  "https://drive.google.com/file/d/1rrSgNSsYYRm83bRgca16JNprBREMXRGK/view?usp=drive_link",
  "https://drive.google.com/file/d/1rrSgNSsYYRm83bRgca16JNprBREMXRGK/view",
  "https://drive.google.com/file/d/1rrSgNSsYYRm83bRgca16JNprBREMXRGK",
];

function convertGoogleDriveUrl(url) {
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

console.log("=== Prueba de conversión de URLs de Google Drive ===\n");

testUrls.forEach((url, index) => {
  console.log(`Prueba ${index + 1}:`);
  console.log(`Original: ${url}`);
  const converted = convertGoogleDriveUrl(url);
  console.log(`Convertida: ${converted}`);
  console.log(`¿Se convirtió?: ${converted !== url ? "SÍ" : "NO"}`);
  console.log("---");
});

// Extraer el FILE_ID para análisis
const fileId = "1rrSgNSsYYRm83bRgca16JNprBREMXRGK";
console.log(`\nFILE_ID detectado: ${fileId}`);
console.log(
  `URL convertida final: https://drive.google.com/uc?export=view&id=${fileId}`
);
console.log(
  `URL alternativa: https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
);
