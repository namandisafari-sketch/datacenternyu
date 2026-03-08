// Simple device fingerprint based on browser properties
export const generateDeviceFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || "unknown",
    (navigator as any).deviceMemory || "unknown",
    navigator.maxTouchPoints || 0,
    // Canvas fingerprint
    (() => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "no-canvas";
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("fingerprint", 2, 2);
        return canvas.toDataURL().slice(-50);
      } catch {
        return "no-canvas";
      }
    })(),
  ];

  const raw = components.join("|");
  
  // Hash using SubtleCrypto
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
