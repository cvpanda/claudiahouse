import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Obtener estadísticas básicas
    const [
      totalProducts,
      totalCustomers,
      todaySales,
      monthSales,
      totalRevenue,
      totalPurchases,
      pendingPurchases,
      monthPurchases,
      totalPurchaseAmount,
    ] = await Promise.all([
      // Total de productos
      prisma.product.count({
        where: { isActive: true },
      }),

      // Total de clientes
      prisma.customer.count({
        where: { isActive: true },
      }),

      // Ventas de hoy
      prisma.sale.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Ventas del mes
      prisma.sale.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
      }),

      // Ingresos totales
      prisma.sale.aggregate({
        _sum: {
          total: true,
        },
      }),

      // Total de compras
      prisma.purchase.count(),

      // Compras pendientes
      prisma.purchase.count({
        where: {
          status: {
            in: ["PENDING", "ORDERED", "SHIPPED", "CUSTOMS", "RECEIVED"],
          },
        },
      }),

      // Compras del mes
      prisma.purchase.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
      }),

      // Monto total de compras
      prisma.purchase.aggregate({
        _sum: {
          total: true,
        },
      }),
    ]);

    // Calcular productos con stock bajo manualmente (comparando stock vs minStock)
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { stock: true, minStock: true },
    });
    const lowStockProducts = allProducts.filter(
      (product: { stock: number; minStock: number }) =>
        product.stock <= product.minStock
    ).length;

    return NextResponse.json({
      totalProducts,
      lowStockProducts,
      totalCustomers,
      todaySales,
      monthSales,
      totalRevenue: totalRevenue._sum.total || 0,
      totalPurchases,
      pendingPurchases,
      monthPurchases,
      totalPurchaseAmount: totalPurchaseAmount._sum.total || 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
