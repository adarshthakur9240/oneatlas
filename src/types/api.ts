// src/types/api.ts
// Standard API envelopes and Data Transfer Objects (DTOs)
// All responses use plain serializable types (e.g. ISO string dates, no Prisma types)

export type ModelType =
  | "FLAGSHIP"
  | "REASONING"
  | "CODING"
  | "FAST"
  | "MULTIMODAL"
  | "EMBEDDING";

// Standard response envelopes
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination Meta
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  appliedFilters?: Record<string, unknown>;
  [key: string]: unknown;
}

// Model DTOs
export interface LabSummary {
  slug: string;
  name: string;
  logoUrl?: string | null;
}

export interface ProviderSummary {
  slug: string;
  name: string;
  logoUrl?: string | null;
}

export interface ModelSummaryDto {
  id: string;
  slug: string;
  sourceId: string;
  name: string;
  descriptionShort: string;
  lab: LabSummary;
  modelType: ModelType;
  releaseDate: string | null;
  isNew: boolean;
  isOpenWeights: boolean;
  isDeprecated: boolean;
  hasFreeVariant: boolean;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  inputModalities: string[];
  outputModalities: string[];
  capabilities: string[];
  minInputPrice: number | null;
  minOutputPrice: number | null;
  blendedPrice: number | null;
  minCacheReadPrice: number | null;
  cheapestProvider: ProviderSummary | null;
  providerCount: number;
  intelligenceScore: number | null;
  codingScore: number | null;
  compositeScore: number | null;
}

export interface ModelProviderDto {
  id: string;
  provider: ProviderSummary;
  endpointTag: string;
  inputPrice: number;
  outputPrice: number;
  cacheReadPrice: number | null;
  cacheWritePrice: number | null;
  quantization: string | null;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  latencyP50Ms: number | null;
  throughputP50Tps: number | null;
  uptimePct: number | null;
  isAvailable: boolean;
  tags: {
    cheapest: boolean;
    fastest: boolean;
    mostReliable: boolean;
  };
}

export interface ModelBenchmarkScoreDto {
  benchmark: {
    id: string;
    slug: string;
    name: string;
    category: string;
    unit: string;
    description: string | null;
  };
  score: number;
  isVendorReported: boolean;
  sourceUrl: string;
  evaluatedAt: string | null;
  categoryAverage: number;
  rank: number;
}

export interface ModelDetailDto extends ModelSummaryDto {
  description: string;
  license: string | null;
  parameterCount: number | null;
  lab: LabDetailDto;
  providers: ModelProviderDto[];
  benchmarks: ModelBenchmarkScoreDto[];
  related: ModelSummaryDto[];
}

// Lab DTOs
export interface LabDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  country: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  isOpenFirst: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabListItemDto extends LabDetailDto {
  modelCount: number;
  openWeightsCount: number;
  flagship: ModelSummaryDto | null;
  avgCompositeScore: number | null;
  latestRelease: string | null;
}

export interface LabWithModelsDto extends LabDetailDto {
  models: ModelSummaryDto[];
  releaseTimeline: Array<{
    month: string;
    count: number;
    models: Array<{ slug: string; name: string }>;
  }>;
}

// Provider DTOs
export interface ProviderListItemDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  hostedModelCount: number;
  avgLatencyMs: number | null;
  avgThroughputTps: number | null;
  uptimePct: number | null;
  startingPrice: number | null;
  cheapestCount: number;
}

export interface ProviderDetailDto extends ProviderListItemDto {
  hostedModels: Array<{
    model: ModelSummaryDto;
    endpointTag: string;
    inputPrice: number;
    outputPrice: number;
    cacheReadPrice: number | null;
    cacheWritePrice: number | null;
    quantization: string | null;
    contextWindow: number | null;
    maxOutputTokens: number | null;
    latencyP50Ms: number | null;
    throughputP50Tps: number | null;
    uptimePct: number | null;
    isAvailable: boolean;
  }>;
}

// Benchmark DTOs
export interface BenchmarkDefinitionDto {
  id: string;
  slug: string;
  name: string;
  category: string;
  unit: string;
  description: string | null;
  coverage: number;
  topModels: Array<{
    rank: number;
    model: ModelSummaryDto;
    score: number;
  }>;
}

// Compare DTOs
export interface CompareWinnersDto {
  cheapestInput: string[];
  cheapestOutput: string[];
  cheapestBlended: string[];
  largestContext: string[];
  largestMaxOutput: string[];
  fastestThroughput: string[];
  highestUptime: string[];
  benchmarks: Record<string, string[]>;
}

export interface CompareResultDto {
  models: ModelDetailDto[];
  winners: CompareWinnersDto;
}

export interface ComparePresetDto {
  id: string;
  name: string;
  description: string;
  modelSlugs: string[];
  models: ModelSummaryDto[];
}

// Rankings DTOs
export interface RankingRowDto {
  rank: number;
  model: ModelSummaryDto;
  score: number;
  blendedPrice: number | null;
  valueIndex: number | null;
  isFree: boolean;
  contextWindow: number | null;
}

// Search DTOs
export interface SearchResultDto {
  models: Array<{
    id: string;
    slug: string;
    name: string;
    modelType: ModelType;
    blendedPrice: number | null;
    compositeScore: number | null;
    lab: LabSummary;
  }>;
  labs: Array<{
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    modelCount: number;
  }>;
  providers: Array<{
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    hostedModelCount: number;
  }>;
}

// Filter Facets DTO
export interface FilterFacetsDto {
  labs: Array<{ slug: string; name: string; count: number }>;
  providers: Array<{ slug: string; name: string; count: number }>;
  types: Array<{ type: ModelType; count: number }>;
  capabilities: Array<{ capability: string; count: number }>;
  inputModalities: Array<{ modality: string; count: number }>;
  openWeightsCount: number;
  freeCount: number;
  contextBuckets: {
    gte128k: number;
    gte200k: number;
    gte1m: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  totalListableModels: number;
}

// Stats DTO
export interface StatsDto {
  totals: {
    models: number;
    labs: number;
    providers: number;
    apiListings: number;
  };
  releasesPerMonth: Array<{ month: string; count: number }>;
  releasesLast12Months: number;
  capabilityCoverage: {
    toolCalling: number;
    reasoning: number;
    visionInput: number;
    openWeights: number;
  };
  updatedAt: string;
}

// Health DTO
export interface HealthDto {
  status: "ok" | "error";
  db: "up" | "down";
  latencyMs: number;
  time: string;
  coldStartSuspected?: boolean;
  "db.coldStartSuspected"?: boolean;
}
