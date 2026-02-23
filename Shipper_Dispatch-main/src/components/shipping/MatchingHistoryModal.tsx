import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Truck, 
  DollarSign,
  Timer,
  AlertCircle,
  Loader2,
  RefreshCw,
  User,
  Edit
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface HistoryEvent {
  id: string;
  type: "notification_sent" | "accepted" | "declined" | "expired" | "negotiating" | "offer" | "counter" | "booked" | "failed" | "cancelled" | "status_change" | "modification";
  timestamp: string;
  courierName?: string;
  performedBy?: string;
  amount?: number;
  details?: string;
  previousValue?: string;
  newValue?: string;
}

interface MatchingHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  listingId?: string;
}

const eventConfig = {
  notification_sent: { icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10" },
  accepted: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  declined: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  expired: { icon: Timer, color: "text-orange-500", bg: "bg-orange-500/10" },
  negotiating: { icon: ArrowRight, color: "text-purple-500", bg: "bg-purple-500/10" },
  offer: { icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
  counter: { icon: ArrowRight, color: "text-amber-500", bg: "bg-amber-500/10" },
  booked: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  failed: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" },
  status_change: { icon: RefreshCw, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  modification: { icon: Edit, color: "text-cyan-500", bg: "bg-cyan-500/10" },
};

const MatchingHistoryModal = ({
  open,
  onOpenChange,
  leadId,
  listingId,
}: MatchingHistoryModalProps) => {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !leadId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const db = supabase as any;
        
        // Fetch activity log
        const { data: activityLog } = await db
          .from("activity_log")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: true });

        // Fetch notifications
        const { data: notifications } = await db
          .from("driver_notifications")
          .select(`
            id, status, created_at, responded_at, offer_amount,
            courier:couriers(name)
          `)
          .eq("lead_id", leadId)
          .order("created_at", { ascending: true });

        // Fetch negotiations
        const { data: negotiations } = await db
          .from("negotiations")
          .select(`
            id, status, created_at, accepted_at, current_offer,
            courier:couriers(name),
            offers(id, amount, offered_by, response, created_at)
          `)
          .eq("lead_id", leadId)
          .order("created_at", { ascending: true });

        // Fetch matching requests
        const { data: matchingRequests } = await db
          .from("matching_requests")
          .select("id, status, created_at, initial_offer")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: true });

        const historyEvents: HistoryEvent[] = [];

        // Process activity log entries
        (activityLog || []).forEach((log: any) => {
          const isStatusChange = log.action_type === "status_change";
          historyEvents.push({
            id: `log-${log.id}`,
            type: isStatusChange ? "status_change" : "modification",
            timestamp: log.created_at,
            performedBy: log.performed_by,
            previousValue: log.previous_value,
            newValue: log.new_value,
            details: log.notes || (isStatusChange 
              ? `Status changed from "${log.previous_value}" to "${log.new_value}"`
              : `${log.action_type}: ${log.new_value}`),
          });
        });

        // Process notifications
        (notifications || []).forEach((n: any) => {
          historyEvents.push({
            id: `notif-${n.id}`,
            type: "notification_sent",
            timestamp: n.created_at,
            courierName: n.courier?.name,
            amount: n.offer_amount,
            details: `Offer sent to ${n.courier?.name}`,
          });

          if (n.status === "accepted" && n.responded_at) {
            historyEvents.push({
              id: `notif-accept-${n.id}`,
              type: "accepted",
              timestamp: n.responded_at,
              courierName: n.courier?.name,
              details: `${n.courier?.name} accepted the offer`,
            });
          } else if (n.status === "declined" && n.responded_at) {
            historyEvents.push({
              id: `notif-decline-${n.id}`,
              type: "declined",
              timestamp: n.responded_at,
              courierName: n.courier?.name,
              details: `${n.courier?.name} declined`,
            });
          } else if (n.status === "expired") {
            historyEvents.push({
              id: `notif-expire-${n.id}`,
              type: "expired",
              timestamp: n.responded_at || n.created_at,
              courierName: n.courier?.name,
              details: `No response from ${n.courier?.name}`,
            });
          }
        });

        // Process negotiations
        (negotiations || []).forEach((neg: any) => {
          historyEvents.push({
            id: `neg-start-${neg.id}`,
            type: "negotiating",
            timestamp: neg.created_at,
            courierName: neg.courier?.name,
            details: `Negotiation started with ${neg.courier?.name}`,
          });

          // Add offers
          (neg.offers || []).forEach((offer: any) => {
            historyEvents.push({
              id: `offer-${offer.id}`,
              type: offer.offered_by === "shipper" ? "offer" : "counter",
              timestamp: offer.created_at,
              amount: offer.amount,
              details: `${offer.offered_by === "shipper" ? "You" : neg.courier?.name} offered $${offer.amount}`,
            });
          });

          if (neg.status === "accepted" && neg.accepted_at) {
            historyEvents.push({
              id: `neg-accept-${neg.id}`,
              type: "booked",
              timestamp: neg.accepted_at,
              courierName: neg.courier?.name,
              amount: neg.current_offer,
              details: `Booked with ${neg.courier?.name} for $${neg.current_offer}`,
            });
          }
        });

        // Process matching requests for failed/cancelled
        (matchingRequests || []).forEach((mr: any) => {
          if (mr.status === "failed") {
            historyEvents.push({
              id: `mr-fail-${mr.id}`,
              type: "failed",
              timestamp: mr.created_at,
              details: "No drivers available",
            });
          } else if (mr.status === "cancelled") {
            historyEvents.push({
              id: `mr-cancel-${mr.id}`,
              type: "cancelled",
              timestamp: mr.created_at,
              details: "Search cancelled",
            });
          }
        });

        // Sort by timestamp
        historyEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setEvents(historyEvents);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, leadId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Historique des modifications
            {listingId && (
              <Badge variant="outline" className="ml-2 font-mono">
                {listingId}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun historique disponible</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-4">
                {events.map((event) => {
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
                          {event.amount && (
                            <Badge variant="secondary" className="font-mono shrink-0">
                              ${event.amount.toLocaleString()}
                            </Badge>
                          )}
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
                            {format(new Date(event.timestamp), "dd MMM yyyy 'à' HH:mm")}
                          </span>
                          {event.performedBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.performedBy}
                            </span>
                          )}
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

export default MatchingHistoryModal;
