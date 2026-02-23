import { useState, useRef } from "react";
import { Upload, FileText, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConditionReportUploadProps {
  onUpload: (file: File) => void;
  existingPdf: File | null;
}

const ConditionReportUpload = ({ onUpload, existingPdf }: ConditionReportUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className={cn(
          "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all",
          isDragging
            ? "bg-primary/20 scale-110"
            : "bg-muted/50"
        )}>
          <Upload className={cn(
            "h-10 w-10 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {isDragging ? "Drop your PDF here" : "Upload Condition Report PDF"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop your PDF file here, or click to browse
        </p>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Browse Files
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Supported format: PDF (max 10MB)
        </p>
      </div>

      {/* Uploaded File Preview */}
      {existingPdf && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{existingPdf.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(existingPdf.size)} • PDF Document
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-600 text-sm">
                <Check className="h-4 w-4" />
                Uploaded
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
        <h4 className="font-medium mb-2 text-sm">Tips for uploading condition reports:</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Ensure the PDF is clear and legible</li>
          <li>• Include all pages of the inspection report</li>
          <li>• Photos embedded in the PDF will be preserved</li>
          <li>• Make sure the file size is under 10MB</li>
        </ul>
      </div>
    </div>
  );
};

export default ConditionReportUpload;
