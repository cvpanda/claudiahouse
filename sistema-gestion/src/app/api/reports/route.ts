import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7days";

    // Calcular fechas según el período
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } // Obtener datos de ventas por día
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        saleItems: {
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

    // Procesar datos para ventas por día
    const salesByDay = [];
    const days = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(
        startDate.getTime() + i * 24 * 60 * 60 * 1000
      );
      const dayStr = currentDate.toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      });
      const daySales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.toDateString() === currentDate.toDateString();
      });

      salesByDay.push({
        day: dayStr,
        sales: daySales.length,
        revenue: daySales.reduce((sum, sale) => sum + sale.total, 0),
      });
    } // Calcular ventas por categoría
    const categoryStats: { [key: string]: number } = {};

    sales.forEach((sale) => {
      sale.saleItems.forEach((item) => {
        const categoryName = item.product?.category?.name || "Sin categoría";
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = 0;
        }
        categoryStats[categoryName] += item.quantity;
      });
    });

    const salesByCategory = Object.entries(categoryStats).map(
      ([name, value], index) => ({
        name,
        value,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Color aleatorio
      })
    ); // Productos más vendidos
    const productStats: {
      [key: string]: { sold: number; revenue: number; name: string };
    } = {};

    sales.forEach((sale) => {
      sale.saleItems.forEach((item) => {
        const productId = item.productId;
        const productName = item.product?.name || "Producto desconocido";

        if (!productStats[productId]) {
          productStats[productId] = { sold: 0, revenue: 0, name: productName };
        }

        productStats[productId].sold += item.quantity;
        productStats[productId].revenue += item.quantity * item.unitPrice;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // Productos con stock bajo
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        name: true,
        stock: true,
        minStock: true,
      },
    });

    const filteredLowStock = lowStockProducts
      .filter((product) => product.stock <= product.minStock)
      .slice(0, 10);

    // Estadísticas de clientes
    const totalCustomers = await prisma.customer.count({
      where: { isActive: true },
    });
    const wholesaleCustomers = await prisma.customer.count({
      where: {
        isActive: true,
        customerType: "wholesale",
      },
    });

    const retailCustomers = await prisma.customer.count({
      where: {
        isActive: true,
        customerType: "retail",
      },
    });

    // Ventas por mes (para el período seleccionado)
    const salesByMonth = [];
    const monthsToShow =
      period === "1year" ? 12 : Math.min(12, Math.ceil(days / 30));

    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = monthDate.toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      });

      const monthSales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return (
          saleDate.getMonth() === monthDate.getMonth() &&
          saleDate.getFullYear() === monthDate.getFullYear()
        );
      });

      salesByMonth.unshift({
        month: monthStr,
        sales: monthSales.length,
        revenue: monthSales.reduce((sum, sale) => sum + sale.total, 0),
      });
    }

    // Calcular métricas avanzadas
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCost = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.saleItems.reduce((itemSum, item) => {
          // Estimamos el costo como 60% del precio de venta si no tenemos costo real
          return itemSum + item.unitPrice * item.quantity * 0.6;
        }, 0)
      );
    }, 0);

    const grossProfit = totalRevenue - totalCost;
    const profitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // ROI calculado como ganancia bruta / inversión (costo)
    const roi = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

    // Ticket promedio
    const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

    // Tendencias (comparar con período anterior)
    const previousStartDate = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime())
    );
    const previousSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    const previousRevenue = previousSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const previousSalesCount = previousSales.length;
    const salesGrowth =
      previousSalesCount > 0
        ? ((sales.length - previousSalesCount) / previousSalesCount) * 100
        : 0;

    // Análisis de productos
    const productAnalysis = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((product) => ({
        ...product,
        profitMargin:
          product.revenue > 0
            ? ((product.revenue - product.revenue * 0.6) / product.revenue) *
              100
            : 0,
        contribution:
          totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0,
      }));

    const reportData = {
      salesByDay,
      salesByCategory,
      topProducts,
      lowStockProducts: filteredLowStock,
      salesByMonth,
      customerStats: {
        totalCustomers,
        wholesaleCustomers,
        retailCustomers,
      },
      // Nuevas métricas avanzadas
      advancedMetrics: {
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
        roi,
        averageTicket,
        revenueGrowth,
        salesGrowth,
      },
      productAnalysis,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
