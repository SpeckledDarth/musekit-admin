import React, { useEffect, useState, useMemo, useCallback } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { downloadCSV } from "@/lib/csv-export";
import { toast } from "sonner";
import {
  ToggleLeft,
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Download,
  X,
} from "lucide-react";

interface FeatureToggle {
  id: string;
  name: string;
  key: string;
  category: string;
  enabled: boolean;
  description: string;
  updated_at: string;
}

type SortField = "name" | "key" | "category" | "enabled" | "description";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export default function FeatureTogglesPage() {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showAdd, setShowAdd] = useState(false);
  const [newToggle, setNewToggle] = useState({
    name: "",
    key: "",
    category: "general",
    description: "",
  });

  const [editToggle, setEditToggle] = useState<FeatureToggle | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", description: "" });

  const [deleteTarget, setDeleteTarget] = useState<FeatureToggle | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchToggles();
  }, []);

  async function fetchToggles() {
    try {
      const res = await fetch("/api/admin/setup/feature-toggles");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setToggles(data.toggles || []);
    } catch (error) {
      console.error("Error fetching toggles:", error);
      toast.error("Failed to load feature toggles");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(toggles.map((t) => t.category))).sort(),
    [toggles]
  );

  const filteredToggles = useMemo(() => {
    let list = toggles;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter((t) => t.category === categoryFilter);
    }
    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "boolean") {
        return sortDir === "asc" ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [toggles, search, categoryFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredToggles.length / PAGE_SIZE));
  const pagedToggles = filteredToggles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const showingStart = filteredToggles.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingEnd = Math.min((page + 1) * PAGE_SIZE, filteredToggles.length);

  useEffect(() => {
    setPage(0);
  }, [search, categoryFilter]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return field;
    });
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled } : t)));
    try {
      const res = await fetch("/api/admin/setup/feature-toggles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Toggle ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling feature:", error);
      setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !enabled } : t)));
      toast.error("Failed to toggle feature");
    }
  };

  const handleAddToggle = async () => {
    try {
      const res = await fetch("/api/admin/setup/feature-toggles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newToggle),
      });
      if (!res.ok) throw new Error("Failed to add");
      const data = await res.json();
      setToggles((prev) => [...prev, data.toggle]);
      setNewToggle({ name: "", key: "", category: "general", description: "" });
      setShowAdd(false);
      toast.success("Toggle created successfully");
    } catch (error) {
      console.error("Error adding toggle:", error);
      toast.error("Failed to create toggle");
    }
  };

  const handleEdit = async () => {
    if (!editToggle) return;
    try {
      const res = await fetch("/api/admin/setup/feature-toggles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editToggle.key, ...editForm }),
      });
      if (!res.ok) throw new Error("Failed to edit");
      const data = await res.json();
      setToggles((prev) => prev.map((t) => (t.id === editToggle.id ? data.toggle : t)));
      setEditToggle(null);
      toast.success("Toggle updated successfully");
    } catch (error) {
      console.error("Error editing toggle:", error);
      toast.error("Failed to update toggle");
    }
  };

  const handleDelete = async (toggle: FeatureToggle) => {
    try {
      const res = await fetch("/api/admin/setup/feature-toggles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: toggle.key }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setToggles((prev) => prev.filter((t) => t.id !== toggle.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(toggle.id);
        return next;
      });
      toast.success(`"${toggle.name}" deleted`);
    } catch (error) {
      console.error("Error deleting toggle:", error);
      toast.error("Failed to delete toggle");
    }
  };

  const openEdit = (toggle: FeatureToggle) => {
    setEditToggle(toggle);
    setEditForm({ name: toggle.name, category: toggle.category, description: toggle.description });
  };

  const toggleSelectAll = () => {
    if (selected.size === pagedToggles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pagedToggles.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkEnable = async () => {
    const ids = Array.from(selected);
    setToggles((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, enabled: true } : t)));
    try {
      await Promise.all(
        ids.map((id) =>
          fetch("/api/admin/setup/feature-toggles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, enabled: true }),
          })
        )
      );
      toast.success(`${ids.length} toggle(s) enabled`);
      setSelected(new Set());
    } catch {
      toast.error("Failed to bulk enable");
      fetchToggles();
    }
  };

  const handleBulkDisable = async () => {
    const ids = Array.from(selected);
    setToggles((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, enabled: false } : t)));
    try {
      await Promise.all(
        ids.map((id) =>
          fetch("/api/admin/setup/feature-toggles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, enabled: false }),
          })
        )
      );
      toast.success(`${ids.length} toggle(s) disabled`);
      setSelected(new Set());
    } catch {
      toast.error("Failed to bulk disable");
      fetchToggles();
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    const toDelete = toggles.filter((t) => ids.includes(t.id));
    try {
      await Promise.all(
        toDelete.map((t) =>
          fetch("/api/admin/setup/feature-toggles", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: t.key }),
          })
        )
      );
      setToggles((prev) => prev.filter((t) => !ids.includes(t.id)));
      setSelected(new Set());
      toast.success(`${toDelete.length} toggle(s) deleted`);
    } catch {
      toast.error("Failed to bulk delete");
      fetchToggles();
    }
    setBulkDeleteConfirm(false);
  };

  const handleExportCSV = () => {
    downloadCSV(
      filteredToggles.map((t) => ({
        key: t.key,
        name: t.name,
        category: t.category,
        enabled: t.enabled ? "true" : "false",
        description: t.description,
      })),
      "feature-toggles",
      [
        { key: "key" as const, label: "Key" },
        { key: "name" as const, label: "Name" },
        { key: "category" as const, label: "Category" },
        { key: "enabled" as const, label: "Enabled" },
        { key: "description" as const, label: "Description" },
      ]
    );
    toast.success("CSV exported");
  };

  const isFiltered = search || categoryFilter;
  const titleCount = isFiltered
    ? `${filteredToggles.length} of ${toggles.length}`
    : `${toggles.length}`;

  return (
    <>
      <Head>
        <title>Feature Toggles - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ToggleLeft className="h-8 w-8" /> Feature Toggles ({titleCount})
            </h1>
            <p className="text-muted-foreground">
              Enable or disable features across the platform.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button onClick={() => setShowAdd(!showAdd)}>
              <Plus className="h-4 w-4 mr-1" /> Add Toggle
            </Button>
          </div>
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
            <Card className="relative z-50 w-full max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">Add New Toggle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={newToggle.name}
                    onChange={(e) => setNewToggle({ ...newToggle, name: e.target.value })}
                    placeholder="Display Name"
                  />
                  <Input
                    value={newToggle.key}
                    onChange={(e) => setNewToggle({ ...newToggle, key: e.target.value })}
                    placeholder="feature_key"
                  />
                </div>
                <Input
                  value={newToggle.category}
                  onChange={(e) => setNewToggle({ ...newToggle, category: e.target.value })}
                  placeholder="Category"
                />
                <Input
                  value={newToggle.description}
                  onChange={(e) => setNewToggle({ ...newToggle, description: e.target.value })}
                  placeholder="Description (optional)"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button onClick={handleAddToggle} disabled={!newToggle.name || !newToggle.key}>Add Toggle</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {editToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditToggle(null)} />
            <Card className="relative z-50 w-full max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">Edit Toggle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Key</label>
                  <Input value={editToggle.key} readOnly className="mt-1 bg-muted" />
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditToggle(null)}>Cancel</Button>
                  <Button onClick={handleEdit}>Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search toggles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredToggles.length === 0 ? (
          <EmptyState
            icon={ToggleLeft}
            title="No feature toggles found"
            description={isFiltered ? "Try adjusting your search or filter." : "Create one to get started."}
            actionLabel={isFiltered ? undefined : "Add Toggle"}
            onAction={isFiltered ? undefined : () => setShowAdd(true)}
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={pagedToggles.length > 0 && selected.size === pagedToggles.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>
                    Name <SortIcon field="name" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("key")}>
                    Key <SortIcon field="key" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("category")}>
                    Category <SortIcon field="category" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("enabled")}>
                    Status <SortIcon field="enabled" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("description")}>
                    Description <SortIcon field="description" />
                  </TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedToggles.map((toggle) => (
                  <TableRow
                    key={toggle.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest("button") || target.closest("input[type=checkbox]")) return;
                      openEdit(toggle);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(toggle.id)}
                        onChange={() => toggleSelect(toggle.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{toggle.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{toggle.key}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{toggle.category}</TableCell>
                    <TableCell>
                      <Badge variant={toggle.enabled ? "success" : "secondary"}>
                        {toggle.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                      {toggle.description || "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(toggle.id, !toggle.enabled)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            toggle.enabled ? "bg-primary" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              toggle.enabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(toggle)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(toggle)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredToggles.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Showing {showingStart}–{showingEnd} of {filteredToggles.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-card border rounded-lg shadow-lg px-4 py-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button size="sm" onClick={handleBulkEnable}>Bulk Enable</Button>
            <Button size="sm" variant="secondary" onClick={handleBulkDisable}>Bulk Disable</Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteConfirm(true)}>Bulk Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Toggle"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Delete Selected Toggles"
        message={`Are you sure you want to delete ${selected.size} toggle(s)? This action cannot be undone.`}
        confirmText="Delete All"
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />
    </>
  );
}
