import { useState, useRef, useEffect } from "react";
import { ScanBarcode, Check, X, AlertCircle, Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VinScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedVin: string;
  vehicleInfo: string;
  onScanSuccess: () => void;
}

type ScanState = "waiting" | "scanning" | "success" | "error";

export default function VinScannerModal({
  open,
  onOpenChange,
  expectedVin,
  vehicleInfo,
  onScanSuccess,
}: VinScannerModalProps) {
  const [scanState, setScanState] = useState<ScanState>("waiting");
  const [scannedVin, setScannedVin] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setScanState("waiting");
      setScannedVin("");
      setShowManualInput(false);
      // Focus the hidden input to capture scanner input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Focus manual input when shown
  useEffect(() => {
    if (showManualInput) {
      setTimeout(() => manualInputRef.current?.focus(), 100);
    }
  }, [showManualInput]);

  const handleScannerInput = (value: string) => {
    setScannedVin(value);
    setScanState("scanning");

    // VINs are typically 17 characters
    if (value.length >= 17) {
      const trimmedValue = value.trim().toUpperCase().slice(0, 17);
      const expectedTrimmed = expectedVin.trim().toUpperCase();

      if (trimmedValue === expectedTrimmed) {
        setScanState("success");
        setTimeout(() => {
          onScanSuccess();
          onOpenChange(false);
        }, 1500);
      } else {
        setScanState("error");
      }
    }
  };

  const handleManualSubmit = () => {
    const trimmedValue = scannedVin.trim().toUpperCase();
    const expectedTrimmed = expectedVin.trim().toUpperCase();

    if (trimmedValue === expectedTrimmed) {
      setScanState("success");
      setTimeout(() => {
        onScanSuccess();
        onOpenChange(false);
      }, 1500);
    } else {
      setScanState("error");
    }
  };

  const handleRetry = () => {
    setScanState("waiting");
    setScannedVin("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-primary" />
            VIN Scanner - Delivery Confirmation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vehicle Info */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Vehicle</p>
            <p className="font-semibold text-foreground">{vehicleInfo}</p>
            <p className="text-xs text-muted-foreground mt-2">Expected VIN</p>
            <p className="font-mono text-sm text-primary">{expectedVin}</p>
          </div>

          {/* Scanner Area */}
          <div
            className={cn(
              "relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300",
              scanState === "waiting" && "border-primary/50 bg-primary/5",
              scanState === "scanning" && "border-amber-500/50 bg-amber-50/50",
              scanState === "success" && "border-teal-500 bg-teal-50",
              scanState === "error" && "border-red-500 bg-red-50"
            )}
          >
            {/* Hidden input for barcode scanner */}
            <input
              ref={inputRef}
              type="text"
              value={scannedVin}
              onChange={(e) => handleScannerInput(e.target.value)}
              className="absolute opacity-0 w-0 h-0"
              autoFocus
            />

            <div className="flex flex-col items-center justify-center text-center">
              {scanState === "waiting" && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                    <ScanBarcode className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    Ready to Scan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Point your barcode scanner at the vehicle's VIN
                  </p>
                </>
              )}

              {scanState === "scanning" && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                    <ScanBarcode className="w-8 h-8 text-amber-600 animate-pulse" />
                  </div>
                  <p className="text-lg font-semibold text-amber-700 mb-1">
                    Scanning...
                  </p>
                  <p className="font-mono text-sm text-amber-600">
                    {scannedVin}
                  </p>
                </>
              )}

              {scanState === "success" && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-teal-600" />
                  </div>
                  <p className="text-lg font-semibold text-teal-700 mb-1">
                    VIN Verified!
                  </p>
                  <p className="text-sm text-teal-600">
                    Marking as delivered...
                  </p>
                </>
              )}

              {scanState === "error" && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-lg font-semibold text-red-700 mb-1">
                    VIN Mismatch
                  </p>
                  <p className="text-sm text-red-600 mb-1">
                    Scanned: <span className="font-mono">{scannedVin.slice(0, 17)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    The scanned VIN doesn't match this vehicle
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Manual Input Toggle */}
          {!showManualInput && scanState !== "success" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowManualInput(true)}
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Enter VIN Manually
            </Button>
          )}

          {/* Manual Input */}
          {showManualInput && scanState !== "success" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  ref={manualInputRef}
                  placeholder="Enter VIN (17 characters)"
                  value={scannedVin}
                  onChange={(e) => setScannedVin(e.target.value.toUpperCase())}
                  maxLength={17}
                  className="font-mono"
                />
                <Button onClick={handleManualSubmit} disabled={scannedVin.length < 17}>
                  Verify
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {scannedVin.length}/17 characters
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {scanState === "error" && (
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
