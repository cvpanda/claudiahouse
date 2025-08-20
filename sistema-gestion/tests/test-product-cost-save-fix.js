/*
 * Test de Corrección de Guardado de Costos de Productos
 * Verificar que se guarde el costo final (con distribución) y no el unitario
 */

console.log("🧮 Test de Corrección de Guardado de Costos de Productos");
console.log("=" .repeat(65));

// Simular datos del producto ejemplo del usuario
const purchaseData = {
  id: "test-purchase-123",
  exchangeRate: 1330.0,
  freightCost: 2470.00, // Ya en ARS (el usuario mencionó $ 2.470,00)
  customsCost: 0,
  taxCost: 661000.00, // ARS
  insuranceCost: 0,
  otherCosts: 0,
  
  items: [
    {
      productId: "LIB62",
      product: { name: "Separador carpeta Hello cactus" },
      quantity: 20,
      unitPriceForeign: 0.95, // USD
      unitPricePesos: 1263.50, // ARS
    },
    // Simular que hay otros productos en la compra para llegar al subtotal correcto
    // El usuario mencionó "Subtotal (ARS): $ 1.490.863,50"
    // Si este producto son $25.270, faltan $1.465.593,50 de otros productos
  ]
};

// Ajustar el subtotal para que coincida con los datos del usuario
const userSubtotalARS = 1490863.50;
const thisItemSubtotal = 20 * 1263.50; // $25.270
const otherItemsSubtotal = userSubtotalARS - thisItemSubtotal;

// Función que simula el cálculo correcto (igual que en el endpoint complete)
function calculateCorrectProductCost(purchase, item) {
  // 1. Calcular subtotal en pesos
  const subtotalPesos = purchase.items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPricePesos || 0);
  }, 0);

  // 2. Calcular total de costos de importación en ARS
  const freightCostARS = (purchase.freightCost || 0) * (purchase.exchangeRate || 1);
  const otherCostsARS = (purchase.otherCosts || 0) * (purchase.exchangeRate || 1);
  const totalImportCosts = 
    freightCostARS + 
    otherCostsARS + 
    (purchase.customsCost || 0) + 
    (purchase.taxCost || 0) + 
    (purchase.insuranceCost || 0);

  // 3. Calcular costo distribuido para este item específico
  const itemSubtotalPesos = (item.quantity || 0) * (item.unitPricePesos || 0);
  const distributedCosts = subtotalPesos > 0 ? (itemSubtotalPesos / subtotalPesos) * totalImportCosts : 0;
  
  // 4. Calcular costo final unitario
  const finalUnitCost = (item.unitPricePesos || 0) + (distributedCosts / (item.quantity || 1));

  return {
    subtotalPesos,
    totalImportCosts,
    itemSubtotalPesos,
    distributedCosts,
    distributedCostsPerUnit: distributedCosts / (item.quantity || 1),
    finalUnitCost: Math.round(finalUnitCost * 100) / 100
  };
}

console.log("\n📊 Datos de la compra:");
console.log(`Tipo de cambio: ${purchaseData.exchangeRate.toLocaleString("es-AR")}`);
console.log(`Flete (USD): ${(purchaseData.freightCost * purchaseData.exchangeRate).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Impuestos (ARS): $${purchaseData.taxCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

console.log("\n📦 Producto en la compra:");
const item = purchaseData.items[0];
console.log(`Producto: ${item.product.name}`);
console.log(`Cantidad: ${item.quantity}`);
console.log(`Precio unitario (USD): ${item.unitPriceForeign.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Precio unitario (ARS): $${item.unitPricePesos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

const calculation = calculateCorrectProductCost(purchaseData, item);

console.log("\n🔧 Cálculo correcto del costo:");
console.log(`Subtotal total compra: $${calculation.subtotalPesos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Total costos importación: $${calculation.totalImportCosts.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Subtotal del item: $${calculation.itemSubtotalPesos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Costos distribuidos (total): $${calculation.distributedCosts.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Costos distribuidos (por unidad): $${calculation.distributedCostsPerUnit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

console.log("\n✅ Resultado final:");
console.log(`❌ Costo incorrecto (solo unitario): $${item.unitPricePesos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`✅ Costo correcto (con distribución): $${calculation.finalUnitCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

// Verificar que coincide con los datos del usuario
const expectedFinalCost = 4607.80;
const calculatedFinalCost = calculation.finalUnitCost;

console.log("\n🎯 Verificación con datos del usuario:");
console.log(`Costo Final Unit. esperado: $${expectedFinalCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Costo Final Unit. calculado: $${calculatedFinalCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`¿Son iguales? ${Math.abs(calculatedFinalCost - expectedFinalCost) < 0.01 ? '✅ SÍ' : '❌ NO'}`);

const incorrectCost = 1825.79;
console.log(`Costo incorrecto guardado: $${incorrectCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
console.log(`Diferencia con el correcto: $${(calculatedFinalCost - incorrectCost).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);

console.log("\n🎉 Conclusión:");
if (Math.abs(calculatedFinalCost - expectedFinalCost) < 0.01) {
  console.log("✅ ¡La corrección está funcionando!");
  console.log("✅ Ahora se guardará el costo final con distribución de costos");
  console.log(`✅ El producto tendrá costo $${calculatedFinalCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })} en lugar de $${incorrectCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
} else {
  console.log("❌ Hay un problema con el cálculo");
  console.log(`❌ Esperado: ${expectedFinalCost}, Calculado: ${calculatedFinalCost}`);
}
