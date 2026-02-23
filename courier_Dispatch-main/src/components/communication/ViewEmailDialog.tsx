import { useState } from "react";
import { Mail, Send, Reply } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface EmailItem { id: number; from: string; subject: string; preview: string; time: string; unread: boolean }

interface ViewEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: EmailItem | null;
  onMarkRead: (id: number) => void;
}

export const ViewEmailDialog = ({ open, onOpenChange, email, onMarkRead }: ViewEmailDialogProps) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sent, setSent] = useState(false);

  if (!email) return null;

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    onMarkRead(email.id);
    setSent(true);
    setTimeout(() => {
      setShowReply(false);
      setReplyText("");
      setSent(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setShowReply(false); setReplyText(""); setSent(false); } }}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-800">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            {email.subject}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-stone-600">{email.from}</p>
            <p className="text-xs text-stone-400">{email.time}</p>
          </div>
          <Separator className="bg-stone-100" />
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{email.preview}</p>
          <Separator className="bg-stone-100" />

          {!showReply && !sent && (
            <Button variant="outline" onClick={() => setShowReply(true)} className="rounded-xl border-stone-200 text-stone-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200">
              <Reply className="h-4 w-4 mr-1.5" /> Reply
            </Button>
          )}

          {showReply && !sent && (
            <div className="space-y-3">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." className="rounded-xl min-h-[100px]" />
              <div className="flex gap-2">
                <Button onClick={handleSendReply} className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl">
                  <Send className="h-4 w-4 mr-1.5" /> Send Reply
                </Button>
                <Button variant="ghost" onClick={() => { setShowReply(false); setReplyText(""); }} className="rounded-xl text-stone-500">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {sent && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3">
              <Send className="h-4 w-4" />
              <p className="text-sm font-medium">Reply sent successfully!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
