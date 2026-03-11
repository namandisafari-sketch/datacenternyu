import { useEffect, useRef, useState, useCallback } from "react";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, FileWarning, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
}

interface PDFBlobPreviewProps {
  pdfBlob: Blob | null;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

const PDFBlobPreview = ({ pdfBlob }: PDFBlobPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP)), []);

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
    if (!pdfBlob) {
      setPdfDoc(null);
      setTotalPages(0);
      setPage(1);
      setError(null);
      setZoom(1);
      setOpenUrl(null);
      return;
    }

    let cancelled = false;
    let loadTask: ReturnType<typeof getDocument> | null = null;
    let docInstance: PDFDocumentProxy | null = null;
    const objectUrl = URL.createObjectURL(pdfBlob);

    setOpenUrl(objectUrl);

    const load = async () => {
      setLoading(true);
      setError(null);
      setPdfDoc(null);

      try {
        const bytes = new Uint8Array(await pdfBlob.arrayBuffer());
        loadTask = getDocument({
          data: bytes,
          disableAutoFetch: true,
          disableStream: true,
          useWorkerFetch: false,
        });

        docInstance = await loadTask.promise;

        if (cancelled) {
          await docInstance.destroy();
          return;
        }

        setPdfDoc(docInstance);
        setTotalPages(docInstance.numPages);
        setPage(1);
        setZoom(1);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Failed to load PDF preview in app");
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      loadTask?.destroy();
      if (docInstance) {
        void docInstance.destroy();
      }
      URL.revokeObjectURL(objectUrl);
    };
  }, [pdfBlob, reloadKey]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    let renderTask: RenderTask | null = null;

    const renderPage = async () => {
      setRendering(true);
      setError(null);

      try {
        const pageObj = await pdfDoc.getPage(page);
        if (cancelled || !canvasRef.current) return;

        const baseViewport = pageObj.getViewport({ scale: 1 });
        const parentWidth = containerRef.current?.clientWidth ?? baseViewport.width;
        const fitScale = Math.max(0.6, Math.min(2.2, (parentWidth - 24) / baseViewport.width));
        const scale = fitScale * zoom;
        const viewport = pageObj.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        renderTask = pageObj.render({
          canvasContext: context,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
          canvas,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (!cancelled && err?.name !== "RenderingCancelledException") {
          console.error(err);
          setError("Failed to render this PDF page");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, page, zoom]);

  if (!pdfBlob) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No PDF available</div>;
  }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2 flex items-center gap-1.5 bg-background/80 flex-wrap">
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

        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={zoom <= ZOOM_MIN} onClick={zoomOut} title="Zoom out (B)">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-foreground min-w-[42px] text-center">{zoomPercent}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={zoom >= ZOOM_MAX} onClick={zoomIn} title="Zoom in (Space)">
          <ZoomIn className="h-4 w-4" />
        </Button>

        {error && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setReloadKey((key) => key + 1)}>
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </Button>
        )}

        {openUrl && (
          <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" asChild>
            <a href={openUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
          </Button>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto p-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {loading || rendering ? (
          <div className="h-full min-h-[320px] flex items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Rendering preview...
          </div>
        ) : error ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-3">
            <FileWarning className="h-6 w-6" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Retry preview
            </Button>
          </div>
        ) : (
          <canvas ref={canvasRef} className="mx-auto rounded border border-border bg-background shadow-sm" />
        )}
      </div>
    </div>
  );
};

export default PDFBlobPreview;
