import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, Download, RefreshCw, Loader2, Monitor, Image } from "lucide-react";

// Standard passport photo: 35x45mm at 300dpi = 413x531px
const PASSPORT_WIDTH = 413;
const PASSPORT_HEIGHT = 531;
const MAX_FILE_SIZE_KB = 300;

const AdminPassportPhoto = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  // Enumerate cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Need initial permission to enumerate
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(t => t.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) setSelectedDevice(videoDevices[0].deviceId);
      } catch {
        toast.error("Camera access denied");
      }
    };
    getDevices();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setCameraActive(true);
      setCapturedImage(null);
      setProcessedImage(null);
    } catch {
      toast.error("Could not access camera");
    }
  }, [selectedDevice, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Capture at passport aspect ratio from center of video
    const videoAspect = video.videoWidth / video.videoHeight;
    const passportAspect = PASSPORT_WIDTH / PASSPORT_HEIGHT;

    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (videoAspect > passportAspect) {
      sw = video.videoHeight * passportAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / passportAspect;
      sy = (video.videoHeight - sh) / 2;
    }

    canvas.width = PASSPORT_WIDTH;
    canvas.height = PASSPORT_HEIGHT;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    setProcessedImage(null);
    stopCamera();
  }, [stopCamera]);

  const processPhoto = async () => {
    if (!capturedImage) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("process-passport-photo", {
        body: { image: capturedImage },
      });

      if (error) throw error;
      if (data?.image) {
        setProcessedImage(data.image);
        toast.success("Background removed successfully!");
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      toast.error("Processing failed: " + (err.message || "Unknown error"));
    }

    setProcessing(false);
  };

  const compressAndDownload = useCallback(() => {
    const imgSrc = processedImage || capturedImage;
    if (!imgSrc) return;

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PASSPORT_WIDTH;
      canvas.height = PASSPORT_HEIGHT;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);
      ctx.drawImage(img, 0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);

      // Binary search for quality that fits under MAX_FILE_SIZE_KB
      let lo = 0.1, hi = 0.95, best = "";
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        const result = canvas.toDataURL("image/jpeg", mid);
        const sizeKB = Math.round((result.length - "data:image/jpeg;base64,".length) * 0.75 / 1024);
        if (sizeKB <= MAX_FILE_SIZE_KB) {
          best = result;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      if (!best) best = canvas.toDataURL("image/jpeg", 0.1);

      const link = document.createElement("a");
      link.download = `passport-photo-${Date.now()}.jpg`;
      link.href = best;
      link.click();

      const sizeKB = Math.round((best.length - "data:image/jpeg;base64,".length) * 0.75 / 1024);
      toast.success(`Downloaded! Size: ${sizeKB}KB (${PASSPORT_WIDTH}×${PASSPORT_HEIGHT}px)`);
    };
    img.src = imgSrc;
  }, [processedImage, capturedImage]);

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" /> Passport Photo Capture
        </h1>
        <p className="text-muted-foreground text-sm">Capture, remove background, and compress to standard passport size</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera / Capture */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" /> Camera
            </CardTitle>
            <CardDescription>Select camera and capture photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {devices.length > 1 && (
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            )}

            <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: `${PASSPORT_WIDTH}/${PASSPORT_HEIGHT}` }}>
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Passport frame overlay */}
                  <div className="absolute inset-0 border-2 border-dashed border-primary/40 pointer-events-none" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="text-[10px] gap-1">● LIVE</Badge>
                  </div>
                </>
              ) : capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground text-sm">
                  Click "Start Camera" to begin
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              {!cameraActive ? (
                <Button onClick={startCamera} className="flex-1 gap-2">
                  <Camera className="h-4 w-4" />
                  {capturedImage ? "Retake" : "Start Camera"}
                </Button>
              ) : (
                <>
                  <Button onClick={capturePhoto} className="flex-1 gap-2">
                    <Camera className="h-4 w-4" /> Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline">Stop</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" /> Result
            </CardTitle>
            <CardDescription>Processed passport photo (35×45mm, ≤300KB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="relative bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border flex items-center justify-center"
              style={{ aspectRatio: `${PASSPORT_WIDTH}/${PASSPORT_HEIGHT}`, minHeight: 300 }}
            >
              {processing ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Removing background...</span>
                </div>
              ) : processedImage ? (
                <img src={processedImage} alt="Processed" className="w-full h-full object-cover" />
              ) : capturedImage ? (
                <img src={capturedImage} alt="Preview" className="w-full h-full object-cover opacity-60" />
              ) : (
                <span className="text-muted-foreground text-sm">No photo captured yet</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={processPhoto}
                disabled={!capturedImage || processing}
                variant="secondary"
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {processing ? "Processing..." : "Remove Background"}
              </Button>
              <Button
                onClick={compressAndDownload}
                disabled={!capturedImage && !processedImage}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" /> Download
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Standard passport size: 35×45mm (413×531px at 300dpi)</p>
              <p>• Compressed to ≤300KB JPEG</p>
              <p>• White background applied via AI</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPassportPhoto;
