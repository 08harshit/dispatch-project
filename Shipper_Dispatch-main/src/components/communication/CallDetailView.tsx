import { ArrowLeft, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Voicemail, Clock, MessageSquare, Copy, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CallItem {
  id: string;
  courierName: string;
  courierInitials: string;
  phone: string;
  type: "incoming" | "outgoing" | "missed" | "voicemail";
  duration: string;
  time: string;
  shipmentId?: string;
}

interface CallDetailViewProps {
  call: CallItem;
  onBack: () => void;
}

const getCallIcon = (type: CallItem["type"], size = "h-5 w-5") => {
  switch (type) {
    case "incoming": return <PhoneIncoming className={cn(size, "text-emerald-500")} />;
    case "outgoing": return <PhoneOutgoing className={cn(size, "text-blue-500")} />;
    case "missed": return <PhoneMissed className={cn(size, "text-destructive")} />;
    case "voicemail": return <Voicemail className={cn(size, "text-primary")} />;
  }
};

const getCallLabel = (type: CallItem["type"]) => {
  switch (type) {
    case "incoming": return "Incoming Call";
    case "outgoing": return "Outgoing Call";
    case "missed": return "Missed Call";
    case "voicemail": return "Voicemail";
  }
};

const CallDetailView = ({ call, onBack }: CallDetailViewProps) => {
  const handleCopyNumber = () => {
    navigator.clipboard.writeText(call.phone);
    toast.success("Phone number copied");
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">Call Details</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Contact Card */}
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
            {call.courierInitials}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{call.courierName}</h2>
            <p className="text-sm text-muted-foreground">{call.phone}</p>
          </div>
          {call.shipmentId && (
            <Badge variant="outline" className="font-mono text-xs">{call.shipmentId}</Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" className="gap-1.5" asChild>
            <a href={`tel:${call.phone.replace(/[^+\d]/g, '')}`}>
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Opening message...")}>
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyNumber}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>

        <Separator />

        {/* Call Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Call Information</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {getCallIcon(call.type, "h-4 w-4")}
                {getCallLabel(call.type)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="text-sm font-medium">{call.time}</span>
            </div>
            {call.duration !== "-" && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {call.duration}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* View Courier */}
        <Button variant="outline" className="w-full gap-2" onClick={() => toast.info("Opening courier profile...")}>
          <User className="h-4 w-4" /> View Courier Profile
        </Button>
      </div>
    </div>
  );
};

export default CallDetailView;
