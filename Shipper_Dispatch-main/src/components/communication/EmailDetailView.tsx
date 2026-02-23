import { useState } from "react";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Paperclip, Star, Reply, Forward, Trash2, Archive, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ComposeEmailModal from "./ComposeEmailModal";

export interface EmailItem {
  id: string;
  from: string;
  fromInitials: string;
  to: string;
  subject: string;
  preview: string;
  body?: string;
  time: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  direction: "inbound" | "outbound";
  shipmentId?: string;
}

interface EmailDetailViewProps {
  email: EmailItem;
  onBack: () => void;
  onToggleStar: (id: string) => void;
}

const EmailDetailView = ({ email, onBack, onToggleStar }: EmailDetailViewProps) => {
  const [composeMode, setComposeMode] = useState<"reply" | "forward" | null>(null);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{email.subject}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleStar(email.id)}>
            <Star className={cn("h-4 w-4", email.starred ? "text-primary fill-primary" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Archived")}>
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast.info("Deleted")}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info("Marked as unread")}>Mark as Unread</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Moved to spam")}>Report Spam</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
            email.direction === "inbound" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {email.fromInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{email.from}</span>
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                email.direction === "inbound" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              )}>
                {email.direction === "inbound" ? <ArrowDownLeft className="h-2.5 w-2.5" /> : <ArrowUpRight className="h-2.5 w-2.5" />}
              </div>
              {email.shipmentId && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">{email.shipmentId}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {email.direction === "inbound" ? `To: You` : `To: ${email.to}`} · {email.time}
            </p>
          </div>
        </div>

        <Separator />

        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {email.body || email.preview}
        </div>

        {email.hasAttachment && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attachments</p>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">document.pdf</p>
                  <p className="text-xs text-muted-foreground">245 KB</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reply Bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-border">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setComposeMode("reply")}>
          <Reply className="h-3.5 w-3.5" /> Reply
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setComposeMode("forward")}>
          <Forward className="h-3.5 w-3.5" /> Forward
        </Button>
      </div>

      {composeMode && (
        <ComposeEmailModal
          open={!!composeMode}
          onClose={() => setComposeMode(null)}
          mode={composeMode}
          originalEmail={email}
        />
      )}
    </div>
  );
};

export default EmailDetailView;
