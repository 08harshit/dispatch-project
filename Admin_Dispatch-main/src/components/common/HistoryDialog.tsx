import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { History } from "lucide-react";
import type { HistoryItem } from "@/types/common";

interface HistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityName: string;
    history: HistoryItem[];
}

/**
 * Reusable history timeline dialog — used by Couriers, Shippers, Loads.
 *
 * Displays a list of { date, action } entries with icon circles and vertical connector.
 */
export function HistoryDialog({
    open,
    onOpenChange,
    entityName,
    history,
}: HistoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Activity History
                    </DialogTitle>
                    <DialogDescription>{entityName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-0">
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <div key={index} className="flex gap-3 relative">
                                {index < history.length - 1 && (
                                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                                )}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
                                    <History className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="flex-1 pb-5">
                                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm py-4">
                            No history available
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
