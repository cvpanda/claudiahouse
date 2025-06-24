import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, contact, phone, email, address, cuit } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name,
        contact: contact || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        cuit: cuit || null,
      },
    });

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("Error updating supplier:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si el proveedor tiene productos asociados
    const productsCount = await prisma.product.count({
      where: { supplierId: params.id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el proveedor porque tiene ${productsCount} productos asociados`,
        },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Proveedor eliminado correctamente" });
  } catch (error: any) {
    console.error("Error deleting supplier:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
