import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Upload, CheckCircle, Loader2, RotateCcw, AlertTriangle, ThumbsUp } from "lucide-react";

const PASSPORT_WIDTH = 413;
const PASSPORT_HEIGHT = 531;
const MAX_FILE_SIZE_KB = 300;

interface PassportPhotoCaptureProps {
  userId: string;
  value: string;
  onChange: (url: string) => void;
}

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type FaceStatus = "no_face" | "too_far" | "too_close" | "off_center" | "good";

const getFaceStatus = (face: FaceBox, videoW: number, videoH: number): FaceStatus => {
  const faceCX = face.x + face.width / 2;
  const faceCY = face.y + face.height / 2;
  const centerX = videoW / 2;
  const centerY = videoH * 0.42; // face should be slightly above center

  const faceRatio = face.height / videoH;

  if (faceRatio < 0.25) return "too_far";
  if (faceRatio > 0.75) return "too_close";

  const dx = Math.abs(faceCX - centerX) / videoW;
  const dy = Math.abs(faceCY - centerY) / videoH;
  if (dx > 0.15 || dy > 0.15) return "off_center";

  return "good";
};

const statusMessages: Record<FaceStatus, { text: string; color: string }> = {
  no_face: { text: "No face detected — look at the camera", color: "text-destructive" },
  too_far: { text: "Move closer to the camera", color: "text-yellow-500" },
  too_close: { text: "Move further from the camera", color: "text-yellow-500" },
  off_center: { text: "Center your face in the oval", color: "text-yellow-500" },
  good: { text: "Perfect! Hold still and capture", color: "text-green-500" },
};

