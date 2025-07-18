import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ShippingBranchUpdateSchema = z.object({
  name: z.string().min(1, "El nombre de la sucursal es requerido").optional(),
  address: z.string().min(1, "La dirección es requerida").optional(),
  province: z.string().min(1, "La provincia es requerida").optional(),
  city: z.string().min(1, "La localidad es requerida").optional(),
  postalCode: z.string().min(1, "El código postal es requerido").optional(),
  branchCode: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; branchId: string } }
) {
  try {
    const branch = await prisma.shippingBranch.findUnique({
      where: {
        id: params.branchId,
        customerId: params.id,
      },
      include: {
        customer: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Sucursal de envío no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Error fetching shipping branch:", error);
    return NextResponse.json(
      { error: "Error al obtener la sucursal de envío" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; branchId: string } }
) {
  try {
    const body = await request.json();
    const validatedData = ShippingBranchUpdateSchema.parse(body);

    const branch = await prisma.shippingBranch.update({
      where: {
        id: params.branchId,
        customerId: params.id,
      },
      data: {
        ...validatedData,
        branchCode: validatedData.branchCode || undefined,
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Error updating shipping branch:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la sucursal de envío" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; branchId: string } }
) {
  try {
    // Check if branch has associated sales
    const salesCount = await prisma.sale.count({
      where: { shippingBranchId: params.branchId },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una sucursal con ventas asociadas" },
        { status: 400 }
      );
    }

    await prisma.shippingBranch.delete({
      where: {
        id: params.branchId,
        customerId: params.id,
      },
    });

    return NextResponse.json({ message: "Sucursal eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting shipping branch:", error);
    return NextResponse.json(
      { error: "Error al eliminar la sucursal de envío" },
      { status: 500 }
    );
  }
}
