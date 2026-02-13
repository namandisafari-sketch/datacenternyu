import { Ticket } from "lucide-react";
import PaymentCodesSection from "@/components/admin/PaymentCodesSection";

const AdminPayments = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <Ticket className="h-6 w-6 text-primary" /> Payment Codes
      </h1>
      <PaymentCodesSection />
    </div>
  );
};

export default AdminPayments;
