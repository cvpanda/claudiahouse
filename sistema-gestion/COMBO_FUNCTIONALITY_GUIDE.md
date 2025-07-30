## 🎯 FUNCIONALIDAD DE COMBOS Y AGRUPACIONES EN VENTAS

### **¿Cómo funciona actualmente?**

La funcionalidad está implementada a **nivel de API** y lista para usar. Solo necesitamos crear la interfaz de usuario.

---

### **📋 Proceso para crear combos/agrupaciones:**

#### **1. Productos Simples (como siempre):**
```
🛍️ Agregar producto individual
├── Seleccionar producto
├── Definir cantidad
└── Aplicar precio (mayorista/minorista)
```

#### **2. COMBO (nuevo):**
```
📦 Crear Combo
├── Elegir tipo: "COMBO" 
├── Nombre: "Combo Desayuno Completo"
├── Agregar productos:
│   ├── 1x Café ($5)
│   ├── 2x Medialunas ($3 c/u)
│   └── 1x Mermelada ($4)
├── Precio especial: $10 (en lugar de $15)
└── Cantidad de combos: 2
```

#### **3. AGRUPACIÓN (nuevo):**
```
📚 Crear Agrupación  
├── Elegir tipo: "AGRUPACIÓN"
├── Nombre: "Pack Limpieza Casa"
├── Agregar productos:
│   ├── 1x Detergente ($8)
│   ├── 1x Lavandina ($3)
│   └── 3x Esponjas ($1 c/u)
├── Precio: $14 (suma automática)
└── Cantidad de packs: 1
```

---

### **🔄 Gestión de Stock:**

#### **Cuando vendes:**
- **Producto simple**: Resta del stock del producto
- **Combo/Agrupación**: Resta del stock de CADA componente

#### **Cuando cancelas:**
- **Producto simple**: Devuelve stock al producto ✅
- **Combo/Agrupación**: Devuelve stock a CADA componente ✅

#### **Ejemplo práctico:**
```
Venta: 2x "Combo Desayuno"
├── Stock antes: Café(50), Medialunas(30), Mermelada(20)
├── Stock después: Café(48), Medialunas(26), Mermelada(18)
└── Si cancelas: Café(50), Medialunas(30), Mermelada(20) ✅
```

---

### **💡 Interfaz de Usuario (pendiente):**

#### **Botones en Nueva Venta:**
```
[➕ Agregar Producto]  [📦 Crear Combo]  [📚 Crear Agrupación]
```

#### **Modal de Combo/Agrupación:**
```
┌─────────────────────────────────────┐
│ 🎯 Crear Combo/Agrupación           │
├─────────────────────────────────────┤
│ Tipo: ○ Combo  ● Agrupación         │
│ Nombre: [Pack Limpieza Casa_____]   │
│                                     │
│ 🔍 Buscar producto: [detergente__]  │
│                                     │
│ Productos incluidos:                │
│ ├── 1x Detergente ($8) [➕➖][🗑️]   │
│ ├── 1x Lavandina ($3)  [➕➖][🗑️]   │
│ └── 3x Esponjas ($1)   [➕➖][🗑️]   │
│                                     │
│ Precio: [$14.00] Cantidad: [1]     │
│ Total: $14.00                       │
│                                     │
│        [Cancelar] [✅ Crear]        │
└─────────────────────────────────────┘
```

#### **En la lista de venta:**
```
📦 Combo Desayuno Completo  [COMBO]
   Incluye: 1x Café, 2x Medialunas, 1x Mermelada
   [➖] 2 [➕]  $10.00  $20.00  [🗑️]

📚 Pack Limpieza Casa  [AGRUPACIÓN]  
   Incluye: 1x Detergente, 1x Lavandina, 3x Esponjas
   [➖] 1 [➕]  $14.00  $14.00  [🗑️]

🛍️ Producto Individual
   SKU: ABC123 | Stock: 50 unidades  
   [➖] 3 [➕]  $5.00  $15.00  [🗑️]
```

---

### **✅ Estado Actual:**

- ✅ **API completa** - Crear, consultar, cancelar ventas
- ✅ **Base de datos** - Schema con soporte para combos
- ✅ **Validaciones** - Stock, precios, componentes
- ✅ **Stock management** - Reducción y devolución automática
- ✅ **Reportes** - Compatibles con nuevos tipos
- ✅ **Tests** - Suite completa de pruebas
- 🔄 **Frontend** - En desarrollo (componente ComboCreator.tsx creado)

---

### **🚀 Para usar ahora mismo:**

**Opción 1: Via API directa**
```bash
# Crear combo via API
curl -X POST http://localhost:3000/api/sales \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [{
      "itemType": "combo",
      "displayName": "Combo Desayuno",
      "quantity": 1,
      "unitPrice": 25.00,
      "components": [
        {"productId": "cafe-id", "quantity": 1},
        {"productId": "medialunas-id", "quantity": 2}
      ]
    }],
    "total": 25.00,
    "paymentMethod": "cash"
  }'
```

**Opción 2: Completar interfaz** (recomendado)
- Integrar ComboCreator.tsx en la página de nueva venta
- Agregar botones para crear combos/agrupaciones  
- Probar funcionalidad completa

### **🧪 Para probar:**

1. Iniciar servidor: `npm run dev`
2. Ejecutar test: `node tests/test-sale-cancellation-simple.js`
3. Verificar que la cancelación devuelve stock correctamente

**¿Te gustaría que complete la interfaz de usuario o prefieres probar primero la funcionalidad via API?**
