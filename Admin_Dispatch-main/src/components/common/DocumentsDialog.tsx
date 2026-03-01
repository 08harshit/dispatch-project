import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface DocItem {
    id?: string;
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
    /** Callback when user adds a document. When provided, upload button triggers form. */
    onUpload?: (meta: { name: string; type: string; date?: string }) => Promise<void>;
    /** Callback when user deletes a document. When provided, delete button shown for docs with id. */
    onDelete?: (docId: string) => Promise<void>;
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
    onUpload,
    onDelete,
}: DocumentsDialogProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [addName, setAddName] = useState("");
    const [addType, setAddType] = useState("");
    const [addDate, setAddDate] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleAddSubmit = async () => {
        if (!addName.trim() || !addType.trim()) {
            toast.error("Name and type are required");
            return;
        }
        if (!onUpload) return;
        setUploading(true);
        try {
            await onUpload({ name: addName.trim(), type: addType.trim(), date: addDate.trim() || undefined });
            toast.success("Document added");
            setAddName("");
            setAddType("");
            setAddDate("");
            setShowAddForm(false);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add document");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!onDelete) return;
        try {
            await onDelete(docId);
            toast.success("Document deleted");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete document");
        }
    };

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
                                key={doc.id ?? index}
                                className="flex items-center justify-between p-3 rounded-lg border"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {doc.type}
                                            {doc.date && ` • ${doc.date}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {onDelete && doc.id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(doc.id!)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toast.info(`Downloading ${doc.name}...`)}
                                    >
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            No documents available
                        </p>
                    )}
                    {showUpload && onUpload && (
                        <>
                            {showAddForm ? (
                                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Name</Label>
                                        <Input
                                            value={addName}
                                            onChange={(e) => setAddName(e.target.value)}
                                            placeholder="Document name"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Type</Label>
                                        <Input
                                            value={addType}
                                            onChange={(e) => setAddType(e.target.value)}
                                            placeholder="e.g. License, Insurance"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Date (optional)</Label>
                                        <Input
                                            value={addDate}
                                            onChange={(e) => setAddDate(e.target.value)}
                                            placeholder="YYYY-MM-DD"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} disabled={uploading}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleAddSubmit} disabled={uploading}>
                                            {uploading ? "Adding..." : "Add"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowAddForm(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Upload Document
                                </Button>
                            )}
                        </>
                    )}
                    {showUpload && !onUpload && (
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
