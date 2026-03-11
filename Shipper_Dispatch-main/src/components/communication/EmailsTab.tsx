import { useState } from "react";
import { Mail, Paperclip, Star, ArrowUpRight, ArrowDownLeft, MoreVertical, Reply, Forward, Trash2, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EmailDetailView, { type EmailItem } from "./EmailDetailView";

const EmailsTab = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || null;

  const toggleStar = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const handleSelectEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
    setSelectedEmailId(id);
  };

  if (selectedEmail) {
    return (
      <EmailDetailView
        email={selectedEmail}
        onBack={() => setSelectedEmailId(null)}
        onToggleStar={toggleStar}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-visible">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Mail className="h-12 w-12 mb-3 opacity-30" />
            <p>No emails yet</p>
          </div>
        ) : (
        emails.map((email) => (
          <div
            key={email.id}
            onClick={() => handleSelectEmail(email.id)}
            className={cn(
              "flex items-start gap-4 px-5 py-4 border-b border-border/50 cursor-pointer transition-colors duration-150",
              !email.read ? "bg-accent/30 hover:bg-accent/40" : "hover:bg-muted/40"
            )}
          >
            <div className="relative shrink-0 mt-0.5">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold",
                email.direction === "inbound" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {email.fromInitials}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                email.direction === "inbound" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              )}>
                {email.direction === "inbound" ? <ArrowDownLeft className="h-2.5 w-2.5" /> : <ArrowUpRight className="h-2.5 w-2.5" />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("text-sm truncate", !email.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                    {email.direction === "inbound" ? email.from : `To: ${email.to}`}
                  </span>
                  {email.shipmentId && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono shrink-0">{email.shipmentId}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {email.starred && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
                  <span className="text-[11px] text-muted-foreground">{email.time}</span>
                </div>
              </div>
              <p className={cn("text-sm truncate", !email.read ? "font-medium text-foreground" : "text-foreground/70")}>{email.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                {email.hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              {!email.read && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default EmailsTab;
