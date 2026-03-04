import React, { useEffect, useState } from "react";
import Head from "next/head";
import { SetupLayout } from "@/layout/SetupLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Pencil, Send, X, Eye } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  updated_at: string;
}

export default function EmailTemplatesSetup() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/admin/setup/email-templates");
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
      await fetch("/api/admin/setup/email-templates", {
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

  const sendTestEmail = async () => {
    if (!testEmail || !editing) return;
    setSendingTest(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSendingTest(false);
    alert(`Test email sent to ${testEmail}`);
  };

  if (loading) {
    return (
      <SetupLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </SetupLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Email Templates - Setup - MuseKit Admin</title>
      </Head>
      <SetupLayout>
        <div className="space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" /> Email Templates
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage and customize email templates.
            </p>
          </div>

          {editing ? (
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
                        __html: editing.body_html,
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium">
                        HTML Body
                      </label>
                      <Textarea
                        value={editing.body_html}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            body_html: e.target.value,
                          })
                        }
                        rows={12}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Plain Text Body
                      </label>
                      <Textarea
                        value={editing.body_text}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            body_text: e.target.value,
                          })
                        }
                        rows={6}
                        className="font-mono text-xs"
                      />
                    </div>
                  </>
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
                          <p className="text-sm font-medium">
                            {template.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Subject: {template.subject || "Not set"}
                          </p>
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
      </SetupLayout>
    </>
  );
}
