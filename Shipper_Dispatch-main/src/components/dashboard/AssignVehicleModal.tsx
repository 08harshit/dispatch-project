import { useState, useEffect, useRef } from "react";
import { Vehicle } from "@/components/dashboard/VehicleTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Search, Shield, ShieldAlert, ShieldQuestion, Loader2, CheckCircle, AlertTriangle, XCircle, Phone, Mail, ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCouriers, Courier } from "@/hooks/useCouriers";
import { cn } from "@/lib/utils";

interface AssignVehicleModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VerificationResultType = 'verified' | 'not_in_database' | 'not_in_fmcsa' | 'not_authorized' | 'error';

interface VerificationResult {
  type: VerificationResultType;
  message: string;
  courier?: Courier;
  fmcsaData?: {
    legalName: string;
    operatingStatus: string;
  };
}

const AssignVehicleModal = ({ vehicle, open, onOpenChange }: AssignVehicleModalProps) => {
  const { toast } = useToast();
  const { couriers, loading: couriersLoading, refetch } = useCouriers(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCouriers, setFilteredCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  // Filter couriers based on search
  // Filter couriers based on search
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      const query = trimmedQuery.toLowerCase();
      const filtered = couriers.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.legal_name?.toLowerCase().includes(query) ||
        c.dot_number?.toLowerCase().includes(query) ||
        c.mc_number?.toLowerCase().includes(query)
      );
      setFilteredCouriers(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCouriers([]);
      setShowDropdown(false);
    }
  }, [searchQuery, couriers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when modal closes, refetch when it opens
  useEffect(() => {
    if (open) {
      // Refetch couriers to get fresh data
      refetch();
    } else {
      setSearchQuery("");
      setSelectedCourier(null);
      setVerificationResult(null);
      setShowVerificationDialog(false);
    }
  }, [open, refetch]);

  if (!vehicle) return null;

  const handleSelectCourier = async (courier: Courier) => {
    setShowDropdown(false);
    setVerifying(true);

    // Use freshest copy (avoids selecting a stale courier object right after a refetch)
    const activeCourier = couriers.find((c) => c.id === courier.id) ?? courier;
    
    try {
      // If courier has a DOT number, verify with FMCSA
      if (activeCourier.dot_number) {
        const { data, error } = await supabase.functions.invoke('verify-carrier', {
          body: { dotNumber: activeCourier.dot_number, courierId: activeCourier.id }
        });

        if (error) {
          setVerificationResult({
            type: 'error',
            message: 'Failed to verify carrier. Please try again.',
          });
          setShowVerificationDialog(true);
          return;
        }

        if (data.status === 'not_found') {
          setVerificationResult({
            type: 'not_in_fmcsa',
            message: `Courier "${activeCourier.name}" (DOT: ${activeCourier.dot_number}) was not found in the FMCSA database. This carrier may not be legally authorized to transport vehicles.`,
            courier: activeCourier,
          });
          setShowVerificationDialog(true);
          return;
        }

        if (!data.verified) {
          setVerificationResult({
            type: 'not_authorized',
            message: `Courier "${activeCourier.name}" has operating status: "${data.carrier?.operatingStatus}". This carrier is NOT authorized to transport vehicles.`,
            courier: activeCourier,
            fmcsaData: data.carrier,
          });
          setShowVerificationDialog(true);
          return;
        }

        // Verified successfully
        setVerificationResult({
          type: 'verified',
          message: `Courier "${activeCourier.name}" is verified and authorized.\n\nLegal Name: ${data.carrier?.legalName}\nStatus: ${data.carrier?.operatingStatus}`,
          courier: activeCourier,
          fmcsaData: data.carrier,
        });
        setSelectedCourier(activeCourier);
        setSearchQuery(activeCourier.name);
        setShowVerificationDialog(true);
        await refetch();
      } else {
        // No DOT number - warn user
        setVerificationResult({
          type: 'not_in_fmcsa',
          message: `Courier "${activeCourier.name}" does not have a DOT number on file. Cannot verify FMCSA authorization.`,
          courier: activeCourier,
        });
        setShowVerificationDialog(true);
      }
    } catch (err) {
      setVerificationResult({
        type: 'error',
        message: 'An error occurred during verification.',
      });
      setShowVerificationDialog(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (couriersLoading) {
      toast({
        title: "Still loading couriers",
        description: "Please wait a moment and try again.",
      });
      return;
    }

    const query = searchQuery.trim();
    if (!query) return;

    // Normalize input (users often paste with trailing spaces)
    if (query !== searchQuery) setSearchQuery(query);

    // Check if any courier matches exactly
    const exactMatch = couriers.find(c => 
      c.name.toLowerCase() === query.toLowerCase() ||
      c.dot_number?.toLowerCase() === query.toLowerCase() ||
      c.mc_number?.toLowerCase() === query.toLowerCase()
    );

    if (exactMatch) {
      await handleSelectCourier(exactMatch);
    } else if (filteredCouriers.length === 1) {
      await handleSelectCourier(filteredCouriers[0]);
    } else if (filteredCouriers.length === 0) {
      // No match in database
      setVerificationResult({
        type: 'not_in_database',
        message: `No courier found matching "${query}" in the database. Please check the name, DOT number, or MC number and try again.`,
      });
      setShowVerificationDialog(true);
    } else {
      setShowDropdown(true);
      toast({
        title: "Multiple matches",
        description: "Please select a courier from the list.",
      });
    }
  };

  const handleAssign = async () => {
    if (!selectedCourier) return;

    toast({
      title: "Driver Assigned",
      description: `${selectedCourier.name} has been assigned to ${vehicle.listingId}.`,
    });
    onOpenChange(false);
  };

  const getVerificationIcon = (status?: string | null) => {
    switch (status) {
      case 'verified':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'flagged':
        return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      case 'not_found':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <ShieldQuestion className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>;
      case 'flagged':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Needs Review</Badge>;
      case 'not_found':
        return <Badge variant="destructive">Not Found</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getDialogIcon = () => {
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

  const getDialogTitle = () => {
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
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Assign Courier</DialogTitle>
                <DialogDescription>
                  Search and verify a carrier for {vehicle.listingId}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Search Section */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <Label htmlFor="courierSearch">Search Courier</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="courierSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Search by name, DOT, or MC number..."
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
                <Button 
                  onClick={handleSearchSubmit}
                  variant="secondary"
                  disabled={!searchQuery.trim() || verifying}
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {/* Dropdown results */}
              {showDropdown && !verifying && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {couriersLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : filteredCouriers.length > 0 ? (
                    filteredCouriers.map((courier) => (
                      <div
                        key={courier.id}
                        onClick={() => handleSelectCourier(courier)}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getVerificationIcon(courier.verification_status)}
                            <span className="font-medium">{courier.name}</span>
                          </div>
                          {getStatusBadge(courier.verification_status)}
                        </div>
                        {courier.legal_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Legal: {courier.legal_name}
                          </p>
                        )}
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {courier.email}
                          </span>
                          {courier.dot_number && (
                            <span className="font-mono">DOT: {courier.dot_number}</span>
                          )}
                          {courier.mc_number && (
                            <span className="font-mono">MC: {courier.mc_number}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                      <p className="text-sm">No couriers found matching "{searchQuery}"</p>
                      <p className="text-xs mt-1">Press Search or Enter to verify</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Verifying indicator */}
            {verifying && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Verifying carrier with FMCSA...</span>
              </div>
            )}

            {/* Selected Courier Display */}
            {selectedCourier && verificationResult?.type === 'verified' && (
              <div className="p-4 rounded-xl border bg-green-50/50 border-green-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Verified Carrier Selected</span>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">{selectedCourier.name}</p>
                  {selectedCourier.legal_name && (
                    <p className="text-sm text-muted-foreground">Legal: {selectedCourier.legal_name}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {selectedCourier.dot_number && (
                      <span className="font-mono">DOT: {selectedCourier.dot_number}</span>
                    )}
                    {selectedCourier.mc_number && (
                      <span className="font-mono">MC: {selectedCourier.mc_number}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCourier.email}
                    </span>
                    {selectedCourier.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedCourier.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedCourier || verificationResult?.type !== 'verified'}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Assign Courier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Result Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-4">
              {getDialogIcon()}
              <AlertDialogTitle className="text-center">
                {getDialogTitle()}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-center pt-2 whitespace-pre-line">
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

export default AssignVehicleModal;
