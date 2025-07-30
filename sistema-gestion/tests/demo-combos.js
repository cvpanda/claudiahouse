/**
 * DEMO: Cómo funciona la creación de combos y agrupaciones
 * 
 * Este es un ejemplo práctico de cómo usar la funcionalidad de combos
 * que ya está implementada en la API.
 */

// ================================
// 1. VENTA CON PRODUCTOS SIMPLES
// ================================
const ventaSimple = {
  "items": [
    {
      "productId": "producto-cafe-123",
      "quantity": 2,
      "unitPrice": 5.00
    },
    {
      "productId": "producto-pan-456", 
      "quantity": 1,
      "unitPrice": 3.00
    }
  ],
  "total": 13.00,
  "paymentMethod": "cash"
};

// ================================
// 2. VENTA CON COMBO
// ================================
const ventaConCombo = {
  "items": [
    {
      "itemType": "combo",
      "displayName": "Combo Desayuno Completo",
      "quantity": 2,
      "unitPrice": 12.00,
      "components": [
        { "productId": "producto-cafe-123", "quantity": 1 },   // 1 café por combo
        { "productId": "producto-pan-456", "quantity": 2 },    // 2 panes por combo
        { "productId": "producto-mermelada-789", "quantity": 1 } // 1 mermelada por combo
      ]
    }
  ],
  "total": 24.00, // 2 combos x $12
  "paymentMethod": "cash"
};

// ================================
// 3. VENTA CON AGRUPACIÓN
// ================================
const ventaConAgrupacion = {
  "items": [
    {
      "itemType": "grouped",
      "displayName": "Pack Limpieza Hogar",
      "quantity": 1,
      "unitPrice": 25.00, // Suma de precios individuales
      "components": [
        { "productId": "detergente-001", "quantity": 1 },
        { "productId": "lavandina-002", "quantity": 1 },
        { "productId": "esponja-003", "quantity": 3 }
      ]
    }
  ],
  "total": 25.00,
  "paymentMethod": "cash"
};

// ================================
// 4. VENTA MIXTA (Simple + Combo + Agrupación)
// ================================
const ventaMixta = {
  "items": [
    // Producto simple
    {
      "productId": "producto-individual-999",
      "quantity": 1,
      "unitPrice": 8.00
    },
    // Combo
    {
      "itemType": "combo",
      "displayName": "Combo Desayuno",
      "quantity": 1,
      "unitPrice": 12.00,
      "components": [
        { "productId": "producto-cafe-123", "quantity": 1 },
        { "productId": "producto-pan-456", "quantity": 2 }
      ]
    },
    // Agrupación
    {
      "itemType": "grouped",
      "displayName": "Pack Limpieza",
      "quantity": 1,
      "unitPrice": 25.00,
      "components": [
        { "productId": "detergente-001", "quantity": 1 },
        { "productId": "lavandina-002", "quantity": 1 }
      ]
    }
  ],
  "total": 45.00, // $8 + $12 + $25
  "paymentMethod": "cash"
};

// ================================
// CÓMO PROBAR
// ================================

console.log("🧪 EJEMPLOS DE USO - COMBOS Y AGRUPACIONES");
console.log("=" .repeat(50));

console.log("\n1️⃣ VENTA SIMPLE:");
console.log("📱 POST /api/sales");
console.log(JSON.stringify(ventaSimple, null, 2));

console.log("\n2️⃣ VENTA CON COMBO:");
console.log("📱 POST /api/sales");
console.log(JSON.stringify(ventaConCombo, null, 2));

console.log("\n3️⃣ VENTA CON AGRUPACIÓN:");
console.log("📱 POST /api/sales");
console.log(JSON.stringify(ventaConAgrupacion, null, 2));

console.log("\n4️⃣ VENTA MIXTA:");
console.log("📱 POST /api/sales");
console.log(JSON.stringify(ventaMixta, null, 2));

console.log("\n" + "=" .repeat(50));
console.log("💡 DIFERENCIAS CLAVE:");
console.log("├── COMBO: Precio especial para conjunto de productos");
console.log("├── AGRUPACIÓN: Precio = suma de precios individuales");
console.log("├── SIMPLE: Un solo producto");
console.log("└── MIXTA: Combinación de todos los tipos");

console.log("\n🔄 GESTIÓN DE STOCK:");
console.log("├── Venta: Reduce stock de componentes individuales");
console.log("├── Cancelación: Devuelve stock a componentes");
console.log("└── Verificación: Valida stock antes de crear venta");

// ================================
// FUNCIONES HELPER PARA TESTING
// ================================

/**
 * Función para crear una venta de prueba
 */
async function crearVentaDePrueba(ventaData) {
  try {
    const response = await fetch('http://localhost:3000/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ventaData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Venta creada: ${result.data.saleNumber}`);
      return result.data;
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
  } catch (error) {
    console.log(`💥 Error de conexión: ${error.message}`);
  }
}

/**
 * Función para cancelar una venta
 */
async function cancelarVenta(saleId) {
  try {
    const response = await fetch(`http://localhost:3000/api/sales/${saleId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${result.message}`);
      return result;
    } else {
      const error = await response.text();
      console.log(`❌ Error cancelando: ${error}`);
    }
  } catch (error) {
    console.log(`💥 Error de conexión: ${error.message}`);
  }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ventaSimple,
    ventaConCombo,
    ventaConAgrupacion,
    ventaMixta,
    crearVentaDePrueba,
    cancelarVenta,
  };
}
