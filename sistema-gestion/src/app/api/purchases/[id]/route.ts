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

    return NextResponse.json(purchase);
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
