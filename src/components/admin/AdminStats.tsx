import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Clock, DollarSign, AlertTriangle } from "lucide-react";

interface AdminStatsProps {
  total: number;
  pending: number;
  approved: number;
  totalSpent: number;
  openClaims: number;
  formatUGX: (n: number) => string;
}

const AdminStats = ({ total, pending, approved, totalSpent, openClaims, formatUGX }: AdminStatsProps) => {
  const stats = [
    { label: "Total Applications", value: total, icon: Users, color: "text-primary" },
    { label: "Pending Review", value: pending, icon: Clock, color: "text-yellow-600" },
    { label: "Approved", value: approved, icon: CheckCircle, color: "text-accent" },
    { label: "Total Spent", value: formatUGX(totalSpent), icon: DollarSign, color: "text-secondary" },
    { label: "Open Claims", value: openClaims, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="grid sm:grid-cols-5 gap-4 mb-8">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="py-5 flex items-center gap-4">
            <s.icon size={28} className={s.color} />
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
