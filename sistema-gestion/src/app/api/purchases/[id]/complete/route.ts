import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/purchases/[id]/complete - Completar compra y actualizar stock/costos
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
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

    if (purchase.status === "COMPLETED") {
      return NextResponse.json(
        { error: "La compra ya está completada" },
        { status: 400 }
      );
    }

    if (purchase.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No se puede completar una compra cancelada" },
        { status: 400 }
      );
    }

    // Completar compra en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar estado de la compra
      const updatedPurchase = await tx.purchase.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          receivedDate: new Date(),
          updatedAt: new Date(),
        },
      });

      // Actualizar stock y costos de productos
      for (const item of purchase.items) {
        // Actualizar stock del producto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
            // Actualizar el costo del producto con el costo final calculado
            cost: item.finalUnitCost,
            updatedAt: new Date(),
          },
        });

        // Registrar movimiento de stock
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            reason: "Compra completada",
            reference: `Compra ${purchase.purchaseNumber}`,
            createdAt: new Date(),
          },
        });
      }

      return updatedPurchase;
    });

    // Obtener la compra actualizada con todas sus relaciones
    const completePurchase = await prisma.purchase.findUnique({
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

    return NextResponse.json({
      message: "Compra completada exitosamente",
      purchase: completePurchase,
    });
  } catch (error) {
    console.error("Error completing purchase:", error);
    return NextResponse.json(
      { error: "Error al completar la compra" },
      { status: 500 }
    );
  }
}
