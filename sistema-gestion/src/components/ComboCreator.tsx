/**
 * Componente para crear combos y agrupaciones en ventas
 * Este componente se integra con el formulario de nueva venta
 */

"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Search,
  Package,
  Trash2,
  Edit3,
  Check,
  X,
  ShoppingBag,
  Layers,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  wholesalePrice: number;
  retailPrice: number;
  unit: string;
}

interface ComboComponent {
  productId: string;
  product: Product;
  quantity: number;
}

interface ComboItem {
  id: string; // ID temporal para el combo
  itemType: 'combo' | 'grouped';
  displayName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  components: ComboComponent[];
}

interface ComboCreatorProps {
  products: Product[];
  customerType: string;
  onComboCreated: (combo: ComboItem) => void;
  onClose: () => void;
}

export default function ComboCreator({ 
  products, 
  customerType, 
  onComboCreated, 
  onClose 
}: ComboCreatorProps) {
  const [comboType, setComboType] = useState<'combo' | 'grouped'>('combo');
  const [displayName, setDisplayName] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [components, setComponents] = useState<ComboComponent[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (productSearch.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [productSearch, products]);

  // Calcular precio sugerido para agrupaciones
  useEffect(() => {
    if (comboType === 'grouped' && components.length > 0) {
      const suggestedPrice = components.reduce((sum, comp) => {
        const price = customerType === 'wholesale' 
          ? comp.product.wholesalePrice 
          : comp.product.retailPrice;
        return sum + (price * comp.quantity);
      }, 0);
      setUnitPrice(suggestedPrice);
    }
  }, [components, comboType, customerType]);

  const addComponent = (product: Product) => {
    // Verificar si el producto ya está en los componentes
    const existingIndex = components.findIndex(comp => comp.productId === product.id);
    
    if (existingIndex >= 0) {
      // Incrementar cantidad del producto existente
      const updatedComponents = [...components];
      updatedComponents[existingIndex].quantity += 1;
      setComponents(updatedComponents);
    } else {
      // Agregar nuevo componente
      const newComponent: ComboComponent = {
        productId: product.id,
        product: product,
        quantity: 1,
      };
      setComponents([...components, newComponent]);
    }

    setProductSearch('');
    setShowProductSearch(false);
  };

  const updateComponentQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeComponent(index);
      return;
    }

    const updatedComponents = [...components];
    const component = updatedComponents[index];

    // Verificar stock total necesario (cantidad del componente * cantidad del combo)
    const totalNeeded = newQuantity * quantity;
    if (totalNeeded > component.product.stock) {
      alert(`No hay suficiente stock. Disponible: ${component.product.stock}, Necesario: ${totalNeeded}`);
      return;
    }

    component.quantity = newQuantity;
    setComponents(updatedComponents);
  };

  const removeComponent = (index: number) => {
    const updatedComponents = components.filter((_, i) => i !== index);
    setComponents(updatedComponents);
  };

  const validateCombo = (): string | null => {
    if (!displayName.trim()) {
      return 'El nombre del combo/agrupación es requerido';
    }

    if (components.length === 0) {
      return 'Debe agregar al menos un producto al combo/agrupación';
    }

    if (unitPrice <= 0) {
      return 'El precio debe ser mayor a 0';
    }

    if (quantity <= 0) {
      return 'La cantidad debe ser mayor a 0';
    }

    // Verificar stock para todos los componentes
    for (const component of components) {
      const totalNeeded = component.quantity * quantity;
      if (totalNeeded > component.product.stock) {
        return `No hay suficiente stock de ${component.product.name}. Disponible: ${component.product.stock}, Necesario: ${totalNeeded}`;
      }
    }

    return null;
  };

  const handleCreate = () => {
    const validationError = validateCombo();
    if (validationError) {
      alert(validationError);
      return;
    }

    const combo: ComboItem = {
      id: `combo-${Date.now()}`, // ID temporal
      itemType: comboType,
      displayName,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      components,
    };

    onComboCreated(combo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Crear {comboType === 'combo' ? 'Combo' : 'Agrupación'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tipo de agrupación */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de agrupación
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setComboType('combo')}
              className={`flex items-center px-4 py-2 rounded-lg border ${
                comboType === 'combo'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Combo (precio especial)
            </button>
            <button
              onClick={() => setComboType('grouped')}
              className={`flex items-center px-4 py-2 rounded-lg border ${
                comboType === 'grouped'
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4 mr-2" />
              Agrupación (suma precios)
            </button>
          </div>
        </div>

        {/* Nombre del combo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del {comboType === 'combo' ? 'combo' : 'agrupación'}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={`Ej: ${comboType === 'combo' ? 'Combo Desayuno Completo' : 'Pack Limpieza Casa'}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Agregar productos */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Productos incluidos
          </label>
          
          {/* Buscador de productos */}
          <div className="relative mb-3">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductSearch(true);
              }}
              onFocus={() => setShowProductSearch(true)}
              placeholder="Buscar producto para agregar..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            
            {/* Lista de productos filtrados */}
            {showProductSearch && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addComponent(product)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      Stock: {product.stock} | ${customerType === 'wholesale' ? product.wholesalePrice : product.retailPrice}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de componentes agregados */}
          <div className="space-y-2">
            {components.map((component, index) => (
              <div key={component.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{component.product.name}</div>
                  <div className="text-sm text-gray-600">
                    Stock disponible: {component.product.stock}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateComponentQuantity(index, component.quantity - 1)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{component.quantity}</span>
                  <button
                    onClick={() => updateComponentQuantity(index, component.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-green-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeComponent(index)}
                    className="p-1 text-gray-500 hover:text-red-600 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {components.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                No hay productos agregados. Busca y selecciona productos arriba.
              </div>
            )}
          </div>
        </div>

        {/* Precio y cantidad */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio unitario
            </label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {comboType === 'grouped' && components.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Precio sugerido basado en suma de componentes
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Total */}
        {unitPrice > 0 && quantity > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-800">
              Total: ${(unitPrice * quantity).toFixed(2)}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            Crear {comboType === 'combo' ? 'Combo' : 'Agrupación'}
          </button>
        </div>
      </div>
    </div>
  );
}
