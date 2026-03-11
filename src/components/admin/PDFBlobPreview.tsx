import { useEffect, useRef, useState, useCallback } from "react";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, FileWarning, ZoomIn, ZoomOut } from "lucide-react";

if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

interface PDFBlobPreviewProps {
  pdfUrl: string | null;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

const PDFBlobPreview = ({ pdfUrl }: PDFBlobPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP)), []);

  // Keyboard shortcuts: Space = zoom in, B = zoom out
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        zoomIn();
      } else if (e.code === "KeyB") {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomIn, zoomOut]);

  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setTotalPages(0);
      setPage(1);
      setError(null);
      setZoom(1);
      return;
    }

    let cancelled = false;
    const loadTask = getDocument(pdfUrl);

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const doc = await loadTask.promise;
        if (cancelled) {
          await doc.destroy();
          return;
        }
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPage(1);
        setZoom(1);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Failed to load PDF preview");
          setPdfDoc(null);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      loadTask.destroy();
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    const renderPage = async () => {
      setRendering(true);
      try {
        const pageObj = await pdfDoc.getPage(page);
        if (cancelled || !canvasRef.current) return;

        const baseViewport = pageObj.getViewport({ scale: 1 });
        const parentWidth = containerRef.current?.clientWidth ?? baseViewport.width;
        const fitScale = Math.max(0.6, Math.min(2.2, (parentWidth - 24) / baseViewport.width));
        const scale = fitScale * zoom;
        const viewport = pageObj.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await pageObj.render({ canvas, canvasContext: context, viewport }).promise;
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Failed to render PDF page");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, page, zoom]);

  if (!pdfUrl) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No PDF available</div>;
  }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2 flex items-center gap-1.5 bg-background/80 flex-wrap">
        {/* Page controls */}
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1 || loading || !pdfDoc} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-foreground min-w-[70px] text-center">
          {totalPages > 0 ? `${page} / ${totalPages}` : "-- / --"}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages || loading || !pdfDoc} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Zoom controls */}
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={zoom <= ZOOM_MIN} onClick={zoomOut} title="Zoom out (B)">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-foreground min-w-[42px] text-center">{zoomPercent}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={zoom >= ZOOM_MAX} onClick={zoomIn} title="Zoom in (Space)">
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" asChild>
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        </Button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto p-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`div[data-pdf-scroll]::-webkit-scrollbar { display: none; }`}</style>
        {loading || rendering ? (
          <div className="h-full min-h-[320px] flex items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Rendering preview...
          </div>
        ) : error ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <FileWarning className="h-6 w-6" />
            <span>{error}</span>
          </div>
        ) : (
          <canvas ref={canvasRef} className="mx-auto rounded border border-border bg-background shadow-sm" />
        )}
      </div>
    </div>
  );
};

export default PDFBlobPreview;
