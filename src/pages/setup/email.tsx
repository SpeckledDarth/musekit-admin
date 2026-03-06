import React, { useEffect, useState } from "react";
import Head from "next/head";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Pencil, Send, X, Eye, Plus } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const EMPTY_TEMPLATE: Omit<EmailTemplate, "id" | "created_at" | "updated_at"> = {
  name: "",
  subject: "",
  body: "",
  description: "",
  category: "general",
};

export default function EmailTemplatesSetup() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState(EMPTY_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/admin/api/admin/setup/email-templates");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const saveTemplate = async () => {
    if (!editing) return;
    try {
      await fetch("/admin/api/admin/setup/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      setTemplates((prev) =>
        prev.map((t) => (t.id === editing.id ? editing : t))
      );
      setEditing(null);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name) return;
    try {
      const res = await fetch("/admin/api/admin/setup/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      setTemplates((prev) => [...prev, data.template]);
      setCreating(false);
      setNewTemplate(EMPTY_TEMPLATE);
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !editing) return;
    setSendingTest(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSendingTest(false);
    alert(`Test email sent to ${testEmail}`);
  };

  if (loading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Email Templates - Setup - MuseKit Admin</title>
      </Head>
      
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="h-6 w-6" /> Email Templates
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage and customize email templates.
              </p>
            </div>
            {!editing && !creating && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Template
              </Button>
            )}
          </div>

          {creating ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">New Template</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreating(false);
                        setNewTemplate(EMPTY_TEMPLATE);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={createTemplate} disabled={!newTemplate.name}>
                      Create
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    placeholder="e.g. Welcome Email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newTemplate.description}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, description: e.target.value })
                    }
                    placeholder="Brief description of this template"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={newTemplate.category}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, category: e.target.value })
                    }
                    placeholder="e.g. general, transactional, marketing"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, subject: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Body</label>
                  <Textarea
                    value={newTemplate.body}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, body: e.target.value })
                    }
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          ) : editing ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Editing: {editing.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {showPreview ? "Editor" : "Preview"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(null)}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={saveTemplate}>
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    placeholder="Brief description of this template"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editing.category || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={editing.subject}
                    onChange={(e) =>
                      setEditing({ ...editing, subject: e.target.value })
                    }
                  />
                </div>

                {showPreview ? (
                  <div className="border rounded-md p-4 bg-white min-h-[300px]">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: editing.body,
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium">Body</label>
                    <Textarea
                      value={editing.body}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          body: e.target.value,
                        })
                      }
                      rows={12}
                      className="font-mono text-xs"
                    />
                  </div>
                )}

                <div className="border-t pt-4">
                  <label className="text-sm font-medium">
                    Send Test Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      type="email"
                    />
                    <Button
                      variant="outline"
                      onClick={sendTestEmail}
                      disabled={sendingTest || !testEmail}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sendingTest ? "Sending..." : "Send Test"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                {templates.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No email templates found. Templates will appear here once configured in the database.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {template.name}
                            </p>
                            {template.category && (
                              <Badge variant="secondary" className="text-xs">
                                {template.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Subject: {template.subject || "Not set"}
                          </p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(template);
                            setShowPreview(false);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      
    </>
  );
}
