import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, RotateCcw } from "lucide-react";

interface ThumbprintCaptureProps {
  label: string;
  existingUrl?: string;
  onCapture: (dataUrl: string) => void;
}

const ThumbprintCapture = ({ label, existingUrl, onCapture }: ThumbprintCaptureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (existingUrl && !hasDrawn) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = existingUrl;
    } else if (!hasDrawn) {
      ctx.fillStyle = "hsl(var(--muted))";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.setLineDash([]);
    }
  }, [existingUrl, hasDrawn]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    if (!hasDrawn) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(true);
    }

    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onCapture(canvas.toDataURL("image/png"));
    }
  };

  const reset = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    setHasDrawn(false);
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.setLineDash([]);
    onCapture("");
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        <Fingerprint className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={120}
        height={150}
        className="rounded-lg border-2 border-border cursor-crosshair touch-none"
        style={{ width: 90, height: 112 }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      {hasDrawn && (
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={reset}>
          <RotateCcw className="w-3 h-3" /> Clear
        </Button>
      )}
      {!hasDrawn && (
        <p className="text-[9px] text-muted-foreground">Press & draw</p>
      )}
    </div>
  );
};

export default ThumbprintCapture;
