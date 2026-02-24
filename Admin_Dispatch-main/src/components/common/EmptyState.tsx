import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Reusable empty state placeholder — used when lists have no results.
 *
 * Displays a muted icon, title, optional description, and an optional action button.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{title}</p>
            {description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button variant="link" size="sm" onClick={onAction} className="mt-2">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
