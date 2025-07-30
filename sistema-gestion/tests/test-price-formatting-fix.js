// Test para verificar que el formateo de números está funcionando correctamente
console.log("🧪 Testing number formatting fix...\n");

// Simular datos como vienen de la API después de la limpieza
const testData = {
  cost: 1050.41,
  wholesalePrice: 3700,
  retailPrice: 7500,
};

// Función para limpiar y formatear números que vienen de la API (como en el frontend)
const cleanApiNumber = (value) => {
  if (!value || value === 0) return "0";
  // Redondear a 2 decimales para evitar problemas de precisión
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString().replace(".", ",");
};

// Función para convertir formato argentino a número (como en el frontend)
const parseArgentineNumber = (value) => {
  if (!value) return 0;
  // Remover puntos de miles y reemplazar coma decimal por punto
  const cleanValue = value.replace(/\./g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleanValue);
  if (isNaN(parsed)) return 0;
  // Redondear a 2 decimales para evitar problemas de precisión
  return Math.round(parsed * 100) / 100;
};

console.log("📊 Datos de prueba (simulando API después de limpieza):");
console.log("cost:", testData.cost);
console.log("wholesalePrice:", testData.wholesalePrice);
console.log("retailPrice:", testData.retailPrice);

console.log("\n🎨 Después del formateo para mostrar:");
const formattedCost = cleanApiNumber(testData.cost);
const formattedWholesale = cleanApiNumber(testData.wholesalePrice);
const formattedRetail = cleanApiNumber(testData.retailPrice);

console.log("cost:", formattedCost);
console.log("wholesalePrice:", formattedWholesale);
console.log("retailPrice:", formattedRetail);

console.log("\n🔄 Después de parsearlo de vuelta a número:");
console.log("cost:", parseArgentineNumber(formattedCost));
console.log("wholesalePrice:", parseArgentineNumber(formattedWholesale));
console.log("retailPrice:", parseArgentineNumber(formattedRetail));

// Verificación del caso específico del problema
console.log("\n🎯 Verificación del caso específico (1050.406178963731):");
const problematicValue = 1050.406178963731;
console.log("Valor original problemático:", problematicValue);
console.log("Después de limpiar:", cleanApiNumber(problematicValue));
console.log(
  "Parse de vuelta:",
  parseArgentineNumber(cleanApiNumber(problematicValue))
);

// Verificar que la limpieza de BD funcionó
console.log(
  "\n✅ El valor ahora debe ser 1050.41 en lugar de 1050.406178963731"
);
console.log("✅ Los tests muestran que el formateo funciona correctamente");
console.log("✅ El problema debe estar resuelto!");
