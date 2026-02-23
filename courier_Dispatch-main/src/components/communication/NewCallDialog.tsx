import { useState } from "react";
import { Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface NewCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCall: (call: { contact: string; number: string; type: "outgoing"; duration: string; time: string }) => void;
}

export const NewCallDialog = ({ open, onOpenChange, onCall }: NewCallDialogProps) => {
  const [contact, setContact] = useState("");
  const [number, setNumber] = useState("");

  const handleCall = () => {
    if (!contact.trim() || !number.trim()) {
      toast({ title: "Missing fields", description: "Please fill in contact name and number.", variant: "destructive" });
      return;
    }
    onCall({ contact: contact.trim(), number: number.trim(), type: "outgoing", duration: "0:00", time: "Just now" });
    
    // Initiate phone call
    window.open(`tel:${number.trim()}`, "_self");
    
    toast({ title: "Calling...", description: `Dialing ${contact} at ${number}` });
    setContact("");
    setNumber("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-800">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            New Call
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-stone-500">Contact Name</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. John's Auto Transport" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-stone-500">Phone Number</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. (555) 123-4567" type="tel" className="mt-1 rounded-xl" />
          </div>
          <Button onClick={handleCall} className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl h-10">
            <Phone className="h-4 w-4 mr-1.5" /> Start Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
