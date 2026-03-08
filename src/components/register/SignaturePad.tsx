import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
  label: string;
  userId: string;
  value: string;
  onChange: (url: string) => void;
}

const SignaturePad = ({ label, userId, value, onChange }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#1a2456";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setHasStrokes(false);
    onChange("");
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    setUploading(true);
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Failed to create image");
      const fileName = `${userId}/signature_${label.toLowerCase().replace(/\s/g, "_")}_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from("application-documents").upload(fileName, blob, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("application-documents").getPublicUrl(fileName);
      onChange(urlData.publicUrl);
      toast.success(`${label} signature saved`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{label} Signature</p>
        <div className="border border-border rounded-lg p-2 bg-background">
          <img src={value} alt={`${label} signature`} className="h-16 object-contain" />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={clear} className="gap-1">
          <RotateCcw size={14} /> Re-sign
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label} Signature *</p>
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <p className="text-xs text-muted-foreground">Draw your signature above using finger or mouse</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={clear} disabled={!hasStrokes}>
          <RotateCcw size={14} className="mr-1" /> Clear
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={!hasStrokes || uploading}>
          {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />}
          Save Signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
