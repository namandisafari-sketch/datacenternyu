import { QRCodeSVG } from "qrcode.react";
import { format, addYears } from "date-fns";
import nyungaLogo from "@/assets/nyunga-logo.png";

interface StudentIDCardProps {
  application: {
    id: string;
    student_name: string;
    date_of_birth: string | null;
    passport_photo_url: string | null;
    education_level: string;
    class_grade: string | null;
    registration_number: string | null;
    village?: string | null;
    parish?: string | null;
    sub_county?: string | null;
    district?: string | null;
  };
  schoolName: string;
  sponsorshipNumber: string;
  side?: "both" | "front" | "back";
}

const BASE_URL = "https://nyungani.lovable.app";

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

// Standard CR-80 ID card aspect ratio: 85.6mm x 53.98mm ≈ 3.375" x 2.125"
// At screen: 504px x 318px (good preview), export at 1012x638 (300dpi)
const CARD_W = "504px";
const CARD_H = "318px";

const StudentIDCard = ({ application, schoolName, sponsorshipNumber, side = "both" }: StudentIDCardProps) => {
  const expiryDate = addYears(new Date(), 1);
  const qrUrl = `${BASE_URL}/lost-id?id=${application.id}`;

  const frontCard = (
    <div
      data-card-side="front"
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="bg-primary px-5 py-3 flex items-center gap-3">
        <img src={nyungaLogo} alt="Nyunga Logo" className="w-10 h-10 rounded-full object-cover bg-white" />
        <div>
          <p className="text-primary-foreground text-sm font-bold tracking-wide">NYUNGA BURSARY SCHEME</p>
          <p className="text-primary-foreground/70 text-xs">Student Identity Card</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-4 p-5">
        {/* Photo */}
        <div className="w-[100px] h-[120px] bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden shrink-0">
          {application.passport_photo_url ? (
            <img src={application.passport_photo_url} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-xs text-center">No Photo</span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5 pt-1">
          <p className="font-bold text-base text-foreground truncate">{application.student_name}</p>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <Row label="School" value={schoolName} />
            <Row label="Level" value={levelLabels[application.education_level] || application.education_level} />
            <Row label="DOB" value={application.date_of_birth ? format(new Date(application.date_of_birth), "dd MMM yyyy") : "N/A"} />
            <Row label="Sponsorship #" value={sponsorshipNumber} />
            <Row label="Expires" value={format(expiryDate, "dd MMM yyyy")} />
          </div>
        </div>

        {/* Sponsorship QR */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-1">
          <QRCodeSVG
            value={sponsorshipNumber}
            size={72}
            level="M"
            includeMargin={false}
            bgColor="hsl(0, 0%, 100%)"
            fgColor="hsl(215, 58%, 26%)"
          />
          <p className="text-[8px] text-muted-foreground leading-tight">Scan to verify</p>
        </div>
      </div>

      {/* Footer stripe */}
      <div className="bg-secondary h-2" />
    </div>
  );

  const mrzName = application.student_name.toUpperCase().replace(/\s+/g, "<");
  const mrzLine1 = `IDUGA${sponsorshipNumber.replace(/-/g, "")}${application.registration_number || "000000"}<<<<<<`;
  const mrzLine2 = `${application.date_of_birth ? application.date_of_birth.replace(/-/g, "").slice(2) : "000000"}${application.education_level === "primary" ? "P" : "S"}UGA${new Date().getFullYear().toString().slice(2)}<<<<<<<<<`;
  const mrzLine3 = `${mrzName}${"<".repeat(Math.max(0, 36 - mrzName.length))}`;

  const backCard = (
    <div
      data-card-side="back"
      style={{ width: CARD_W, height: CARD_H, fontFamily: "'Source Sans 3', sans-serif" }}
      className="rounded-xl border-2 border-primary overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      {/* Top section: Thumbprint + QR */}
      <div className="flex-1 flex" style={{ background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(220 20% 95%) 100%)" }}>
        {/* Left: Right Thumb */}
        <div className="flex flex-col items-center justify-start pt-3 pl-4 pr-2" style={{ width: "40%" }}>
          <p className="text-[9px] font-bold text-foreground tracking-wider mb-1.5 self-start">RIGHT THUMB</p>
          <div className="w-[80px] h-[95px] bg-muted/60 rounded border border-border flex items-center justify-center overflow-hidden">
            <span className="text-muted-foreground text-3xl">👆</span>
          </div>
          {/* Location details */}
          <div className="mt-2.5 w-full space-y-0.5 text-[8.5px]">
            <BackRow label="VILLAGE" value={application.village || "—"} />
            <BackRow label="PARISH" value={application.parish || "—"} />
            <BackRow label="S.COUNTY" value={application.sub_county || "—"} />
            <BackRow label="DISTRICT" value={application.district || "—"} />
          </div>
        </div>
        {/* Right: QR Code */}
        <div className="flex-1 flex items-center justify-center p-3">
          <QRCodeSVG
            value={qrUrl}
            size={140}
            level="H"
            includeMargin={false}
            bgColor="transparent"
            fgColor="hsl(215, 58%, 26%)"
          />
        </div>
      </div>

      {/* MRZ Zone */}
      <div
        className="px-3 py-2 border-t border-border"
        style={{ background: "hsl(220 15% 93%)", fontFamily: "'OCR B', 'Courier New', monospace" }}
      >
        <p className="text-[9.5px] tracking-[0.18em] text-foreground leading-snug truncate">{mrzLine1}</p>
        <p className="text-[9.5px] tracking-[0.18em] text-foreground leading-snug truncate">{mrzLine2}</p>
        <p className="text-[9.5px] tracking-[0.18em] text-foreground leading-snug truncate">{mrzLine3}</p>
      </div>
    </div>
  );

  if (side === "front") return frontCard;
  if (side === "back") return backCard;

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {frontCard}
      {backCard}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-1.5">
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <span className="font-semibold text-foreground truncate">{value}</span>
  </div>
);

const BackRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-1">
    <span className="text-muted-foreground shrink-0 font-semibold">{label} :</span>
    <span className="font-bold text-foreground truncate uppercase">{value}</span>
  </div>
);

export default StudentIDCard;
