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
  const typeColor = call.type === "missed" ? "text-red-500" : "text-emerald-600";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-800">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
              call.type === "missed" ? "from-red-400 to-rose-500" : "from-emerald-400 to-teal-500"
            )}>
              <Phone className="h-4 w-4 text-white" />
            </div>
            {call.contact}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-stone-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">Status</span>
              <span className={cn("text-sm font-medium", typeColor)}>{typeLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">Number</span>
              <span className="text-sm font-medium text-stone-700">{call.number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">Duration</span>
              <span className="text-sm font-medium text-stone-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {call.duration !== "-" ? call.duration : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">Time</span>
              <span className="text-sm text-stone-500">{call.time}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(`tel:${call.number}`, "_self")}
              className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl h-10"
            >
              <PhoneCall className="h-4 w-4 mr-1.5" /> Call Back
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl h-10 border-stone-200 text-stone-600">
              <PhoneOff className="h-4 w-4 mr-1.5" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
