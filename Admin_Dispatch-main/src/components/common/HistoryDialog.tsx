import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
 * Displays a list of { date, action } entries with a dot-timeline style.
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
                    <DialogTitle>Activity History</DialogTitle>
                    <DialogDescription>{entityName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                                <div>
                                    <p className="font-medium">{item.action}</p>
                                    <p className="text-xs text-muted-foreground">{item.date}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            No history available
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
