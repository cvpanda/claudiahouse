-- DropForeignKey
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_productId_fkey";

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "itemType" TEXT NOT NULL DEFAULT 'simple',
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "sale_item_components" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "sale_item_components_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_components" ADD CONSTRAINT "sale_item_components_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_components" ADD CONSTRAINT "sale_item_components_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
