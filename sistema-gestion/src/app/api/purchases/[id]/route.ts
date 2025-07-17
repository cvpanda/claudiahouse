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
      items: purchase.items.map((item: any) => ({
        ...item,
        quantity: item.quantity || 0,
        unitPricePesos: item.unitPricePesos || 0,
        unitPriceForeign: item.unitPriceForeign || null,
        distributedCosts: item.distributedCosts || 0,
        finalUnitCost: item.finalUnitCost || item.unitPricePesos,
        totalCost: item.totalCost || (item.quantity * item.unitPricePesos),
        // Calcular subtotales para la vista
        subtotalPesos: item.totalCost || (item.quantity * item.unitPricePesos),
        subtotalForeign: item.unitPriceForeign ? (item.quantity * item.unitPriceForeign) : null,
        distributedCostPesos: item.distributedCosts || 0,
        distributedCostForeign: (item.unitPriceForeign && purchase.exchangeRate) 
          ? (item.distributedCosts || 0) / purchase.exchangeRate 
          : null,
        finalCostPesos: item.finalUnitCost || item.unitPricePesos,
        finalCostForeign: (item.unitPriceForeign && purchase.exchangeRate) 
          ? item.finalUnitCost / purchase.exchangeRate 
          : null,
      })),
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

// DELETE /api/purchases/[id] - Eliminar compra (solo si está en estado PENDING o CANCELLED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la compra existe y se puede eliminar
    // @ts-ignore - Temporary fix for Prisma client type issue
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id: params.id },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Compra no encontrada" },
        { status: 404 }
      );
    }

    if (!["PENDING", "CANCELLED"].includes(existingPurchase.status)) {
      return NextResponse.json(
        { error: "Solo se pueden eliminar compras pendientes o canceladas" },
        { status: 400 }
      );
    }

    // @ts-ignore - Temporary fix for Prisma client type issue
    await prisma.purchase.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Compra eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Error al eliminar la compra" },
      { status: 500 }
    );
  }
}
