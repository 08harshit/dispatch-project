import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, CheckCircle, Loader2, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface VinScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVinScanned: (vin: string) => void;
  existingVin?: string;
  mode?: "bol" | "invoice";
}

export const VinScannerDialog = ({
  open,
  onOpenChange,
  onVinScanned,
  existingVin,
  mode = "bol",
}: VinScannerDialogProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualVin, setManualVin] = useState(existingVin || "");
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "vin-scanner-container";

  useEffect(() => {
    if (existingVin) {
      setManualVin(existingVin);
    }
  }, [existingVin]);

  const startScanning = async () => {
    setScanError(null);
    setIsScanning(true);

    try {
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 100 },
        },
        (decodedText) => {
          // VIN detected
          const cleanedVin = decodedText.replace(/[^A-HJ-NPR-Z0-9]/gi, "").toUpperCase();
          if (cleanedVin.length === 17) {
            setManualVin(cleanedVin);
            stopScanning();
          }
        },
        () => {
          // Ignore scanning errors (no QR found)
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setScanError("Could not access camera. Please enter VIN manually.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    const cleanedVin = manualVin.replace(/[^A-HJ-NPR-Z0-9]/gi, "").toUpperCase();
    if (cleanedVin.length === 17) {
      onVinScanned(cleanedVin);
      handleClose();
    } else {
      setScanError("Invalid VIN. Must be 17 characters.");
    }
  };

  const isValidVin = manualVin.replace(/[^A-HJ-NPR-Z0-9]/gi, "").length === 17;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-amber-500" />
            {mode === "invoice" ? "Enter VIN for Invoice" : "Scan VIN Number"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner Container */}
          <div
            id={scannerContainerId}
            className={`relative rounded-xl overflow-hidden bg-stone-900 ${
              isScanning ? "h-48" : "h-0"
            } transition-all duration-300`}
          />

          {/* Scanner Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button
                onClick={startScanning}
                variant="outline"
                className="flex-1 gap-2 border-amber-200 hover:bg-amber-50"
              >
                <Camera className="h-4 w-4" />
                Start Camera Scan
              </Button>
            ) : (
              <Button
                onClick={stopScanning}
                variant="outline"
                className="flex-1 gap-2 border-rose-200 hover:bg-rose-50 text-rose-600"
              >
                <X className="h-4 w-4" />
                Stop Scanning
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-stone-500">or enter manually</span>
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Input
              value={manualVin}
              onChange={(e) => {
                setManualVin(e.target.value.toUpperCase());
                setScanError(null);
              }}
              placeholder="Enter 17-character VIN"
              className="font-mono text-center text-lg tracking-wider"
              maxLength={17}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={manualVin.length === 17 ? "text-emerald-600 font-medium" : "text-stone-400"}>
                {manualVin.length}/17 characters
              </span>
              {isValidVin && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  Valid VIN
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {scanError && (
            <p className="text-sm text-rose-600 text-center">{scanError}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValidVin}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {mode === "invoice" ? "Confirm & Generate Invoice" : "Confirm & Generate BOL"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
