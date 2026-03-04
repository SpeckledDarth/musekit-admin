import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleLeft, Plus, Search } from "lucide-react";

interface FeatureToggle {
  id: string;
  name: string;
  key: string;
  category: string;
  enabled: boolean;
  description: string;
  updated_at: string;
}

export default function FeatureTogglesPage() {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newToggle, setNewToggle] = useState({
    name: "",
    key: "",
    category: "general",
    description: "",
  });

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
    } finally {
      setLoading(false);
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled } : t))
    );
    try {
      await fetch("/api/admin/setup/feature-toggles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
    } catch (error) {
      console.error("Error toggling feature:", error);
      setToggles((prev) =>
        prev.map((t) => (t.id === id ? { ...t, enabled: !enabled } : t))
      );
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
    } catch (error) {
      console.error("Error adding toggle:", error);
    }
  };

  const filteredToggles = toggles.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.key.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(filteredToggles.map((t) => t.category))).sort();

  return (
    <>
      <Head>
        <title>Feature Toggles - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ToggleLeft className="h-8 w-8" /> Feature Toggles
            </h1>
            <p className="text-muted-foreground">
              Enable or disable features across the platform.
            </p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" /> Add Toggle
          </Button>
        </div>

        {showAdd && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-4 gap-4">
                <Input
                  value={newToggle.name}
                  onChange={(e) =>
                    setNewToggle({ ...newToggle, name: e.target.value })
                  }
                  placeholder="Display Name"
                />
                <Input
                  value={newToggle.key}
                  onChange={(e) =>
                    setNewToggle({ ...newToggle, key: e.target.value })
                  }
                  placeholder="feature_key"
                />
                <Input
                  value={newToggle.category}
                  onChange={(e) =>
                    setNewToggle({ ...newToggle, category: e.target.value })
                  }
                  placeholder="Category"
                />
                <Button onClick={handleAddToggle} disabled={!newToggle.name || !newToggle.key}>
                  Add
                </Button>
              </div>
              <Input
                value={newToggle.description}
                onChange={(e) =>
                  setNewToggle({ ...newToggle, description: e.target.value })
                }
                placeholder="Description (optional)"
                className="mt-2"
              />
            </CardContent>
          </Card>
        )}

        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search toggles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredToggles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No feature toggles found. Create one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredToggles
                  .filter((t) => t.category === category)
                  .map((toggle) => (
                    <div
                      key={toggle.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {toggle.name}
                          </span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {toggle.key}
                          </Badge>
                        </div>
                        {toggle.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {toggle.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggle(toggle.id, !toggle.enabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          toggle.enabled ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            toggle.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
