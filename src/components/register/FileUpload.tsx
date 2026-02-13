import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

interface FileUploadProps {
  userId: string;
  folder: string;
  label: string;
  accept?: string;
  value: string;
  onChange: (url: string) => void;
}

const FileUpload = ({ userId, folder, label, accept = "image/*,.pdf", value, onChange }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum 5MB allowed.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("application-documents")
      .upload(path, file);

    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      const { data: urlData } = supabase.storage
        .from("application-documents")
        .getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast.success(`${label} uploaded`);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 relative overflow-hidden"
          disabled={uploading}
        >
          {uploading ? (
            <><Loader2 size={14} className="animate-spin" /> Uploading...</>
          ) : value ? (
            <><CheckCircle size={14} className="text-accent" /> Uploaded</>
          ) : (
            <><Upload size={14} /> Choose File</>
          )}
          <input
            type="file"
            accept={accept}
            onChange={handleUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </Button>
        {value && (
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">✓ File uploaded</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Max 5MB • PDF, JPG, PNG</p>
    </div>
  );
};

export default FileUpload;
