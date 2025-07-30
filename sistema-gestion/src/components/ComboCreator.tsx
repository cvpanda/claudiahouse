"use client";

import { Plus, Minus, Trash2, Layers, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  wholesalePrice: number;
  retailPrice: number;
  unit: string;
  category?: {
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  customerType: string;
  email?: string;
  phone?: string;
}

interface ComboComponent {
  productId: string;
  product: Product;
  quantity: number;
}

interface ComboCreatorProps {
  itemType: "combo" | "grouped";
  selectedCustomer: Customer | null;
  components: ComboComponent[];
  onUpdateComponentQuantity: (index: number, quantity: number) => void;
  onRemoveComponent: (index: number) => void;
  onAddToSale: () => void;
  onCancel: () => void;
  comboName: string;
  setComboName: (name: string) => void;
  comboPrice: number;
  setComboPrice: (price: number) => void;
}

export default function ComboCreator({
  itemType,
  selectedCustomer,
  components,
  onUpdateComponentQuantity,
  onRemoveComponent,
  onAddToSale,
  onCancel,
  comboName,
  setComboName,
  comboPrice,
  setComboPrice,
}: ComboCreatorProps) {
  const calculateIndividualPrice = () => {
    return components.reduce((sum, comp) => {
      const price =
        selectedCustomer?.customerType === "wholesale"
          ? comp.product.wholesalePrice
          : comp.product.retailPrice;
      return sum + price * comp.quantity;
    }, 0);
  };

  // Calcular total de unidades para agrupaciones
  const calculateTotalUnits = () => {
    return components.reduce((sum, comp) => sum + comp.quantity, 0);
  };

  // Verificar si todos los productos tienen el mismo precio (para agrupaciones)
  const checkSamePriceForGrouped = () => {
    if (components.length === 0) return true;

    const basePrice =
      selectedCustomer?.customerType === "wholesale"
        ? components[0].product.wholesalePrice
        : components[0].product.retailPrice;

    return components.every((comp) => {
      const price =
        selectedCustomer?.customerType === "wholesale"
          ? comp.product.wholesalePrice
          : comp.product.retailPrice;
      return price === basePrice;
    });
  };

  const isValid = () => {
    if (!comboName.trim() || components.length === 0) return false;

    if (itemType === "combo") {
      return comboPrice > 0;
    } else {
      // Para agrupaciones, verificar que todos tengan el mismo precio
      return checkSamePriceForGrouped();
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h4 className="font-medium mb-3 text-gray-900 flex items-center">
        {itemType === "combo" ? (
          <>
            <Layers className="h-4 w-4 mr-2 text-green-600" />
            Configurar Combo
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2 text-purple-600" />
            Configurar Agrupación
          </>
        )}
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del {itemType === "combo" ? "combo" : "pack"}
          </label>
          <input
            type="text"
            value={comboName}
            onChange={(e) => setComboName(e.target.value)}
            placeholder={`Ej: ${
              itemType === "combo" ? "Combo Desayuno" : "Pack Limpieza"
            }`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {itemType === "combo" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio especial del combo
            </label>
            <input
              type="number"
              value={comboPrice}
              onChange={(e) => setComboPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Componentes */}
        {components.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Componentes ({components.length})
            </label>
            <div className="space-y-2">
              {components.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-2 rounded border"
                >
                  <div className="flex-1">
                    <span className="font-medium">{comp.product.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      $
                      {selectedCustomer?.customerType === "wholesale"
                        ? comp.product.wholesalePrice
                        : comp.product.retailPrice}{" "}
                      c/u
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateComponentQuantity(index, comp.quantity - 1)
                      }
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm min-w-[2rem] text-center">
                      {comp.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateComponentQuantity(index, comp.quantity + 1)
                      }
                      className="p-1 text-gray-500 hover:text-green-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveComponent(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {itemType === "combo" && (
              <div className="mt-3 p-3 bg-blue-50 rounded border">
                <div className="flex justify-between text-sm">
                  <span>Precio individual:</span>
                  <span>${calculateIndividualPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Precio combo:</span>
                  <span>${comboPrice.toFixed(2)}</span>
                </div>
                {calculateIndividualPrice() > comboPrice && comboPrice > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Ahorro:</span>
                    <span>
                      ${(calculateIndividualPrice() - comboPrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {itemType === "grouped" && (
              <div className="mt-3 p-3 bg-purple-50 rounded border">
                {checkSamePriceForGrouped() ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Unidades totales:</span>
                      <span>{calculateTotalUnits()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Precio unitario:</span>
                      <span>
                        $
                        {components.length > 0
                          ? (selectedCustomer?.customerType === "wholesale"
                              ? components[0].product.wholesalePrice
                              : components[0].product.retailPrice
                            ).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Precio total:</span>
                      <span>
                        $
                        {(
                          calculateTotalUnits() *
                          (components.length > 0
                            ? selectedCustomer?.customerType === "wholesale"
                              ? components[0].product.wholesalePrice
                              : components[0].product.retailPrice
                            : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-red-600 text-sm">
                    ⚠️ Todos los productos deben tener el mismo precio para
                    crear una agrupación
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {components.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">
              Busque productos arriba para agregarlos al{" "}
              {itemType === "combo" ? "combo" : "pack"}
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onAddToSale}
            disabled={!isValid()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Agregar {itemType === "combo" ? "Combo" : "Agrupación"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
