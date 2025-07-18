/**
 * Test de auto-cálculo y formato de números
 */

console.log("🧪 Test de formateo de números...\n");

// Simular la función de formateo
const formatNumber = (value) => {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Test de números
const testNumbers = [
  1000, 10000, 100000, 1000000, 1234.56, 12345.67, 123456.78, 1234567.89,
];

console.log("📊 Formato de números:");
testNumbers.forEach((num) => {
  console.log(`${num} -> ${formatNumber(num)}`);
});

// Test de auto-cálculo
console.log("\n💱 Test de auto-cálculo:");
const exchangeRate = 1000;
const usdPrice = 10.5;
const arsPrice = usdPrice * exchangeRate;

console.log(`Precio USD: $${usdPrice}`);
console.log(`Tipo de cambio: ${formatNumber(exchangeRate)}`);
console.log(`Precio ARS calculado: $${formatNumber(arsPrice)}`);

// Test con costos de importación
console.log("\n🚢 Test de costos de importación:");
const costs = {
  freightUSD: 100,
  customsUSD: 50,
  insuranceUSD: 25,
  otherUSD: 10,
  taxesARS: 15000,
};

const totalUSD =
  costs.freightUSD + costs.customsUSD + costs.insuranceUSD + costs.otherUSD;
const totalUSDinARS = totalUSD * exchangeRate;
const totalARS = costs.taxesARS;
const grandTotalARS = totalUSDinARS + totalARS;

console.log("Costos en USD:");
console.log(`• Flete: USD ${formatNumber(costs.freightUSD)}`);
console.log(`• Aduana: USD ${formatNumber(costs.customsUSD)}`);
console.log(`• Seguro: USD ${formatNumber(costs.insuranceUSD)}`);
console.log(`• Otros: USD ${formatNumber(costs.otherUSD)}`);
console.log(`Total USD: ${formatNumber(totalUSD)}`);

console.log("\nCostos en ARS:");
console.log(`• Impuestos: ARS ${formatNumber(costs.taxesARS)}`);

console.log("\nConversión:");
console.log(
  `USD ${formatNumber(totalUSD)} x ${formatNumber(
    exchangeRate
  )} = ARS ${formatNumber(totalUSDinARS)}`
);

console.log("\nTotal Final:");
console.log(
  `ARS ${formatNumber(totalUSDinARS)} + ARS ${formatNumber(
    totalARS
  )} = ARS ${formatNumber(grandTotalARS)}`
);

console.log("\n✅ Test de formateo completado");
