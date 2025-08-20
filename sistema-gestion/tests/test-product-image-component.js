/**
 * Test del componente ProductImage para verificar carga de imágenes
 * Este script verifica que las URLs de Google Drive se carguen correctamente
 */

const https = require("https");
const http = require("http");

// URL de imagen del producto LIB58
const imageUrl =
  "https://drive.google.com/uc?export=view&id=1zAkhYnjRAazjCrBjNYyfJqcPuNpavFAt";

console.log("🔍 Verificando accesibilidad de imagen del producto LIB58...");
console.log("URL:", imageUrl);

// Verificar que la URL responda
https
  .get(imageUrl, (res) => {
    console.log("\n📊 Respuesta del servidor:");
    console.log("Status Code:", res.statusCode);
    console.log("Content-Type:", res.headers["content-type"]);
    console.log("Content-Length:", res.headers["content-length"]);

    if (res.statusCode === 200) {
      console.log("✅ La imagen es accesible desde el servidor");

      // Verificar si es una imagen
      const contentType = res.headers["content-type"];
      if (contentType && contentType.startsWith("image/")) {
        console.log("✅ Es un archivo de imagen válido");
      } else {
        console.log("❌ No es un archivo de imagen:", contentType);
      }
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      console.log("🔄 Redirección detectada a:", res.headers.location);
    } else {
      console.log("❌ Error al acceder a la imagen");
    }

    res.on("data", () => {
      // No procesamos los datos, solo verificamos conectividad
    });
  })
  .on("error", (err) => {
    console.log("❌ Error de conexión:", err.message);
  });

// También vamos a probar la API local
console.log("\n🔍 Verificando API local...");

const apiUrl = "http://localhost:3000/api/products?search=LIB58";

http
  .get(apiUrl, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const response = JSON.parse(data);
        const product = response.data[0];

        console.log("\n📦 Producto encontrado:");
        console.log("Nombre:", product.name);
        console.log("SKU:", product.sku);
        console.log("ImageURL:", product.imageUrl);
        console.log("ImageURL válida:", !!product.imageUrl);

        if (product.imageUrl) {
          console.log("✅ El producto tiene imageUrl en la API");
        } else {
          console.log("❌ El producto NO tiene imageUrl en la API");
        }
      } catch (error) {
        console.log("❌ Error parseando respuesta API:", error.message);
      }
    });
  })
  .on("error", (err) => {
    console.log("❌ Error conectando con API local:", err.message);
  });
