import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import dataCentreBg from "@/assets/data-centre-bg.png";

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
    emergency_contact_name: string;
    emergency_contact_phone: string;
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
  });

  const frontCard = (
    <div
      data-card-side="front"
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      {/* Header band */}
      <div className="bg-primary px-5 py-3 flex items-center gap-3">
        <img src={dataCentreBg} alt="Logo" className="w-10 h-10 rounded-full object-contain bg-white p-0.5" />
        <div className="flex-1">
          <p className="text-primary-foreground text-sm font-bold tracking-wide">KABEJJA DATA CENTRE</p>
          <p className="text-primary-foreground/70 text-[10px] uppercase tracking-widest">Staff Identity Card</p>
        </div>
        <div className="bg-white/20 rounded-md px-2 py-1">
          <p className="text-primary-foreground text-[9px] font-bold tracking-wider uppercase">
            {staff.department || "STAFF"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Photo */}
        <div className="w-[95px] h-[115px] bg-muted rounded-lg border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
          {staff.photo_url ? (
            <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-xs text-center px-1">No Photo</span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1 pt-0.5">
          <p className="font-bold text-base text-foreground truncate leading-tight">{staff.full_name}</p>
          <p className="text-xs text-primary font-semibold">{staff.role_title || "Staff Member"}</p>
          <div className="h-px bg-border my-1" />
          <div className="grid grid-cols-1 gap-0.5 text-[11px]">
            <DetailRow label="Staff #" value={staff.staff_number} />
            <DetailRow label="Dept" value={staff.department} />
            <DetailRow label="Joined" value={staff.date_joined ? format(new Date(staff.date_joined), "dd MMM yyyy") : "N/A"} />
            <DetailRow label="Phone" value={staff.phone} />
          </div>
        </div>

        {/* QR */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-1">
          <QRCodeSVG
            value={qrData}
            size={68}
            level="M"
            includeMargin={false}
            bgColor="hsl(0, 0%, 100%)"
            fgColor="hsl(215, 58%, 26%)"
          />
          <p className="text-[7px] text-muted-foreground">{staff.staff_number}</p>
        </div>
      </div>

      {/* Footer accent */}
      <div className="flex">
        <div className="bg-primary h-2 flex-1" />
        <div className="bg-secondary h-2 w-24" />
        <div className="bg-primary h-2 flex-1" />
      </div>
    </div>
  );

  const backCard = (
    <div
      data-card-side="back"
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-xl border-2 border-primary bg-card shadow-lg overflow-hidden print:shadow-none flex flex-col shrink-0"
    >
      <div className="bg-primary px-4 py-2.5 text-center">
        <p className="text-primary-foreground text-xs font-semibold tracking-wide">AUTHORIZED PERSONNEL — KABEJJA DATA CENTRE</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 gap-6">
        <QRCodeSVG
          value={qrData}
          size={140}
          level="H"
          includeMargin={false}
          bgColor="hsl(0, 0%, 100%)"
          fgColor="hsl(215, 58%, 26%)"
        />
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Emergency Contact</p>
            <p className="font-semibold text-foreground">{staff.emergency_contact_name || "Not set"}</p>
            <p className="text-muted-foreground">{staff.emergency_contact_phone || "—"}</p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
            <p className="text-foreground text-[11px] break-all">{staff.email || "—"}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 text-center border-t">
        <p className="text-[10px] text-muted-foreground mt-2">
          This card is the property of Kabejja Data Centre. If found, please return to the office.
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
  <div className="flex gap-1">
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <span className="font-semibold text-foreground truncate">{value || "—"}</span>
  </div>
);

export default StaffIDCard;
