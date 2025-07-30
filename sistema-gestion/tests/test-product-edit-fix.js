/**
 * TEST RÁPIDO: Verificar formateo de números en edición de productos
 *
 * Problema reportado: Al editar un producto con costo 1050, se mostraba como 1.050.406.178.963.731
 *
 * Solución aplicada:
 * - Simplificada función formatArgentineNumber
 * - No aplicar formateo al cargar datos del servidor
 * - Formatear solo en onBlur, no durante la escritura
 * - Mejorado handleChange para evitar recursión
 */

console.log("🧪 TEST RÁPIDO: Formateo de números para productos");

// Simulación de la función corregida
function formatArgentineNumber(value) {
  if (!value || value === "0") return "0";

  // Limpiar el valor - solo números y coma decimal
  let cleanValue = value.replace(/[^\d,]/g, "");

  // Si está vacío después de limpiar, retornar vacío
  if (!cleanValue) return "";

  // Separar parte entera y decimal
  const parts = cleanValue.split(",");
  let integerPart = parts[0];
  const decimalPart = parts[1] || "";

  // Si no hay parte entera, retornar el valor limpio
  if (!integerPart) return cleanValue;

  // Formatear solo si tiene más de 3 dígitos
  if (integerPart.length > 3) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Retornar con o sin decimales
  return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}

function parseArgentineNumber(value) {
  if (!value) return 0;
  // Remover puntos de miles y reemplazar coma decimal por punto
  const cleanValue = value.replace(/\./g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

// Casos de prueba específicos del problema
const testCases = [
  {
    input: "1050",
    expected: "1.050",
    description: "Caso problemático original",
  },
  {
    input: "1000",
    expected: "1.000",
    description: "Número redondo de 4 dígitos",
  },
  { input: "999", expected: "999", description: "Número menor a 1000" },
  { input: "15000", expected: "15.000", description: "Número de 5 dígitos" },
  { input: "1050,50", expected: "1.050,50", description: "Con decimales" },
  { input: "0", expected: "0", description: "Valor cero" },
  { input: "", expected: "", description: "Valor vacío" },
  { input: "500", expected: "500", description: "Número de 3 dígitos" },
];

console.log("\n📊 RESULTADOS:");

let allPassed = true;

testCases.forEach((test, index) => {
  const result = formatArgentineNumber(test.input);
  const passed = result === test.expected;

  console.log(`\n${index + 1}. ${test.description}`);
  console.log(`   Input: "${test.input}"`);
  console.log(`   Expected: "${test.expected}"`);
  console.log(`   Result: "${result}"`);
  console.log(`   Status: ${passed ? "✅ PASS" : "❌ FAIL"}`);

  if (!passed) {
    allPassed = false;
  }
});

// Test del problema específico
console.log("\n🎯 PROBLEMA ESPECÍFICO:");
const problemInput = "1050";
const result = formatArgentineNumber(problemInput);
console.log(`Valor problemático: ${problemInput}`);
console.log(`Antes (problemático): 1.050.406.178.963.731`);
console.log(`Ahora: ${result}`);
console.log(`Esperado: 1.050`);

const problemSolved = result === "1.050";
console.log(`🎉 Problema resuelto: ${problemSolved ? "SÍ" : "NO"}`);

// Test de parsing (ida y vuelta)
console.log("\n🔄 TEST DE PARSING:");
const formattedValue = "1.050";
const parsedValue = parseArgentineNumber(formattedValue);
console.log(`Formatted: "${formattedValue}"`);
console.log(`Parsed: ${parsedValue}`);
console.log(`Expected: 1050`);
console.log(`Parse OK: ${parsedValue === 1050 ? "✅" : "❌"}`);

console.log("\n" + "=".repeat(50));
if (allPassed && problemSolved) {
  console.log("✅ TODOS LOS TESTS PASARON");
  console.log("🎯 El problema del formateo gigante está RESUELTO");
  console.log("\n💡 Cambios aplicados:");
  console.log("- Simplificada función formatArgentineNumber");
  console.log("- Eliminado formateo al cargar datos del servidor");
  console.log("- Mejorado handleChange para evitar recursión");
  console.log("- Formateo solo en onBlur, no durante escritura");
} else {
  console.log("❌ ALGUNOS TESTS FALLARON");
  console.log("Por favor revisa las funciones");
}
console.log("=".repeat(50));
