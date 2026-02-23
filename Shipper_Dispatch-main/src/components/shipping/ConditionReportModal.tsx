import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  ClipboardList,
  Download,
  Printer,
  Trash2,
  Loader2
} from "lucide-react";
import ConditionReportForm from "./ConditionReportForm";
import ConditionReportUpload from "./ConditionReportUpload";
import ConditionReportPreview from "./ConditionReportPreview";
import { ConditionReport, createEmptyConditionReport } from "@/types/conditionReport";
import { createExampleConditionReport } from "@/data/exampleConditionReport";
import { useConditionReport, useSaveConditionReport, useDeleteConditionReport } from "@/hooks/useConditionReports";

interface ConditionReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    vin: string;
  };
  existingReport?: ConditionReport;
  onSave: (report: ConditionReport) => void;
  onDelete?: () => void;
}

const ConditionReportModal = ({
  open,
  onOpenChange,
  vehicleId,
  vehicleInfo,
  existingReport,
  onSave,
  onDelete,
}: ConditionReportModalProps) => {
  // Fetch existing report from database
  const { data: dbReport, isLoading } = useConditionReport(vehicleId);
  const saveReportMutation = useSaveConditionReport();
  const deleteReportMutation = useDeleteConditionReport();

  // Use example report for demonstration if no existing report
  const [activeTab, setActiveTab] = useState<'form' | 'upload' | 'preview'>('preview');
  const [report, setReport] = useState<ConditionReport>(
    existingReport || createExampleConditionReport(vehicleId)
  );
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update local state when database report loads
  useEffect(() => {
    if (dbReport) {
      setReport(dbReport);
    }
  }, [dbReport]);

  const handleReportChange = (updates: Partial<ConditionReport>) => {
    setReport(prev => ({ ...prev, ...updates, updatedAt: new Date() }));
  };

  const handleSave = () => {
    saveReportMutation.mutate(report, {
      onSuccess: () => {
        onSave(report);
        onOpenChange(false);
      }
    });
  };

  const handleDelete = () => {
    deleteReportMutation.mutate(report.id, {
      onSuccess: () => {
        onDelete?.();
        setShowDeleteConfirm(false);
        onOpenChange(false);
      }
    });
  };

  const handlePdfUpload = (file: File) => {
    setUploadedPdf(file);
    // In a real app, upload to storage and get URL
    handleReportChange({ pdfReportUrl: URL.createObjectURL(file) });
    setActiveTab('preview');
  };

  const vehicleTitle = `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Vehicle Condition Report
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {vehicleTitle} • VIN: {vehicleInfo.vin || 'N/A'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0">
              <TabsTrigger value="form" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Fill Form
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload PDF
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <FileText className="h-4 w-4" />
                Preview Report
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 scrollbar-visible">
              <TabsContent value="form" className="mt-0 h-full">
                <ConditionReportForm 
                  report={report} 
                  onChange={handleReportChange}
                  onComplete={() => setActiveTab('preview')}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-0 h-full">
                <ConditionReportUpload 
                  onUpload={handlePdfUpload}
                  existingPdf={uploadedPdf}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0 h-full">
                <ConditionReportPreview 
                  report={report}
                  vehicleInfo={vehicleInfo}
                  pdfFile={uploadedPdf}
                />
              </TabsContent>
            </div>
          </Tabs>

          <div className="pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  // Generate and download PDF
                  window.print();
                }}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
            <div className="flex gap-2">
              {(dbReport || existingReport) && onDelete && (
                <Button 
                  variant="outline" 
                  className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteReportMutation.isPending}
                >
                  {deleteReportMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete Report
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveReportMutation.isPending}>
                {saveReportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Report'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Condition Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the condition report for {vehicleTitle}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConditionReportModal;
