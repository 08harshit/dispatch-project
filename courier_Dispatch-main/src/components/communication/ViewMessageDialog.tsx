import { MessageCircle, Send, User } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageItem { id: number; from: string; preview: string; time: string; unread: boolean }

interface ViewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: MessageItem | null;
  onMarkRead: (id: number) => void;
}

export const ViewMessageDialog = ({ open, onOpenChange, message, onMarkRead }: ViewMessageDialogProps) => {
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState<{ text: string; time: string; isMine: boolean }[]>([]);

  if (!message) return null;

  const handleReply = () => {
    if (!reply.trim()) return;
    setReplies((prev) => [...prev, { text: reply.trim(), time: "Just now", isMine: true }]);
    setReply("");
    onMarkRead(message.id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setReplies([]); setReply(""); } }}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-800">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            {message.from}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-3 min-h-[200px]">
          {/* Original message */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-sky-500" />
            </div>
            <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
              <p className="text-sm text-stone-700">{message.preview}</p>
              <p className="text-[10px] text-stone-400 mt-1">{message.time}</p>
            </div>
          </div>
          {/* Replies */}
          {replies.map((r, i) => (
            <div key={i} className={cn("flex items-start gap-3", r.isMine && "flex-row-reverse")}>
              {!r.isMine && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-sky-500" />
                </div>
              )}
              <div className={cn(
                "rounded-2xl px-4 py-2.5 max-w-[80%]",
                r.isMine ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-tr-sm" : "bg-stone-100 text-stone-700 rounded-tl-sm"
              )}>
                <p className="text-sm">{r.text}</p>
                <p className={cn("text-[10px] mt-1", r.isMine ? "text-white/70" : "text-stone-400")}>{r.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply..." className="rounded-xl min-h-[44px] max-h-[100px] resize-none flex-1" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }} />
          <Button onClick={handleReply} size="icon" className="h-10 w-10 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
