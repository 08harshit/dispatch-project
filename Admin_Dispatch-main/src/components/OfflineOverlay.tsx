import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Full-screen overlay shown when the network is offline.
 * Prevents API calls and auth checks from running, avoiding rate limit errors.
 */
export function OfflineOverlay() {
    const handleRetry = () => {
        if (navigator.onLine) {
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-6">
            <div className="flex flex-col items-center justify-center max-w-md text-center space-y-6">
                <div className="p-6 rounded-full bg-muted/50">
                    <WifiOff className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">You are offline</h1>
                    <p className="text-muted-foreground">
                        Check your internet connection and try again. The app will reload automatically when you are back online.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handleRetry}
                    className="mt-4"
                >
                    Retry when online
                </Button>
            </div>
        </div>
    );
}
