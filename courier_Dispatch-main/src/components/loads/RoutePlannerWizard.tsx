import { useState, useMemo, useCallback } from "react";
import { 
  MapPin, ArrowRight, X, Route, DollarSign, Navigation, Trash2, 
  Gauge, TrendingUp, Check, Send, ChevronRight, ChevronLeft,
  Play, Loader2, Clock, AlertTriangle, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";
import { LoadNotification } from "@/hooks/useLoadNotifications";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MultiLoadRouteMap } from "./MultiLoadRouteMap";
import { RouteLoadsList } from "./RouteLoadsList";
import { RoutePickerMap } from "./RoutePickerMap";

interface RoutePlannerWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableLoads?: LoadNotification[];
  onAcceptAll?: (loads: LoadNotification[]) => Promise<void>;
  onSendBids?: (bids: { loadId: string; price: number }[]) => Promise<void>;
}

type Step = "setup" | "proposals" | "bids" | "accepted";

interface LoadBid {
  loadId: string;
  bidPrice: number;
  status: "pending" | "sent" | "accepted" | "negotiating";
}

interface OptimizedStop {
  type: "pickup" | "delivery";
  loadIndex: number;
  load: LoadNotification;
  coordinates: [number, number];
  city: string;
  state: string;
  date: string;
  time: string;
  color: string;
  label: string;
}

interface ClusterGroup {
  stops: OptimizedStop[];
  centerCoordinates: [number, number];
  radius: number;
}

