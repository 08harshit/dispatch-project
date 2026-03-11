import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  RefreshCw,
  User,
  Edit,
  FileText,
  Trash2,
  Plus,
  Loader2,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HistoryEvent {
  id: string;
  type: "created" | "status_change" | "payout_change" | "cost_change" | "doc_added" | "doc_removed" | "edited" | "deleted";
  timestamp: string;
  performedBy: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

interface AccountingHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string | null;
  listingId?: string;
  history: HistoryEvent[];
}

const eventConfig = {
  created: { icon: Plus, color: "text-green-500", bg: "bg-green-500/10" },
  status_change: { icon: RefreshCw, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  payout_change: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  cost_change: { icon: Edit, color: "text-amber-500", bg: "bg-amber-500/10" },
  doc_added: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  doc_removed: { icon: Trash2, color: "text-red-500", bg: "bg-red-500/10" },
  edited: { icon: Edit, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  deleted: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const AccountingHistoryModal = ({
  open,
  onOpenChange,
  recordId,
  listingId,
  history,
}: AccountingHistoryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Change History
            {listingId && (
              <Badge variant="outline" className="ml-2 font-mono">
                {listingId}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No history available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-4">
                {history.map((event) => {
                  const config = eventConfig[event.type];
                  const Icon = config.icon;
                  
                  return (
                    <div key={event.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center",
                        config.bg
                      )}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      
                      <div className="bg-card border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{event.details}</p>
                        </div>
                        
                        {/* Show previous/new values for modifications */}
                        {(event.previousValue || event.newValue) && (
                          <div className="flex items-center gap-2 text-xs">
                            {event.previousValue && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                {event.previousValue}
                              </Badge>
                            )}
                            {event.previousValue && event.newValue && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                            {event.newValue && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                {event.newValue}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {format(new Date(event.timestamp), "dd MMM yyyy 'at' HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.performedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AccountingHistoryModal;
