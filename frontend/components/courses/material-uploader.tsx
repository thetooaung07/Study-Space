"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, FileText, FileImage, Film, Presentation, File, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coursesApi } from "@/lib/courses-api";
import type { CourseMaterial, MaterialType } from "@/types/courses";

const MaterialIcon = ({ type }: { type: MaterialType }) => {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "PDF":
      return <FileText className={cls + " text-red-500"} />;
    case "SLIDES":
      return <Presentation className={cls + " text-orange-500"} />;
    case "VIDEO":
      return <Film className={cls + " text-purple-500"} />;
    case "IMAGE":
      return <FileImage className={cls + " text-blue-500"} />;
    default:
      return <File className={cls + " text-muted-foreground"} />;
  }
};

interface MaterialUploaderProps {
  sectionId: number;
  userId: number;
  materials: CourseMaterial[];
  onUploaded: (material: CourseMaterial) => void;
  onDeleted: (materialId: number) => void;
}

export function MaterialUploader({
  sectionId,
  userId,
  materials,
  onUploaded,
  onDeleted,
}: MaterialUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const material = await coursesApi.uploadMaterial(sectionId, userId, title, selectedFile);
      onUploaded(material);
      setTitle("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: number) => {
    if (!confirm("Delete this material?")) return;
    try {
      await coursesApi.deleteMaterial(materialId, userId);
      onDeleted(materialId);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-3">
      {/* Material list */}
      {materials.length > 0 && (
        <ul className="space-y-1.5">
          {materials.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-muted/50 group"
            >
              <MaterialIcon type={m.fileType} />
              <span className="flex-1 truncate text-card-foreground">{m.title}</span>
              <span className="text-xs text-muted-foreground">{m.fileType}</span>
              <a
                href={`http://localhost:8080${m.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Download"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </a>
              <button
                onClick={() => handleDelete(m.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Upload new material */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Material Title</Label>
            <Input
              placeholder="e.g. Lecture Notes Week 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">File</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.mp4,.mov,.jpg,.jpeg,.png,.zip"
              onChange={handleFileChange}
              className="h-8 text-sm cursor-pointer"
            />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleUpload}
          disabled={!selectedFile || !title.trim() || uploading}
          className="gap-1.5"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : "Upload File"}
        </Button>
      </div>
    </div>
  );
}
