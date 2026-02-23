import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (msg: { from: string; preview: string; time: string; unread: boolean }) => void;
}

export const NewMessageDialog = ({ open, onOpenChange, onSend }: NewMessageDialogProps) => {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!to.trim() || !message.trim()) {
      toast({ title: "Missing fields", description: "Please fill in recipient and message.", variant: "destructive" });
      return;
    }
    onSend({ from: to.trim(), preview: message.trim(), time: "Just now", unread: false });
    toast({ title: "Message sent", description: `Message sent to ${to}` });
    setTo("");
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-800">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            New Message
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-stone-500">To (Shipper / Company)</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. John's Auto Transport" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-stone-500">Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." className="mt-1 rounded-xl min-h-[120px]" />
          </div>
          <Button onClick={handleSend} className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl h-10">
            <Send className="h-4 w-4 mr-1.5" /> Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
