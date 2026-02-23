import { useState } from "react";
import { Mail, Paperclip, Star, ArrowUpRight, ArrowDownLeft, MoreVertical, Reply, Forward, Trash2, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EmailDetailView, { type EmailItem } from "./EmailDetailView";

const mockEmails: EmailItem[] = [
  { id: "e1", from: "Mike's Transport", fromInitials: "MT", to: "you", subject: "BOL for LD-024 — Signed Copy", preview: "Hi, please find the signed BOL attached for the BMW X5 pickup today. Let me know if you need anything else.", body: "Hi,\n\nPlease find the signed BOL attached for the BMW X5 pickup today at 1420 Industrial Blvd.\n\nThe vehicle was inspected and loaded without any issues. Condition report photos are included as well.\n\nLet me know if you need anything else.\n\nBest regards,\nMike's Transport", time: "11:20 AM", read: false, starred: false, hasAttachment: true, direction: "inbound", shipmentId: "LD-024" },
  { id: "e2", from: "You", fromInitials: "SD", to: "FastHaul LLC", subject: "Re: Invoice #INV-2024-019", preview: "Payment has been processed via ACH. You should see it within 2-3 business days.", body: "Hi FastHaul team,\n\nPayment has been processed via ACH for Invoice #INV-2024-019. You should see it within 2-3 business days.\n\nPlease confirm receipt once it arrives.\n\nThank you,\nShipper Dispatch", time: "10:45 AM", read: true, starred: false, hasAttachment: false, direction: "outbound", shipmentId: "LD-019" },
  { id: "e3", from: "Summit Logistics", fromInitials: "SL", to: "you", subject: "Address Confirmation Needed — LD-018", preview: "We're arriving tomorrow morning but the delivery address doesn't match Google Maps. Can you confirm?", body: "Hello,\n\nWe're arriving tomorrow morning for the delivery of LD-018, but the delivery address provided doesn't match what we see on Google Maps.\n\nCould you please confirm the correct address? We want to make sure we arrive at the right location.\n\nThanks,\nSummit Logistics", time: "9:30 AM", read: false, starred: true, hasAttachment: false, direction: "inbound", shipmentId: "LD-018" },
  { id: "e4", from: "You", fromInitials: "SD", to: "Express Auto Carriers", subject: "Delivery Confirmed — Thank You", preview: "Confirming the vehicle was received in good condition. Great service as always.", body: "Hi Express Auto Carriers,\n\nConfirming the vehicle for LD-022 was received in good condition. Great service as always.\n\nLooking forward to working with you again.\n\nBest,\nShipper Dispatch", time: "Yesterday", read: true, starred: false, hasAttachment: false, direction: "outbound", shipmentId: "LD-022" },
  { id: "e5", from: "Pinnacle Haulers", fromInitials: "PH", to: "you", subject: "Invoice #INV-2024-015", preview: "Attached is the invoice for the completed transport of LD-015. Payment terms: Net 30.", body: "Hello,\n\nAttached is the invoice for the completed transport of LD-015.\n\nPayment terms: Net 30\nAmount: $1,250.00\n\nPlease process at your earliest convenience.\n\nThank you,\nPinnacle Haulers", time: "Yesterday", read: false, starred: false, hasAttachment: true, direction: "inbound", shipmentId: "LD-015" },
  { id: "e6", from: "You", fromInitials: "SD", to: "Mike's Transport", subject: "Pickup Instructions — LD-024", preview: "Keys are with the lot manager. Gate code is 4521. Please text on arrival.", body: "Hi Mike,\n\nHere are the pickup instructions for LD-024:\n\n• Location: 1420 Industrial Blvd, Dallas TX\n• Keys are with the lot manager (ask for John)\n• Gate code: 4521\n• Please text me on arrival\n\nThanks,\nShipper Dispatch", time: "2 days ago", read: true, starred: true, hasAttachment: false, direction: "outbound", shipmentId: "LD-024" },
];

const EmailsTab = () => {
  const [emails, setEmails] = useState(mockEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || null;

  const toggleStar = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const handleSelectEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
    setSelectedEmailId(id);
  };

  if (selectedEmail) {
    return (
      <EmailDetailView
        email={selectedEmail}
        onBack={() => setSelectedEmailId(null)}
        onToggleStar={toggleStar}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-visible">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => handleSelectEmail(email.id)}
            className={cn(
              "flex items-start gap-4 px-5 py-4 border-b border-border/50 cursor-pointer transition-colors duration-150",
              !email.read ? "bg-accent/30 hover:bg-accent/40" : "hover:bg-muted/40"
            )}
          >
            <div className="relative shrink-0 mt-0.5">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold",
                email.direction === "inbound" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {email.fromInitials}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                email.direction === "inbound" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              )}>
                {email.direction === "inbound" ? <ArrowDownLeft className="h-2.5 w-2.5" /> : <ArrowUpRight className="h-2.5 w-2.5" />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("text-sm truncate", !email.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                    {email.direction === "inbound" ? email.from : `To: ${email.to}`}
                  </span>
                  {email.shipmentId && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono shrink-0">{email.shipmentId}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {email.starred && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
                  <span className="text-[11px] text-muted-foreground">{email.time}</span>
                </div>
              </div>
              <p className={cn("text-sm truncate", !email.read ? "font-medium text-foreground" : "text-foreground/70")}>{email.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                {email.hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              {!email.read && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailsTab;
