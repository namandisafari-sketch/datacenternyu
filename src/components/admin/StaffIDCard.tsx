import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import dataCentreBg from "@/assets/data-centre-bg.png";
import { Fingerprint } from "lucide-react";

interface StaffIDCardProps {
  staff: {
    id: string;
    user_id: string;
    full_name: string;
    photo_url: string;
    staff_number: string;
    role_title: string;
    department: string;
    date_joined: string | null;
    phone: string;
    email: string;
    nin: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
  };
  side?: "both" | "front" | "back";
}

const CARD_W = "504px";
const CARD_H = "318px";

const StaffIDCard = ({ staff, side = "both" }: StaffIDCardProps) => {
  const qrData = JSON.stringify({
    id: staff.staff_number,
    name: staff.full_name,
    role: staff.role_title,
    dept: staff.department,
  });

  const frontCard = (
    <div
      data-card-side="front"
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      {/* Header band */}
      <div className="bg-primary px-4 py-2 flex items-center gap-2.5">
        <img src={dataCentreBg} alt="Logo" className="w-9 h-9 rounded-full object-contain bg-white p-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-primary-foreground text-xs font-bold tracking-wide leading-tight">KABEJJA DATA CENTRE</p>
          <p className="text-primary-foreground/70 text-[9px] uppercase tracking-widest">Staff Identity Card</p>
        </div>
        <div className="bg-white/20 rounded px-2 py-0.5">
          <p className="text-primary-foreground text-[8px] font-bold tracking-wider uppercase">
            {staff.department || "STAFF"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 px-3 py-2.5">
        {/* Photo */}
        <div className="w-[88px] h-[108px] bg-muted rounded-lg border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
          {staff.photo_url ? (
            <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-xs text-center px-1">No Photo</span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="font-bold text-sm text-foreground truncate leading-tight">{staff.full_name}</p>
            <p className="text-[11px] text-primary font-semibold">{staff.role_title || "Staff Member"}</p>
          </div>
          <div className="h-px bg-border" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            <DetailRow label="Staff #" value={staff.staff_number} />
            <DetailRow label="Dept" value={staff.department} />
            <DetailRow label="Joined" value={staff.date_joined ? format(new Date(staff.date_joined), "dd MMM yyyy") : "—"} />
            <DetailRow label="Phone" value={staff.phone} />
          </div>
          {staff.nin && (
            <p className="text-[9px] text-muted-foreground truncate">NIN: {staff.nin}</p>
          )}
        </div>

        {/* Right column: QR + Fingerprint */}
        <div className="shrink-0 flex flex-col items-center justify-between py-0.5">
          <QRCodeSVG
            value={qrData}
            size={60}
            level="M"
            includeMargin={false}
            bgColor="hsl(0, 0%, 100%)"
            fgColor="hsl(215, 58%, 26%)"
          />
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <div className="w-12 h-14 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center">
              <Fingerprint className="w-6 h-6 text-primary/60" />
              <p className="text-[6px] text-primary/50 font-medium mt-0.5">THUMB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer accent */}
      <div className="flex">
        <div className="bg-primary h-1.5 flex-1" />
        <div className="bg-secondary h-1.5 w-20" />
        <div className="bg-primary h-1.5 flex-1" />
      </div>
    </div>
  );

  const backCard = (
    <div
      data-card-side="back"
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      <div className="bg-primary px-4 py-2 text-center">
        <p className="text-primary-foreground text-[10px] font-semibold tracking-wide">AUTHORIZED PERSONNEL — KABEJJA DATA CENTRE</p>
      </div>

      <div className="flex-1 flex p-3 gap-4">
        {/* Left: QR + fingerprint */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <QRCodeSVG
            value={qrData}
            size={110}
            level="H"
            includeMargin={false}
            bgColor="hsl(0, 0%, 100%)"
            fgColor="hsl(215, 58%, 26%)"
          />
          <p className="text-[8px] font-mono text-muted-foreground">{staff.staff_number}</p>
        </div>

        {/* Right: Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Emergency Contact</p>
              <p className="font-semibold text-foreground text-xs">{staff.emergency_contact_name || "Not set"}</p>
              <p className="text-muted-foreground text-[11px]">{staff.emergency_contact_phone || "—"}</p>
              {staff.emergency_contact_relationship && (
                <p className="text-muted-foreground text-[9px] italic">({staff.emergency_contact_relationship})</p>
              )}
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Email</p>
              <p className="text-foreground text-[11px] break-all">{staff.email || "—"}</p>
            </div>
          </div>

          {/* Thumbprint box for attendance */}
          <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-dashed border-border">
            <div className="w-10 h-12 rounded border-2 border-primary/30 bg-primary/5 flex flex-col items-center justify-center shrink-0">
              <Fingerprint className="w-5 h-5 text-primary/50" />
            </div>
            <div>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">Biometric Attendance</p>
              <p className="text-[7px] text-muted-foreground">Thumbprint registered for clock-in/out</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-2 text-center border-t border-border">
        <p className="text-[8px] text-muted-foreground mt-1.5 leading-tight">
          This card is the property of Kabejja Data Centre. If found, please return to the nearest office. Misuse is a disciplinary offence.
        </p>
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

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-0.5">
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <span className="font-semibold text-foreground truncate">{value || "—"}</span>
  </div>
);

export default StaffIDCard;
