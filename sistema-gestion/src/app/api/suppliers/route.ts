import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      data: suppliers,
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Error fetching suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contact, phone, email, address, cuit } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contact: contact || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        cuit: cuit || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Error creating supplier" },
      { status: 500 }
    );
  }
}
