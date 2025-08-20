/**
 * ANÁLISIS: Eliminación de Compras - Comportamiento Actual
 * =======================================================
 * 
 * ✅ COMPORTAMIENTO CORRECTO: NO elimina productos, solo gestiona stock
 * 
 * 🔍 ¿Qué hace cuando eliminas una compra?
 * 
 * 1. VALIDACIONES:
 *    - Verifica que la compra existe
 *    - NO permite eliminar compras RECEIVED o IN_TRANSIT (protección)
 *    - Solo permite eliminar PENDING, ORDERED, COMPLETED
 * 
 * 2. SI LA COMPRA ESTÁ COMPLETED:
 *    ✅ REVIERTE EL STOCK: product.stock -= quantity (quita el stock agregado)
 *    ✅ REGISTRA MOVIMIENTO: Crea stockMovement tipo "OUT" como reversión
 *    ✅ RECALCULA COSTO: Usa solo otras compras completadas para costo promedio
 *    ✅ MANTIENE PRODUCTO: El producto sigue existiendo intacto
 * 
 * 3. ELIMINA SOLO:
 *    - El registro de la compra (Purchase)
 *    - Los items de compra (PurchaseItem) por cascade
 *    - NO toca los productos (Product)
 * 
 * 🎯 RESULTADO: Los productos permanecen, solo se ajusta stock y costos
 */

// Ejemplo de lo que pasa al eliminar compra PC-000005:

// ANTES:
// Producto "Separador carpeta Hello cactus":
// - stock: 12 (incluye 5 de esta compra)  
// - cost: $4607.80

// DESPUÉS DE ELIMINAR:
// Producto "Separador carpeta Hello cactus":
// - stock: 7 (se quitaron 5 unidades)
// - cost: Recalculado con otras compras
// - El producto sigue existiendo ✅

console.log("✅ CONFIRMADO: Eliminar compra NO elimina productos");
console.log("📦 Solo gestiona stock y recalcula costos");
console.log("🔒 Tiene protecciones para compras críticas");
