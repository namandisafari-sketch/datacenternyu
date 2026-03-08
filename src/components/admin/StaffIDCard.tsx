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
    date_of_birth: string | null;
    gender: string;
    phone: string;
    email: string;
    nin: string;
    district: string;
    sub_county: string;
    left_thumb_url: string;
    right_thumb_url: string;
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

  const location = [staff.district, staff.sub_county].filter(Boolean).join(", ");

  const frontCard = (
    <div
      data-card-side="front"
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="bg-primary px-3 py-1.5 flex items-center gap-2">
        <img src={dataCentreBg} alt="Logo" className="w-8 h-8 rounded-full object-contain bg-white p-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-primary-foreground text-[11px] font-bold tracking-wide leading-tight">KABEJJA DATA CENTRE</p>
          <p className="text-primary-foreground/70 text-[8px] uppercase tracking-widest">Staff Identity Card</p>
        </div>
        <div className="bg-white/20 rounded px-1.5 py-0.5">
          <p className="text-primary-foreground text-[7px] font-bold tracking-wider uppercase">{staff.department || "STAFF"}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-2.5 px-3 py-2">
        {/* Photo */}
        <div className="w-[80px] h-[100px] bg-muted rounded-lg border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
          {staff.photo_url ? (
            <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-[10px] text-center px-1">No Photo</span>
          )}
        </div>

        {/* Details - 2 columns */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="font-bold text-[13px] text-foreground truncate leading-tight">{staff.full_name}</p>
            <p className="text-[10px] text-primary font-semibold">{staff.role_title || "Staff Member"}</p>
          </div>
          <div className="h-px bg-border" />
          <div className="grid grid-cols-2 gap-x-2 gap-y-[2px] text-[9px]">
            <DetailRow label="Staff #" value={staff.staff_number} />
            <DetailRow label="Gender" value={staff.gender} />
            <DetailRow label="Dept" value={staff.department} />
            <DetailRow label="DOB" value={staff.date_of_birth ? format(new Date(staff.date_of_birth), "dd/MM/yyyy") : "—"} />
            <DetailRow label="Joined" value={staff.date_joined ? format(new Date(staff.date_joined), "dd MMM yyyy") : "—"} />
            <DetailRow label="Phone" value={staff.phone} />
            {location && <DetailRow label="Location" value={location} />}
            {staff.email && <DetailRow label="Email" value={staff.email} />}
          </div>
          {staff.nin && (
            <p className="text-[8px] text-muted-foreground truncate mt-0.5">NIN: {staff.nin}</p>
          )}
        </div>

        {/* QR + Thumb */}
        <div className="shrink-0 flex flex-col items-center justify-between">
          <QRCodeSVG value={qrData} size={52} level="M" includeMargin={false} bgColor="hsl(0,0%,100%)" fgColor="hsl(215,58%,26%)" />
          {staff.right_thumb_url ? (
            <div className="w-11 h-14 rounded border border-border overflow-hidden">
              <img src={staff.right_thumb_url} alt="Thumb" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-11 h-14 rounded border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary/40" />
              <p className="text-[5px] text-primary/40 font-medium">R.THUMB</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex">
        <div className="bg-primary h-1.5 flex-1" />
        <div className="bg-secondary h-1.5 w-16" />
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
      <div className="bg-primary px-4 py-1.5 text-center">
        <p className="text-primary-foreground text-[9px] font-semibold tracking-wide">AUTHORIZED PERSONNEL — KABEJJA DATA CENTRE</p>
      </div>

      <div className="flex-1 flex p-3 gap-3">
        {/* Left: QR */}
        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
          <QRCodeSVG value={qrData} size={100} level="H" includeMargin={false} bgColor="hsl(0,0%,100%)" fgColor="hsl(215,58%,26%)" />
          <p className="text-[7px] font-mono text-muted-foreground">{staff.staff_number}</p>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0 text-[10px]">
          <div className="space-y-1.5">
            <div>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">Emergency Contact</p>
              <p className="font-semibold text-foreground text-xs">{staff.emergency_contact_name || "Not set"}</p>
              <p className="text-muted-foreground">{staff.emergency_contact_phone || "—"}</p>
              {staff.emergency_contact_relationship && (
                <p className="text-muted-foreground text-[8px] italic">({staff.emergency_contact_relationship})</p>
              )}
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">Email</p>
              <p className="text-foreground text-[10px] break-all">{staff.email || "—"}</p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">Biometric Attendance</p>
              <p className="text-[8px] text-muted-foreground">Thumbprints registered for clock-in/out</p>
            </div>
          </div>
        </div>

        {/* Right: Thumbprints */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-2">
          <ThumbBox label="L.THUMB" url={staff.left_thumb_url} />
          <ThumbBox label="R.THUMB" url={staff.right_thumb_url} />
        </div>
      </div>

      <div className="px-3 pb-1.5 text-center border-t border-border">
        <p className="text-[7px] text-muted-foreground mt-1 leading-tight">
          Property of Kabejja Data Centre. If found, return to the nearest office. Misuse is a disciplinary offence.
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

const ThumbBox = ({ label, url }: { label: string; url?: string }) => {
  if (url) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-12 h-14 rounded border border-border overflow-hidden bg-white">
          <img src={url} alt={label} className="w-full h-full object-contain" />
        </div>
        <p className="text-[6px] text-muted-foreground font-medium">{label}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-12 h-14 rounded border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center">
        <Fingerprint className="w-5 h-5 text-primary/40" />
      </div>
      <p className="text-[6px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-0.5 min-w-0">
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <span className="font-semibold text-foreground truncate">{value || "—"}</span>
  </div>
);

export default StaffIDCard;
