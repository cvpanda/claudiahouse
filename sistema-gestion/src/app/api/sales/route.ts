import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSaleNumber } from "@/lib/utils";
import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  quantity: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),
});

const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, "Debe incluir al menos un producto"),
  paymentMethod: z
    .enum([
      "efectivo",
      "tarjeta",
      "transferencia",
      "cheque",
      "cuenta_corriente",
    ])
    .default("efectivo"),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  shippingType: z.string().optional().nullable(),
  notes: z.string().optional(),
  subtotal: z.number().min(0),
  total: z.number().min(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search");
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const orderBy = searchParams.get("orderBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          saleItems: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          [orderBy]: order,
        },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);
    return NextResponse.json({
      data: sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = saleSchema.parse(body);

    // Verificar stock disponible
    for (const item of validatedData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 400 }
        );
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Producto inactivo: ${product.name}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
          },
          { status: 400 }
        );
      }
    }

    // Los totales ya vienen calculados del frontend, pero validamos
    const calculatedSubtotal = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discountAmount = (calculatedSubtotal * validatedData.discount) / 100;
    const taxableAmount = calculatedSubtotal - discountAmount;
    const taxAmount = (taxableAmount * validatedData.tax) / 100;
    const shippingCost = validatedData.shippingCost || 0;
    const calculatedTotal = taxableAmount + taxAmount + shippingCost;

    // Crear venta en transacción
    const sale = await prisma.$transaction(async (tx: any) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          saleNumber: generateSaleNumber(),
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          discount: discountAmount,
          tax: taxAmount,
          paymentMethod: validatedData.paymentMethod,
          customerId: validatedData.customerId,
          notes: validatedData.notes,
          shippingCost: validatedData.shippingCost,
          shippingType: validatedData.shippingType,
          saleItems: {
            create: validatedData.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          customer: true,
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      });

      // Actualizar stock y crear movimientos
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            type: "out",
            quantity: item.quantity,
            reason: "Venta",
            reference: newSale.saleNumber,
            productId: item.productId,
          },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
