import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface EditPurchaseData {
  supplierId?: string;
  type?: string;
  currency?: string;
  exchangeRate?: number;
  exchangeType?: string;
  freightCost?: number;
  customsCost?: number;
  taxCost?: number;
  insuranceCost?: number;
  otherCosts?: number;
  notes?: string;
  orderDate?: string;
  expectedDate?: string;
  items: {
    id?: string; // Si existe, es un item a actualizar
    productId: string;
    quantity: number;
    unitPriceForeign?: number;
    unitPricePesos: number;
    _action?: "create" | "update" | "delete"; // Acción a realizar
  }[];
}

// PUT /api/purchases/[id]/edit - Editar compra completa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== EDIT PURCHASE DEBUG ===");
    console.log("Purchase ID:", params.id);

    const data: EditPurchaseData = await request.json();
    console.log("Request data:", JSON.stringify(data, null, 2));

    // Validaciones de datos
    if (!data.items || data.items.length === 0) {
      console.log("ERROR: No items provided");
      return NextResponse.json(
        { error: "Debe incluir al menos un producto en la compra" },
        { status: 400 }
      );
    }

    // Validar que todos los items tengan los campos requeridos
    for (const item of data.items) {
      if (!item.productId) {
        console.log("ERROR: Missing productId for item:", item);
        return NextResponse.json(
          { error: "Todos los productos deben tener un ID válido" },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        console.log("ERROR: Invalid quantity for item:", item);
        return NextResponse.json(
          { error: "Todas las cantidades deben ser mayores a 0" },
          { status: 400 }
        );
      }
      if (!item.unitPricePesos || item.unitPricePesos <= 0) {
        console.log("ERROR: Invalid unitPricePesos for item:", item);
        return NextResponse.json(
          { error: "Todos los precios deben ser mayores a 0" },
          { status: 400 }
        );
      }
    }

    // Verificar que la compra existe y se puede editar
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Compra no encontrada" },
        { status: 404 }
      );
    }

    // Solo permitir editar compras pendientes, ordenadas o en tránsito
    if (!["PENDING", "ORDERED", "SHIPPED"].includes(existingPurchase.status)) {
      return NextResponse.json(
        {
          error:
            "Solo se pueden editar compras pendientes, ordenadas o en tránsito",
        },
        { status: 400 }
      );
    }

    // Calcular nuevos totales con separación por moneda
    const subtotalPesos = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPricePesos,
      0
    );

    const subtotalForeign =
      data.currency && data.currency !== "ARS"
        ? data.items.reduce(
            (sum, item) => sum + item.quantity * (item.unitPriceForeign || 0),
            0
          )
        : null;

    // Separar costos por moneda
    const costsForeign =
      data.currency !== "ARS"
        ? {
            freight: data.freightCost || 0,
            customs: data.customsCost || 0,
            insurance: data.insuranceCost || 0,
            other: data.otherCosts || 0,
          }
        : {
            freight: 0,
            customs: 0,
            insurance: 0,
            other: 0,
          };

    const costsLocal = {
      // Impuestos SIEMPRE en pesos (IIBB, IVA, etc. son locales)
      tax: data.taxCost || 0,
      // Si es compra local (ARS), todos los costos van en pesos
      ...(data.currency === "ARS"
        ? {
            freight: data.freightCost || 0,
            customs: data.customsCost || 0,
            insurance: data.insuranceCost || 0,
            other: data.otherCosts || 0,
          }
        : {}),
    };

    const totalCostsForeign = Object.values(costsForeign).reduce(
      (sum, cost) => sum + cost,
      0
    );
    const totalCostsLocal = Object.values(costsLocal).reduce(
      (sum, cost) => sum + cost,
      0
    );

    // Convertir costos extranjeros a pesos usando el tipo de cambio
    const exchangeRate = data.exchangeRate || 1;
    const totalCostsForeignInPesos = totalCostsForeign * exchangeRate;
    const totalCostsInPesos = totalCostsForeignInPesos + totalCostsLocal;

    const total = subtotalPesos + totalCostsInPesos;

    // Actualizar datos principales de la compra
    const updateData: any = {
      updatedAt: new Date(),
      subtotalPesos,
      totalCosts: totalCostsInPesos,
      total,
    };

    if (data.supplierId) updateData.supplierId = data.supplierId;
    if (data.type) updateData.type = data.type;
    if (data.currency) updateData.currency = data.currency;
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = data.exchangeRate;
    if (data.exchangeType) updateData.exchangeType = data.exchangeType;
    if (data.freightCost !== undefined)
      updateData.freightCost = data.freightCost;
    if (data.customsCost !== undefined)
      updateData.customsCost = data.customsCost;
    if (data.taxCost !== undefined) updateData.taxCost = data.taxCost;
    if (data.insuranceCost !== undefined)
      updateData.insuranceCost = data.insuranceCost;
    if (data.otherCosts !== undefined) updateData.otherCosts = data.otherCosts;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.orderDate) updateData.orderDate = new Date(data.orderDate);
    if (data.expectedDate)
      updateData.expectedDate = new Date(data.expectedDate);
    if (subtotalForeign !== null) updateData.subtotalForeign = subtotalForeign;

    // Usar transacción para garantizar consistencia
    await prisma.$transaction(async (tx) => {
      // Actualizar compra
      await tx.purchase.update({
        where: { id: params.id },
        data: updateData,
      });

      // Eliminar todos los items existentes
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: params.id },
      });

      // Crear nuevos items con cálculos actualizados
      for (const item of data.items) {
        const itemSubtotalPesos = item.quantity * item.unitPricePesos;

        // Calcular costos distribuidos
        const distributedCosts =
          subtotalPesos > 0
            ? (itemSubtotalPesos / subtotalPesos) * totalCostsInPesos
            : 0;

        const finalUnitCost =
          item.unitPricePesos + distributedCosts / item.quantity;
        const totalCost = finalUnitCost * item.quantity;

        await tx.purchaseItem.create({
          data: {
            purchaseId: params.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPriceForeign: item.unitPriceForeign,
            unitPricePesos: item.unitPricePesos,
            distributedCosts,
            finalUnitCost,
            totalCost,
          },
        });
      }
    });

    // Obtener la compra actualizada con cálculos
    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!updatedPurchase) {
      throw new Error("Compra no encontrada después de la actualización");
    }

    // Calcular distribución de costos (igual que en GET)
    const totalSubtotalPesos = updatedPurchase.items.reduce(
      (sum: number, item: any) => {
        return sum + (item.quantity || 0) * (item.unitPricePesos || 0);
      },
      0
    );

    const totalImportCosts =
      (updatedPurchase.freightCost || 0) +
      (updatedPurchase.customsCost || 0) +
      (updatedPurchase.taxCost || 0) +
      (updatedPurchase.insuranceCost || 0) +
      (updatedPurchase.otherCosts || 0);

    // Asegurar que todos los valores numéricos sean válidos y calcular costos distribuidos
    const sanitizedPurchase = {
      ...updatedPurchase,
      freightCost: updatedPurchase.freightCost || 0,
      customsCost: updatedPurchase.customsCost || 0,
      taxCost: updatedPurchase.taxCost || 0,
      insuranceCost: updatedPurchase.insuranceCost || 0,
      otherCosts: updatedPurchase.otherCosts || 0,
      subtotalPesos: updatedPurchase.subtotalPesos || 0,
      totalCosts: updatedPurchase.totalCosts || 0,
      total: updatedPurchase.total || 0,
      exchangeRate: updatedPurchase.exchangeRate || null,
      subtotalForeign: updatedPurchase.subtotalForeign || null,
      items: updatedPurchase.items.map((item: any) => {
        const itemSubtotalPesos =
          (item.quantity || 0) * (item.unitPricePesos || 0);

        // Calcular el costo distribuido proporcionalmente
        const distributedCostPesos =
          totalSubtotalPesos > 0
            ? (itemSubtotalPesos / totalSubtotalPesos) * totalImportCosts
            : 0;

        // Calcular el costo distribuido por unidad
        const distributedCostPerUnit =
          (item.quantity || 0) > 0
            ? distributedCostPesos / (item.quantity || 0)
            : 0;

        // Costo final por unidad (precio + costo distribuido por unidad)
        const finalCostPesos =
          (item.unitPricePesos || 0) + distributedCostPerUnit;

        let distributedCostForeign = null;
        let finalCostForeign = null;

        if (item.unitPriceForeign && updatedPurchase.exchangeRate) {
          const itemSubtotalForeign =
            (item.quantity || 0) * item.unitPriceForeign;
          const totalSubtotalForeign = updatedPurchase.subtotalForeign || 0;

          if (totalSubtotalForeign > 0) {
            const totalImportCostsForeign =
              totalImportCosts / updatedPurchase.exchangeRate;
            distributedCostForeign =
              (itemSubtotalForeign / totalSubtotalForeign) *
              totalImportCostsForeign;
            const distributedCostPerUnitForeign =
              distributedCostForeign / (item.quantity || 0);
            finalCostForeign =
              item.unitPriceForeign + distributedCostPerUnitForeign;
          }
        }

        return {
          id: item.id,
          productId: item.productId,
          product: item.product,
          quantity: item.quantity || 0,
          unitPricePesos: item.unitPricePesos || 0,
          unitPriceForeign: item.unitPriceForeign || null,
          // Calcular subtotales
          subtotalPesos: itemSubtotalPesos,
          subtotalForeign: item.unitPriceForeign
            ? (item.quantity || 0) * item.unitPriceForeign
            : null,
          // Costos distribuidos calculados
          distributedCostPesos: Math.round(distributedCostPesos * 100) / 100,
          distributedCostForeign: distributedCostForeign
            ? Math.round(distributedCostForeign * 100) / 100
            : null,
          finalCostPesos: Math.round(finalCostPesos * 100) / 100,
          finalCostForeign: finalCostForeign
            ? Math.round(finalCostForeign * 100) / 100
            : null,
        };
      }),
    };

    console.log("✅ Purchase updated successfully");
    return NextResponse.json(sanitizedPurchase);
  } catch (error) {
    console.error("❌ Error editing purchase:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      {
        error: "Error al editar la compra",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
