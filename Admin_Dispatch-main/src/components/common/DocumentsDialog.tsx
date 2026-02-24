import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface DocItem {
    name: string;
    type: string;
    date?: string;
}

interface DocumentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityName: string;
    documents: DocItem[];
    /** Whether to show the upload button. Defaults to true. */
    showUpload?: boolean;
}

/**
 * Reusable documents dialog — used by Couriers, Shippers, Loads.
 *
 * Displays a list of documents with download buttons and an optional upload action.
 */
export function DocumentsDialog({
    open,
    onOpenChange,
    entityName,
    documents,
    showUpload = true,
}: DocumentsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Documents</DialogTitle>
                    <DialogDescription>{entityName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {documents.length > 0 ? (
                        documents.map((doc, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg border"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {doc.type}
                                            {doc.date && ` • ${doc.date}`}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toast.info(`Downloading ${doc.name}...`)}
                                >
                                    Download
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            No documents available
                        </p>
                    )}
                    {showUpload && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => toast.info("Upload feature coming soon!")}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Document
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
