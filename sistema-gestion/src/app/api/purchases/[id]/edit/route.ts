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
    id?: string; // ID del item existente (si se está editando un item existente)
    productId: string;
    quantity: number;
    unitPriceForeign?: number;
    unitPricePesos: number;
    _action?: "create" | "update" | "delete"; // Opcional: acción explícita
  }[];
}

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

    // Validar que la compra existe antes de proceder
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id: params.id },
    });

    if (!existingPurchase) {
      console.log("ERROR: Purchase not found");
      return NextResponse.json(
        { error: "Compra no encontrada" },
        { status: 404 }
      );
    }

    console.log("Existing purchase status:", existingPurchase.status);

    // Validar que todos los items tengan los campos requeridos
    for (const [index, item] of data.items.entries()) {
      if (!item.productId) {
        console.log(`ERROR: Item ${index} missing productId`);
        return NextResponse.json(
          { error: `Item ${index + 1}: productId es requerido` },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        console.log(`ERROR: Item ${index} invalid quantity`);
        return NextResponse.json(
          { error: `Item ${index + 1}: cantidad debe ser mayor a 0` },
          { status: 400 }
        );
      }
      if (!item.unitPricePesos || item.unitPricePesos <= 0) {
        console.log(`ERROR: Item ${index} invalid unitPricePesos`);
        return NextResponse.json(
          { error: `Item ${index + 1}: precio en pesos debe ser mayor a 0` },
          { status: 400 }
        );
      }

      // Validar que el producto existe
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        console.log(`ERROR: Product ${item.productId} not found`);
        return NextResponse.json(
          { error: `Producto con ID ${item.productId} no encontrado` },
          { status: 400 }
        );
      }
    }

    // Calcular nuevos totales
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
      tax: data.taxCost || 0,
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

    console.log("Update data:", updateData);

    // Usar transacción para garantizar consistencia
    const result = await prisma.$transaction(
      async (tx) => {
        console.log("🔄 Starting transaction...");

        const existingPurchase = await tx.purchase.findUnique({
          where: { id: params.id },
        });

        if (!existingPurchase) {
          throw new Error(`Compra con ID ${params.id} no encontrada`);
        }

        console.log("📝 Updating purchase...");
        const updatedPurchase = await tx.purchase.update({
          where: { id: params.id },
          data: updateData,
        });

        console.log("� Processing items changes...");

        // Obtener items existentes
        const existingItems = await tx.purchaseItem.findMany({
          where: { purchaseId: params.id },
        });

        console.log(`Found ${existingItems.length} existing items`);

        // Separar items en tres categorías
        const itemsToUpdate = [];
        const itemsToCreate = [];
        const existingItemIds = new Set();

        for (const newItem of data.items) {
          if (newItem.id) {
            // Item existente - actualizar
            itemsToUpdate.push(newItem);
            existingItemIds.add(newItem.id);
          } else {
            // Item nuevo - crear
            itemsToCreate.push(newItem);
          }
        }

        // Items a eliminar (existían pero ya no están en la lista)
        const itemsToDelete = existingItems.filter(
          (existing) => !existingItemIds.has(existing.id)
        );

        console.log(`Items to update: ${itemsToUpdate.length}`);
        console.log(`Items to create: ${itemsToCreate.length}`);
        console.log(`Items to delete: ${itemsToDelete.length}`);

        // 1. ACTUALIZAR items existentes
        for (const item of itemsToUpdate) {
          console.log(`Updating item ${item.id}`);

          const itemSubtotalPesos = item.quantity * item.unitPricePesos;
          const distributedCosts =
            subtotalPesos > 0
              ? (itemSubtotalPesos / subtotalPesos) * totalCostsInPesos
              : 0;
          const finalUnitCost =
            item.unitPricePesos + distributedCosts / item.quantity;
          const totalCost = finalUnitCost * item.quantity;

          await tx.purchaseItem.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity,
              unitPriceForeign: item.unitPriceForeign || null,
              unitPricePesos: item.unitPricePesos,
              distributedCosts,
              finalUnitCost,
              totalCost,
            },
          });
        }

        // 2. CREAR items nuevos
        for (const item of itemsToCreate) {
          console.log(`Creating new item for product ${item.productId}`);

          const itemSubtotalPesos = item.quantity * item.unitPricePesos;
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
              unitPriceForeign: item.unitPriceForeign || null,
              unitPricePesos: item.unitPricePesos,
              distributedCosts,
              finalUnitCost,
              totalCost,
            },
          });
        }

        // 3. ELIMINAR items que ya no están
        if (itemsToDelete.length > 0) {
          console.log(`Deleting ${itemsToDelete.length} removed items`);
          const idsToDelete = itemsToDelete.map((item) => item.id);
          await tx.purchaseItem.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        console.log("✅ Items processing completed");

        const updatedPurchaseWithItems = await tx.purchase.findUnique({
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

        return updatedPurchaseWithItems;
      },
      {
        timeout: 30000,
        maxWait: 5000,
      }
    );

    if (!result) {
      throw new Error("Compra no encontrada después de la actualización");
    }

    console.log("🧮 Calculating final costs...");
    const totalSubtotalPesos = result.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity || 0) * (item.unitPricePesos || 0);
    }, 0);

    const totalImportCosts =
      (result.freightCost || 0) +
      (result.customsCost || 0) +
      (result.taxCost || 0) +
      (result.insuranceCost || 0) +
      (result.otherCosts || 0);

    const sanitizedPurchase = {
      ...result,
      freightCost: result.freightCost || 0,
      customsCost: result.customsCost || 0,
      taxCost: result.taxCost || 0,
      insuranceCost: result.insuranceCost || 0,
      otherCosts: result.otherCosts || 0,
      subtotalPesos: result.subtotalPesos || 0,
      totalCosts: result.totalCosts || 0,
      total: result.total || 0,
      exchangeRate: result.exchangeRate || null,
      subtotalForeign: result.subtotalForeign || null,
      items: result.items.map((item: any) => {
        const itemSubtotalPesos =
          (item.quantity || 0) * (item.unitPricePesos || 0);
        const distributedCostPesos =
          totalSubtotalPesos > 0
            ? (itemSubtotalPesos / totalSubtotalPesos) * totalImportCosts
            : 0;
        const distributedCostPerUnit =
          (item.quantity || 0) > 0
            ? distributedCostPesos / (item.quantity || 0)
            : 0;
        const finalCostPesos =
          (item.unitPricePesos || 0) + distributedCostPerUnit;

        let distributedCostForeign = null;
        let finalCostForeign = null;

        if (item.unitPriceForeign && result.exchangeRate) {
          const itemSubtotalForeign =
            (item.quantity || 0) * item.unitPriceForeign;
          const totalSubtotalForeign = result.subtotalForeign || 0;

          if (totalSubtotalForeign > 0) {
            const totalImportCostsForeign =
              totalImportCosts / result.exchangeRate;
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
          subtotalPesos: itemSubtotalPesos,
          subtotalForeign: item.unitPriceForeign
            ? (item.quantity || 0) * item.unitPriceForeign
            : null,
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

    if (error instanceof Error) {
      if (error.message.includes("Transaction")) {
        return NextResponse.json(
          {
            error: "Error de transacción en la base de datos",
            details: "Por favor, intenta de nuevo en unos momentos",
            technical: error.message,
          },
          { status: 500 }
        );
      }

      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            error: "Error de referencia en la base de datos",
            details: "Uno o más productos referenciados no existen",
            technical: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Error al editar la compra",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
