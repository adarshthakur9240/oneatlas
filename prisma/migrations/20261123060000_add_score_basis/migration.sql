-- AlterTable
ALTER TABLE "Model" ADD COLUMN "scoreBasis" TEXT;

-- CreateIndex
CREATE INDEX "Model_scoreBasis_idx" ON "Model"("scoreBasis");
