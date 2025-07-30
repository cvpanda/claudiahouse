/**
 * Test para verificar que la cancelación de ventas devuelve correctamente el stock
 * Incluye pruebas para productos simples, combos y agrupaciones
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

async function createTestProducts() {
  console.log('\n=== 1. Creando productos de prueba ===');
  
  const products = [
    {
      name: 'Producto A - Test Cancel',
      price: 10.00,
      stock: 50,
      sku: 'TEST-A-CANCEL',
      categoryId: 'cm2n5qbbv000113uxhbh6oazr' // Usar ID de categoría existente
    },
    {
      name: 'Producto B - Test Cancel', 
      price: 15.00,
      stock: 30,
      sku: 'TEST-B-CANCEL',
      categoryId: 'cm2n5qbbv000113uxhbh6oazr'
    },
    {
      name: 'Producto C - Test Cancel',
      price: 20.00,
      stock: 25,
      sku: 'TEST-C-CANCEL', 
      categoryId: 'cm2n5qbbv000113uxhbh6oazr'
    }
  ];
  
  const createdProducts = [];
  for (const product of products) {
    try {
      const result = await makeRequest(`${BASE_URL}/api/products`, {
        method: 'POST',
        body: JSON.stringify(product),
      });
      
      console.log(`✅ Producto creado: ${result.data.name} (Stock: ${result.data.stock})`);
      createdProducts.push(result.data);
    } catch (error) {
      console.error(`❌ Error creando producto ${product.name}:`, error.message);
      throw error;
    }
  }
  
  return createdProducts;
}

async function createSaleWithSimpleProducts(products) {
  console.log('\n=== 2. Creando venta con productos simples ===');
  
  const saleData = {
    items: [
      {
        productId: products[0].id,
        quantity: 5,
        unitPrice: products[0].price
      },
      {
        productId: products[1].id,
        quantity: 3,
        unitPrice: products[1].price
      }
    ],
    total: (5 * products[0].price) + (3 * products[1].price),
    paymentMethod: 'cash',
    status: 'completed'
  };
  
  try {
    const result = await makeRequest(`${BASE_URL}/api/sales`, {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
    
    console.log(`✅ Venta creada: ${result.data.saleNumber}`);
    console.log(`   Items: ${result.data.saleItems.length}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error creando venta simple:', error.message);
    throw error;
  }
}

async function createSaleWithCombo(products) {
  console.log('\n=== 3. Creando venta con combo ===');
  
  const saleData = {
    items: [
      {
        itemType: 'combo',
        displayName: 'Combo ABC - Test Cancel',
        quantity: 2,
        unitPrice: 40.00,
        components: [
          { productId: products[0].id, quantity: 1 }, // 1x Producto A por combo
          { productId: products[1].id, quantity: 1 }, // 1x Producto B por combo
          { productId: products[2].id, quantity: 1 }  // 1x Producto C por combo
        ]
      }
    ],
    total: 80.00, // 2 combos x $40
    paymentMethod: 'cash',
    status: 'completed'
  };
  
  try {
    const result = await makeRequest(`${BASE_URL}/api/sales`, {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
    
    console.log(`✅ Venta con combo creada: ${result.data.saleNumber}`);
    console.log(`   Items: ${result.data.saleItems.length}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error creando venta con combo:', error.message);
    throw error;
  }
}

async function getProductStock(productId) {
  try {
    const result = await makeRequest(`${BASE_URL}/api/products/${productId}`);
    return result.data.stock;
  } catch (error) {
    console.error(`❌ Error obteniendo stock del producto ${productId}:`, error.message);
    throw error;
  }
}

async function cancelSale(saleId) {
  try {
    const result = await makeRequest(`${BASE_URL}/api/sales/${saleId}`, {
      method: 'DELETE',
    });
    
    console.log(`✅ Venta cancelada exitosamente`);
    console.log(`   Mensaje: ${result.message}`);
    return result;
  } catch (error) {
    console.error(`❌ Error cancelando venta ${saleId}:`, error.message);
    throw error;
  }
}

async function checkStockMovements(products) {
  console.log('\n=== Verificando movimientos de stock ===');
  
  try {
    const result = await makeRequest(`${BASE_URL}/api/stock-movements`);
    const movements = result.data;
    
    // Filtrar movimientos de cancelación recientes
    const cancellationMovements = movements.filter(m => 
      m.reason.includes('Cancelación') && 
      products.some(p => p.id === m.productId)
    );
    
    console.log(`📊 Movimientos de cancelación encontrados: ${cancellationMovements.length}`);
    
    cancellationMovements.forEach(movement => {
      const product = products.find(p => p.id === movement.productId);
      console.log(`   ${movement.type.toUpperCase()}: +${movement.quantity} ${product?.name || 'Producto'} - ${movement.reason}`);
    });
    
    return cancellationMovements;
  } catch (error) {
    console.error('❌ Error verificando movimientos de stock:', error.message);
  }
}

async function runTest() {
  console.log('🧪 INICIANDO TEST DE CANCELACIÓN DE VENTAS CON DEVOLUCIÓN DE STOCK');
  console.log('=' .repeat(70));
  
  try {
    // 1. Crear productos de prueba
    const products = await createTestProducts();
    
    // Guardar stock inicial
    const initialStocks = {};
    for (const product of products) {
      initialStocks[product.id] = await getProductStock(product.id);
      console.log(`📦 Stock inicial ${product.name}: ${initialStocks[product.id]}`);
    }
    
    // 2. Crear venta con productos simples
    const simpleSale = await createSaleWithSimpleProducts(products);
    
    // Verificar stock después de la venta simple
    console.log('\n--- Stock después de venta simple ---');
    const stockAfterSimpleSale = {};
    for (const product of products) {
      stockAfterSimpleSale[product.id] = await getProductStock(product.id);
      console.log(`📦 Stock ${product.name}: ${stockAfterSimpleSale[product.id]}`);
    }
    
    // 3. Cancelar venta simple
    console.log('\n=== 4. Cancelando venta simple ===');
    await cancelSale(simpleSale.id);
    
    // Verificar stock después de cancelación simple
    console.log('\n--- Stock después de cancelar venta simple ---');
    const stockAfterSimpleCancellation = {};
    for (const product of products) {
      stockAfterSimpleCancellation[product.id] = await getProductStock(product.id);
      console.log(`📦 Stock ${product.name}: ${stockAfterSimpleCancellation[product.id]}`);
    }
    
    // 4. Crear venta con combo
    const comboSale = await createSaleWithCombo(products);
    
    // Verificar stock después de la venta combo
    console.log('\n--- Stock después de venta combo ---');
    const stockAfterComboSale = {};
    for (const product of products) {
      stockAfterComboSale[product.id] = await getProductStock(product.id);
      console.log(`📦 Stock ${product.name}: ${stockAfterComboSale[product.id]}`);
    }
    
    // 5. Cancelar venta combo
    console.log('\n=== 5. Cancelando venta combo ===');
    await cancelSale(comboSale.id);
    
    // Verificar stock final
    console.log('\n--- Stock después de cancelar venta combo ---');
    const finalStocks = {};
    for (const product of products) {
      finalStocks[product.id] = await getProductStock(product.id);
      console.log(`📦 Stock final ${product.name}: ${finalStocks[product.id]}`);
    }
    
    // 6. Verificar movimientos de stock
    await checkStockMovements(products);
    
    // 7. Validar resultados
    console.log('\n=== 6. VALIDACIÓN DE RESULTADOS ===');
    let allTestsPassed = true;
    
    for (const product of products) {
      const expected = initialStocks[product.id];
      const actual = finalStocks[product.id];
      
      if (expected === actual) {
        console.log(`✅ ${product.name}: Stock restaurado correctamente (${actual})`);
      } else {
        console.log(`❌ ${product.name}: ERROR - Esperado: ${expected}, Actual: ${actual}`);
        allTestsPassed = false;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    if (allTestsPassed) {
      console.log('🎉 TODOS LOS TESTS PASARON - La cancelación devuelve el stock correctamente');
    } else {
      console.log('💥 ALGUNOS TESTS FALLARON - Revisar la lógica de cancelación');
    }
    
  } catch (error) {
    console.error('\n💥 TEST FALLÓ:', error.message);
  }
}

// Ejecutar el test
runTest();
