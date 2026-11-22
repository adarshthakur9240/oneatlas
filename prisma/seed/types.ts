// prisma/seed/types.ts
// Zod validation schemas for OpenRouter API payloads
import { z } from "zod";

// Pricing object from /models catalog
export const CatalogPricingSchema = z
  .object({
    prompt: z.string().optional(),
    completion: z.string().optional(),
    input_cache_read: z.string().optional(),
    input_cache_write: z.string().optional(),
    image: z.string().optional(),
    audio: z.string().optional(),
    internal_reasoning: z.string().optional(),
    input_audio_cache: z.string().optional(),
    web_search: z.string().optional(),
    discount: z.number().optional(),
    overrides: z.unknown().optional(),
  })
  .passthrough();

export const ArchitectureSchema = z
  .object({
    modality: z.string().optional(),
    input_modalities: z.array(z.string()).optional(),
    output_modalities: z.array(z.string()).optional(),
    tokenizer: z.string().optional(),
    instruct_type: z.string().nullable().optional(),
  })
  .passthrough();

export const TopProviderSchema = z
  .object({
    context_length: z.number().nullable().optional(),
    max_completion_tokens: z.number().nullable().optional(),
    is_moderated: z.boolean().optional(),
  })
  .passthrough();

export const ArtificialAnalysisSchema = z
  .object({
    intelligence_index: z.number().nullable().optional(),
    coding_index: z.number().nullable().optional(),
    agentic_index: z.number().nullable().optional(),
  })
  .passthrough();

export const BenchmarksSchema = z
  .object({
    design_arena: z.array(z.unknown()).optional(),
    artificial_analysis: ArtificialAnalysisSchema.optional(),
  })
  .passthrough();

export const ReasoningSchema = z
  .object({
    mandatory: z.boolean().optional(),
    default_enabled: z.boolean().optional(),
    supported_efforts: z.array(z.string()).optional(),
  })
  .passthrough();

// Catalog model schema
export const CatalogModelSchema = z
  .object({
    id: z.string(),
    canonical_slug: z.string().optional(),
    hugging_face_id: z.string().nullable().optional(),
    name: z.string(),
    created: z.number().optional(),
    description: z.string().optional(),
    context_length: z.number().nullable().optional(),
    architecture: ArchitectureSchema.optional(),
    pricing: CatalogPricingSchema,
    top_provider: TopProviderSchema.nullable().optional(),
    per_request_limits: z.unknown().nullable().optional(),
    supported_parameters: z.array(z.string()).optional(),
    default_parameters: z.unknown().optional(),
    supported_voices: z.unknown().nullable().optional(),
    knowledge_cutoff: z.string().nullable().optional(),
    expiration_date: z.string().nullable().optional(),
    links: z.object({ details: z.string().optional() }).optional(),
    // In catalog, endpoints is array of URL strings
    endpoints: z.array(z.string()).optional(),
    benchmarks: BenchmarksSchema.nullable().optional(),
    reasoning: ReasoningSchema.nullable().optional(),
  })
  .passthrough();

export const CatalogResponseSchema = z.object({
  data: z.array(CatalogModelSchema),
});

// Per-endpoint pricing
export const EndpointPricingSchema = z
  .object({
    prompt: z.string().optional(),
    completion: z.string().optional(),
    input_cache_read: z.string().optional(),
    input_cache_write: z.string().optional(),
    image: z.string().optional(),
    audio: z.string().optional(),
    internal_reasoning: z.string().optional(),
    discount: z.number().optional(),
  })
  .passthrough();

// Endpoint object from /models/{author}/{slug}/endpoints
export const EndpointObjectSchema = z
  .object({
    name: z.string().optional(),
    model_id: z.string().optional(),
    model_name: z.string().optional(),
    context_length: z.number().nullable().optional(),
    pricing: EndpointPricingSchema,
    provider_name: z.string(),
    tag: z.string().optional(),
    service_tier: z.unknown().nullable().optional(),
    quantization: z.string().nullable().optional(),
    max_completion_tokens: z.number().nullable().optional(),
    max_prompt_tokens: z.number().nullable().optional(),
    supported_parameters: z.array(z.string()).optional(),
    status: z.number().optional(),
    uptime_last_30m: z.number().nullable().optional(),
    uptime_last_5m: z.number().nullable().optional(),
    uptime_last_1d: z.number().nullable().optional(),
    supports_implicit_caching: z.boolean().optional(),
    latency_last_30m: z.unknown().nullable().optional(),
    throughput_last_30m: z.unknown().nullable().optional(),
  })
  .passthrough();

export const EndpointResponseSchema = z.object({
  data: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    endpoints: z.array(EndpointObjectSchema),
  }),
});

export type CatalogModel = z.infer<typeof CatalogModelSchema>;
export type EndpointObject = z.infer<typeof EndpointObjectSchema>;