export const RoutePlannerWizard = ({ 
  open, 
  onOpenChange,
  availableLoads = [],
  onAcceptAll,
  onSendBids 
}: RoutePlannerWizardProps) => {
  const { selectedLoads, removeLoad, clearRoute, addLoad, isInRoute } = useRoutePlanner();
  
  const [step, setStep] = useState<Step>("setup");
  const [bids, setBids] = useState<LoadBid[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedLoads, setAcceptedLoads] = useState<string[]>([]);
  const [optimizedStops, setOptimizedStops] = useState<OptimizedStop[]>([]);
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);
  
  // Bid dialog state
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedBidLoad, setSelectedBidLoad] = useState<LoadNotification | null>(null);
  const [bidAmount, setBidAmount] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle route calculation from map
  const handleRouteCalculated = useCallback((stops: OptimizedStop[], foundClusters: ClusterGroup[]) => {
    setOptimizedStops(stops);
    setClusters(foundClusters);
  }, []);

  // Calculate route metrics
  const loadsDistance = selectedLoads.reduce((sum, load) => sum + load.distance, 0);
  const totalEarnings = selectedLoads.reduce((sum, load) => sum + load.price, 0);
  const avgPricePerMile = loadsDistance > 0 ? totalEarnings / loadsDistance : 0;
  const estimatedFuelCost = loadsDistance * 0.65;
  const estimatedProfit = totalEarnings - estimatedFuelCost;

  // Calculate optimized total distance using stops order
  const optimizedTotalDistance = useMemo(() => {
    if (optimizedStops.length <= 1) return loadsDistance;
    
    let totalDist = 0;
    for (let i = 1; i < optimizedStops.length; i++) {
      const prev = optimizedStops[i - 1].coordinates;
      const curr = optimizedStops[i].coordinates;
      // Haversine distance
      const R = 3959;
      const lat1 = prev[0] * Math.PI / 180;
      const lat2 = curr[0] * Math.PI / 180;
      const deltaLat = (curr[0] - prev[0]) * Math.PI / 180;
      const deltaLon = (curr[1] - prev[1]) * Math.PI / 180;
      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDist += R * c;
    }
    return Math.round(totalDist);
  }, [optimizedStops, loadsDistance]);

  // Initialize bids when moving to proposals
  const handleProceedToProposals = () => {
    setBids(selectedLoads.map(load => ({
      loadId: load.id,
      bidPrice: load.price,
      status: "pending"
    })));
    setStep("proposals");
  };

  // Open bid dialog for a load
  const handleOpenBidDialog = (load: LoadNotification) => {
    setSelectedBidLoad(load);
    setBidAmount(load.price.toString());
    setBidDialogOpen(true);
  };

  // Submit bid from dialog
  const handleSubmitBidFromDialog = async () => {
    if (!selectedBidLoad || !bidAmount) return;
    const price = parseFloat(bidAmount);
    
    // Update the bid in the bids array
    setBids(prev => prev.map(b => 
      b.loadId === selectedBidLoad.id 
        ? { ...b, bidPrice: price, status: "sent" } 
        : b
    ));
    
    // Close dialog
    setBidDialogOpen(false);
    setSelectedBidLoad(null);
    setBidAmount("");
  };

  // Reject a proposal (remove from route)
  const handleRejectProposal = (loadId: string) => {
    removeLoad(loadId);
    setBids(prev => prev.filter(b => b.loadId !== loadId));
  };

  // Update bid price
  const handleUpdateBidPrice = (loadId: string, price: number) => {
    setBids(prev => prev.map(b => 
      b.loadId === loadId ? { ...b, bidPrice: price } : b
    ));
  };

  // Proceed to bids step
  const handleProceedToBids = () => {
    setStep("bids");
  };

  // Send all pending bids
  const handleSendBids = async () => {
    setIsProcessing(true);
    setBids(prev => prev.map(b => 
      b.status === "pending" ? { ...b, status: "sent" } : b
    ));
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBids(prev => prev.map(b => 
      b.status === "sent" ? { ...b, status: "negotiating" } : b
    ));
    setIsProcessing(false);
  };

  // Accept all and start pickup
  const handleAcceptAllAndStart = async () => {
    setIsProcessing(true);
    setBids(prev => prev.map(b => ({ ...b, status: "accepted" })));
    setAcceptedLoads(selectedLoads.map(l => l.id));
    if (onAcceptAll) {
      await onAcceptAll(selectedLoads);
    }
    setStep("accepted");
    setIsProcessing(false);
  };

  // Reset wizard
  const handleReset = () => {
    setStep("setup");
    setBids([]);
    setAcceptedLoads([]);
    setOptimizedStops([]);
    setClusters([]);
    clearRoute();
    onOpenChange(false);
  };

  const allBidsSent = bids.every(b => b.status !== "pending");
  const acceptedCount = bids.filter(b => b.status === "accepted").length;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-white/50 backdrop-blur-sm">
      {["setup", "proposals", "bids", "accepted"].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
            step === s
              ? "bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-lg"
              : ["proposals", "bids", "accepted"].indexOf(step) >= i
                ? "bg-emerald-500 text-white"
                : "bg-stone-200 text-stone-500"
          )}>
            {["proposals", "bids", "accepted"].indexOf(step) > i ? (
              <Check className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          {i < 3 && (
            <div className={cn(
              "w-8 h-0.5 rounded-full transition-all",
              ["proposals", "bids", "accepted"].indexOf(step) > i
                ? "bg-emerald-400"
                : "bg-stone-200"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-stone-50 border-l border-stone-200 p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-500 p-6">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Route className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Plan Route</span>
                <p className="text-white/80 text-sm font-normal mt-0.5">
                  {step === "setup" && `${selectedLoads.length} loads • ${optimizedStops.length} stops`}
                  {step === "proposals" && "Review proposals"}
                  {step === "bids" && "Manage your bids"}
                  {step === "accepted" && "Ready to start!"}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Setup - Route Picker + Selected Loads */}
          {step === "setup" && (
            <div className="flex flex-col h-full animate-fade-in">
              {/* Route Picker Map - When we have available loads to choose from */}
              {availableLoads.length > 0 && (
                <div className="p-4 border-b border-stone-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Map className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-stone-700">Pick Your Route</span>
                    <span className="text-xs text-stone-400">Set start & destination to find loads</span>
                  </div>
                  <RoutePickerMap
                    loads={availableLoads}
                    onAddToRoute={addLoad}
                    isInRoute={isInRoute}
                  />
                </div>
              )}

              {/* Selected Loads Map - Shows the current route */}
              {selectedLoads.length > 0 && (
                <>
                  <div className="h-[250px] relative">
                    <MultiLoadRouteMap
                      loads={selectedLoads}
                      className="h-full"
                      showOptimizedRoute={true}
                      onRouteCalculated={handleRouteCalculated}
                    />
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-4 gap-2 p-3 bg-white border-b border-stone-100">
                    <div className="text-center">
                      <p className="text-[9px] uppercase text-stone-400 font-semibold">Loads</p>
                      <p className="text-lg font-bold text-stone-700">{selectedLoads.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase text-stone-400 font-semibold">Distance</p>
                      <p className="text-lg font-bold text-amber-600">{optimizedTotalDistance.toLocaleString()} mi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase text-stone-400 font-semibold">Earnings</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalEarnings)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase text-stone-400 font-semibold">$/Mile</p>
                      <p className={cn(
                        "text-lg font-bold",
                        avgPricePerMile >= 1.5 ? "text-emerald-600" : avgPricePerMile >= 1 ? "text-amber-600" : "text-rose-600"
                      )}>
                        ${avgPricePerMile.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Cluster Alert */}
                  {clusters.length > 0 && (
                    <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-800 text-sm">Nearby Stops Detected!</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {clusters.reduce((sum, c) => sum + c.stops.length, 0)} stops are close together. 
                          The optimized route groups them for efficiency.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Profit Analysis */}
                  <div className="mx-4 mt-3 p-4 rounded-xl bg-gradient-to-r from-stone-50 to-stone-100 border border-stone-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-stone-700">Profit Analysis</span>
                      <TrendingUp className="h-4 w-4 text-stone-400" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[9px] text-stone-500 uppercase tracking-wider">Est. Fuel</p>
                        <p className="text-lg font-semibold text-rose-600">-{formatCurrency(estimatedFuelCost)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-stone-500 uppercase tracking-wider">Net Profit</p>
                        <p className={cn(
                          "text-lg font-bold",
                          estimatedProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {formatCurrency(estimatedProfit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-stone-500 uppercase tracking-wider">Profit/Mi</p>
                        <p className={cn(
                          "text-lg font-semibold",
                          avgPricePerMile >= 1.5 ? "text-emerald-600" : avgPricePerMile >= 1 ? "text-amber-600" : "text-rose-600"
                        )}>
                          ${(estimatedProfit / (optimizedTotalDistance || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Optimized Stops List */}
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-600">
                        Optimized Route Order
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRoute}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-7"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    
                    <RouteLoadsList
                      loads={selectedLoads}
                      optimizedStops={optimizedStops}
                      onRemoveLoad={removeLoad}
                      compact={true}
                    />
                  </div>
                </>
              )}

              {/* Empty state - when no loads selected and no available loads */}
              {selectedLoads.length === 0 && availableLoads.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                    <Map className="h-8 w-8 text-stone-400" />
                  </div>
                  <p className="font-semibold text-stone-600">No loads selected</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Add loads from the Available Loads list to start planning your route
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Proposals */}
          {step === "proposals" && (
            <div className="p-6 space-y-6 animate-fade-in">
              {/* Map Preview */}
              {selectedLoads.length > 0 && (
                <div className="rounded-2xl overflow-hidden border border-stone-200 h-48">
                  <MultiLoadRouteMap
                    loads={selectedLoads}
                    className="h-full"
                    showOptimizedRoute={true}
                  />
                </div>
              )}

              {/* Proposals List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-stone-600">Review & Bid</h3>
                  <span className="text-xs text-stone-400">
                    {bids.filter(b => b.status === "sent").length}/{selectedLoads.length} bids sent
                  </span>
                </div>
                {selectedLoads.map((load, index) => {
                  const bid = bids.find(b => b.loadId === load.id);
                  const hasBidSent = bid?.status === "sent";
                  const pricePerMile = load.price / load.distance;
                  const isProfitable = pricePerMile >= 1.5;
                  const suggestedOffer = Math.round(load.distance * 1.8);
                  
                  return (
                    <div
                      key={load.id}
                      className={cn(
                        "bg-white rounded-2xl border p-4 transition-all",
                        hasBidSent ? "border-amber-300 bg-amber-50/50" : "border-stone-100"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold",
                          isProfitable ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-amber-400 to-orange-400"
                        )}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800">
                            {load.vehicle.year} {load.vehicle.make} {load.vehicle.model}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-amber-500" />
                            <span>{load.pickup.city}, {load.pickup.state}</span>
                            <ArrowRight className="h-3 w-3" />
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{load.delivery.city}, {load.delivery.state}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-stone-400">{load.distance} mi</span>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              isProfitable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              ${pricePerMile.toFixed(2)}/mi
                            </span>
                            {!isProfitable && (
                              <span className="text-[10px] text-stone-400">
                                Suggest: {formatCurrency(suggestedOffer)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(load.price)}</p>
                          {!hasBidSent ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectProposal(load.id)}
                                className="h-8 px-3 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleOpenBidDialog(load)}
                                className="h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Bid
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                              <Send className="h-4 w-4" />
                              Bid Sent
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

          {/* STEP 3: Bids */}
          {step === "bids" && (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-stone-600">
                  {acceptedCount} Accepted • {bids.length - acceptedCount} Pending Bids
                </h3>
                {!allBidsSent && bids.some(b => b.status === "pending") && (
                  <Button
                    size="sm"
                    onClick={handleSendBids}
                    disabled={isProcessing}
                    className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send All Bids
                  </Button>
                )}
              </div>

              {/* Bids List */}
              <div className="space-y-3">
                {selectedLoads.map((load) => {
                  const bid = bids.find(b => b.loadId === load.id);
                  if (!bid) return null;
                  
                  const pricePerMile = bid.bidPrice / load.distance;
                  const isProfitable = pricePerMile >= 1.5;
                  const suggestedMin = Math.round(load.distance * 1.5);
                  const suggestedIdeal = Math.round(load.distance * 2.0);
                  
                  const statusColors = {
                    pending: "bg-stone-100 text-stone-600",
                    sent: "bg-amber-100 text-amber-700",
                    negotiating: "bg-orange-100 text-orange-700",
                    accepted: "bg-emerald-100 text-emerald-700"
                  };

                  const statusLabels = {
                    pending: "Pending",
                    sent: "Bid Sent",
                    negotiating: "Negotiating",
                    accepted: "Accepted"
                  };
                  
                  return (
                    <div
                      key={load.id}
                      className="bg-white rounded-2xl border border-stone-100 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-stone-800">
                            {load.vehicle.make} {load.vehicle.model}
                          </p>
                          <p className="text-xs text-stone-500">
                            {load.pickup.city} → {load.delivery.city} • {load.distance} mi
                          </p>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold",
                          statusColors[bid.status]
                        )}>
                          {statusLabels[bid.status]}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stone-400">Your Offer</label>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded",
                              isProfitable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              ${pricePerMile.toFixed(2)}/mi
                            </span>
                          </div>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <Input
                              type="number"
                              value={bid.bidPrice}
                              onChange={(e) => handleUpdateBidPrice(load.id, Number(e.target.value))}
                              disabled={bid.status !== "pending"}
                              className="pl-9 h-10 rounded-xl text-lg font-semibold"
                            />
                          </div>
                          {bid.status === "pending" && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBidPrice(load.id, suggestedMin)}
                                className="h-7 px-2 text-xs rounded-lg"
                              >
                                Min ${suggestedMin}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBidPrice(load.id, suggestedIdeal)}
                                className="h-7 px-2 text-xs rounded-lg border-emerald-200 text-emerald-600"
                              >
                                Ideal ${suggestedIdeal}
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <label className="text-xs text-stone-400 mb-1 block">Listed Price</label>
                          <p className="text-lg font-bold text-stone-600">{formatCurrency(load.price)}</p>
                          <p className="text-[10px] text-stone-400">${(load.price / load.distance).toFixed(2)}/mi</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Accepted */}
          {step === "accepted" && (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center mb-4 animate-bounce">
                  <Check className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">All Loads Accepted!</h2>
                <p className="text-stone-500 mt-2">Your route is ready. Start your pickups.</p>
              </div>

              {/* Final Route Map */}
              <div className="rounded-2xl overflow-hidden border border-emerald-200 h-48">
                <MultiLoadRouteMap
                  loads={selectedLoads}
                  className="h-full"
                  showOptimizedRoute={true}
                />
              </div>

              {/* Final Route Summary */}
              <div className="space-y-3">
                {selectedLoads.map((load, index) => (
                  <div
                    key={load.id}
                    className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-stone-800">
                          {load.vehicle.year} {load.vehicle.make} {load.vehicle.model}
                        </p>
                        <p className="text-sm text-stone-500">
                          {load.pickup.city} → {load.delivery.city}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-emerald-600">{formatCurrency(load.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Total Route Earnings</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalEarnings)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Total Distance</p>
                    <p className="text-2xl font-bold">{optimizedTotalDistance.toLocaleString()} mi</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-stone-100 space-y-3">
          {step === "setup" && (
            <>
              {selectedLoads.length > 0 ? (
                <Button
                  onClick={handleProceedToProposals}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white shadow-lg"
                >
                  Continue to Proposals
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-stone-400">Add loads from Available tab to continue</p>
                </div>
              )}
            </>
          )}

          {step === "proposals" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("setup")}
                className="flex-1 h-11 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleProceedToBids}
                disabled={selectedLoads.length === 0}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white"
              >
                Continue to Bids
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === "bids" && (
            <div className="space-y-3">
              <Button
                onClick={handleAcceptAllAndStart}
                disabled={isProcessing || bids.some(b => b.status === "pending")}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Accept All & Start Pickup
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("proposals")}
                className="w-full h-10 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Proposals
              </Button>
            </div>
          )}

          {step === "accepted" && (
            <Button
              onClick={handleReset}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Pickup
            </Button>
          )}
        </div>
      </SheetContent>

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-800">Submit Bid</DialogTitle>
            <DialogDescription className="text-stone-500">
              {selectedBidLoad && (
                <>
                  Make an offer for {selectedBidLoad.vehicle.year} {selectedBidLoad.vehicle.make} {selectedBidLoad.vehicle.model}
                  <br />
                  <span className="text-stone-400">
                    {selectedBidLoad.pickup.city} → {selectedBidLoad.delivery.city}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-stone-500">Listed Price:</span>
              <span className="font-bold text-lg text-stone-700">
                {selectedBidLoad && formatCurrency(selectedBidLoad.price)}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Your Bid</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-lg font-semibold"
                  placeholder="Enter your bid"
                />
              </div>
              {selectedBidLoad && (
                <p className="text-xs text-stone-400">
                  Suggested: {formatCurrency(Math.round(selectedBidLoad.distance * 1.8))} (${(1.8).toFixed(2)}/mi)
                </p>
              )}
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
                onClick={handleSubmitBidFromDialog}
                disabled={!bidAmount}
                className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Bid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};
