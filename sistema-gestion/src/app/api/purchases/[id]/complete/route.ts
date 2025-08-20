import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/purchases/[id]/complete - Completar compra y actualizar stock/costos
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const maxAttempts = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `🔄 Intento ${attempt}/${maxAttempts} - Completando compra ${params.id}`
      );

      const purchase = await prisma.purchase.findUnique({
        where: { id: params.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!purchase) {
        return NextResponse.json(
          { error: "Compra no encontrada" },
          { status: 404 }
        );
      }

      if (purchase.status === "COMPLETED") {
        return NextResponse.json(
          { error: "La compra ya está completada" },
          { status: 400 }
        );
      }

      if (purchase.status === "CANCELLED") {
        return NextResponse.json(
          { error: "No se puede completar una compra cancelada" },
          { status: 400 }
        );
      }

      // Completar compra en una transacción optimizada con timeout extendido
      const result = await prisma.$transaction(
        async (tx) => {
          // Actualizar estado de la compra
          const updatedPurchase = await tx.purchase.update({
            where: { id: params.id },
            data: {
              status: "COMPLETED",
              receivedDate: new Date(),
              updatedAt: new Date(),
            },
          });

          // Calcular costo final distribuido para cada producto
          const subtotalPesos = purchase.items.reduce((sum, item) => {
            return sum + (item.quantity || 0) * (item.unitPricePesos || 0);
          }, 0);

          // Calcular total de costos de importación en ARS
          const freightCostARS =
            (purchase.freightCost || 0) * (purchase.exchangeRate || 1);
          const otherCostsARS =
            (purchase.otherCosts || 0) * (purchase.exchangeRate || 1);
          const totalImportCosts =
            freightCostARS +
            otherCostsARS +
            (purchase.customsCost || 0) +
            (purchase.taxCost || 0) +
            (purchase.insuranceCost || 0);

          // Preparar actualizaciones de productos y movimientos de stock en paralelo
          const productUpdates = purchase.items.map((item) => {
            // Calcular costo distribuido para este item
            const itemSubtotalPesos =
              (item.quantity || 0) * (item.unitPricePesos || 0);
            const distributedCosts =
              subtotalPesos > 0
                ? (itemSubtotalPesos / subtotalPesos) * totalImportCosts
                : 0;
            const finalUnitCost =
              (item.unitPricePesos || 0) +
              distributedCosts / (item.quantity || 1);

            console.log(`💰 Producto ${item.product.name}:`, {
              unitPricePesos: item.unitPricePesos,
              distributedCosts,
              finalUnitCost,
              quantity: item.quantity,
            });

            return tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
                // ✅ Usar el costo final calculado (unitPrice + costos distribuidos)
                cost: Math.round(finalUnitCost * 100) / 100,
                updatedAt: new Date(),
              },
            });
          });

          const stockMovements = purchase.items.map((item) =>
            tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: "IN",
                quantity: item.quantity,
                reason: "Compra completada",
                reference: `Compra ${purchase.purchaseNumber}`,
                createdAt: new Date(),
              },
            })
          );

          // Ejecutar todas las operaciones en paralelo
          await Promise.allSettled([...productUpdates, ...stockMovements]);

          return updatedPurchase;
        },
        {
          timeout: 60000, // 60 segundos timeout
          maxWait: 20000, // 20 segundos máximo de espera para obtener una conexión
        }
      );

      // Obtener la compra actualizada con todas sus relaciones
      const completePurchase = await prisma.purchase.findUnique({
        where: { id: params.id },
        include: {
          supplier: true,
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      console.log(
        `✅ Compra ${params.id} completada exitosamente en el intento ${attempt}`
      );
      return NextResponse.json({
        message: "Compra completada exitosamente",
        purchase: completePurchase,
      });
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Error en intento ${attempt}/${maxAttempts}:`, {
        error: error.message,
        code: error.code,
        purchaseId: params.id,
        itemCount: await prisma.purchase
          .findUnique({
            where: { id: params.id },
            select: { _count: { select: { items: true } } },
          })
          .then((p) => p?._count.items || 0),
      });

      // Si es el último intento o si es un error que no debería reintentarse, lanzar error
      const nonRetryableErrors = ["P2002", "P2025", "P2003"]; // Constraint violation, record not found, foreign key constraint
      if (attempt === maxAttempts || nonRetryableErrors.includes(error.code)) {
        break;
      }

      // Esperar antes del siguiente intento (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 segundos
      console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  console.error(
    `💥 Error al completar compra ${params.id} después de ${maxAttempts} intentos:`,
    lastError
  );

  return NextResponse.json(
    {
      error: `Error al completar la compra después de ${maxAttempts} intentos: ${
        lastError?.message || "Error desconocido"
      }`,
      code: lastError?.code,
      attempt: maxAttempts,
    },
    { status: 500 }
  );
}
