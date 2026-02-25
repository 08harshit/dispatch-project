import { useState } from "react";
import { MapPin, ArrowRight, Car, User, Star, Phone, Send, Plus, DollarSign, Clock, Map, Check, MessageCircle, Bookmark } from "lucide-react";
import { ConditionIcons } from "./ConditionIcons";
import { Button } from "@/components/ui/button";
import { ShipperChatDialog } from "./ShipperChatDialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoadNotification } from "@/hooks/useLoadNotifications";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";
import { differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AvailableLoadsTableProps {
  loads: LoadNotification[];
  onBid: (loadId: string, price: number) => Promise<{ requiresAuth: boolean }>;
  onAccept: (loadId: string, price: number) => Promise<{ requiresAuth: boolean }>;
  onAddToRoute: (load: LoadNotification) => void;
  loading?: boolean;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
  /** When provided, Save button uses API saved_loads by leadId */
  isSavedByLead?: (leadId: string) => boolean;
  onToggleSaveByLead?: (leadId: string) => void;
}

const getPickupTypeBadge = (type: string) => {
  const styles: Record<string, string> = {
    auction: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dealer: "bg-amber-100 text-amber-700 border border-amber-200",
    private: "bg-stone-100 text-stone-600 border border-stone-200",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
      styles[type.toLowerCase()] || styles.private
    )}>
      {type}
    </span>
  );
};

