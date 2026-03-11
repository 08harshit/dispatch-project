import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  File, 
  Image, 
  FileSpreadsheet, 
  Trash2, 
  Upload,
  ClipboardList,
  Truck,
  Receipt,
  Loader2,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  useShipmentDocuments, 
  useUploadShipmentDocument, 
  useDeleteShipmentDocument,
  getDocumentTypeLabel,
  ShipmentDocument 
} from "@/hooks/useShipmentDocuments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShipmentDocsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  vehicleInfo: {
    listingId: string;
    year: number;
    make: string;
    model: string;
    vin?: string;
  };
  onOpenConditionReport?: () => void;
  hasConditionReport?: boolean;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "application/pdf":
      return <FileText size={20} className="text-red-500" />;
    case "image":
    case "image/jpeg":
    case "image/png":
    case "image/webp":
      return <Image size={20} className="text-blue-500" />;
    case "spreadsheet":
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return <FileSpreadsheet size={20} className="text-green-500" />;
    default:
      return <File size={20} className="text-muted-foreground" />;
  }
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getDocumentTypeIcon = (type: ShipmentDocument["documentType"]) => {
  switch (type) {
    case "invoice":
      return <Receipt size={16} className="text-green-500" />;
    case "bill_of_lading":
      return <Package size={16} className="text-blue-500" />;
    case "proof_of_delivery":
      return <Truck size={16} className="text-purple-500" />;
    case "condition_report":
      return <ClipboardList size={16} className="text-amber-500" />;
    default:
      return <File size={16} className="text-muted-foreground" />;
  }
};

const ShipmentDocsModal = ({
  open,
  onOpenChange,
  leadId,
  vehicleInfo,
  onOpenConditionReport,
  hasConditionReport = false,
}: ShipmentDocsModalProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "courier" | "shipper">("all");
  const [selectedDocType, setSelectedDocType] = useState<ShipmentDocument["documentType"]>("proof_of_delivery");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading } = useShipmentDocuments(leadId);
  const uploadMutation = useUploadShipmentDocument();
  const deleteMutation = useDeleteShipmentDocument();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && leadId) {
      await uploadMutation.mutateAsync({
        leadId,
        documentType: selectedDocType,
        file,
        uploadedBy: "shipper",
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && leadId) {
      await uploadMutation.mutateAsync({
        leadId,
        documentType: selectedDocType,
        file,
        uploadedBy: "shipper",
      });
    }
  };

  const handleDelete = async (doc: ShipmentDocument) => {
    await deleteMutation.mutateAsync({
      leadId: doc.leadId,
      docId: doc.id,
    });
  };

  const filteredDocs = documents.filter((doc) => {
    if (activeTab === "all") return true;
    return doc.uploadedBy === activeTab;
  });

  const courierDocs = documents.filter((d) => d.uploadedBy === "courier");
  const shipperDocs = documents.filter((d) => d.uploadedBy === "shipper");

  const vehicleTitle = `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-primary/5 p-6 border-b border-border/30 flex-shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-500/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <FileText size={28} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Shipment Documents</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {vehicleInfo.listingId} • {vehicleTitle}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
            <div className="px-6 pt-4 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="gap-2">
                  All
                  <Badge variant="secondary" className="ml-1">{documents.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="courier" className="gap-2">
                  <Truck size={14} />
                  From Courier
                  {courierDocs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{courierDocs.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="shipper" className="gap-2">
                  Uploaded
                  {shipperDocs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{shipperDocs.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-visible">

              {/* Condition Report Card */}
              {onOpenConditionReport && (
                <div 
                  onClick={onOpenConditionReport}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl mb-4 cursor-pointer",
                    "bg-gradient-to-br from-amber-500/10 to-amber-500/5",
                    "border border-amber-500/30",
                    "hover:border-amber-500/50 hover:shadow-sm transition-all duration-200"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <ClipboardList size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Vehicle Condition Report</p>
                    <p className="text-xs text-muted-foreground">
                      {hasConditionReport ? "View or edit condition report" : "Create condition report"}
                    </p>
                  </div>
                  <Badge variant={hasConditionReport ? "default" : "outline"} className="gap-1">
                    {hasConditionReport ? (
                      <>
                        <FileText size={12} />
                        Available
                      </>
                    ) : (
                      "Not Created"
                    )}
                  </Badge>
                </div>
              )}

              {/* Upload Area */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as ShipmentDocument["documentType"])}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>
                      <SelectItem value="proof_of_delivery">Proof of Delivery</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/30",
                    uploadMutation.isPending && "pointer-events-none opacity-50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv,.doc,.docx"
                    disabled={uploadMutation.isPending}
                  />
                  <div className={cn(
                    "w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 transition-all",
                    isDragging ? "bg-primary/20 scale-110" : "bg-muted/50"
                  )}>
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Upload className={cn(
                        "h-5 w-5 transition-colors",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {uploadMutation.isPending ? "Uploading..." : isDragging ? "Drop file here" : "Add Document"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or click to browse
                  </p>
                </div>
              </div>

              {/* Documents List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No documents found</p>
                  <p className="text-xs mt-1">
                    {activeTab === "courier" 
                      ? "Courier hasn't uploaded any documents yet" 
                      : "Upload documents to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocs.map((doc) => (
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
                        {getFileIcon(doc.mimeType || "")}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                          {doc.uploadedBy === "courier" && (
                            <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
                              <Truck size={10} />
                              Courier
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {getDocumentTypeIcon(doc.documentType)}
                            {getDocumentTypeLabel(doc.documentType)}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{format(doc.createdAt, "MMM d, yyyy")}</span>
                          {doc.courierName && (
                            <>
                              <span>•</span>
                              <span>by {doc.courierName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-primary/10"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          <ExternalLink size={14} className="text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-primary/10"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = doc.fileUrl;
                            a.download = doc.fileName;
                            a.click();
                          }}
                        >
                          <Download size={14} className="text-muted-foreground" />
                        </Button>
                        {doc.uploadedBy === "shipper" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(doc)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} className="text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentDocsModal;
