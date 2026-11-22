// prisma/seed/derive.ts
// Pure functions to derive structured fields from raw API data
import { ModelType } from "@prisma/client";
import type { CatalogModel } from "./types";

// Lab display name map for well-known providers
const LAB_NAME_MAP: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  "meta-llama": "Meta",
  deepseek: "DeepSeek",
  mistralai: "Mistral AI",
  "x-ai": "xAI",
  qwen: "Qwen",
  cohere: "Cohere",
  nvidia: "NVIDIA",
  microsoft: "Microsoft",
  amazon: "Amazon",
  moonshotai: "Moonshot AI",
  "z-ai": "Z.AI",
  minimax: "MiniMax",
  perplexity: "Perplexity",
  ai21: "AI21 Labs",
  nousresearch: "Nous Research",
  liquid: "Liquid AI",
};

/** Slugify: replace "/" and ":" with "-", lowercase */
export function deriveSlug(sourceId: string): string {
  return sourceId.replace(/[/:]/g, "-").toLowerCase();
}

/** Provider slug: slugify provider_name */
export function deriveProviderSlug(providerName: string): string {
  return providerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Extract lab slug from model id prefix before "/" */
export function deriveLabSlug(modelId: string): string {
  return modelId.split("/")[0]?.toLowerCase() ?? "unknown";
}

/** Get display name for a lab slug */
export function deriveLabName(slug: string): string {
  if (LAB_NAME_MAP[slug]) return LAB_NAME_MAP[slug]!;
  // Fallback: title-case the slug
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Check if model has open weights (hugging_face_id present and non-empty) */
export function isOpenWeights(model: CatalogModel): boolean {
  return !!model.hugging_face_id;
}

/** Determine model type by documented precedence */
export function deriveModelType(model: CatalogModel): ModelType {
  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();
  const outputModalities = model.architecture?.output_modalities ?? [];
  const inputModalities = model.architecture?.input_modalities ?? [];
  const supportedParams = model.supported_parameters ?? [];

  // EMBEDDING: output includes "embed" or id contains "embed"
  if (
    outputModalities.some((m) => m.includes("embed")) ||
    id.includes("embed")
  ) {
    return ModelType.EMBEDDING;
  }
  // CODING: name/id matches code|coder|codex|devstral
  if (
    /code|coder|codex|devstral/.test(id) ||
    /code|coder|codex|devstral/.test(name)
  ) {
    return ModelType.CODING;
  }
  // REASONING: supported_parameters includes "reasoning"
  if (supportedParams.includes("reasoning")) {
    return ModelType.REASONING;
  }
  // FAST: common fast-model patterns
  if (/mini|flash|haiku|nano|lite|small|tiny|instant|lightning/.test(id)) {
    return ModelType.FAST;
  }
  // MULTIMODAL: image or audio input
  if (inputModalities.some((m) => ["image", "audio", "video"].includes(m))) {
    return ModelType.MULTIMODAL;
  }
  return ModelType.FLAGSHIP;
}

/** Derive capabilities array from supported_parameters and modalities */
export function deriveCapabilities(
  model: CatalogModel,
  hasCacheRead: boolean
): string[] {
  const caps = new Set<string>();
  const supportedParams = model.supported_parameters ?? [];
  const inputModalities = model.architecture?.input_modalities ?? [];

  if (supportedParams.includes("reasoning")) caps.add("reasoning");
  if (
    supportedParams.includes("tools") ||
    supportedParams.includes("tool_choice")
  )
    caps.add("tool_calling");
  if (
    supportedParams.includes("structured_outputs") ||
    supportedParams.includes("response_format")
  )
    caps.add("structured_outputs");
  if (supportedParams.includes("temperature")) caps.add("temperature");
  if (inputModalities.includes("image")) caps.add("vision");
  if (inputModalities.includes("file")) caps.add("files");
  if (inputModalities.includes("audio")) caps.add("audio_input");
  if (hasCacheRead) caps.add("prompt_caching");

  return Array.from(caps).sort();
}

// Variant suffix patterns to strip (order matters)
const VARIANT_SUFFIXES = [
  ":free",
  ":extended",
  ":thinking",
  ":nitro",
  ":floor",
  ":beta",
  ":online",
  ":batch",
];

/** Strip variant suffixes from model id. Returns base id. */
export function stripVariantSuffix(modelId: string): string {
  for (const suffix of VARIANT_SUFFIXES) {
    if (modelId.endsWith(suffix)) {
      return modelId.slice(0, -suffix.length);
    }
  }
  return modelId;
}

/** Check if a model id is a free variant */
export function isFreeVariant(modelId: string): boolean {
  return modelId.endsWith(":free");
}

/** Check if a model should be skipped (dynamic/negative pricing or router pseudo-models) */
export function shouldSkipModel(model: CatalogModel): boolean {
  // Skip OpenRouter internal router aliases and pseudo-models
  if (model.id.startsWith("openrouter/") || model.id.startsWith("~")) return true;
  if (model.architecture?.tokenizer === "Router") return true;

  const pricing = model.pricing;
  // Skip if prompt price is negative (-1 = dynamic routing) or literal "-1"
  if (pricing.prompt === "-1" || pricing.completion === "-1") return true;
  const promptVal = parseFloat(pricing.prompt ?? "0");
  const completionVal = parseFloat(pricing.completion ?? "0");
  if (promptVal < 0 || completionVal < 0) return true;
  return false;
}
