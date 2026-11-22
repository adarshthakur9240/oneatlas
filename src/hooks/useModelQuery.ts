// src/hooks/useModelQuery.ts
// URL is the single source of truth for all discovery filters, sorting, and view modes

"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ViewMode } from "@/components/ui/SegmentedControl";

export interface ModelQueryState {
  q: string;
  lab: string[];
  provider: string[];
  type: string[];
  capability: string[];
  openWeights?: boolean;
  free?: boolean;
  minContext?: number;
  maxPrice?: number;
  hideDeprecated: boolean;
  sort: string;
  page: number;
  limit: number;
  view: ViewMode;
}

export function useModelQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse state from current URL searchParams
  const state: ModelQueryState = useMemo(() => {
    const q = searchParams.get("q") || "";
    const labRaw = searchParams.get("lab");
    const lab = labRaw ? labRaw.split(",").filter(Boolean) : [];

    const providerRaw = searchParams.get("provider");
    const provider = providerRaw ? providerRaw.split(",").filter(Boolean) : [];

    const typeRaw = searchParams.get("type");
    const type = typeRaw ? typeRaw.split(",").filter(Boolean) : [];

    const capRaw = searchParams.get("capability");
    const capability = capRaw ? capRaw.split(",").filter(Boolean) : [];

    const openWeightsRaw = searchParams.get("openWeights");
    const openWeights =
      openWeightsRaw === "true" || openWeightsRaw === "1"
        ? true
        : openWeightsRaw === "false" || openWeightsRaw === "0"
        ? false
        : undefined;

    const freeRaw = searchParams.get("free");
    const free =
      freeRaw === "true" || freeRaw === "1"
        ? true
        : freeRaw === "false" || freeRaw === "0"
        ? false
        : undefined;

    const minContextRaw = searchParams.get("minContext");
    const minContext = minContextRaw ? parseInt(minContextRaw, 10) : undefined;

    const maxPriceRaw = searchParams.get("maxPrice");
    const maxPrice = maxPriceRaw ? parseFloat(maxPriceRaw) : undefined;

    const hideDeprecatedRaw = searchParams.get("hideDeprecated");
    const hideDeprecated =
      hideDeprecatedRaw === null ? true : hideDeprecatedRaw === "true";

    const sort = searchParams.get("sort") || "release_desc";
    const pageRaw = searchParams.get("page");
    const page = pageRaw ? Math.max(parseInt(pageRaw, 10) || 1, 1) : 1;
    const viewRaw = searchParams.get("view");
    const view: ViewMode = viewRaw === "cards" ? "cards" : "table";

    return {
      q,
      lab,
      provider,
      type,
      capability,
      openWeights,
      free,
      minContext,
      maxPrice,
      hideDeprecated,
      sort,
      page,
      limit: 18,
      view,
    };
  }, [searchParams]);

  // Construct URL string omitting defaults to keep URLs clean
  const updateUrl = useCallback(
    (newState: Partial<ModelQueryState>) => {
      const merged = { ...state, ...newState };
      const params = new URLSearchParams();

      if (merged.q.trim()) params.set("q", merged.q.trim());
      if (merged.lab.length > 0) params.set("lab", merged.lab.join(","));
      if (merged.provider.length > 0) params.set("provider", merged.provider.join(","));
      if (merged.type.length > 0) params.set("type", merged.type.join(","));
      if (merged.capability.length > 0) params.set("capability", merged.capability.join(","));
      if (merged.openWeights !== undefined) params.set("openWeights", String(merged.openWeights));
      if (merged.free !== undefined) params.set("free", String(merged.free));
      if (merged.minContext !== undefined) params.set("minContext", String(merged.minContext));
      if (merged.maxPrice !== undefined) params.set("maxPrice", String(merged.maxPrice));
      if (!merged.hideDeprecated) params.set("hideDeprecated", "false"); // omit when default true
      if (merged.sort !== "release_desc") params.set("sort", merged.sort);
      if (merged.page > 1) params.set("page", String(merged.page));
      if (merged.view !== "table") params.set("view", merged.view);

      const qs = params.toString();
      const newUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [state, pathname, router]
  );

  const setSearch = useCallback(
    (q: string) => {
      updateUrl({ q, page: 1 });
    },
    [updateUrl]
  );

  const toggleLab = useCallback(
    (labSlug: string) => {
      const current = state.lab;
      const next = current.includes(labSlug)
        ? current.filter((l) => l !== labSlug)
        : [...current, labSlug];
      updateUrl({ lab: next, page: 1 });
    },
    [state.lab, updateUrl]
  );

  const setSingleLab = useCallback(
    (labSlug: string) => {
      updateUrl({ lab: labSlug ? [labSlug] : [], page: 1 });
    },
    [updateUrl]
  );

  const setSingleProvider = useCallback(
    (providerSlug: string) => {
      updateUrl({ provider: providerSlug ? [providerSlug] : [], page: 1 });
    },
    [updateUrl]
  );

  const setSingleType = useCallback(
    (type: string) => {
      updateUrl({ type: type ? [type] : [], page: 1 });
    },
    [updateUrl]
  );

  const toggleCapability = useCallback(
    (cap: string) => {
      const current = state.capability;
      const next = current.includes(cap)
        ? current.filter((c) => c !== cap)
        : [...current, cap];
      updateUrl({ capability: next, page: 1 });
    },
    [state.capability, updateUrl]
  );

  const toggleOpenWeights = useCallback(() => {
    updateUrl({
      openWeights: state.openWeights ? undefined : true,
      page: 1,
    });
  }, [state.openWeights, updateUrl]);

  const toggleFree = useCallback(() => {
    updateUrl({
      free: state.free ? undefined : true,
      page: 1,
    });
  }, [state.free, updateUrl]);

  const toggleMinContext1M = useCallback(() => {
    updateUrl({
      minContext: state.minContext === 1000000 ? undefined : 1000000,
      page: 1,
    });
  }, [state.minContext, updateUrl]);

  const toggleHideDeprecated = useCallback(() => {
    updateUrl({
      hideDeprecated: !state.hideDeprecated,
      page: 1,
    });
  }, [state.hideDeprecated, updateUrl]);

  const setSort = useCallback(
    (sort: string) => {
      updateUrl({ sort, page: 1 });
    },
    [updateUrl]
  );

  const setPage = useCallback(
    (page: number) => {
      updateUrl({ page });
    },
    [updateUrl]
  );

  const setView = useCallback(
    (view: ViewMode) => {
      updateUrl({ view });
    },
    [updateUrl]
  );

  const clearFilters = useCallback(() => {
    updateUrl({
      q: "",
      lab: [],
      provider: [],
      type: [],
      capability: [],
      openWeights: undefined,
      free: undefined,
      minContext: undefined,
      maxPrice: undefined,
      hideDeprecated: true,
      page: 1,
    });
  }, [updateUrl]);

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(state.q.trim()) ||
      state.lab.length > 0 ||
      state.provider.length > 0 ||
      state.type.length > 0 ||
      state.capability.length > 0 ||
      state.openWeights !== undefined ||
      state.free !== undefined ||
      state.minContext !== undefined ||
      state.maxPrice !== undefined ||
      !state.hideDeprecated
    );
  }, [state]);

  // Serialized API query string
  const apiQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (state.q.trim()) params.set("q", state.q.trim());
    if (state.lab.length > 0) params.set("lab", state.lab.join(","));
    if (state.provider.length > 0) params.set("provider", state.provider.join(","));
    if (state.type.length > 0) params.set("type", state.type.join(","));
    if (state.capability.length > 0) params.set("capability", state.capability.join(","));
    if (state.openWeights !== undefined) params.set("openWeights", String(state.openWeights));
    if (state.free !== undefined) params.set("free", String(state.free));
    if (state.minContext !== undefined) params.set("minContext", String(state.minContext));
    if (state.maxPrice !== undefined) params.set("maxPrice", String(state.maxPrice));
    params.set("hideDeprecated", String(state.hideDeprecated));
    params.set("sort", state.sort);
    params.set("page", String(state.page));
    params.set("limit", String(state.limit));
    return params.toString();
  }, [state]);

  return {
    state,
    apiQueryString,
    hasActiveFilters,
    setSearch,
    toggleLab,
    setSingleLab,
    setSingleProvider,
    setSingleType,
    toggleCapability,
    toggleOpenWeights,
    toggleFree,
    toggleMinContext1M,
    toggleHideDeprecated,
    setSort,
    setPage,
    setView,
    clearFilters,
  };
}
