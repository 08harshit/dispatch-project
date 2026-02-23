import { useState, useRef } from "react";
import { Camera, Image, X, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploadSectionProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const PhotoUploadSection = ({ photos, onChange, maxPhotos = 8 }: PhotoUploadSectionProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const newPhotos: string[] = [];
    const remaining = maxPhotos - photos.length;
    
    Array.from(files).slice(0, remaining).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPhotos.push(url);
      }
    });
    
    onChange([...photos, ...newPhotos]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Camera className="h-4 w-4 text-primary" />
        Damage Photos
        <span className="text-xs text-muted-foreground font-normal">
          ({photos.length}/{maxPhotos})
        </span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border-2 border-border/40 bg-muted/30 group"
          >
            <img
              src={photo}
              alt={`Damage photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-[10px] text-white font-medium">Photo {index + 1}</span>
            </div>
          </div>
        ))}

        {/* Add Photo Button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Add Photo</span>
          </button>
        )}
      </div>

      {/* Upload Area for Empty State */}
      {photos.length === 0 && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            dragActive
              ? "border-primary bg-primary/10"
              : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Drop photos here or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Document any damage to the vehicle
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
};

export default PhotoUploadSection;
