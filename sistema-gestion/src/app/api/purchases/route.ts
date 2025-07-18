import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tipos para validación
type PurchaseType = "LOCAL" | "IMPORT";
type Currency = "ARS" | "USD" | "EUR" | "BRL" | "CNY";
type PurchaseStatus =
  | "PENDING"
  | "ORDERED"
  | "SHIPPED"
  | "CUSTOMS"
  | "RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

interface CreatePurchaseData {
  supplierId: string;
  type: PurchaseType;
  currency?: Currency;
  exchangeRate?: number;
  exchangeType?: string;
  freightCost?: number;
  customsCost?: number;
  taxCost?: number;
  insuranceCost?: number;
  otherCosts?: number;
  orderDate: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceForeign?: number;
    unitPricePesos: number;
    distributedCosts?: number;
    finalUnitCost?: number;
    totalCost?: number;
  }>;
}

// GET /api/purchases - Obtener todas las compras con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const status = searchParams.get("status") as PurchaseStatus | null;
    const type = searchParams.get("type") as PurchaseType | null;
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              country: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    return NextResponse.json({
      purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Error al obtener las compras" },
      { status: 500 }
    );
  }
}

// POST /api/purchases - Crear nueva compra
export async function POST(request: NextRequest) {
  try {
    const data: CreatePurchaseData = await request.json();

    // Validar datos requeridos
    if (!data.supplierId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Generar número de compra único
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { createdAt: "desc" },
      select: { purchaseNumber: true },
    });

    let nextNumber = 1;
    if (lastPurchase && lastPurchase.purchaseNumber) {
      const match = lastPurchase.purchaseNumber.match(/PC-(\d+)/);
      nextNumber = match ? parseInt(match[1]) + 1 : 1;
    }

    // Verificar que el número no exista ya (por seguridad)
    let purchaseNumber = `PC-${nextNumber.toString().padStart(6, "0")}`;
    let attempts = 0;
    while (attempts < 100) {
      const existing = await prisma.purchase.findUnique({
        where: { purchaseNumber },
        select: { id: true },
      });

      if (!existing) {
        break;
      }

      nextNumber++;
      purchaseNumber = `PC-${nextNumber.toString().padStart(6, "0")}`;
      attempts++;
    }

    if (attempts >= 100) {
      throw new Error("No se pudo generar un número de compra único");
    }

    // Calcular totales
    const subtotalForeign =
      data.type === "IMPORT"
        ? data.items.reduce(
            (sum, item) => sum + (item.unitPriceForeign || 0) * item.quantity,
            0
          )
        : null;

    const subtotalPesos = data.items.reduce(
      (sum, item) => sum + item.unitPricePesos * item.quantity,
      0
    );

    const totalCosts =
      (data.freightCost || 0) +
      (data.customsCost || 0) +
      (data.taxCost || 0) +
      (data.insuranceCost || 0) +
      (data.otherCosts || 0);

    // Para importaciones, distribuir costos proporcionalmente
    let itemsWithDistributedCosts = data.items;
    if (data.type === "IMPORT" && totalCosts > 0 && subtotalPesos > 0) {
      itemsWithDistributedCosts = data.items.map((item) => {
        const itemTotal = item.unitPricePesos * item.quantity;
        const proportion = itemTotal / subtotalPesos;
        const distributedCosts = totalCosts * proportion;
        const finalUnitCost =
          item.unitPricePesos + distributedCosts / item.quantity;

        return {
          ...item,
          distributedCosts,
          finalUnitCost,
          totalCost: finalUnitCost * item.quantity,
        };
      });
    } else {
      itemsWithDistributedCosts = data.items.map((item) => ({
        ...item,
        distributedCosts: 0,
        finalUnitCost: item.unitPricePesos,
        totalCost: item.unitPricePesos * item.quantity,
      }));
    }

    const total = subtotalPesos + totalCosts;

    // Crear la compra en una transacción
    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId,
          type: data.type,
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          exchangeType: data.exchangeType,
          freightCost: data.freightCost || 0,
          customsCost: data.customsCost || 0,
          taxCost: data.taxCost || 0,
          insuranceCost: data.insuranceCost || 0,
          otherCosts: data.otherCosts || 0,
          subtotalForeign,
          subtotalPesos,
          totalCosts,
          total,
          orderDate: new Date(data.orderDate),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          notes: data.notes,
          status: "PENDING",
        },
      });

      // Crear los items de la compra
      await tx.purchaseItem.createMany({
        data: itemsWithDistributedCosts.map((item) => ({
          purchaseId: newPurchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceForeign: item.unitPriceForeign || null,
          unitPricePesos: item.unitPricePesos,
          distributedCosts: item.distributedCosts || 0,
          finalUnitCost: item.finalUnitCost || item.unitPricePesos,
          totalCost: item.totalCost || item.quantity * item.unitPricePesos,
        })),
      });

      return newPurchase;
    });

    // Obtener la compra completa con sus relaciones
    const completePurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(completePurchase, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Error al crear la compra", details: errorMessage },
      { status: 500 }
    );
  }
}
