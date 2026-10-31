import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { Payment } from "@/api/payments/interface";
import { listPayments } from "@/api/payments";
import { loadState } from "@/lib/load-state";
import { paymentVersions } from "@/lib/versions";

const PAGE_SIZE = 20;

export function useTillPayments() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const pages = useInfiniteQuery({
    queryKey: ["till-payments", search],
    queryFn: ({ pageParam }) =>
      listPayments({ q: search || undefined, limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const payments = useMemo(() => {
    const byId = new Map<string, Payment>();
    for (const page of pages.data?.pages ?? []) {
      for (const p of page.items) byId.set(p.id, paymentVersions.keep(p));
    }
    return [...byId.values()];
  }, [pages.data]);

  return {
    query,
    setQuery,
    submitSearch: () => setSearch(query.trim()),
    payments,
    loading: pages.isPending,
    failed: loadState(pages).failed,
    refreshing: pages.isRefetching,
    refresh: pages.refetch,
    hasMore: pages.hasNextPage,
    loadingMore: pages.isFetchingNextPage,
    loadMore: pages.fetchNextPage,
  };
}
