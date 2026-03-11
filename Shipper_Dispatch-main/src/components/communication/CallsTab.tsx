import { useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Voicemail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import CallDetailView, { type CallItem } from "./CallDetailView";

const getCallIcon = (type: CallItem["type"]) => {
  switch (type) {
    case "incoming": return <PhoneIncoming className="h-4 w-4 text-emerald-500" />;
    case "outgoing": return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
    case "missed": return <PhoneMissed className="h-4 w-4 text-destructive" />;
    case "voicemail": return <Voicemail className="h-4 w-4 text-primary" />;
  }
};

const getCallLabel = (type: CallItem["type"]) => {
  switch (type) {
    case "incoming": return "Incoming";
    case "outgoing": return "Outgoing";
    case "missed": return "Missed";
    case "voicemail": return "Voicemail";
  }
};

const CallsTab = () => {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const calls: CallItem[] = [];

  const selectedCall = calls.find(c => c.id === selectedCallId) || null;

  if (selectedCall) {
    return (
      <CallDetailView
        call={selectedCall}
        onBack={() => setSelectedCallId(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-visible">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Phone className="h-12 w-12 mb-3 opacity-30" />
            <p>No calls yet</p>
          </div>
        ) : (
        calls.map((call) => (
          <div
            key={call.id}
            onClick={() => setSelectedCallId(call.id)}
            className={cn(
              "flex items-center gap-4 px-5 py-4 border-b border-border/50 cursor-pointer transition-colors duration-150 hover:bg-muted/40",
              call.type === "missed" && "bg-destructive/5"
            )}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {call.courierInitials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
                {getCallIcon(call.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn("text-sm font-medium truncate", call.type === "missed" ? "text-destructive" : "text-foreground")}>
                  {call.courierName}
                </span>
                {call.shipmentId && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono shrink-0">{call.shipmentId}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getCallLabel(call.type)}</span>
                <span>·</span>
                <span>{call.phone}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] text-muted-foreground">{call.time}</span>
              {call.duration !== "-" && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {call.duration}
                </span>
              )}
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default CallsTab;
