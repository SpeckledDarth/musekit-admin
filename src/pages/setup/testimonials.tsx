import React, { useState, useEffect } from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { MessageSquare, Plus, Trash2, ChevronUp, ChevronDown, Star, Check } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  avatarUrl: string;
  rating: number;
  approved: boolean;
  featured: boolean;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const emptyTestimonial: Omit<Testimonial, "id"> = {
  name: "",
  role: "",
  company: "",
  quote: "",
  avatarUrl: "",
  rating: 5,
  approved: false,
  featured: false,
};

export default function TestimonialsPage() {
  const { getSetting, updateSetting, saveSettings, loading, saving } =
    useSettings("testimonials");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      const stored = getSetting("data", "[]");
      try {
        setTestimonials(JSON.parse(stored));
      } catch {
        setTestimonials([]);
      }
    }
  }, [loading, getSetting]);

  function persistTestimonials(updated: Testimonial[]) {
    setTestimonials(updated);
    updateSetting("data", JSON.stringify(updated));
  }

  function addTestimonial() {
    const newItem: Testimonial = { ...emptyTestimonial, id: generateId() };
    const updated = [...testimonials, newItem];
    persistTestimonials(updated);
    setEditingId(newItem.id);
  }

  function updateTestimonial(id: string, field: keyof Testimonial, value: string | number | boolean) {
    const updated = testimonials.map((t) =>
      t.id === id ? { ...t, [field]: value } : t
    );
    persistTestimonials(updated);
  }

  function deleteTestimonial(id: string) {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
    const updated = testimonials.filter((t) => t.id !== id);
    persistTestimonials(updated);
    if (editingId === id) setEditingId(null);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...testimonials];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    persistTestimonials(updated);
  }

  function moveDown(index: number) {
    if (index === testimonials.length - 1) return;
    const updated = [...testimonials];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    persistTestimonials(updated);
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
          <div className="flex gap-2">
            <Button onClick={addTestimonial} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Testimonial
            </Button>
            <Button onClick={saveSettings} disabled={saving} size="sm" variant="outline">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
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
                                value={testimonial.avatarUrl}
                                onChange={(e) => updateTestimonial(testimonial.id, "avatarUrl", e.target.value)}
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
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
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
                            onClick={() =>
                              updateTestimonial(testimonial.id, "approved", !testimonial.approved)
                            }
                            className="focus:outline-none"
                          >
                            <Badge variant={testimonial.approved ? "success" : "outline"}>
                              {testimonial.approved ? "Approved" : "Pending"}
                            </Badge>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateTestimonial(testimonial.id, "featured", !testimonial.featured)
                            }
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
