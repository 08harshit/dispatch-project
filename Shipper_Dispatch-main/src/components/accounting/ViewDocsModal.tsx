import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, ExternalLink, File, Image, FileSpreadsheet, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AccountingRecord {
  id: string;
  listingId: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  cost: number;
  paymentMethod: "cod" | "ach" | "wire" | "check";
  payoutStatus: "paid" | "pending" | "processing";
  hasDocs: boolean;
}

interface DocFile {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
}

interface ViewDocsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AccountingRecord | null;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText size={20} className="text-red-500" />;
    case "image":
      return <Image size={20} className="text-blue-500" />;
    case "spreadsheet":
      return <FileSpreadsheet size={20} className="text-green-500" />;
    default:
      return <File size={20} className="text-muted-foreground" />;
  }
};

const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'spreadsheet';
  return 'file';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const ViewDocsModal = ({ open, onOpenChange, record }: ViewDocsModalProps) => {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (record) {
      setDocs([]);
    }
  }, [record]);

  if (!record) return null;

  const handleAddFile = (file: File) => {
    const newDoc: DocFile = {
      id: Date.now().toString(),
      name: file.name,
      type: getFileType(file.name),
      size: formatFileSize(file.size),
      date: new Date().toISOString().split('T')[0],
    };
    setDocs(prev => [...prev, newDoc]);
    toast.success(`Added "${file.name}"`);
  };

  const handleDeleteDoc = (docId: string, docName: string) => {
    setDocs(prev => prev.filter(d => d.id !== docId));
    toast.success(`Deleted "${docName}"`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleAddFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
    if (files.length > 0) {
      handleAddFile(files[0]);
    }
  };

  const displayDocs = docs;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 p-6 border-b border-border/30">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <FileText size={28} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Documents</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {record.listingId} • {displayDocs.length} files
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv,.doc,.docx"
            />
            <div className={cn(
              "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 transition-all",
              isDragging ? "bg-primary/20 scale-110" : "bg-muted/50"
            )}>
              <Upload className={cn(
                "h-6 w-6 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragging ? "Drop file here" : "Add Document"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag & drop or click to browse
            </p>
          </div>

          {/* Documents List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {displayDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No documents yet. Add one using the upload area above.</p>
            ) : (
            displayDocs.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl",
                  "bg-gradient-to-br from-card to-muted/30",
                  "border border-border/50",
                  "hover:border-primary/30 hover:shadow-sm transition-all duration-200",
                  "group"
                )}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  {getFileIcon(doc.type)}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.size} • {doc.date}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10">
                    <ExternalLink size={14} className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10">
                    <Download size={14} className="text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDoc(doc.id, doc.name);
                    }}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDocsModal;
