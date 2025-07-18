-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Argentina',
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "shippingBranchId" TEXT;

-- CreateTable
CREATE TABLE "shipping_branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "branchCode" TEXT,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_branches_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shipping_branches" ADD CONSTRAINT "shipping_branches_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_shippingBranchId_fkey" FOREIGN KEY ("shippingBranchId") REFERENCES "shipping_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
