import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CustomerUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  cuit: z.string().optional(),
  customerType: z.enum(["retail", "wholesale"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Error al obtener el cliente" },
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
    const validatedData = CustomerUpdateSchema.parse(body);

    // Convert empty string to undefined for optional fields
    const updateData = {
      ...validatedData,
      email: validatedData.email || undefined,
      phone: validatedData.phone || undefined,
      address: validatedData.address || undefined,
      cuit: validatedData.cuit || undefined,
    };

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar el cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer has associated sales
    const salesCount = await prisma.sale.count({
      where: { customerId: params.id },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cliente con ventas asociadas" },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Error al eliminar el cliente" },
      { status: 500 }
    );
  }
}
