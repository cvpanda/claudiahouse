import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSaleNumber } from "@/lib/utils";
import { z } from "zod";

const saleItemComponentSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  quantity: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
});

const saleItemSchema = z
  .object({
    // Para productos simples
    productId: z.string().optional(),
    quantity: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
    unitPrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),

    // Para combos/agrupaciones
    itemType: z.enum(["simple", "combo", "grouped"]).default("simple"),
    displayName: z.string().optional(),
    components: z.array(saleItemComponentSchema).optional(),
  })
  .refine(
    (data) => {
      // Validar que para items simples se requiera productId
      if (data.itemType === "simple") {
        return !!data.productId;
      }
      // Validar que para combos/agrupaciones se requieran components
      if (data.itemType === "combo" || data.itemType === "grouped") {
        return (
          !!data.components && data.components.length > 0 && !!data.displayName
        );
      }
      return true;
    },
    {
      message: "Datos incompletos para el tipo de item",
    }
  );

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
              components: {
                include: {
                  product: true,
                },
              },
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

    // Toda la lógica de stock y creación de venta dentro de la transacción
    const sale = await prisma.$transaction(
      async (tx: any) => {
        // Recopilar todos los productos necesarios (simples y de componentes)
        const allProductIds = new Set<string>();

        validatedData.items.forEach((item) => {
          if (item.itemType === "simple" && item.productId) {
            allProductIds.add(item.productId);
          } else if (
            (item.itemType === "combo" || item.itemType === "grouped") &&
            item.components
          ) {
            item.components.forEach((comp) =>
              allProductIds.add(comp.productId)
            );
          }
        });

        // Obtener todos los productos de una vez
        const products = await tx.product.findMany({
          where: { id: { in: Array.from(allProductIds) } },
        });

        // Crear un mapa para acceso rápido
        const productMap = new Map(products.map((p: any) => [p.id, p]));

        // Verificar stock y estado de productos
        for (const item of validatedData.items) {
          if (item.itemType === "simple" && item.productId) {
            const product: any = productMap.get(item.productId);
            if (!product) {
              throw new Error(`Producto no encontrado: ${item.productId}`);
            }
            if (!product.isActive) {
              throw new Error(`Producto inactivo: ${product.name}`);
            }
            if (product.stock < item.quantity) {
              throw new Error(
                `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
              );
            }
          } else if (
            (item.itemType === "combo" || item.itemType === "grouped") &&
            item.components
          ) {
            // Verificar cada componente del combo/agrupación
            for (const component of item.components) {
              const product: any = productMap.get(component.productId);
              if (!product) {
                throw new Error(
                  `Producto no encontrado: ${component.productId}`
                );
              }
              if (!product.isActive) {
                throw new Error(`Producto inactivo: ${product.name}`);
              }
              const totalNeeded = component.quantity * item.quantity;
              if (product.stock < totalNeeded) {
                throw new Error(
                  `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, necesario: ${totalNeeded}`
                );
              }
            }
          }
        }

        // Crear la venta con sus items
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
              create: await Promise.all(
                validatedData.items.map(async (item) => {
                  const saleItemData: any = {
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                    itemType: item.itemType,
                    displayName: item.displayName,
                  };

                  // Para productos simples
                  if (item.itemType === "simple" && item.productId) {
                    saleItemData.productId = item.productId;
                  }

                  // Para combos/agrupaciones, crear los componentes
                  if (
                    (item.itemType === "combo" ||
                      item.itemType === "grouped") &&
                    item.components
                  ) {
                    saleItemData.components = {
                      create: item.components.map((comp) => ({
                        productId: comp.productId,
                        quantity: comp.quantity,
                      })),
                    };
                  }

                  return saleItemData;
                })
              ),
            },
          },
          include: {
            customer: true,
            saleItems: {
              include: {
                product: true,
                components: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        });

        // Actualizar stock en lotes
        const stockUpdates: any[] = [];
        const stockMovements: any[] = [];

        for (const item of validatedData.items) {
          if (item.itemType === "simple" && item.productId) {
            // Stock update para producto simple
            stockUpdates.push(
              tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              })
            );

            // Stock movement para producto simple
            stockMovements.push(
              tx.stockMovement.create({
                data: {
                  type: "out",
                  quantity: item.quantity,
                  reason: "Venta",
                  reference: newSale.saleNumber,
                  productId: item.productId,
                },
              })
            );
          } else if (
            (item.itemType === "combo" || item.itemType === "grouped") &&
            item.components
          ) {
            // Stock updates para componentes del combo/agrupación
            for (const component of item.components) {
              const totalQuantity = component.quantity * item.quantity;

              stockUpdates.push(
                tx.product.update({
                  where: { id: component.productId },
                  data: { stock: { decrement: totalQuantity } },
                })
              );

              stockMovements.push(
                tx.stockMovement.create({
                  data: {
                    type: "out",
                    quantity: totalQuantity,
                    reason: `Venta - ${
                      item.displayName ||
                      (item.itemType === "combo" ? "Combo" : "Agrupación")
                    }`,
                    reference: newSale.saleNumber,
                    productId: component.productId,
                  },
                })
              );
            }
          }
        }

        // Ejecutar todas las operaciones en paralelo
        await Promise.all([...stockUpdates, ...stockMovements]);

        return newSale;
      },
      {
        maxWait: 10000, // 10 segundos de espera máxima
        timeout: 10000, // 10 segundos de timeout
      }
    );

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    // Errores personalizados de stock/producto
    if (
      typeof error.message === "string" &&
      error.message.startsWith("Producto")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      typeof error.message === "string" &&
      error.message.startsWith("Stock")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
