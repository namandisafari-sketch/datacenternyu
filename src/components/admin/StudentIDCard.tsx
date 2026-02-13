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
}

const BASE_URL = "https://nyungani.lovable.app";

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const StudentIDCard = ({ application, schoolName, sponsorshipNumber }: StudentIDCardProps) => {
  const expiryDate = addYears(new Date(), 1);
  const qrUrl = `${BASE_URL}/lost-id?id=${application.id}`;

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Front Side */}
      <div className="w-[340px] h-[214px] rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none relative flex flex-col">
        {/* Header */}
        <div className="bg-primary px-4 py-2 flex items-center gap-2">
          <img src={nyungaLogo} alt="Nyunga Logo" className="w-8 h-8 rounded-full object-cover bg-white" />
          <div>
            <p className="text-primary-foreground text-xs font-bold tracking-wide">NYUNGA BURSARY SCHEME</p>
            <p className="text-primary-foreground/70 text-[10px]">Student Identity Card</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex gap-3 p-3">
          {/* Photo */}
          <div className="w-20 h-24 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden shrink-0">
            {application.passport_photo_url ? (
              <img src={application.passport_photo_url} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-[10px] text-center">No Photo</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-bold text-sm text-foreground truncate">{application.student_name}</p>
            <div className="grid grid-cols-1 gap-0.5 text-[10px]">
              <Row label="School" value={schoolName} />
              <Row label="Level" value={levelLabels[application.education_level] || application.education_level} />
              <Row label="DOB" value={application.date_of_birth ? format(new Date(application.date_of_birth), "dd MMM yyyy") : "N/A"} />
              <Row label="Sponsorship #" value={sponsorshipNumber} />
              <Row label="Expires" value={format(expiryDate, "dd MMM yyyy")} />
            </div>
          </div>
        </div>

        {/* Footer stripe */}
        <div className="bg-secondary h-1.5" />
      </div>

      {/* Back Side */}
      <div className="w-[340px] h-[214px] rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col">
        <div className="bg-primary w-full px-3 py-1 text-center">
          <p className="text-primary-foreground text-[10px] font-semibold">SCAN IF FOUND — REPORT LOST ID</p>
        </div>
        <div className="flex-1 flex items-center justify-center px-2 py-1">
          <QRCodeSVG
            value={qrUrl}
            size={130}
            level="H"
            includeMargin={false}
            bgColor="hsl(0, 0%, 100%)"
            fgColor="hsl(215, 58%, 26%)"
          />
        </div>
        <div className="px-3 pb-1.5 text-center">
          <p className="text-[9px] text-muted-foreground leading-tight">If you find this card, please scan the QR code or visit</p>
          <p className="text-[9px] text-primary font-medium break-all leading-tight">{BASE_URL}/lost-id</p>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-1">
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <span className="font-medium text-foreground truncate">{value}</span>
  </div>
);

export default StudentIDCard;
