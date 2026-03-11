import { useState, useEffect } from "react";
import { Users, DollarSign, Send, Clock, CheckCircle, XCircle, ArrowLeftRight, Loader2, MapPin, Truck, Phone, Mail, Search, ShieldCheck, ShieldX, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useCouriers, Courier } from "@/hooks/useCouriers";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as matchingService from "@/services/matchingService";

interface CourierMatchingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  initialPrice: number;
}

type Step = 'select' | 'negotiate' | 'complete';

type VerificationResult = {
  type: 'verified' | 'not_in_database' | 'not_in_fmcsa' | 'not_authorized' | 'error';
  message: string;
  courier?: Courier;
  fmcsaData?: {
    legalName: string;
    operatingStatus: string;
  };
};

const CourierMatchingModal = ({ open, onOpenChange, leadId, initialPrice }: CourierMatchingModalProps) => {
  const { toast } = useToast();
  const { couriers, loading: couriersLoading, refetch } = useCouriers(true);
  const { negotiations, loading: negotiationsLoading, startNegotiation, respondToOffer } = useNegotiations(leadId);
  
  const [step, setStep] = useState<Step>('select');
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [offerAmount, setOfferAmount] = useState(initialPrice.toString());
  const [counterAmount, setCounterAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // Search and verification state
  const [searchQuery, setSearchQuery] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  // Find active negotiation
  const activeNegotiation = negotiations.find(n => n.status === 'negotiating');
  const acceptedNegotiation = negotiations.find(n => n.status === 'accepted');

  // Filter couriers based on search
  const filteredCouriers = couriers.filter(courier => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      courier.name.toLowerCase().includes(query) ||
      courier.email.toLowerCase().includes(query) ||
      courier.dot_number?.toLowerCase().includes(query) ||
      courier.mc_number?.toLowerCase().includes(query) ||
      courier.legal_name?.toLowerCase().includes(query)
    );
  });

  // Timer for response deadline
  useEffect(() => {
    if (!activeNegotiation?.courier_response_deadline && !activeNegotiation?.shipper_response_deadline) {
      setTimeLeft(null);
      return;
    }

    const deadline = activeNegotiation.shipper_response_deadline || activeNegotiation.courier_response_deadline;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(deadline!).getTime() - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeNegotiation]);

  // Update step based on negotiation state
  useEffect(() => {
    if (acceptedNegotiation) {
      setStep('complete');
    } else if (activeNegotiation) {
      setStep('negotiate');
      const courier = couriers.find(c => c.id === activeNegotiation.courier_id);
      if (courier) setSelectedCourier(courier);
    } else {
      setStep('select');
    }
  }, [activeNegotiation, acceptedNegotiation, couriers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectCourier = async (courier: Courier) => {
    setIsVerifying(true);
    setSelectedCourier(courier);
    
    try {
      // If courier has a DOT number, verify with FMCSA
      if (courier.dot_number) {
        const data = await matchingService.verifyCarrier({
          dotNumber: courier.dot_number,
          courierId: courier.id,
        }) as { status?: string; verified?: boolean; carrier?: { legalName?: string; operatingStatus?: string } };

        if (!data || (data as { error?: string }).error) {
          setVerificationResult({
            type: 'error',
            message: 'Failed to verify carrier. Please try again.',
          });
          setShowVerificationDialog(true);
          setSelectedCourier(null);
          return;
        }

        if (data.status === 'not_found') {
          setVerificationResult({
            type: 'not_in_fmcsa',
            message: `Courier "${courier.name}" (DOT: ${courier.dot_number}) was not found in the FMCSA database. This carrier may not be legally authorized to transport vehicles.`,
            courier,
          });
          setShowVerificationDialog(true);
          setSelectedCourier(null);
          return;
        }

        if (!data.verified) {
          setVerificationResult({
            type: 'not_authorized',
            message: `Courier "${courier.name}" has operating status: "${data.carrier?.operatingStatus}". This carrier is NOT authorized to transport vehicles.`,
            courier,
            fmcsaData: data.carrier,
          });
          setShowVerificationDialog(true);
          setSelectedCourier(null);
          return;
        }

        // Verified successfully
        setVerificationResult({
          type: 'verified',
          message: `Courier "${courier.name}" is verified and authorized. Legal Name: ${data.carrier?.legalName}, Status: ${data.carrier?.operatingStatus}`,
          courier,
          fmcsaData: data.carrier,
        });
        setShowVerificationDialog(true);
        await refetch();
      } else {
        // No DOT number - warn user
        setVerificationResult({
          type: 'not_in_fmcsa',
          message: `Courier "${courier.name}" does not have a DOT number on file. Cannot verify FMCSA authorization.`,
          courier,
        });
        setShowVerificationDialog(true);
        setSelectedCourier(null);
      }
    } catch (err) {
      setVerificationResult({
        type: 'error',
        message: 'An error occurred during verification.',
      });
      setShowVerificationDialog(true);
      setSelectedCourier(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;

    // Check if any courier matches exactly
    const exactMatch = couriers.find(c => 
      c.name.toLowerCase() === searchQuery.toLowerCase() ||
      c.dot_number === searchQuery ||
      c.mc_number === searchQuery
    );

    if (exactMatch) {
      await handleSelectCourier(exactMatch);
    } else if (filteredCouriers.length === 0) {
      // No match in database
      setVerificationResult({
        type: 'not_in_database',
        message: `No courier found matching "${searchQuery}" in the database. Please check the name, DOT number, or MC number and try again.`,
      });
      setShowVerificationDialog(true);
    }
  };

  const handleSendOffer = async () => {
    if (!selectedCourier || !offerAmount) return;
    
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid offer amount.",
        variant: "destructive",
      });
      return;
    }

    const negotiation = await startNegotiation(selectedCourier.id, amount);
    if (negotiation) {
      toast({
        title: "Offer Sent",
        description: `Sent $${amount.toLocaleString()} offer to ${selectedCourier.name}`,
      });
      setStep('negotiate');
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeNegotiation) return;
    await respondToOffer(activeNegotiation.id, 'accepted');
    toast({
      title: "Offer Accepted",
      description: "The shipment has been booked successfully!",
    });
  };

  const handleDeclineOffer = async () => {
    if (!activeNegotiation) return;
    await respondToOffer(activeNegotiation.id, 'declined');
    toast({
      title: "Offer Declined",
      description: "Looking for other couriers...",
    });
    setSelectedCourier(null);
    setStep('select');
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

  const latestOffer = activeNegotiation?.offers?.sort(
    (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
  )[0];

  const isWaitingForCourier = latestOffer?.offered_by === 'shipper' && latestOffer?.response === 'pending';
  const isWaitingForShipper = latestOffer?.offered_by === 'courier' && latestOffer?.response === 'pending';

  const getVerificationIcon = () => {
    switch (verificationResult?.type) {
      case 'verified':
        return <ShieldCheck className="h-12 w-12 text-green-500" />;
      case 'not_in_database':
        return <AlertTriangle className="h-12 w-12 text-amber-500" />;
      case 'not_in_fmcsa':
        return <ShieldX className="h-12 w-12 text-destructive" />;
      case 'not_authorized':
        return <ShieldAlert className="h-12 w-12 text-destructive" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-destructive" />;
    }
  };

  const getVerificationTitle = () => {
    switch (verificationResult?.type) {
      case 'verified':
        return 'Carrier Verified ✓';
      case 'not_in_database':
        return 'Courier Not Found';
      case 'not_in_fmcsa':
        return 'Not Found in FMCSA';
      case 'not_authorized':
        return 'Authorization Invalid';
      default:
        return 'Verification Error';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              {step === 'select' && 'Select Courier'}
              {step === 'negotiate' && 'Negotiation in Progress'}
              {step === 'complete' && 'Booking Complete'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Select Courier */}
          {step === 'select' && (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Search for a courier by name, DOT number, or MC number. We'll verify their FMCSA status before proceeding.
              </p>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Search by name, DOT, or MC number..."
                    className="pl-9"
                  />
                </div>
                <Button 
                  onClick={handleSearchSubmit}
                  variant="secondary"
                  disabled={!searchQuery.trim()}
                >
                  Search
                </Button>
              </div>

              {couriersLoading || isVerifying ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  {isVerifying && <span className="ml-2 text-muted-foreground">Verifying carrier...</span>}
                </div>
              ) : filteredCouriers.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No couriers match your search' : 'No couriers available'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                  {filteredCouriers.map((courier) => (
                    <div
                      key={courier.id}
                      onClick={() => handleSelectCourier(courier)}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedCourier?.id === courier.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{courier.name}</h4>
                            {courier.verification_status === 'verified' && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {courier.verification_status === 'flagged' && (
                              <Badge variant="destructive" className="text-xs">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {courier.available_capacity} slots
                            </Badge>
                          </div>
                          {courier.legal_name && (
                            <p className="text-sm text-muted-foreground">
                              Legal: {courier.legal_name}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {courier.dot_number && (
                              <span className="font-mono">DOT: {courier.dot_number}</span>
                            )}
                            {courier.mc_number && (
                              <span className="font-mono">MC: {courier.mc_number}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {courier.email}
                            </span>
                            {courier.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {courier.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedCourier?.id === courier.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCourier && verificationResult?.type === 'verified' && (
                <div className="pt-4 border-t space-y-4">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      Carrier verified and authorized to transport
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerAmount">Initial Offer Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="offerAmount"
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        className="pl-9"
                        placeholder="Enter offer amount"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSendOffer} className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Send Offer to {selectedCourier.name}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Negotiation */}
          {step === 'negotiate' && activeNegotiation && (
            <div className="space-y-6">
              {/* Timer */}
              {timeLeft !== null && (
                <div className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg",
                  timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  <Clock className="h-5 w-5" />
                  <span className="font-mono font-semibold text-lg">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm">remaining to respond</span>
                </div>
              )}

              {/* Courier Info */}
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Negotiating with</p>
                    <p className="font-semibold">{selectedCourier?.name}</p>
                  </div>
                  <Badge variant={isWaitingForCourier ? "secondary" : "default"}>
                    {isWaitingForCourier ? "Waiting for Courier" : "Your Turn"}
                  </Badge>
                </div>
              </div>

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

              {/* Offer History */}
              {activeNegotiation.offers && activeNegotiation.offers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Offer History</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {activeNegotiation.offers
                      .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
                      .map((offer, idx) => (
                        <div
                          key={offer.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg text-sm",
                            offer.offered_by === 'shipper' ? "bg-primary/5" : "bg-muted"
                          )}
                        >
                          <span className="capitalize">{offer.offered_by}</span>
                          <span className="font-semibold">${offer.amount.toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {offer.response || 'pending'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {isWaitingForShipper && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleAcceptOffer} className="gap-2" variant="default">
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button onClick={handleDeclineOffer} className="gap-2" variant="destructive">
                      <XCircle className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        placeholder="Counter offer"
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      onClick={handleCounterOffer} 
                      variant="outline"
                      disabled={!counterAmount || (activeNegotiation.counter_count || 0) >= 3}
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Counter
                    </Button>
                  </div>
                </div>
              )}

              {isWaitingForCourier && (
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Waiting for courier response...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && acceptedNegotiation && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Booking Confirmed!</h3>
                <p className="text-muted-foreground mt-1">
                  The shipment has been booked with {selectedCourier?.name}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Final Price</p>
                <p className="text-3xl font-bold text-primary">
                  ${acceptedNegotiation.current_offer?.toLocaleString()}
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)} className="mt-4">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Result Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-4">
              {getVerificationIcon()}
              <AlertDialogTitle className="text-center">
                {getVerificationTitle()}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-center pt-2">
              {verificationResult?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => {
              setShowVerificationDialog(false);
              if (verificationResult?.type !== 'verified') {
                setSelectedCourier(null);
              }
            }}>
              {verificationResult?.type === 'verified' ? 'Continue' : 'Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CourierMatchingModal;
