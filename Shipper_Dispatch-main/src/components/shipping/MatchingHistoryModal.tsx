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
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as matchingService from "@/services/matchingService";
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

function getCourierName(obj: { couriers?: { name?: string } | { name?: string }[] }): string | undefined {
  const c = obj.couriers;
  if (!c) return undefined;
  if (Array.isArray(c)) return c[0]?.name;
  return (c as { name?: string }).name;
}

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
        const { activity, notifications, matchingRequests } = await matchingService.getMatchingHistory(leadId);

        const historyEvents: HistoryEvent[] = [];

        (activity || []).forEach((log: Record<string, unknown>) => {
          const isStatusChange = log.action_type === "status_change";
          historyEvents.push({
            id: `log-${log.id}`,
            type: isStatusChange ? "status_change" : "modification",
            timestamp: (log.created_at as string) ?? "",
            performedBy: log.performed_by as string | undefined,
            previousValue: log.previous_value as string | undefined,
            newValue: log.new_value as string | undefined,
            details: (log.notes as string) || (isStatusChange
              ? `Status changed from "${log.previous_value}" to "${log.new_value}"`
              : `${log.action_type}: ${log.new_value}`),
          });
        });

        (notifications || []).forEach((n: Record<string, unknown>) => {
          const courierName = getCourierName(n as { couriers?: { name?: string } });
          historyEvents.push({
            id: `notif-${n.id}`,
            type: "notification_sent",
            timestamp: (n.created_at as string) ?? "",
            courierName,
            amount: n.offer_amount as number | undefined,
            details: `Offer sent to ${courierName ?? "courier"}`,
          });

          if (n.status === "accepted" && n.responded_at) {
            historyEvents.push({
              id: `notif-accept-${n.id}`,
              type: "accepted",
              timestamp: n.responded_at as string,
              courierName,
              details: `${courierName ?? "Courier"} accepted the offer`,
            });
          } else if (n.status === "declined" && n.responded_at) {
            historyEvents.push({
              id: `notif-decline-${n.id}`,
              type: "declined",
              timestamp: n.responded_at as string,
              courierName,
              details: `${courierName ?? "Courier"} declined`,
            });
          } else if (n.status === "expired") {
            historyEvents.push({
              id: `notif-expire-${n.id}`,
              type: "expired",
              timestamp: (n.responded_at as string) || (n.created_at as string),
              courierName,
              details: `No response from ${courierName ?? "courier"}`,
            });
          }
        });

        const negRes = await matchingService.listNegotiations(leadId);
        (negRes || []).forEach((neg: matchingService.Negotiation) => {
          const courierData = neg.couriers;
          const courierName = Array.isArray(courierData) ? courierData[0]?.name : (courierData as { name?: string })?.name;

          historyEvents.push({
            id: `neg-start-${neg.id}`,
            type: "negotiating",
            timestamp: neg.negotiation_started_at ?? neg.created_at ?? "",
            courierName,
            details: `Negotiation started with ${courierName ?? "courier"}`,
          });

          (neg.offers || []).forEach((offer: { id: string; created_at?: string; amount?: number; offered_by?: string }) => {
            historyEvents.push({
              id: `offer-${offer.id}`,
              type: offer.offered_by === "shipper" ? "offer" : "counter",
              timestamp: offer.created_at ?? "",
              amount: offer.amount,
              details: `${offer.offered_by === "shipper" ? "You" : courierName ?? "Courier"} offered $${offer.amount ?? 0}`,
            });
          });

          if (neg.status === "accepted" && (neg as { accepted_at?: string }).accepted_at) {
            historyEvents.push({
              id: `neg-accept-${neg.id}`,
              type: "booked",
              timestamp: (neg as { accepted_at?: string }).accepted_at ?? "",
              courierName,
              amount: neg.current_offer ?? undefined,
              details: `Booked with ${courierName ?? "courier"} for $${neg.current_offer ?? 0}`,
            });
          }
        });

        (matchingRequests || []).forEach((mr: Record<string, unknown>) => {
          if (mr.status === "failed") {
            historyEvents.push({
              id: `mr-fail-${mr.id}`,
              type: "failed",
              timestamp: (mr.created_at as string) ?? "",
              details: "No drivers available",
            });
          } else if (mr.status === "cancelled") {
            historyEvents.push({
              id: `mr-cancel-${mr.id}`,
              type: "cancelled",
              timestamp: (mr.created_at as string) ?? "",
              details: "Search cancelled",
            });
          }
        });

        historyEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setEvents(historyEvents);
      } catch {
        setEvents([]);
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
            Change History
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
              <p>No history available</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {events.map((event) => {
                  const config = eventConfig[event.type];
                  const Icon = config.icon;

                  return (
                    <div key={event.id} className="relative pl-10">
                      <div
                        className={cn(
                          "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center",
                          config.bg
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>

                      <div className="bg-card border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{event.details}</p>
                          {event.amount != null && (
                            <Badge variant="secondary" className="font-mono shrink-0">
                              ${event.amount.toLocaleString()}
                            </Badge>
                          )}
                        </div>

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
