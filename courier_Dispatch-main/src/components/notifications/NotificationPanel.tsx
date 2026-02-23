import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LoadNotificationCard } from "./LoadNotificationCard";
import { SimilarRoutesCard } from "./SimilarRoutesCard";
import { useLoadNotifications, LoadNotification } from "@/hooks/useLoadNotifications";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SimilarRoute {
  id: string;
  shippersCount: number;
  pickup: { city: string; state: string; coordinates: [number, number] };
  delivery: { city: string; state: string; coordinates: [number, number] };
  priceRange: { min: number; max: number };
  distance: number;
  loads: LoadNotification[];
}

export const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<SimilarRoute | null>(null);
  const navigate = useNavigate();
  
  const { notifications, loading, acceptLoad, declineLoad } = useLoadNotifications();
  const { user } = useAuth();

  // Group notifications by similar routes
  const similarRoutes = useMemo((): SimilarRoute[] => {
    const routeMap = new Map<string, LoadNotification[]>();
    
    notifications.forEach((notification) => {
        const key = `${notification.pickup.city}-${notification.delivery.city}`;
        if (!routeMap.has(key)) {
          routeMap.set(key, []);
        }
        routeMap.get(key)!.push(notification);
    });

    return Array.from(routeMap.entries())
      .filter(([_, loads]) => loads.length > 1)
      .map(([key, loads]) => ({
        id: key,
        shippersCount: loads.length,
        pickup: {
          city: loads[0].pickup.city,
          state: loads[0].pickup.state,
          coordinates: loads[0].pickup.coordinates,
        },
        delivery: {
          city: loads[0].delivery.city,
          state: loads[0].delivery.state,
          coordinates: loads[0].delivery.coordinates,
        },
        priceRange: {
          min: Math.min(...loads.map((l) => l.price)),
          max: Math.max(...loads.map((l) => l.price)),
        },
        distance: loads[0].distance,
        loads,
      }));
  }, [notifications]);

  const handleAccept = async (id: string, price: number) => {
    const result = await acceptLoad(id, price);
    if (result.requiresAuth) {
      toast.info("Please sign in to accept loads");
      setIsOpen(false);
      navigate("/auth");
    }
  };

  const handleDecline = (id: string) => {
    declineLoad(id);
  };

  const handleSelectRoute = (route: SimilarRoute) => {
    setSelectedRoute(route);
    if (route.loads.length > 0) {
      setExpandedId(route.loads[0].id);
    }
  };

  const displayedNotifications = selectedRoute 
    ? selectedRoute.loads 
    : notifications;

  const hasNotifications = notifications.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative group">
          {/* Subtle outer glow */}
          {hasNotifications && (
            <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-md animate-pulse" />
          )}
          
          {/* Main button container */}
          <div className={cn(
            "relative h-11 w-11 rounded-full bg-white border flex items-center justify-center transition-all duration-300",
            hasNotifications 
              ? "border-amber-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50" 
              : "border-stone-200 hover:border-stone-300 hover:shadow-md"
          )}>
            {/* Bell icon */}
            <Bell className={cn(
              "h-5 w-5 transition-all duration-300",
              hasNotifications 
                ? "text-amber-600 group-hover:animate-[wiggle_0.5s_ease-in-out]" 
                : "text-stone-400 group-hover:text-stone-600"
            )} strokeWidth={2} />
          </div>
          
          {/* Notification badge */}
          {hasNotifications && (
            <div className="absolute -top-1 -right-1 z-20">
              <div className="h-5 min-w-5 px-1 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-bold text-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              </div>
            </div>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 bg-amber-50/30 border-l border-amber-100 overflow-hidden">
        <SheetHeader className="relative p-5">
          {/* Clean header container */}
          <div className="relative bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
            {/* Thin accent line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            
            <div className="flex items-center justify-between pt-2">
              <SheetTitle className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <span className="text-lg font-bold text-stone-700">
                    Notifications
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs text-stone-400 tracking-wide">Live</span>
                  </div>
                </div>
              </SheetTitle>
              
              {/* Notification count badge */}
              <div className="px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                <span className="text-sm font-semibold text-amber-700">
                  {notifications.length} new
                </span>
              </div>
            </div>
            
            {selectedRoute && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-100">
                <div className="flex-1 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-sm font-medium text-amber-700">
                    {selectedRoute.pickup.city} → {selectedRoute.delivery.city}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRoute(null)}
                  className="h-8 px-3 rounded-xl text-xs text-stone-500 hover:bg-amber-50 hover:text-amber-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Auth Status Banner */}
        {!user && (
          <div className="relative mx-5 mb-3">
            <div className="relative bg-white rounded-xl p-3 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <LogIn className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-stone-600">Sign in to accept loads</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/auth");
                }}
                className="h-8 px-4 bg-amber-500 hover:bg-amber-600 rounded-lg text-white border-0"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-160px)] relative">
          <div className="p-5 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border border-amber-200">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
                <p className="mt-4 text-sm text-stone-400">Loading notifications...</p>
              </div>
            ) : (
              <>
                {/* Similar Routes Section */}
                {!selectedRoute && similarRoutes.length > 0 && (
                  <SimilarRoutesCard 
                    routes={similarRoutes} 
                    onSelectRoute={handleSelectRoute}
                  />
                )}

                {/* Notifications List */}
                {displayedNotifications.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-4 border border-amber-200">
                      <Bell className="h-10 w-10 text-amber-300" />
                    </div>
                    <p className="font-semibold text-stone-600">No new load notifications</p>
                    <p className="text-sm text-stone-400 mt-2 max-w-[240px] mx-auto">
                      Loads posted by shippers will appear here in real-time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-amber-400 rounded-full" />
                        <h3 className="font-semibold text-stone-700 tracking-wide">Available Loads</h3>
                      </div>
                      <div className="px-2.5 py-1 bg-white rounded-lg border border-amber-200">
                        <span className="text-sm font-medium text-amber-600">{displayedNotifications.length}</span>
                      </div>
                    </div>
                    
                    {/* Notification cards */}
                    <div className="space-y-3">
                      {displayedNotifications.map((notification, index) => (
                        <div 
                          key={notification.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <LoadNotificationCard
                            notification={notification}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                            isExpanded={expandedId === notification.id}
                            onToggleExpand={() => 
                              setExpandedId(expandedId === notification.id ? null : notification.id)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
