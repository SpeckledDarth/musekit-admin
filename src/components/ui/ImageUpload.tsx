"use client";

import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const MAX_SIZE = 5 * 1024 * 1024;

function ImageUpload({ value, onChange, folder = "uploads" }: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = React.useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Invalid file type. Please upload PNG, JPEG, GIF, WebP, or SVG.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("File too large. Maximum size is 5MB.");
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        const supabase = getSupabaseClient();
        const ext = file.name.split(".").pop() || "png";
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 15, 90));
        }, 200);

        const { data, error } = await supabase.storage
          .from("assets")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        clearInterval(progressInterval);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("assets")
          .getPublicUrl(data.path);

        setProgress(100);
        onChange(urlData.publicUrl);
        toast.success("Image uploaded successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to upload image");
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 500);
      }
    },
    [folder, onChange]
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-h-32 rounded-lg border object-contain"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="w-48 rounded-full bg-muted h-2">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {dragOver ? (
              <ImageIcon className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {dragOver ? "Drop image here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPEG, GIF, WebP, SVG up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { ImageUpload };
export type { ImageUploadProps };
