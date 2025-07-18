import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface UpdatePurchaseData {
  status?: string;
  receivedDate?: string;
  notes?: string;
}

// GET /api/purchases/[id] - Obtener compra específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // @ts-ignore - Temporary fix for Prisma client type issue
    const purchase = await prisma.purchase.findUnique({
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

    if (!purchase) {
      return NextResponse.json(
        { error: "Compra no encontrada" },
        { status: 404 }
      );
    }

    // Calcular distribución de costos
    const totalSubtotalPesos = purchase.items.reduce(
      (sum: number, item: any) => {
        return sum + (item.quantity || 0) * (item.unitPricePesos || 0);
      },
      0
    );

    // Calcular total de costos de importación en ARS
    const freightCostARS =
      (purchase.freightCost || 0) * (purchase.exchangeRate || 1);
    const otherCostsARS =
      (purchase.otherCosts || 0) * (purchase.exchangeRate || 1);

    const totalImportCosts =
      freightCostARS +
      otherCostsARS +
      (purchase.customsCost || 0) +
      (purchase.taxCost || 0) +
      (purchase.insuranceCost || 0);

    // Asegurar que todos los valores numéricos sean válidos
    const sanitizedPurchase = {
      ...purchase,
      freightCost: purchase.freightCost || 0,
      customsCost: purchase.customsCost || 0,
      taxCost: purchase.taxCost || 0,
      insuranceCost: purchase.insuranceCost || 0,
      otherCosts: purchase.otherCosts || 0,
      subtotalPesos: purchase.subtotalPesos || 0,
      totalCosts: purchase.totalCosts || 0,
      total: purchase.total || 0,
      exchangeRate: purchase.exchangeRate || null,
      subtotalForeign: purchase.subtotalForeign || null,
      items: purchase.items.map((item: any) => {
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

        if (item.unitPriceForeign && purchase.exchangeRate) {
          const itemSubtotalForeign =
            (item.quantity || 0) * item.unitPriceForeign;
          const totalSubtotalForeign = purchase.subtotalForeign || 0;

          if (totalSubtotalForeign > 0) {
            const totalImportCostsForeign =
              totalImportCosts / purchase.exchangeRate;
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
          // Costos distribuidos calculados (nombres compatibles con la vista)
          distributedCosts: Math.round(distributedCostPesos * 100) / 100,
          distributedCostPesos: Math.round(distributedCostPesos * 100) / 100,
          distributedCostForeign: distributedCostForeign
            ? Math.round(distributedCostForeign * 100) / 100
            : null,
          // Costo final unitario (nombres compatibles con la vista)
          finalUnitCost: Math.round(finalCostPesos * 100) / 100,
          finalCostPesos: Math.round(finalCostPesos * 100) / 100,
          finalCostForeign: finalCostForeign
            ? Math.round(finalCostForeign * 100) / 100
            : null,
        };
      }),
    };

    return NextResponse.json(sanitizedPurchase);
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      { error: "Error al obtener la compra" },
      { status: 500 }
    );
  }
}

// PUT /api/purchases/[id] - Actualizar compra
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdatePurchaseData = await request.json();

    const updateData: any = {};

    if (data.status) updateData.status = data.status;
    if (data.receivedDate)
      updateData.receivedDate = new Date(data.receivedDate);
    if (data.notes !== undefined) updateData.notes = data.notes;

    updateData.updatedAt = new Date();

    // @ts-ignore - Temporary fix for Prisma client type issue
    const purchase = await prisma.purchase.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      { error: "Error al actualizar la compra" },
      { status: 500 }
    );
  }
}

// DELETE /api/purchases/[id] - Eliminar compra con reversión de stock
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la compra existe y obtener sus items
    // @ts-ignore - Temporary fix for Prisma client type issue
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

    // Solo permitir eliminar compras que no estén en estados críticos
    if (["RECEIVED", "IN_TRANSIT"].includes(existingPurchase.status)) {
      return NextResponse.json(
        { error: "No se pueden eliminar compras recibidas o en tránsito" },
        { status: 400 }
      );
    }

    // Usar transacción para garantizar consistencia
    await prisma.$transaction(async (tx) => {
      // Si la compra fue completada, revertir el impacto en stock
      if (existingPurchase.status === "COMPLETED") {
        for (const item of existingPurchase.items) {
          // Revertir stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          // Crear movimiento de stock (reversión)
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              reason: "Reversión por eliminación de compra",
              reference: `Compra ${existingPurchase.purchaseNumber} (eliminada)`,
            },
          });

          // Recalcular costo promedio del producto
          const otherPurchaseItems = await tx.purchaseItem.findMany({
            where: {
              productId: item.productId,
              purchase: {
                status: "COMPLETED",
                id: { not: params.id }, // Excluir la compra actual
              },
            },
          });

          if (otherPurchaseItems.length > 0) {
            const totalCost = otherPurchaseItems.reduce(
              (sum, otherItem) =>
                sum + otherItem.finalUnitCost * otherItem.quantity,
              0
            );
            const totalQuantity = otherPurchaseItems.reduce(
              (sum, otherItem) => sum + otherItem.quantity,
              0
            );
            const averageCost =
              totalQuantity > 0 ? totalCost / totalQuantity : 0;

            await tx.product.update({
              where: { id: item.productId },
              data: { cost: averageCost },
            });
          } else {
            // Si no hay otras compras, resetear el costo
            await tx.product.update({
              where: { id: item.productId },
              data: { cost: 0 },
            });
          }
        }
      }

      // Eliminar la compra (los items se eliminan automáticamente por onDelete: Cascade)
      await tx.purchase.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      message: "Compra eliminada exitosamente",
      revertedStock: existingPurchase.status === "COMPLETED",
    });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Error al eliminar la compra" },
      { status: 500 }
    );
  }
}
