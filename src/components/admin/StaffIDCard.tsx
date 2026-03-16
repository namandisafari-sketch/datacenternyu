import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import nyungaLogo from "@/assets/nyunga-foundation-logo.png";
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
  scale?: number;
  logoSize?: number;
}

const BASE_W = 504;
const BASE_H = 318;

const StaffIDCard = ({ staff, side = "both", scale = 1, logoSize = 32 }: StaffIDCardProps) => {
  const CARD_W = `${BASE_W * scale}px`;
  const CARD_H = `${BASE_H * scale}px`;

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
      style={{ width: CARD_W, height: CARD_H, fontSize: `${scale * 100}%` }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="bg-primary px-3 py-1.5 flex items-center gap-2">
        <div className="shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden" style={{ width: `${logoSize * scale}px`, height: `${logoSize * scale}px` }}>
          <img src={nyungaLogo} alt="Nyunga Foundation Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0 text-center">
          <h1 className="text-primary-foreground font-bold tracking-wide leading-tight" style={{ fontSize: `${14 * scale}px` }}>NYUNGA FOUNDATION</h1>
          <h2 className="text-primary-foreground/70 uppercase tracking-widest" style={{ fontSize: `${9 * scale}px` }}>Staff Identity Card</h2>
        </div>
        <div className="bg-white/20 rounded px-1.5 py-0.5">
          <p className="text-primary-foreground font-bold tracking-wider uppercase" style={{ fontSize: `${7 * scale}px` }}>{staff.department || "STAFF"}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-2.5 px-3 py-2">
        {/* Photo */}
        <div style={{ width: `${80 * scale}px`, height: `${100 * scale}px` }} className="bg-muted rounded-lg border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
          {staff.photo_url ? (
            <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-center px-1" style={{ fontSize: `${10 * scale}px` }}>No Photo</span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="font-bold text-foreground truncate leading-tight" style={{ fontSize: `${13 * scale}px` }}>{staff.full_name}</p>
            <p className="text-primary font-semibold" style={{ fontSize: `${10 * scale}px` }}>{staff.role_title || "Staff Member"}</p>
          </div>
          <div className="h-px bg-border" />
          <div className="grid grid-cols-2 gap-x-2" style={{ gap: `${2 * scale}px ${8 * scale}px`, fontSize: `${9 * scale}px` }}>
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
            <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: `${8 * scale}px` }}>NIN: {staff.nin}</p>
          )}
        </div>

        {/* QR + Thumb */}
        <div className="shrink-0 flex flex-col items-center justify-between">
          <QRCodeSVG value={qrData} size={Math.round(52 * scale)} level="M" includeMargin={false} bgColor="hsl(0,0%,100%)" fgColor="hsl(215,58%,26%)" />
          {staff.right_thumb_url ? (
            <div style={{ width: `${44 * scale}px`, height: `${56 * scale}px` }} className="rounded border border-border overflow-hidden">
              <img src={staff.right_thumb_url} alt="Thumb" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div style={{ width: `${44 * scale}px`, height: `${56 * scale}px` }} className="rounded border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center">
              <Fingerprint className="text-primary/40" style={{ width: `${20 * scale}px`, height: `${20 * scale}px` }} />
              <p className="text-primary/40 font-medium" style={{ fontSize: `${5 * scale}px` }}>R.THUMB</p>
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
      style={{ width: CARD_W, height: CARD_H, fontSize: `${scale * 100}%` }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      <div className="bg-primary px-4 py-1.5 text-center">
        <p className="text-primary-foreground font-semibold tracking-wide" style={{ fontSize: `${9 * scale}px` }}>AUTHORIZED PERSONNEL — NYUNGA FOUNDATION</p>
      </div>

      <div className="flex-1 flex p-3 gap-3">
        {/* Left: QR */}
        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
          <QRCodeSVG value={qrData} size={Math.round(100 * scale)} level="H" includeMargin={false} bgColor="hsl(0,0%,100%)" fgColor="hsl(215,58%,26%)" />
          <p className="font-mono text-muted-foreground" style={{ fontSize: `${7 * scale}px` }}>{staff.staff_number}</p>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0" style={{ fontSize: `${10 * scale}px` }}>
          <div className="space-y-1.5">
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-medium" style={{ fontSize: `${8 * scale}px` }}>Emergency Contact</p>
              <p className="font-semibold text-foreground" style={{ fontSize: `${12 * scale}px` }}>{staff.emergency_contact_name || "Not set"}</p>
              <p className="text-muted-foreground">{staff.emergency_contact_phone || "—"}</p>
              {staff.emergency_contact_relationship && (
                <p className="text-muted-foreground italic" style={{ fontSize: `${8 * scale}px` }}>({staff.emergency_contact_relationship})</p>
              )}
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-medium" style={{ fontSize: `${8 * scale}px` }}>Email</p>
              <p className="text-foreground break-all" style={{ fontSize: `${10 * scale}px` }}>{staff.email || "—"}</p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-medium" style={{ fontSize: `${8 * scale}px` }}>Biometric Attendance</p>
              <p className="text-muted-foreground" style={{ fontSize: `${8 * scale}px` }}>Thumbprints registered for clock-in/out</p>
            </div>
          </div>
        </div>

        {/* Right: Thumbprints */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-2">
          <ThumbBox label="L.THUMB" url={staff.left_thumb_url} scale={scale} />
          <ThumbBox label="R.THUMB" url={staff.right_thumb_url} scale={scale} />
        </div>
      </div>

      <div className="px-3 pb-1.5 text-center border-t border-border">
        <p className="text-muted-foreground mt-1 leading-tight" style={{ fontSize: `${7 * scale}px` }}>
          Property of Nyunga Foundation. If found, return to the nearest office. Misuse is a disciplinary offence.
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

const ThumbBox = ({ label, url, scale = 1 }: { label: string; url?: string; scale?: number }) => {
  const w = `${48 * scale}px`;
  const h = `${56 * scale}px`;
  if (url) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div style={{ width: w, height: h }} className="rounded border border-border overflow-hidden bg-white">
          <img src={url} alt={label} className="w-full h-full object-contain" />
        </div>
        <p className="text-muted-foreground font-medium" style={{ fontSize: `${6 * scale}px` }}>{label}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div style={{ width: w, height: h }} className="rounded border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center">
        <Fingerprint className="text-primary/40" style={{ width: `${20 * scale}px`, height: `${20 * scale}px` }} />
      </div>
      <p className="text-muted-foreground font-medium" style={{ fontSize: `${6 * scale}px` }}>{label}</p>
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