export const AvailableLoadsTable = ({ 
  loads, 
  onBid, 
  onAccept, 
  onAddToRoute,
  loading = false,
  isBookmarked,
  onToggleBookmark,
  isSavedByLead,
  onToggleSaveByLead,
}: AvailableLoadsTableProps) => {
  const useApiSave = isSavedByLead != null && onToggleSaveByLead != null;
  const isSaved = (load: LoadNotification) => useApiSave ? isSavedByLead(load.leadId) : isBookmarked(load.id);
  const onToggleSave = (load: LoadNotification) => {
    if (useApiSave) onToggleSaveByLead(load.leadId);
    else onToggleBookmark(load.id);
  };
  const { isInRoute } = useRoutePlanner();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<LoadNotification | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoad, setChatLoad] = useState<LoadNotification | null>(null);

  const handleOpenChat = (load: LoadNotification) => {
    setChatLoad(load);
    setChatOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenBidDialog = (load: LoadNotification) => {
    setSelectedLoad(load);
    setBidAmount(load.price.toString());
    setBidDialogOpen(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedLoad || !bidAmount) return;
    setSubmitting(true);
    try {
      await onBid(selectedLoad.id, parseFloat(bidAmount));
      setBidDialogOpen(false);
      setSelectedLoad(null);
      setBidAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (load: LoadNotification) => {
    setAcceptingId(load.id);
    try {
      await onAccept(load.id, load.price);
    } finally {
      setAcceptingId((prev) => (prev === load.id ? null : prev));
    }
  };


  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center animate-pulse">
            <Car className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-stone-700">Loading available loads...</p>
        </div>
      </div>
    );
  }

  if (loads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Car className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-stone-700">No available loads</p>
            <p className="text-sm text-stone-400 mt-1">Check back later for new opportunities</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100 pb-2">
        <div className="min-w-[1100px] space-y-4">
        {loads.map((load, index) => {
          const accents = [
            { bg: 'from-amber-400 to-orange-400', light: 'bg-amber-50', text: 'text-amber-600', shadow: 'shadow-amber-200/20', border: 'hover:border-amber-200' },
            { bg: 'from-emerald-400 to-teal-400', light: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-200/20', border: 'hover:border-emerald-200' },
          ];
          const accent = accents[index % accents.length];

          return (
            <div 
              key={load.id}
              className={cn(
                "group bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden",
                accent.border, accent.shadow
              )}
            >
              {/* Decorative accent bar */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", accent.bg)} />
              
              {/* Decorative corner accent */}
              <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br opacity-5", accent.bg)} />
              
              <div className="flex flex-col gap-4 pl-4">
                {/* Top Row: Load ID, Vehicle, Shipper, Price */}
                <div className="flex items-start gap-6">
                  {/* Load ID & Vehicle */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300", accent.light)}>
                      <Car className={cn("h-6 w-6", accent.text)} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold text-sm", accent.text)}>#{load.id.slice(0, 8)}</span>
                        <div className={cn("h-2 w-2 rounded-full bg-gradient-to-r animate-pulse", accent.bg)} />
                      </div>
                      <p className="font-semibold text-stone-800 mt-0.5">
                        {load.vehicle.year} {load.vehicle.make}
                      </p>
                      <p className="text-stone-500 text-sm">{load.vehicle.model}</p>
                      {/* Days Listed Badge */}
                      {(() => {
                        const daysListed = differenceInDays(new Date(), new Date(load.createdAt));
                        return (
                          <span className={cn(
                            "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                            daysListed >= 3 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-stone-50 text-stone-500 border border-stone-100"
                          )}>
                            <Clock className="h-3 w-3" />
                            {daysListed === 0 ? "Today" : `${daysListed}d ago`}
                          </span>
                        );
                      })()}
                      {/* Condition Icons */}
                      {load.vehicle.condition && (
                        <div className="mt-1">
                          <ConditionIcons condition={load.vehicle.condition} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipper Info */}
                  <div className="min-w-[180px] p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <User className="h-4 w-4 text-stone-400" />
                      <span className="text-[9px] text-stone-500 uppercase tracking-wider font-bold">Shipper</span>
                    </div>
                    <p className="font-semibold text-stone-700 text-sm">{load.shipper.name}</p>
                    {load.shipper.company && (
                      <p className="text-xs text-stone-500">{load.shipper.company}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-stone-600">{load.shipper.rating}</span>
                      </div>
                      {load.shipper.phone && (
                        <div className="flex items-center gap-1 text-stone-400">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{load.shipper.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pickup/Delivery with Map indicator */}
                  <div className="flex-1 flex items-center gap-4 px-4 py-3 bg-stone-50/50 rounded-2xl border border-stone-100">
                    {/* Pickup */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Pickup</p>
                        <p className="text-sm font-semibold text-stone-700 truncate">{load.pickup.city}, {load.pickup.state}</p>
                        {getPickupTypeBadge(load.vehicle.type)}
                      </div>
                    </div>

                    {/* Map indicator */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center">
                        <Map className="h-4 w-4 text-stone-400" />
                      </div>
                      <span className="text-[8px] text-stone-400 font-medium">{load.distance} mi</span>
                    </div>

                    {/* Animated Arrow */}
                    <div className="flex items-center gap-1 px-2">
                      <div className="h-0.5 w-4 bg-amber-200 rounded-full" />
                      <div className="h-7 w-7 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 flex items-center justify-center shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                      </div>
                      <div className="h-0.5 w-4 bg-emerald-200 rounded-full" />
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Delivery</p>
                        <p className="text-sm font-semibold text-stone-700 truncate">{load.delivery.city}, {load.delivery.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* Availability Dates */}
                  <div className="hidden lg:flex flex-col gap-1.5 min-w-[100px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span className="text-[9px] text-stone-500 uppercase tracking-wider font-bold">Available</span>
                    </div>
                    <p className="text-sm font-medium text-stone-700">{load.pickup.date}</p>
                    <p className="text-xs text-stone-500">{load.pickup.time}</p>
                  </div>

                  {/* Price */}
                  <div className="min-w-[120px] text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[9px] text-emerald-600 uppercase tracking-wider font-bold mb-1">Price</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(load.price)}</p>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  {/* Contact Column */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSave(load)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-2 rounded-[1.2rem_1.8rem_1.2rem_1.8rem] transition-all duration-500 group/bm overflow-hidden border-2",
                        isSaved(load)
                          ? "bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 border-amber-300 shadow-lg shadow-amber-300/50 scale-[1.03] hover:shadow-xl hover:shadow-amber-400/60"
                          : "bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 border-amber-200 shadow-sm hover:from-amber-200 hover:via-orange-200 hover:to-rose-200 hover:shadow-md hover:shadow-amber-200/40 hover:scale-[1.03]"
                      )}
                    >
                      {/* Animated glow + shimmer when bookmarked */}
                      {isSaved(load) && (
                        <>
                          <div className="absolute -inset-1 rounded-[1.4rem_2rem_1.4rem_2rem] bg-gradient-to-br from-amber-300 to-orange-400 animate-[glow-pulse_2s_ease-in-out_infinite] opacity-50 blur-md" />
                          <div className="absolute inset-0 rounded-[1.2rem_1.8rem_1.2rem_1.8rem] overflow-hidden">
                            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2.5s_infinite] skew-x-12" />
                          </div>
                        </>
                      )}
                      <Bookmark className={cn(
                        "h-[18px] w-[18px] relative z-10 transition-all duration-300",
                        isSaved(load) 
                          ? "fill-white text-white drop-shadow-md" 
                          : "text-amber-500 group-hover/bm:scale-110 group-hover/bm:rotate-[-8deg]"
                      )} strokeWidth={isSaved(load) ? 0 : 1.5} />
                      <span className={cn(
                        "relative z-10 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                        isSaved(load) ? "text-white" : "text-amber-600"
                      )}>
                        {isSaved(load) ? "Saved" : "Save"}
                      </span>
                    </button>
                    <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold mr-2">Contact</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => load.shipper.phone && window.open(`tel:${load.shipper.phone}`, '_self')}
                      disabled={!load.shipper.phone}
                      className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 disabled:opacity-50"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenChat(load)}
                      className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddToRoute(load)}
                      disabled={isInRoute(load.id)}
                      className={cn(
                        "h-9 px-4 rounded-xl transition-all",
                        isInRoute(load.id)
                          ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {isInRoute(load.id) ? (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          In Route
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add to Route
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenBidDialog(load)}
                      className="h-9 px-4 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
                    >
                      <Send className="h-4 w-4 mr-1.5" />
                      Submit Offer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-800">Submit Offer</DialogTitle>
            <DialogDescription className="text-stone-500">
              {selectedLoad && (
                <>
                  Make an offer for {selectedLoad.vehicle.year} {selectedLoad.vehicle.make} {selectedLoad.vehicle.model}
                  <br />
                  <span className="text-stone-400">
                    {selectedLoad.pickup.city} → {selectedLoad.delivery.city}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-stone-500">Listed Price:</span>
              <span className="font-bold text-lg text-stone-700">
                {selectedLoad && formatCurrency(selectedLoad.price)}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Your Offer</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-lg font-semibold"
                  placeholder="Enter your offer"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setBidDialogOpen(false)}
                className="flex-1 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBid}
                disabled={submitting || !bidAmount}
                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600"
              >
                {submitting ? "Sending..." : "Send Offer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}

      {chatLoad && (
        <ShipperChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          shipper={chatLoad.shipper}
          loadId={chatLoad.id.slice(0, 8)}
        />
      )}
    </>
  );
};
