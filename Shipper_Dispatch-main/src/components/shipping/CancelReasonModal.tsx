import { useState } from "react";
import { XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CANCEL_REASONS = [
  { id: "price_too_high", label: "Price too high" },
  { id: "found_another_driver", label: "Found another driver" },
  { id: "shipment_cancelled", label: "Shipment cancelled" },
  { id: "wrong_location", label: "Wrong pickup/delivery location" },
  { id: "timing_issue", label: "Timing doesn't work" },
  { id: "other", label: "Other reason" },
] as const;

interface CancelReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, details?: string) => Promise<void>;
  isLoading?: boolean;
}

const CancelReasonModal = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CancelReasonModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState("");

  const handleConfirm = async () => {
    if (!selectedReason) return;
    const reasonLabel = CANCEL_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
    await onConfirm(reasonLabel, details || undefined);
    setSelectedReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Matching
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Why are you cancelling?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {CANCEL_REASONS.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id} className="cursor-pointer flex-1 font-normal">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="details">Please explain</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us more about why you're cancelling..."
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Keep Searching
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReason || isLoading}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            {isLoading ? "Cancelling..." : "Confirm Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelReasonModal;
