import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSaleSchema = z.object({
  paymentMethod: z
    .enum([
      "efectivo",
      "tarjeta",
      "transferencia",
      "cheque",
      "cuenta_corriente",
    ])
    .optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  shippingType: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        productId: z.string(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;

    const sale = await (prisma.sale.findUnique as any)({
      where: {
        id: saleId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerType: true,
            phone: true,
            email: true,
          },
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
                stock: true,
                retailPrice: true,
                wholesalePrice: true,
              },
            },
            components: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    unit: true,
                    stock: true,
                    retailPrice: true,
                    wholesalePrice: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error("Error fetching sale:", error);
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
    const saleId = params.id;
    const body = await request.json();

    // Validar los datos
    const validatedData = updateSaleSchema.parse(body);

    // Verificar que la venta existe
    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { saleItems: true },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // No permitir editar ventas canceladas
    if (existingSale.status === "cancelled") {
      return NextResponse.json(
        { error: "No se puede editar una venta cancelada" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Si se están actualizando los items
      if (validatedData.items) {
        // Eliminar items existentes
        await tx.saleItem.deleteMany({
          where: { saleId: saleId },
        });

        // Calcular nuevos totales
        let subtotal = 0;
        const newItems = validatedData.items.map((item) => {
          const totalPrice = item.quantity * item.unitPrice;
          subtotal += totalPrice;
          return {
            saleId: saleId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: totalPrice,
          };
        });

        // Crear nuevos items
        await tx.saleItem.createMany({
          data: newItems,
        });

        // Actualizar totales
        const tax = validatedData.tax ?? existingSale.tax;
        const discount = validatedData.discount ?? existingSale.discount;
        const shippingCost =
          validatedData.shippingCost ??
          ((existingSale as any).shippingCost || 0);
        const total = subtotal + tax - discount + shippingCost;

        // Prepare update data excluding items
        const { items, ...saleUpdateData } = validatedData;

        // Filter out undefined values to avoid Prisma issues
        const cleanUpdateData = Object.fromEntries(
          Object.entries(saleUpdateData).filter(
            ([_, value]) => value !== undefined
          )
        );

        // Actualizar la venta
        const updatedSale = await tx.sale.update({
          where: { id: saleId },
          data: {
            ...cleanUpdateData,
            subtotal,
            total,
            updatedAt: new Date(),
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                customerType: true,
                phone: true,
                email: true,
              },
            },
            saleItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    unit: true,
                    stock: true,
                    retailPrice: true,
                    wholesalePrice: true,
                  },
                },
              },
            },
          },
        });

        return updatedSale;
      } else {
        // Solo actualizar campos de la venta (sin items)
        // Prepare update data excluding items
        const { items, ...saleUpdateData } = validatedData;

        // Filter out undefined values to avoid Prisma issues
        const cleanUpdateData = Object.fromEntries(
          Object.entries(saleUpdateData).filter(
            ([_, value]) => value !== undefined
          )
        );

        const updatedSale = await tx.sale.update({
          where: { id: saleId },
          data: {
            ...cleanUpdateData,
            updatedAt: new Date(),
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                customerType: true,
                phone: true,
                email: true,
              },
            },
            saleItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    unit: true,
                    stock: true,
                    retailPrice: true,
                    wholesalePrice: true,
                  },
                },
              },
            },
          },
        });

        return updatedSale;
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Venta actualizada exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating sale:", error);
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
    const saleId = params.id;

    // Verificar que la venta existe y obtener todos los items con componentes
    const existingSale = await (prisma.sale.findUnique as any)({
      where: { id: saleId },
      include: {
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

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // No permitir cancelar ventas ya canceladas
    if (existingSale.status === "cancelled") {
      return NextResponse.json(
        { error: "La venta ya está cancelada" },
        { status: 400 }
      );
    }

    // Cancelar la venta y devolver stock en una transacción
    const cancelledSale = await prisma.$transaction(
      async (tx: any) => {
        // 1. Cambiar el estado de la venta a cancelado
        const updatedSale = await tx.sale.update({
          where: { id: saleId },
          data: {
            status: "cancelled",
            updatedAt: new Date(),
          },
        });

        // 2. Devolver el stock y crear movimientos de stock
        const stockUpdates: any[] = [];
        const stockMovements: any[] = [];

        for (const item of (existingSale as any).saleItems) {
          if (
            (!item.itemType || item.itemType === "simple") &&
            item.productId
          ) {
            // Producto simple - devolver stock
            stockUpdates.push(
              tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              })
            );

            // Crear movimiento de stock de entrada
            stockMovements.push(
              tx.stockMovement.create({
                data: {
                  type: "in",
                  quantity: item.quantity,
                  reason: "Cancelación de venta",
                  reference: existingSale.saleNumber,
                  productId: item.productId,
                },
              })
            );
          } else if (
            (item.itemType === "combo" || item.itemType === "grouped") &&
            item.components &&
            item.components.length > 0
          ) {
            // Combo/agrupación - devolver stock de cada componente
            for (const component of item.components) {
              const totalQuantity = component.quantity * item.quantity;

              stockUpdates.push(
                tx.product.update({
                  where: { id: component.productId },
                  data: { stock: { increment: totalQuantity } },
                })
              );

              stockMovements.push(
                tx.stockMovement.create({
                  data: {
                    type: "in",
                    quantity: totalQuantity,
                    reason: `Cancelación de venta - ${
                      item.displayName ||
                      (item.itemType === "combo" ? "Combo" : "Agrupación")
                    }`,
                    reference: existingSale.saleNumber,
                    productId: component.productId,
                  },
                })
              );
            }
          }
        }

        // Ejecutar todas las operaciones de stock en paralelo
        await Promise.all([...stockUpdates, ...stockMovements]);

        return updatedSale;
      },
      {
        maxWait: 10000,
        timeout: 10000,
      }
    );

    return NextResponse.json({
      success: true,
      data: cancelledSale,
      message: "Venta cancelada exitosamente. Stock devuelto a los productos.",
    });
  } catch (error) {
    console.error("Error cancelling sale:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