const PassportPhotoCapture = ({ userId, value, onChange }: PassportPhotoCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionRef = useRef<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("no_face");
  const [faceDetectorSupported, setFaceDetectorSupported] = useState(false);

  useEffect(() => {
    // Check for FaceDetector API (Chrome/Edge)
    setFaceDetectorSupported("FaceDetector" in window);
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (detectionRef.current) cancelAnimationFrame(detectionRef.current);
    };
  }, [stream]);

  // Draw the face guide oval overlay on the overlay canvas
  const drawOverlay = useCallback(
    (status: FaceStatus, face: FaceBox | null) => {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;
      const ctx = overlay.getContext("2d")!;
      const w = overlay.width;
      const h = overlay.height;
      ctx.clearRect(0, 0, w, h);

      // Semi-transparent dark overlay
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, w, h);

      // Cut out the oval guide
      const ovalCX = w / 2;
      const ovalCY = h * 0.42;
      const ovalRX = w * 0.3;
      const ovalRY = h * 0.38;

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.ellipse(ovalCX, ovalCY, ovalRX, ovalRY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw oval border
      const borderColor =
        status === "good"
          ? "rgba(34,197,94,0.9)"
          : status === "no_face"
          ? "rgba(239,68,68,0.7)"
          : "rgba(234,179,8,0.8)";

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ovalCX, ovalCY, ovalRX, ovalRY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair lines inside oval
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ovalCX, ovalCY - ovalRY);
      ctx.lineTo(ovalCX, ovalCY + ovalRY);
      ctx.moveTo(ovalCX - ovalRX, ovalCY);
      ctx.lineTo(ovalCX + ovalRX, ovalCY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw face bounding box if detected
      if (face) {
        const scaleX = w / (videoRef.current?.videoWidth || w);
        const scaleY = h / (videoRef.current?.videoHeight || h);
        ctx.strokeStyle = status === "good" ? "rgba(34,197,94,0.8)" : "rgba(234,179,8,0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(
          face.x * scaleX,
          face.y * scaleY,
          face.width * scaleX,
          face.height * scaleY
        );
        ctx.setLineDash([]);
      }

      // Shoulder guide lines at bottom
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const shoulderY = h * 0.82;
      ctx.moveTo(w * 0.15, shoulderY);
      ctx.quadraticCurveTo(w * 0.5, shoulderY + h * 0.12, w * 0.85, shoulderY);
      ctx.stroke();
    },
    []
  );

  // Face detection loop
  const startFaceDetection = useCallback(async () => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    if (!video || !overlay) return;

    let detector: any = null;
    if (faceDetectorSupported) {
      try {
        detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch {
        setFaceDetectorSupported(false);
      }
    }

    const detect = async () => {
      if (!video || video.readyState < 2) {
        detectionRef.current = requestAnimationFrame(detect);
        return;
      }

      // Sync overlay canvas size
      if (overlay.width !== video.clientWidth || overlay.height !== video.clientHeight) {
        overlay.width = video.clientWidth;
        overlay.height = video.clientHeight;
      }

      let face: FaceBox | null = null;
      let status: FaceStatus = "no_face";

      if (detector) {
        try {
          const faces = await detector.detect(video);
          if (faces.length > 0) {
            const b = faces[0].boundingBox;
            face = { x: b.x, y: b.y, width: b.width, height: b.height };
            status = getFaceStatus(face, video.videoWidth, video.videoHeight);
          }
        } catch {
          // FaceDetector can fail on some frames
        }
      } else {
        // Fallback: no face detection API — just show the oval guide
        // Assume face is roughly positioned (user relies on visual guide)
        status = "good"; // optimistic without detection
      }

      setFaceStatus(status);
      drawOverlay(status, face);
      detectionRef.current = requestAnimationFrame(detect);
    };

    detectionRef.current = requestAnimationFrame(detect);
  }, [faceDetectorSupported, drawOverlay]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());

      if (devices.length === 0) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((t) => t.stop());
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDevice) setSelectedDevice(videoDevices[0].deviceId);
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 960 },
          facingMode: "user",
        },
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          startFaceDetection();
        };
      }
      setCameraActive(true);
      setCapturedImage(null);
      setFaceStatus("no_face");
    } catch {
      toast.error("Could not access camera");
    }
  }, [selectedDevice, stream, devices, startFaceDetection]);

  const stopCamera = useCallback(() => {
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  const cleanBackground = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Build a mask: 0 = background, 1 = foreground
    const mask = new Uint8Array(w * h);

    // Pass 1: classify pixels
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];

        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        const l = (max + min) / 2;
        const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);

        // Skin tone detection (broader range for diverse skin tones)
        const isSkinTone =
          (r > 80 && g > 40 && b > 20 && r > g && r > b) ||
          (r > 60 && g > 40 && b > 30 && r > b);

        // Hair/dark features
        const isDark = l < 0.2;

        // Central region bias (face is in center)
        const cx = x / w;
        const cy = y / h;
        const distFromCenter = Math.sqrt((cx - 0.5) ** 2 + ((cy - 0.42) * 1.3) ** 2);
        const isInCentralRegion = distFromCenter < 0.38;

        // Edge region (more likely background)
        const isEdge = cx < 0.08 || cx > 0.92 || cy < 0.03 || cy > 0.93;

        const isBackground =
          isEdge ||
          (!isInCentralRegion && !isSkinTone && !isDark && ((l > 0.6 && s < 0.35) || (s < 0.1 && l > 0.4)));

        mask[y * w + x] = isBackground && !isSkinTone && !isDark ? 0 : 1;
      }
    }

    // Pass 2: smooth the mask with dilation/erosion
    const smoothed = new Uint8Array(mask);
    const kernel = 3;
    for (let y = kernel; y < h - kernel; y++) {
      for (let x = kernel; x < w - kernel; x++) {
        let sum = 0;
        for (let dy = -kernel; dy <= kernel; dy++) {
          for (let dx = -kernel; dx <= kernel; dx++) {
            sum += mask[(y + dy) * w + (x + dx)];
          }
        }
        const total = (kernel * 2 + 1) ** 2;
        smoothed[y * w + x] = sum > total * 0.5 ? 1 : 0;
      }
    }

    // Pass 3: apply white background with soft edges
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (smoothed[y * w + x] === 0) {
          // Blend to white
          const alpha = 0.95;
          data[idx] = Math.round(data[idx] * (1 - alpha) + 255 * alpha);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - alpha) + 255 * alpha);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - alpha) + 255 * alpha);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

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
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);

    // Mirror the image since we're using front camera
    ctx.save();
    ctx.translate(PASSPORT_WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);
    ctx.restore();

    // Auto-clean background
    cleanBackground(canvas, ctx);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    toast.success("Photo captured! Review below.");
  }, [stopCamera]);

  const uploadPhoto = async (source: string) => {
    setUploading(true);
    try {
      const img = new window.Image();
      img.src = source;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement("canvas");
      canvas.width = PASSPORT_WIDTH;
      canvas.height = PASSPORT_HEIGHT;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);
      ctx.drawImage(img, 0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);

      let lo = 0.1, hi = 0.95, best = "";
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        const result = canvas.toDataURL("image/jpeg", mid);
        const sizeKB = Math.round((result.length - "data:image/jpeg;base64,".length) * 0.75 / 1024);
        if (sizeKB <= MAX_FILE_SIZE_KB) { best = result; lo = mid; } else { hi = mid; }
      }
      if (!best) best = canvas.toDataURL("image/jpeg", 0.1);

      const res = await fetch(best);
      const blob = await res.blob();
      const path = `${userId}/passport-photo/${Date.now()}.jpg`;

      const { error } = await supabase.storage.from("application-documents").upload(path, blob);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("application-documents").getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast.success("Passport photo uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    }
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5MB."); return; }

    const reader = new FileReader();
    reader.onload = () => {
      // Process uploaded file with background cleaning too
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = PASSPORT_WIDTH;
        canvas.height = PASSPORT_HEIGHT;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);
        ctx.drawImage(img, 0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);
        cleanBackground(canvas, ctx);
        setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const statusInfo = statusMessages[faceStatus];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Passport Photo *</label>

      {/* Already uploaded */}
      {value && !capturedImage && !cameraActive && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <img src={value} alt="Passport" className="w-20 h-[104px] object-cover rounded-lg border-2 border-primary/20 shadow-sm" />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-foreground flex items-center gap-1.5">
              <CheckCircle size={16} className="text-green-500" /> Photo uploaded
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => { setCapturedImage(null); onChange(""); }} className="text-xs gap-1">
              <RotateCcw size={12} /> Change Photo
            </Button>
          </div>
        </div>
      )}

      {/* Start buttons */}
      {!value && !capturedImage && !cameraActive && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 text-center space-y-3">
            <div className="w-16 h-20 mx-auto rounded-lg bg-muted border-2 border-border flex items-center justify-center">
              <Camera size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Take a passport-style photo with face detection guidance</p>
            <div className="flex gap-2 justify-center">
              <Button type="button" size="sm" onClick={startCamera} className="gap-2">
                <Camera size={14} /> Open Camera
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-2 relative overflow-hidden">
                <Upload size={14} /> Upload File
                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-yellow-500" />
            <span>Use good lighting, face the camera directly, keep a neutral expression. Background will be cleaned automatically.</span>
          </div>
        </div>
      )}

      {/* Camera active with face detection */}
      {cameraActive && (
        <div className="space-y-2">
          {devices.length > 1 && (
            <select
              className="w-full border rounded-md p-1.5 text-xs bg-background text-foreground"
              value={selectedDevice}
              onChange={(e) => { setSelectedDevice(e.target.value); startCamera(); }}
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 8)}`}</option>
              ))}
            </select>
          )}

          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg" style={{ maxWidth: 280 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full block"
              style={{ aspectRatio: `${PASSPORT_WIDTH}/${PASSPORT_HEIGHT}`, objectFit: "cover", transform: "scaleX(-1)" }}
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Status badge */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                faceStatus === "good" ? "bg-green-900/80 text-green-300" :
                faceStatus === "no_face" ? "bg-red-900/80 text-red-300" :
                "bg-yellow-900/80 text-yellow-300"
              }`}>
                {faceStatus === "good" ? <ThumbsUp size={12} /> : <AlertTriangle size={12} />}
                {statusInfo.text}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={capturePhoto} className="gap-1.5 flex-1">
              <Camera size={14} /> Capture Photo
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={stopCamera}>Cancel</Button>
          </div>
          {!faceDetectorSupported && (
            <p className="text-xs text-muted-foreground italic">Face detection not supported in this browser. Use the oval guide to position your face.</p>
          )}
        </div>
      )}

      {/* Captured preview — review & retake */}
      {capturedImage && !value && (
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="rounded-xl overflow-hidden border-2 border-primary/30 shadow-md" style={{ width: 160 }}>
              <img src={capturedImage} alt="Captured" className="w-full" style={{ aspectRatio: `${PASSPORT_WIDTH}/${PASSPORT_HEIGHT}`, objectFit: "cover" }} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-sm font-medium text-foreground">Review your photo</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Background auto-cleaned</li>
                <li>✓ Passport size (35×45mm)</li>
                <li>✓ Compressed ≤300KB</li>
              </ul>
              <div className="flex flex-col gap-1.5 mt-2">
                <Button type="button" size="sm" onClick={() => uploadPhoto(capturedImage)} disabled={uploading} className="gap-1.5">
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><CheckCircle size={14} /> Use This Photo</>}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setCapturedImage(null); startCamera(); }} className="gap-1.5">
                  <RotateCcw size={14} /> Retake Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PassportPhotoCapture;
