import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

interface UseSortableReturn<T> {
  sortedData: T[];
  sortColumn: keyof T | null;
  sortDirection: SortDirection;
  requestSort: (column: keyof T) => void;
}

function useSortable<T>(
  data: T[],
  defaultColumn?: keyof T,
  defaultDirection?: "asc" | "desc"
): UseSortableReturn<T> {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(
    defaultColumn ?? null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultDirection ?? null
  );

  const requestSort = (column: keyof T) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? 1 : -1;
      if (bVal == null) return sortDirection === "asc" ? -1 : 1;

      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal, undefined, {
          sensitivity: "base",
        });
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  return { sortedData, sortColumn, sortDirection, requestSort };
}

export { useSortable };
export type { SortDirection, UseSortableReturn };
