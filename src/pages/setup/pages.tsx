import React, { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadCSV } from "@/lib/csv-export";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  Plus, Trash2, Save, X, Download,
  File, Search, Globe, Edit2,
} from "lucide-react";

interface SitePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

type SortField = "title" | "slug" | "status" | "updated_at";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 25;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PagesSetup() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPage, setEditingPage] = useState<SitePage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [originalPage, setOriginalPage] = useState<SitePage | null>(null);

  useUnsavedChanges(isDirty);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/admin/setup/pages");
      if (!res.ok) throw new Error("Failed to fetch pages");
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const filteredPages = useMemo(() => {
    let result = pages;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [pages, statusFilter, debouncedSearch, sortField, sortDir]);

  const totalPages = Math.ceil(filteredPages.length / ITEMS_PER_PAGE);
  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDir === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const openCreate = () => {
    setEditingPage({
      id: "",
      title: "",
      slug: "",
      content: "",
      meta_title: "",
      meta_description: "",
      status: "draft",
      created_at: "",
      updated_at: "",
    });
    setOriginalPage(null);
    setIsCreating(true);
    setIsDirty(false);
  };

  const openEdit = (page: SitePage) => {
    setEditingPage({ ...page });
    setOriginalPage({ ...page });
    setIsCreating(false);
    setIsDirty(false);
  };

  const closeEditor = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    setEditingPage(null);
    setOriginalPage(null);
    setIsCreating(false);
    setIsDirty(false);
  };

  const updateField = (field: keyof SitePage, value: string) => {
    if (!editingPage) return;
    const updated = { ...editingPage, [field]: value };
    if (field === "title" && (isCreating || editingPage.slug === slugify(editingPage.title))) {
      updated.slug = slugify(value);
    }
    setEditingPage(updated);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!editingPage) return;
    if (!editingPage.title.trim() || !editingPage.slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }
    setSaving(true);
    try {
      const method = isCreating ? "POST" : "PUT";
      const body = isCreating
        ? {
            title: editingPage.title,
            slug: editingPage.slug,
            content: editingPage.content,
            meta_title: editingPage.meta_title,
            meta_description: editingPage.meta_description,
            status: editingPage.status,
          }
        : {
            id: editingPage.id,
            title: editingPage.title,
            slug: editingPage.slug,
            content: editingPage.content,
            meta_title: editingPage.meta_title,
            meta_description: editingPage.meta_description,
            status: editingPage.status,
          };
      const res = await fetch("/admin/api/admin/setup/pages", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save page");
      }
      toast.success(isCreating ? "Page created" : "Page updated");
      closeEditor();
      await fetchPages();
    } catch (e: any) {
      toast.error(e.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch("/admin/api/admin/setup/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      if (!res.ok) throw new Error("Failed to delete page");
      toast.success("Page deleted");
      if (editingPage?.id === deleteId) {
        closeEditor();
      }
      setDeleteId(null);
      await fetchPages();
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const handleExportCSV = () => {
    downloadCSV(pages, "site-pages", [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "status", label: "Status" },
      { key: "meta_title", label: "Meta Title" },
      { key: "meta_description", label: "Meta Description" },
      { key: "updated_at", label: "Updated At" },
      { key: "created_at", label: "Created At" },
    ]);
  };

  if (loading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Pages - Setup - MuseKit Admin</title>
      </Head>
      
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <File className="h-6 w-6" /> Pages
                <Badge variant="secondary" className="ml-2">{pages.length}</Badge>
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage site pages and SEO settings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Create Page
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-40"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          {filteredPages.length === 0 && !editingPage ? (
            <EmptyState
              icon={File}
              title="No pages found"
              description={pages.length === 0 ? "Create your first page to get started." : "No pages match your search or filter."}
              actionLabel={pages.length === 0 ? "Create Page" : undefined}
              onAction={pages.length === 0 ? openCreate : undefined}
            />
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button className="flex items-center font-medium" onClick={() => handleSort("title")}>
                          Title {getSortIcon("title")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="flex items-center font-medium" onClick={() => handleSort("slug")}>
                          Slug {getSortIcon("slug")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="flex items-center font-medium" onClick={() => handleSort("status")}>
                          Status {getSortIcon("status")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="flex items-center font-medium" onClick={() => handleSort("updated_at")}>
                          Updated {getSortIcon("updated_at")}
                        </button>
                      </TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPages.map((page) => (
                      <TableRow
                        key={page.id}
                        className="cursor-pointer"
                        onClick={() => openEdit(page)}
                      >
                        <TableCell className="font-medium">{page.title}</TableCell>
                        <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                        <TableCell>
                          <Badge variant={page.status === "published" ? "success" : "secondary"}>
                            {page.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{timeAgo(page.updated_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(page.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredPages.length)} of {filteredPages.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {editingPage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isCreating ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                    {isCreating ? "Create Page" : "Edit Page"}
                    {isDirty && <Badge variant="warning">Unsaved</Badge>}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={closeEditor}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editingPage.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="Page title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={editingPage.slug}
                      onChange={(e) => updateField("slug", e.target.value)}
                      placeholder="page-slug"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={editingPage.content || ""}
                    onChange={(e) => updateField("content", e.target.value)}
                    rows={12}
                    placeholder="Page content..."
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold flex items-center gap-1 mb-3">
                    <Globe className="h-4 w-4" /> SEO Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Meta Title</label>
                      <Input
                        value={editingPage.meta_title || ""}
                        onChange={(e) => updateField("meta_title", e.target.value)}
                        placeholder="SEO title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Meta Description</label>
                      <Input
                        value={editingPage.meta_description || ""}
                        onChange={(e) => updateField("meta_description", e.target.value)}
                        placeholder="SEO description"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editingPage.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-40"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? "Saving..." : isCreating ? "Create" : "Save"}
                  </Button>
                  <Button variant="outline" onClick={closeEditor}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  {!isCreating && (
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteId(editingPage.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <ConfirmDialog
          open={!!deleteId}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          title="Delete Page"
          message="Are you sure you want to delete this page? This action cannot be undone."
          confirmText="Delete"
          destructive
        />
      
    </>
  );
}
