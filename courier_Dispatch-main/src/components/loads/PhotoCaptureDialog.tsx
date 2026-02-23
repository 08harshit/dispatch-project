import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, ImagePlus, Check, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotosConfirmed: (photos: string[]) => void;
  requiredPhotos?: {
    label: string;
    description: string;
  }[];
}

const defaultRequiredPhotos = [
  { label: "Front", description: "Front view of vehicle" },
  { label: "Rear", description: "Rear view of vehicle" },
  { label: "Left Side", description: "Driver side view" },
  { label: "Right Side", description: "Passenger side view" },
  { label: "Interior", description: "Dashboard and seats" },
  { label: "Odometer", description: "Current mileage reading" },
];

export const PhotoCaptureDialog = ({
  open,
  onOpenChange,
  onPhotosConfirmed,
  requiredPhotos = defaultRequiredPhotos,
}: PhotoCaptureDialogProps) => {
  const [photos, setPhotos] = useState<(string | null)[]>(
    new Array(requiredPhotos.length).fill(null)
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (index: number) => {
    setActiveIndex(index);
    setIsCapturing(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      // Fallback to file input
      fileInputRef.current?.click();
      setIsCapturing(false);
      setActiveIndex(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setActiveIndex(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || activeIndex === null) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      
      setPhotos(prev => {
        const updated = [...prev];
        updated[activeIndex] = dataUrl;
        return updated;
      });
    }
    
    stopCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotos(prev => {
        const updated = [...prev];
        updated[index] = reader.result as string;
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const handleConfirm = () => {
    const validPhotos = photos.filter((p): p is string => p !== null);
    onPhotosConfirmed(validPhotos);
    setPhotos(new Array(requiredPhotos.length).fill(null));
    onOpenChange(false);
  };

  const handleClose = () => {
    stopCamera();
    setPhotos(new Array(requiredPhotos.length).fill(null));
    onOpenChange(false);
  };

  const capturedCount = photos.filter(p => p !== null).length;
  const minRequired = Math.ceil(requiredPhotos.length / 2); // At least half required

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-500" />
            Vehicle Condition Photos
          </DialogTitle>
          <DialogDescription>
            Capture photos of the vehicle for the delivery inspection. 
            At least {minRequired} photos required.
          </DialogDescription>
        </DialogHeader>

        {/* Camera Preview */}
        {isCapturing && (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                onClick={stopCamera}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/90 hover:bg-white border-0"
              >
                <X className="h-5 w-5 text-stone-600" />
              </Button>
              <Button
                onClick={capturePhoto}
                size="icon"
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 border-4 border-white shadow-lg"
              >
                <Camera className="h-7 w-7" />
              </Button>
              <Button
                onClick={() => {
                  stopCamera();
                  if (activeIndex !== null) {
                    fileInputRef.current?.click();
                  }
                }}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/90 hover:bg-white border-0"
              >
                <ImagePlus className="h-5 w-5 text-stone-600" />
              </Button>
            </div>
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg text-white text-sm font-medium">
              {activeIndex !== null && requiredPhotos[activeIndex]?.label}
            </div>
          </div>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-3">
          {requiredPhotos.map((photo, index) => (
            <div key={index} className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id={`photo-input-${index}`}
                onChange={(e) => handleFileSelect(e, index)}
              />
              
              {photos[index] ? (
                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-200 bg-emerald-50">
                  <img
                    src={photos[index]!}
                    alt={photo.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startCamera(index)}
                      className="h-7 w-7 rounded-lg bg-white/90 hover:bg-white shadow-sm"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-stone-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removePhoto(index)}
                      className="h-7 w-7 rounded-lg bg-rose-500/90 hover:bg-rose-500 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-white">{photo.label}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startCamera(index)}
                  className={cn(
                    "w-full aspect-square rounded-xl border-2 border-dashed transition-all",
                    "flex flex-col items-center justify-center gap-2 p-2",
                    "border-stone-200 bg-stone-50 hover:border-amber-300 hover:bg-amber-50"
                  )}
                >
                  <Camera className="h-6 w-6 text-stone-400" />
                  <span className="text-xs font-medium text-stone-600 text-center">
                    {photo.label}
                  </span>
                  <span className="text-[10px] text-stone-400 text-center leading-tight">
                    {photo.description}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Hidden file input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (activeIndex !== null) {
              handleFileSelect(e, activeIndex);
            }
          }}
        />

        {/* Progress & Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                style={{ width: `${(capturedCount / requiredPhotos.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-stone-500">
              {capturedCount}/{requiredPhotos.length} photos
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={capturedCount < minRequired}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Confirm Photos ({capturedCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
