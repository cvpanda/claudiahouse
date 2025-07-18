import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CustomerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Argentina"),
  cuit: z.string().optional(),
  customerType: z.enum(["retail", "wholesale"]).default("retail"),
  isActive: z.boolean().default(true),
});

const ShippingBranchSchema = z.object({
  name: z.string().min(1, "El nombre de la sucursal es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  city: z.string().min(1, "La localidad es requerida"),
  postalCode: z.string().min(1, "El código postal es requerido"),
  branchCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { cuit: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.customerType = type;
    }

    const customers = await prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.customer.count({ where });

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Error al obtener los clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CustomerSchema.parse(body);

    // Convert empty string to undefined for optional fields
    const customerData = {
      ...validatedData,
      email: validatedData.email || undefined,
      phone: validatedData.phone || undefined,
      address: validatedData.address || undefined,
      postalCode: validatedData.postalCode || undefined,
      province: validatedData.province || undefined,
      city: validatedData.city || undefined,
      cuit: validatedData.cuit || undefined,
    };

    const customer = await prisma.customer.create({
      data: customerData,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear el cliente" },
      { status: 500 }
    );
  }
}
