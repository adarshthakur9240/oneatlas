-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('FLAGSHIP', 'REASONING', 'CODING', 'FAST', 'MULTIMODAL', 'EMBEDDING');

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "country" TEXT,
    "foundedYear" INTEGER,
    "logoUrl" TEXT,
    "isOpenFirst" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "avgLatencyMs" INTEGER,
    "avgThroughputTps" DOUBLE PRECISION,
    "uptimePct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "modelType" "ModelType" NOT NULL DEFAULT 'FLAGSHIP',
    "isOpenWeights" BOOLEAN NOT NULL DEFAULT false,
    "isDeprecated" BOOLEAN NOT NULL DEFAULT false,
    "hasFreeVariant" BOOLEAN NOT NULL DEFAULT false,
    "contextWindow" INTEGER,
    "maxOutputTokens" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "huggingFaceId" TEXT,
    "minInputPrice" DOUBLE PRECISION,
    "minOutputPrice" DOUBLE PRECISION,
    "blendedPrice" DOUBLE PRECISION,
    "minCacheReadPrice" DOUBLE PRECISION,
    "cheapestProviderSlug" TEXT,
    "cheapestProviderName" TEXT,
    "providerCount" INTEGER NOT NULL DEFAULT 0,
    "compositeScore" DOUBLE PRECISION,
    "intelligenceScore" DOUBLE PRECISION,
    "codingScore" DOUBLE PRECISION,
    "capabilities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelProvider" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "endpointTag" TEXT NOT NULL DEFAULT '',
    "inputPrice" DOUBLE PRECISION NOT NULL,
    "outputPrice" DOUBLE PRECISION NOT NULL,
    "cacheReadPrice" DOUBLE PRECISION,
    "cacheWritePrice" DOUBLE PRECISION,
    "quantization" TEXT,
    "contextWindow" INTEGER,
    "maxOutputTokens" INTEGER,
    "latencyP50Ms" INTEGER,
    "throughputP50Tps" DOUBLE PRECISION,
    "uptimePct" DOUBLE PRECISION,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkScore" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "isVendorReported" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lab_slug_key" ON "Lab"("slug");

-- CreateIndex
CREATE INDEX "Lab_slug_idx" ON "Lab"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE INDEX "Provider_slug_idx" ON "Provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Model_sourceId_key" ON "Model"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Model_slug_key" ON "Model"("slug");

-- CreateIndex
CREATE INDEX "Model_labId_idx" ON "Model"("labId");

-- CreateIndex
CREATE INDEX "Model_modelType_idx" ON "Model"("modelType");

-- CreateIndex
CREATE INDEX "Model_blendedPrice_idx" ON "Model"("blendedPrice");

-- CreateIndex
CREATE INDEX "Model_contextWindow_idx" ON "Model"("contextWindow");

-- CreateIndex
CREATE INDEX "Model_compositeScore_idx" ON "Model"("compositeScore");

-- CreateIndex
CREATE INDEX "Model_isOpenWeights_idx" ON "Model"("isOpenWeights");

-- CreateIndex
CREATE INDEX "Model_isDeprecated_releaseDate_idx" ON "Model"("isDeprecated", "releaseDate" DESC);

-- CreateIndex
CREATE INDEX "Model_capabilities_idx" ON "Model" USING GIN ("capabilities");

-- CreateIndex
CREATE INDEX "ModelProvider_modelId_idx" ON "ModelProvider"("modelId");

-- CreateIndex
CREATE INDEX "ModelProvider_providerId_idx" ON "ModelProvider"("providerId");

-- CreateIndex
CREATE INDEX "ModelProvider_inputPrice_idx" ON "ModelProvider"("inputPrice");

-- CreateIndex
CREATE UNIQUE INDEX "ModelProvider_modelId_providerId_endpointTag_key" ON "ModelProvider"("modelId", "providerId", "endpointTag");

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_slug_key" ON "Benchmark"("slug");

-- CreateIndex
CREATE INDEX "Benchmark_slug_idx" ON "Benchmark"("slug");

-- CreateIndex
CREATE INDEX "BenchmarkScore_modelId_idx" ON "BenchmarkScore"("modelId");

-- CreateIndex
CREATE INDEX "BenchmarkScore_benchmarkId_idx" ON "BenchmarkScore"("benchmarkId");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkScore_modelId_benchmarkId_key" ON "BenchmarkScore"("modelId", "benchmarkId");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelProvider" ADD CONSTRAINT "ModelProvider_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelProvider" ADD CONSTRAINT "ModelProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkScore" ADD CONSTRAINT "BenchmarkScore_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkScore" ADD CONSTRAINT "BenchmarkScore_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- trigram indexes for ILIKE/fuzzy search (Prisma cannot declare these natively)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Model_name_trgm_idx" ON "Model" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Model_slug_trgm_idx" ON "Model" USING gin ("slug" gin_trgm_ops);
