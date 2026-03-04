import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  ScrollText,
} from "lucide-react";
import type { AuditLog } from "@/types";

const PAGE_SIZE = 25;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/admin/audit-log-filters");
        if (!res.ok) return;
        const data = await res.json();
        setActions(data.actions || []);
        setResourceTypes(data.resourceTypes || []);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    }

    fetchFilters();
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        action: actionFilter,
        resource: resourceFilter,
        dateFrom,
        dateTo,
        page: page.toString(),
      });
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, resourceFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(0);
  }, [search, actionFilter, resourceFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <>
      <Head>
        <title>Audit Log - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            View system activity and event history.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-[180px]"
                >
                  <option value="all">All Actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </Select>
                <Select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className="w-[180px]"
                >
                  <option value="all">All Resources</option>
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Date Range:
                  </span>
                </div>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[160px]"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[160px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <ScrollText className="h-8 w-8" />
                            <p>No audit logs found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <React.Fragment key={log.id}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => toggleRow(log.id)}
                          >
                            <TableCell>
                              {expandedRow === log.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {log.resource_type}
                                {log.resource_id && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    #{log.resource_id.slice(0, 8)}
                                  </span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {log.user_id
                                ? log.user_id.slice(0, 8) + "..."
                                : "system"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.ip_address || "\u2014"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(log.created_at)}
                            </TableCell>
                          </TableRow>
                          {expandedRow === log.id && (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <div className="p-4 bg-muted/30 rounded-md">
                                  <h4 className="text-sm font-semibold mb-2">
                                    Full Details
                                  </h4>
                                  <div className="grid gap-2 text-sm">
                                    <div className="flex gap-2">
                                      <span className="font-medium text-muted-foreground w-32">
                                        Log ID:
                                      </span>
                                      <span className="font-mono">
                                        {log.id}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="font-medium text-muted-foreground w-32">
                                        User ID:
                                      </span>
                                      <span className="font-mono">
                                        {log.user_id || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="font-medium text-muted-foreground w-32">
                                        Resource ID:
                                      </span>
                                      <span className="font-mono">
                                        {log.resource_id || "N/A"}
                                      </span>
                                    </div>
                                    {log.metadata && (
                                      <div className="flex gap-2">
                                        <span className="font-medium text-muted-foreground w-32">
                                          Metadata:
                                        </span>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto flex-1">
                                          {JSON.stringify(
                                            log.metadata,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {page * PAGE_SIZE + 1} to{" "}
                      {Math.min((page + 1) * PAGE_SIZE, totalCount)} of{" "}
                      {totalCount} entries
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={page >= totalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
