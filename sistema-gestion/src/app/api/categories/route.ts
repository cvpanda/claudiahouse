import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Error fetching categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "El nombre y código son requeridos" },
        { status: 400 }
      );
    }

    if (code.length !== 3) {
      return NextResponse.json(
        { error: "El código debe tener exactamente 3 caracteres" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error creating category" },
      { status: 500 }
    );
  }
}
