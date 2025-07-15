-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNumber" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "shippingCost" REAL NOT NULL DEFAULT 0,
    "shippingType" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT,
    CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sales" ("createdAt", "customerId", "discount", "id", "notes", "paymentMethod", "saleNumber", "status", "subtotal", "tax", "total", "updatedAt") SELECT "createdAt", "customerId", "discount", "id", "notes", "paymentMethod", "saleNumber", "status", "subtotal", "tax", "total", "updatedAt" FROM "sales";
DROP TABLE "sales";
ALTER TABLE "new_sales" RENAME TO "sales";
CREATE UNIQUE INDEX "sales_saleNumber_key" ON "sales"("saleNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
