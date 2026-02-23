import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface NewEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (email: { from: string; subject: string; preview: string; time: string; unread: boolean }) => void;
}

export const NewEmailDialog = ({ open, onOpenChange, onSend }: NewEmailDialogProps) => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSend = () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    onSend({ from: to.trim(), subject: subject.trim(), preview: body.trim(), time: "Just now", unread: false });
    toast({ title: "Email sent", description: `Email sent to ${to}` });
    setTo("");
    setSubject("");
    setBody("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-800">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            New Email
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-stone-500">To (Email address)</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. dispatch@company.com" type="email" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-stone-500">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Load Confirmation #1234" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-stone-500">Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Compose your email..." className="mt-1 rounded-xl min-h-[140px]" />
          </div>
          <Button onClick={handleSend} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl h-10">
            <Send className="h-4 w-4 mr-1.5" /> Send Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
