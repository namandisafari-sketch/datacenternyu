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
      </div>

      {/* Footer stripe */}
      <div className="bg-secondary h-2" />
    </div>
  );

  const backCard = (
    <div
      data-card-side="back"
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      <div className="bg-primary w-full px-4 py-2.5 text-center">
        <p className="text-primary-foreground text-xs font-semibold tracking-wide">SCAN IF FOUND — REPORT LOST ID</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <QRCodeSVG
          value={qrUrl}
          size={170}
          level="H"
          includeMargin={false}
          bgColor="hsl(0, 0%, 100%)"
          fgColor="hsl(215, 58%, 26%)"
        />
      </div>
      <div className="px-4 pb-3 text-center">
        <p className="text-[11px] text-muted-foreground leading-tight">If you find this card, please scan the QR code or visit</p>
        <p className="text-[11px] text-primary font-medium break-all leading-tight">{BASE_URL}/lost-id</p>
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

export default StudentIDCard;
