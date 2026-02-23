import { useState, useEffect, useRef } from "react";
import { Truck, Clock, CheckCircle, XCircle, Loader2, MapPin, DollarSign, Users, AlertCircle, Search, Zap, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAutoMatching } from "@/hooks/useAutoMatching";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import CancelReasonModal from "./CancelReasonModal";
import DriverMapView from "./DriverMapView";

interface AutoMatchingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  initialPrice: number;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

type Step = 'config' | 'searching' | 'waiting' | 'negotiating' | 'complete' | 'failed';

const AutoMatchingModal = ({ 
  open, 
  onOpenChange, 
  leadId, 
  initialPrice,
  pickupLatitude = 36.29,
  pickupLongitude = 6.73,
  deliveryLatitude,
  deliveryLongitude,
}: AutoMatchingModalProps) => {
  const { toast } = useToast();
  const { matchingStatus, timeLeft, startMatching, cancelMatching } = useAutoMatching(leadId);
  const { negotiations, startNegotiation, respondToOffer } = useNegotiations(leadId);
  
  const [step, setStep] = useState<Step>('config');
  const [offerAmount, setOfferAmount] = useState(initialPrice.toString());
  const [counterAmount, setCounterAmount] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewTab, setViewTab] = useState<"info" | "map">("info");
  const negotiationStartedForRef = useRef<string | null>(null);

  // Find active/accepted negotiation
  const activeNegotiation = negotiations.find((n: any) => n.status === 'negotiating');
  const acceptedNegotiation = negotiations.find((n: any) => n.status === 'accepted');
  
  // Check if courier has sent an offer that shipper needs to respond to
  const latestOfferFromCourier = activeNegotiation?.offers
    ?.filter((o: any) => o.offered_by === 'courier')
    ?.sort((a: any, b: any) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
  
  const hasCourierOffer = !!latestOfferFromCourier;
  const isShipperTurn = hasCourierOffer && latestOfferFromCourier?.response === 'pending';

  // Update step based on matching status
  useEffect(() => {
    if (acceptedNegotiation) {
      setStep('complete');
    } else if (activeNegotiation && isShipperTurn) {
      // Only show negotiating screen when courier has sent an offer
      setStep('negotiating');
    } else if (activeNegotiation && !isShipperTurn) {
      // Waiting for courier to respond to our offer
      setStep('waiting');
    } else if (matchingStatus.status === 'searching') {
      setStep('searching');
    } else if (matchingStatus.status === 'pending_response') {
      setStep('waiting');
    } else if (matchingStatus.status === 'failed') {
      setStep('failed');
    } else if (matchingStatus.status === 'negotiating') {
      // Driver accepted, start negotiation process
      setStep('waiting');
    }
  }, [matchingStatus.status, activeNegotiation, acceptedNegotiation, isShipperTurn]);

  // Auto-start negotiation when driver accepts
  useEffect(() => {
    if (!open) return;
    if (!leadId) return;
    if (matchingStatus.status !== 'negotiating') return;
    if (!matchingStatus.currentCourier) return;
    if (activeNegotiation || acceptedNegotiation) return;

    const key =
      matchingStatus.matchingRequestId ??
      matchingStatus.notificationId ??
      `${leadId}-${matchingStatus.currentCourier.id}`;

    if (negotiationStartedForRef.current === key) return;
    negotiationStartedForRef.current = key;

    const amount = parseFloat(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    void startNegotiation(matchingStatus.currentCourier.id, amount).then((neg) => {
      if (!neg) negotiationStartedForRef.current = null;
    });
  }, [
    open,
    leadId,
    matchingStatus.status,
    matchingStatus.matchingRequestId,
    matchingStatus.notificationId,
    matchingStatus.currentCourier,
    offerAmount,
    activeNegotiation,
    acceptedNegotiation,
    startNegotiation,
  ]);

  useEffect(() => {
    negotiationStartedForRef.current = null;
  }, [leadId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartMatching = async () => {
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid offer amount.",
        variant: "destructive",
      });
      return;
    }

    await startMatching(amount, pickupLatitude, pickupLongitude);
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (reason: string, details?: string) => {
    setIsCancelling(true);
    try {
      await cancelMatching();
      toast({
        title: "Search Cancelled",
        description: `Reason: ${reason}${details ? ` - ${details}` : ""}`,
      });
      setShowCancelModal(false);
      setStep('config');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeNegotiation) return;
    await respondToOffer(activeNegotiation.id, 'accepted');
    toast({
      title: "Offer Accepted",
      description: "The shipment has been booked!",
    });
  };

  const handleDeclineOffer = async () => {
    if (!activeNegotiation) return;
    await respondToOffer(activeNegotiation.id, 'declined');
    toast({
      title: "Offer Declined",
      description: "Looking for next driver...",
    });
    setStep('searching');
  };

  const handleCounterOffer = async () => {
    if (!activeNegotiation || !counterAmount) return;
    
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid counter amount.",
        variant: "destructive",
      });
      return;
    }

    await respondToOffer(activeNegotiation.id, 'countered', amount);
    setCounterAmount("");
    toast({
      title: "Counter Offer Sent",
      description: `Counter offer of $${amount.toLocaleString()} sent`,
    });
  };

  const timerProgress = timeLeft !== null ? (timeLeft / 120) * 100 : 100;
  const latestOffer = activeNegotiation?.offers?.sort(
    (a: any, b: any) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
  )[0];
  const isWaitingForCourier = latestOffer?.offered_by === 'shipper' && latestOffer?.response === 'pending';
  const isWaitingForShipper = latestOffer?.offered_by === 'courier' && latestOffer?.response === 'pending';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-primary" />
              {step === 'config' && 'Auto-Match Driver'}
              {step === 'searching' && 'Finding Drivers...'}
              {step === 'waiting' && 'Driver Notified'}
              {step === 'negotiating' && 'Price Negotiation'}
              {step === 'complete' && 'Booking Complete'}
              {step === 'failed' && 'No Drivers Available'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Configuration */}
          {step === 'config' && (
            <div className="space-y-6">
              <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as "info" | "map")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info" className="gap-2">
                    <Users className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-2">
                    <Map className="h-4 w-4" />
                    Nearby Drivers
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Search radius: <strong>50km</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Response timeout: <strong>2 minutes</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Max negotiations: <strong>3 counters</strong></span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autoOfferAmount">Your Offer Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="autoOfferAmount"
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        className="pl-9"
                        placeholder="Enter your offer"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Drivers will be notified in order of proximity
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="map" className="mt-4">
                  <DriverMapView
                    pickupLatitude={pickupLatitude}
                    pickupLongitude={pickupLongitude}
                    deliveryLatitude={deliveryLatitude}
                    deliveryLongitude={deliveryLongitude}
                    className="h-[300px]"
                  />
                </TabsContent>
              </Tabs>

              <Button onClick={handleStartMatching} className="w-full gap-2">
                <Search className="h-4 w-4" />
                Find Closest Driver
              </Button>
            </div>
          )}

          {/* Step 2: Searching */}
          {step === 'searching' && (
            <div className="space-y-6">
              <div className="py-8 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
                  <div className="absolute inset-2 border-4 border-primary/40 rounded-full animate-ping animation-delay-150" />
                  <div className="absolute inset-4 flex items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg">Searching for drivers...</p>
                  <p className="text-sm text-muted-foreground">Finding the closest available driver</p>
                </div>
              </div>
              
              <DriverMapView
                pickupLatitude={pickupLatitude}
                pickupLongitude={pickupLongitude}
                className="h-[200px]"
              />
              
              <Button variant="outline" onClick={handleCancelClick} className="w-full">
                Cancel Search
              </Button>
            </div>
          )}

          {/* Step 3: Waiting for driver response */}
          {step === 'waiting' && (matchingStatus.currentCourier || activeNegotiation?.courier) && (
            <div className="space-y-6">
              {/* Timer - only show when waiting for initial response */}
              {!activeNegotiation && timeLeft !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time remaining</span>
                    <span className={cn(
                      "font-mono font-bold text-lg",
                      timeLeft < 30 ? "text-destructive" : "text-primary"
                    )}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <Progress value={timerProgress} className={cn(
                    "h-2",
                    timeLeft < 30 && "[&>div]:bg-destructive"
                  )} />
                </div>
              )}

              {/* Map with current driver highlighted */}
              <DriverMapView
                pickupLatitude={pickupLatitude}
                pickupLongitude={pickupLongitude}
                selectedDriverId={activeNegotiation?.courier_id || matchingStatus.currentCourier?.id}
                className="h-[200px]"
              />

              {/* Current Driver */}
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {activeNegotiation 
                      ? `Waiting for courier's offer (Counter ${activeNegotiation.counter_count || 0}/3)`
                      : "Waiting for response"
                    }
                  </Badge>
                  {!activeNegotiation && matchingStatus.driversRemaining > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{matchingStatus.driversRemaining} drivers available
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {activeNegotiation?.courier?.name || matchingStatus.currentCourier?.name}
                    </p>
                    {matchingStatus.currentCourier?.distance && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {matchingStatus.currentCourier.distance < 1000 
                          ? `${matchingStatus.currentCourier.distance}m away`
                          : `${(matchingStatus.currentCourier.distance / 1000).toFixed(1)}km away`
                        }
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Your Offer</p>
                    <p className="font-bold text-primary">
                      ${activeNegotiation?.current_offer?.toLocaleString() || parseFloat(offerAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Show offer history if in negotiation */}
              {activeNegotiation?.offers && activeNegotiation.offers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Offer History</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {activeNegotiation.offers
                      .sort((a: any, b: any) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
                      .map((offer: any) => (
                        <div
                          key={offer.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded text-sm",
                            offer.offered_by === 'shipper' ? "bg-primary/5" : "bg-muted"
                          )}
                        >
                          <span className="capitalize text-xs">{offer.offered_by === 'shipper' ? 'You' : 'Courier'}</span>
                          <span className="font-semibold">${offer.amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground">
                {activeNegotiation 
                  ? "Waiting for the courier to respond with their price..."
                  : "If no response, we'll automatically notify the next closest driver"
                }
              </p>

              <Button variant="outline" onClick={handleCancelClick} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {/* Step 4: Negotiating */}
          {step === 'negotiating' && activeNegotiation && (
            <div className="space-y-6">
              {/* Current Offer */}
              <div className="text-center py-6 border rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">Current Offer</p>
                <p className="text-4xl font-bold text-primary">
                  ${activeNegotiation.current_offer?.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Counter #{activeNegotiation.counter_count || 0} of 3
                </p>
              </div>

              {/* Courier Info */}
              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="font-medium">{activeNegotiation.courier?.name}</span>
                </div>
                <Badge variant={isWaitingForCourier ? "secondary" : "default"}>
                  {isWaitingForCourier ? "Waiting for driver" : "Your turn"}
                </Badge>
              </div>

              {/* Offer History */}
              {activeNegotiation.offers && activeNegotiation.offers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">History</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {activeNegotiation.offers
                      .sort((a: any, b: any) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
                      .map((offer: any) => (
                        <div
                          key={offer.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded text-sm",
                            offer.offered_by === 'shipper' ? "bg-primary/5" : "bg-muted"
                          )}
                        >
                          <span className="capitalize text-xs">{offer.offered_by}</span>
                          <span className="font-semibold">${offer.amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {isWaitingForShipper && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleAcceptOffer} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button onClick={handleDeclineOffer} variant="destructive" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Next Driver
                    </Button>
                  </div>
                  
                  {(activeNegotiation.counter_count || 0) < 3 && (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={counterAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCounterAmount(e.target.value)}
                          placeholder="Counter offer"
                          className="pl-9"
                        />
                      </div>
                      <Button onClick={handleCounterOffer} variant="outline">
                        Counter
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {isWaitingForCourier && (
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Waiting for driver response...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Complete - Show route */}
          {step === 'complete' && acceptedNegotiation && (
            <div className="space-y-6">
              <div className="text-center py-4 space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Driver Matched!</h3>
                  <p className="text-muted-foreground">
                    {acceptedNegotiation.courier?.name} accepted your shipment
                  </p>
                </div>
              </div>

              {/* Route Map */}
              {deliveryLatitude && deliveryLongitude && (
                <DriverMapView
                  pickupLatitude={pickupLatitude}
                  pickupLongitude={pickupLongitude}
                  deliveryLatitude={deliveryLatitude}
                  deliveryLongitude={deliveryLongitude}
                  showRoute={true}
                  className="h-[250px]"
                />
              )}

              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Final Price</p>
                <p className="text-3xl font-bold text-primary">
                  ${acceptedNegotiation.current_offer?.toLocaleString()}
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            </div>
          )}

          {/* Step 6: Failed */}
          {step === 'failed' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No Drivers Found</h3>
                <p className="text-muted-foreground mt-1">
                  {matchingStatus.error || "No available drivers in your area"}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={() => setStep('config')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Reason Modal */}
      <CancelReasonModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
    </>
  );
};

export default AutoMatchingModal;
