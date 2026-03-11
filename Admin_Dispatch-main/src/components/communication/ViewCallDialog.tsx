import { Phone, PhoneCall, PhoneOff, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CallItem { id: number; contact: string; number: string; type: "incoming" | "outgoing" | "missed"; duration: string; time: string }

interface ViewCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CallItem | null;
}

export const ViewCallDialog = ({ open, onOpenChange, call }: ViewCallDialogProps) => {
  if (!call) return null;

  const typeLabel = call.type === "incoming" ? "Incoming Call" : call.type === "outgoing" ? "Outgoing Call" : "Missed Call";
  const typeColor = call.type === "missed" ? "text-destructive" : "text-accent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", call.type === "missed" ? "bg-destructive/10" : "bg-accent/10")}>
              <Phone className={cn("h-4 w-4", call.type === "missed" ? "text-destructive" : "text-accent")} />
            </div>
            {call.contact}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Status</span><span className={cn("text-sm font-medium", typeColor)}>{typeLabel}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Number</span><span className="text-sm font-medium text-foreground">{call.number}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Duration</span><span className="text-sm font-medium text-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{call.duration !== "-" ? call.duration : "N/A"}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Time</span><span className="text-sm text-muted-foreground">{call.time}</span></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.open(`tel:${call.number}`, "_self")} className="flex-1 bg-accent text-accent-foreground rounded-xl h-10"><PhoneCall className="h-4 w-4 mr-1.5" /> Call Back</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl h-10 border-border text-muted-foreground"><PhoneOff className="h-4 w-4 mr-1.5" /> Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
