import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Send, FileCheck, Receipt, FileText, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipperEmail?: string;
  shipperName: string;
  loadId: string;
  vehicleInfo: string;
  hasBol: boolean;
  hasInvoice: boolean;
  hasVcr?: boolean;
  hasPhotos?: boolean;
}

export const EmailDocumentsDialog = ({
  open,
  onOpenChange,
  shipperEmail = "",
  shipperName,
  loadId,
  vehicleInfo,
  hasBol,
  hasInvoice,
  hasVcr = false,
  hasPhotos = false,
}: EmailDocumentsDialogProps) => {
  const [email, setEmail] = useState(shipperEmail);
  const [subject, setSubject] = useState(`Delivery Completed - ${loadId} - ${vehicleInfo}`);
  const [message, setMessage] = useState(
    `Dear ${shipperName},\n\nI am pleased to confirm that the vehicle transport for ${vehicleInfo} (Load ID: ${loadId}) has been successfully completed.\n\nPlease find the attached documents for your records.\n\nThank you for your business!\n\nBest regards`
  );
  const [selectedDocs, setSelectedDocs] = useState({
    bol: hasBol,
    invoice: hasInvoice,
    vcr: hasVcr,
    photos: hasPhotos,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!selectedDocs.bol && !selectedDocs.invoice && !selectedDocs.vcr && !selectedDocs.photos) {
      toast.error("Please select at least one document to send");
      return;
    }

    setSending(true);

    // Simulate email sending (in production, this would call an edge function)
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSending(false);
    setSent(true);

    const docNames = [];
    if (selectedDocs.bol) docNames.push("BOL");
    if (selectedDocs.invoice) docNames.push("Invoice");
    if (selectedDocs.vcr) docNames.push("VCR");
    if (selectedDocs.photos) docNames.push("Photos");

    toast.success("Documents sent successfully!", {
      description: `${docNames.join(", ")} sent to ${email}`,
    });

    setTimeout(() => {
      onOpenChange(false);
      setSent(false);
    }, 1500);
  };

  const toggleDoc = (doc: keyof typeof selectedDocs) => {
    setSelectedDocs(prev => ({ ...prev, [doc]: !prev[doc] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-amber-500" />
            Send Documents to Shipper
          </DialogTitle>
          <DialogDescription>
            Email the delivery documents to {shipperName}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-stone-800">Email Sent!</p>
            <p className="text-sm text-stone-500 text-center">
              Documents have been sent to {email}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shipper@example.com"
                className="rounded-xl"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Document Selection */}
            <div className="space-y-3">
              <Label>Attach Documents</Label>
              <div className="grid grid-cols-2 gap-3">
                {hasBol && (
                  <button
                    onClick={() => toggleDoc("bol")}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      selectedDocs.bol
                        ? "border-teal-300 bg-teal-50"
                        : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <Checkbox checked={selectedDocs.bol} />
                    <div className="flex items-center gap-2">
                      <FileCheck className={cn("h-4 w-4", selectedDocs.bol ? "text-teal-600" : "text-stone-400")} />
                      <span className={cn("text-sm font-medium", selectedDocs.bol ? "text-teal-700" : "text-stone-600")}>
                        Bill of Lading
                      </span>
                    </div>
                  </button>
                )}

                {hasInvoice && (
                  <button
                    onClick={() => toggleDoc("invoice")}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      selectedDocs.invoice
                        ? "border-amber-300 bg-amber-50"
                        : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <Checkbox checked={selectedDocs.invoice} />
                    <div className="flex items-center gap-2">
                      <Receipt className={cn("h-4 w-4", selectedDocs.invoice ? "text-amber-600" : "text-stone-400")} />
                      <span className={cn("text-sm font-medium", selectedDocs.invoice ? "text-amber-700" : "text-stone-600")}>
                        Invoice
                      </span>
                    </div>
                  </button>
                )}

                {hasVcr && (
                  <button
                    onClick={() => toggleDoc("vcr")}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      selectedDocs.vcr
                        ? "border-stone-400 bg-stone-100"
                        : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <Checkbox checked={selectedDocs.vcr} />
                    <div className="flex items-center gap-2">
                      <FileText className={cn("h-4 w-4", selectedDocs.vcr ? "text-stone-600" : "text-stone-400")} />
                      <span className={cn("text-sm font-medium", selectedDocs.vcr ? "text-stone-700" : "text-stone-600")}>
                        Vehicle Condition Report
                      </span>
                    </div>
                  </button>
                )}

                {hasPhotos && (
                  <button
                    onClick={() => toggleDoc("photos")}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      selectedDocs.photos
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <Checkbox checked={selectedDocs.photos} />
                    <div className="flex items-center gap-2">
                      <FileText className={cn("h-4 w-4", selectedDocs.photos ? "text-emerald-600" : "text-stone-400")} />
                      <span className={cn("text-sm font-medium", selectedDocs.photos ? "text-emerald-700" : "text-stone-600")}>
                        Delivery Photos
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
