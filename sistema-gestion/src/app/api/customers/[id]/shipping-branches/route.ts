import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ShippingBranchSchema = z.object({
  name: z.string().min(1, "El nombre de la sucursal es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  city: z.string().min(1, "La localidad es requerida"),
  postalCode: z.string().min(1, "El código postal es requerido"),
  branchCode: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branches = await prisma.shippingBranch.findMany({
      where: { customerId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error("Error fetching shipping branches:", error);
    return NextResponse.json(
      { error: "Error al obtener las sucursales de envío" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = ShippingBranchSchema.parse(body);

    // Verify that the customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const branch = await prisma.shippingBranch.create({
      data: {
        ...validatedData,
        customerId: params.id,
        branchCode: validatedData.branchCode || undefined,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping branch:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la sucursal de envío" },
      { status: 500 }
    );
  }
}
