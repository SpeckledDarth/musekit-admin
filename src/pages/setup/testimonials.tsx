import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Plus, Trash2, ChevronUp, ChevronDown, Star, Check } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar_url: string;
  rating: number;
  approved: boolean;
  featured: boolean;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/setup/testimonials");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  async function addTestimonial() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/setup/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          role: "",
          company: "",
          quote: "",
          avatar_url: "",
          rating: 5,
          approved: false,
          featured: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const data = await res.json();
      setTestimonials((prev) => [data.testimonial, ...prev]);
      setEditingId(data.testimonial.id);
    } catch (error) {
      console.error("Error adding testimonial:", error);
    } finally {
      setSaving(false);
    }
  }

  async function updateTestimonial(id: string, field: keyof Testimonial, value: string | number | boolean) {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  async function saveTestimonial(id: string) {
    const testimonial = testimonials.find((t) => t.id === id);
    if (!testimonial) return;
    setSaving(true);
    try {
      await fetch("/api/admin/setup/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testimonial),
      });
    } catch (error) {
      console.error("Error saving testimonial:", error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTestimonial(id: string) {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await fetch("/api/admin/setup/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  }

  async function toggleField(id: string, field: "approved" | "featured") {
    const testimonial = testimonials.find((t) => t.id === id);
    if (!testimonial) return;
    const newValue = !testimonial[field];
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: newValue } : t))
    );
    try {
      await fetch("/api/admin/setup/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: newValue }),
      });
    } catch (error) {
      console.error("Error updating testimonial:", error);
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: !newValue } : t))
      );
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...testimonials];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setTestimonials(updated);
  }

  function moveDown(index: number) {
    if (index === testimonials.length - 1) return;
    const updated = [...testimonials];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setTestimonials(updated);
  }

  const totalCount = testimonials.length;
  const approvedCount = testimonials.filter((t) => t.approved).length;
  const featuredCount = testimonials.filter((t) => t.featured).length;

  if (loading) {
    return (
      <SetupLayout>
        <Head>
          <title>Testimonials | Setup</title>
        </Head>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </SetupLayout>
    );
  }

  return (
    <SetupLayout>
      <Head>
        <title>Testimonials | Setup</title>
      </Head>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Testimonials
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage customer testimonials displayed on your site.
            </p>
          </div>
          <Button onClick={addTestimonial} size="sm" disabled={saving}>
            <Plus className="h-4 w-4 mr-1" /> Add Testimonial
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{featuredCount}</div>
            </CardContent>
          </Card>
        </div>

        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No testimonials yet. Click &quot;Add Testimonial&quot; to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => {
              const isEditing = editingId === testimonial.id;
              return (
                <Card key={testimonial.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {isEditing ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input
                                placeholder="Name"
                                value={testimonial.name}
                                onChange={(e) => updateTestimonial(testimonial.id, "name", e.target.value)}
                              />
                              <Input
                                placeholder="Role"
                                value={testimonial.role}
                                onChange={(e) => updateTestimonial(testimonial.id, "role", e.target.value)}
                              />
                              <Input
                                placeholder="Company"
                                value={testimonial.company}
                                onChange={(e) => updateTestimonial(testimonial.id, "company", e.target.value)}
                              />
                            </div>
                            <Textarea
                              placeholder="Testimonial quote..."
                              value={testimonial.quote}
                              onChange={(e) => updateTestimonial(testimonial.id, "quote", e.target.value)}
                              rows={3}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                placeholder="Avatar URL"
                                value={testimonial.avatar_url}
                                onChange={(e) => updateTestimonial(testimonial.id, "avatar_url", e.target.value)}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Rating:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => updateTestimonial(testimonial.id, "rating", star)}
                                      className="focus:outline-none"
                                    >
                                      <Star
                                        className={`h-5 w-5 ${
                                          star <= testimonial.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                saveTestimonial(testimonial.id);
                                setEditingId(null);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" /> Done Editing
                            </Button>
                          </>
                        ) : (
                          <div
                            className="cursor-pointer"
                            onClick={() => setEditingId(testimonial.id)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                {testimonial.name || "Unnamed"}
                              </span>
                              {testimonial.role && (
                                <span className="text-sm text-muted-foreground">
                                  {testimonial.role}
                                  {testimonial.company && ` at ${testimonial.company}`}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground italic">
                              {testimonial.quote
                                ? `"${testimonial.quote}"`
                                : "Click to edit..."}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= testimonial.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => moveDown(index)}
                            disabled={index === testimonials.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteTestimonial(testimonial.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleField(testimonial.id, "approved")}
                            className="focus:outline-none"
                          >
                            <Badge variant={testimonial.approved ? "success" : "outline"}>
                              {testimonial.approved ? "Approved" : "Pending"}
                            </Badge>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleField(testimonial.id, "featured")}
                            className="focus:outline-none"
                          >
                            <Badge variant={testimonial.featured ? "default" : "outline"}>
                              {testimonial.featured ? "Featured" : "Not Featured"}
                            </Badge>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SetupLayout>
  );
}
