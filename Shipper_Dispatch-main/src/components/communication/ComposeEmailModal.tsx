import { useState } from "react";
import { Send, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { EmailItem } from "./EmailDetailView";

interface ComposeEmailModalProps {
  open: boolean;
  onClose: () => void;
  mode: "reply" | "forward";
  originalEmail: EmailItem;
}

const ComposeEmailModal = ({ open, onClose, mode, originalEmail }: ComposeEmailModalProps) => {
  const defaultTo = mode === "reply"
    ? (originalEmail.direction === "inbound" ? originalEmail.from : originalEmail.to)
    : "";

  const subjectPrefix = mode === "reply" ? "Re: " : "Fwd: ";
  const subject = originalEmail.subject.startsWith(subjectPrefix)
    ? originalEmail.subject
    : `${subjectPrefix}${originalEmail.subject}`;

  const quotedBody = `\n\n--- Original Message ---\nFrom: ${originalEmail.from}\nTo: ${originalEmail.to}\nDate: ${originalEmail.time}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body || originalEmail.preview}`;

  const [to, setTo] = useState(defaultTo);
  const [body, setBody] = useState(mode === "forward" ? quotedBody : "");
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!to.trim()) {
      toast.error("Please enter a recipient");
      return;
    }
    if (!body.trim() && mode === "reply") {
      toast.error("Please enter a message");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success(mode === "reply" ? "Reply sent successfully" : "Email forwarded successfully");
      onClose();
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === "reply" ? "Reply" : "Forward"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipient name or email"
              autoFocus={mode === "forward"}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input value={subject} disabled className="text-muted-foreground" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={mode === "reply" ? "Type your reply..." : "Add a message (optional)..."}
              className="min-h-[160px] resize-none"
              autoFocus={mode === "reply"}
            />
          </div>

          {mode === "reply" && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
              <p className="font-medium mb-1">Original Message:</p>
              {originalEmail.body || originalEmail.preview}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" /> Attach
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={handleSend} disabled={sending}>
              <Send className="h-3.5 w-3.5" /> {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeEmailModal;
