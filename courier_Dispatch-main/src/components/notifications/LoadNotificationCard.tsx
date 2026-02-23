import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Star, 
  Car, 
  DollarSign,
  Send,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { LoadNotification } from "@/hooks/useLoadNotifications";
import { RouteMap } from "./RouteMap";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LoadNotificationCardProps {
  notification: LoadNotification;
  onAccept: (id: string, price: number) => void;
  onDecline: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const LoadNotificationCard = ({
  notification,
  onAccept,
  onDecline,
  isExpanded = false,
  onToggleExpand,
}: LoadNotificationCardProps) => {
  const [counterOffer, setCounterOffer] = useState<string>(notification.price.toString());
  const [timeRemaining, setTimeRemaining] = useState(notification.expiresIn);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (timeRemaining / notification.expiresIn) * 100;
  const isUrgent = timeRemaining < notification.expiresIn * 0.25;

  const handleSendOffer = () => {
    const offerPrice = parseFloat(counterOffer);
    if (isNaN(offerPrice) || offerPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    onAccept(notification.id, offerPrice);
    toast.success(`Offer of $${offerPrice} sent to ${notification.shipper.name}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const perMile = (notification.price / notification.distance).toFixed(2);

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle border highlight on hover */}
      <div className={cn(
        "absolute -inset-px rounded-2xl bg-amber-200 opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100",
        isExpanded && "opacity-100 bg-amber-300"
      )} />
      
      {/* Main card container */}
      <div className={cn(
        "relative bg-white rounded-2xl overflow-hidden transition-all duration-300",
        isExpanded && "shadow-lg shadow-amber-100/50",
        isHovered && !isExpanded && "shadow-md"
      )}>
        {/* Header - Always Visible */}
        <div 
          className="relative p-4 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-4">
            {/* Vehicle icon */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200">
                <Car className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            
            {/* Vehicle & Route info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-700 truncate">
                {notification.vehicle.year} {notification.vehicle.make} {notification.vehicle.model}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-sm">
                <span className="font-medium text-amber-600">{notification.pickup.city}</span>
                <ArrowRight className="h-3 w-3 text-stone-300 flex-shrink-0" />
                <span className="font-medium text-emerald-600 truncate">{notification.delivery.city}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                <span>{notification.distance} mi</span>
                <span>•</span>
                <span>${perMile}/mi</span>
              </div>
            </div>
            
            {/* Price and expand */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Price badge */}
              <div className="px-4 py-2 bg-emerald-500 rounded-xl">
                <span className="text-lg font-bold text-white">
                  ${notification.price}
                </span>
              </div>
              
              {/* Expand indicator */}
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
                isExpanded 
                  ? "bg-amber-500 text-white" 
                  : "bg-amber-50 text-amber-500 group-hover:bg-amber-100"
              )}>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-amber-100">
            {/* Map */}
            <div className="relative mt-4 rounded-xl overflow-hidden border border-amber-200">
              <RouteMap
                pickup={notification.pickup}
                delivery={notification.delivery}
                className="h-44"
              />
            </div>

            {/* Shipper Info */}
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <h4 className="font-semibold text-stone-700 flex items-center gap-2 mb-3 text-sm tracking-wide uppercase">
                <User className="h-4 w-4 text-amber-600" />
                Shipper
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-stone-400 text-xs">Name</p>
                  <p className="font-medium text-stone-700">{notification.shipper.name}</p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Company</p>
                  <p className="font-medium text-stone-700">{notification.shipper.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-lg border border-amber-200">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-amber-700 text-sm">{notification.shipper.rating}</span>
                  </div>
                  <span className="text-xs text-stone-400">({notification.shipper.totalLoads} loads)</span>
                </div>
                <div className="flex items-center gap-2 text-stone-500">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-sm">{notification.shipper.phone}</span>
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div className="grid grid-cols-2 gap-3">
              {/* Pickup */}
              <div className="bg-white rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-amber-500 rounded flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-semibold text-stone-700 text-xs uppercase tracking-wide">Pickup</span>
                </div>
                <p className="text-sm font-medium text-stone-700 line-clamp-1">{notification.pickup.address}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {notification.pickup.city}, {notification.pickup.state}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(notification.pickup.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{notification.pickup.time}</span>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-emerald-500 rounded flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-semibold text-stone-700 text-xs uppercase tracking-wide">Delivery</span>
                </div>
                <p className="text-sm font-medium text-stone-700 line-clamp-1">{notification.delivery.address}</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {notification.delivery.city}, {notification.delivery.state}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(notification.delivery.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{notification.delivery.time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <p className="text-lg font-bold text-stone-700">{notification.distance}</p>
                <p className="text-xs text-stone-400">miles</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-lg font-bold text-emerald-700">${notification.price}</p>
                <p className="text-xs text-stone-400">total</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <p className="text-lg font-bold text-stone-700">${perMile}</p>
                <p className="text-xs text-stone-400">per mile</p>
              </div>
            </div>

            {/* Counter Offer & Actions */}
            <div className="space-y-3 pt-2">
              {/* Counter offer input */}
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-white rounded-lg border border-emerald-100">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <Input
                    type="number"
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(e.target.value)}
                    className="border-0 bg-transparent p-0 h-auto text-lg font-semibold focus-visible:ring-0"
                    placeholder="Your offer"
                  />
                </div>
                <Button
                  onClick={handleSendOffer}
                  className="h-11 px-5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white border-0 gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
              
              {/* Accept/Decline buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onAccept(notification.id, notification.price);
                    toast.success(`Accepted load at $${notification.price}`);
                  }}
                  className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white border-0 gap-2"
                >
                  <Check className="h-4 w-4" />
                  Accept ${notification.price}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDecline(notification.id)}
                  className="flex-1 h-11 rounded-xl gap-2 border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
