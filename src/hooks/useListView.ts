"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface UseListViewOptions {
  filterKeys?: string[];
  defaultPageSize?: number;
}

interface UseListViewReturn {
  search: string;
  page: number;
  pageSize: number;
  sort: string;
  dir: string;
  filters: Record<string, string>;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  setSort: (column: string) => void;
  setFilter: (key: string, value: string) => void;
  resetFilters: () => void;
}

function useListView(options: UseListViewOptions = {}): UseListViewReturn {
  const { filterKeys = [], defaultPageSize = 25 } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams ? Object.fromEntries(searchParams.entries()) : {};

  const search = query.search || "";
  const page = parseInt(query.page || "1", 10);
  const sort = query.sort || "";
  const dir = query.dir || "";

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const key of filterKeys) {
      result[key] = query[key] || "all";
    }
    return result;
  }, [query, filterKeys]);

  const updateQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      const newQuery: Record<string, string> = {};
      for (const [k, v] of Object.entries(query)) {
        if (typeof v === "string" && v) newQuery[k] = v;
      }
      for (const [k, v] of Object.entries(updates)) {
        if (v && v !== "all" && v !== "0" && v !== "") {
          newQuery[k] = v;
        } else {
          delete newQuery[k];
        }
      }
      const newParams = new URLSearchParams();
      for (const [k, v] of Object.entries(newQuery)) {
        if (v !== undefined && v !== null && v !== "") {
          newParams.set(k, String(v));
        }
      }
      const paramString = newParams.toString();
      router.replace(paramString ? `${pathname}?${paramString}` : pathname);
    },
    [router, pathname, query]
  );

  const setSearch = useCallback(
    (value: string) => updateQuery({ search: value, page: undefined }),
    [updateQuery]
  );

  const setPage = useCallback(
    (p: number) => updateQuery({ page: p > 1 ? String(p) : undefined }),
    [updateQuery]
  );

  const setSort = useCallback(
    (column: string) => {
      if (sort === column && dir === "asc") {
        updateQuery({ sort: column, dir: "desc" });
      } else if (sort === column && dir === "desc") {
        updateQuery({ sort: undefined, dir: undefined });
      } else {
        updateQuery({ sort: column, dir: "asc" });
      }
    },
    [sort, dir, updateQuery]
  );

  const setFilter = useCallback(
    (key: string, value: string) =>
      updateQuery({ [key]: value === "all" ? undefined : value, page: undefined }),
    [updateQuery]
  );

  const resetFilters = useCallback(() => {
    const resets: Record<string, undefined> = {
      search: undefined,
      page: undefined,
      sort: undefined,
      dir: undefined,
    };
    for (const key of filterKeys) {
      resets[key] = undefined;
    }
    updateQuery(resets);
  }, [updateQuery, filterKeys]);

  return {
    search,
    page,
    pageSize: defaultPageSize,
    sort,
    dir,
    filters,
    setSearch,
    setPage,
    setSort,
    setFilter,
    resetFilters,
  };
}

export { useListView };
export type { UseListViewOptions, UseListViewReturn };
