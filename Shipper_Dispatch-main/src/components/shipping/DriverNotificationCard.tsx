import { useState, useEffect } from "react";
import { MapPin, Clock, DollarSign, CheckCircle, XCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DriverNotificationCardProps {
  notification: {
    id: string;
    offer_amount: number;
    distance_meters: number | null;
    expires_at: string;
    lead?: {
      pickup_address: string;
      delivery_address: string;
      vehicle_make: string | null;
      vehicle_model: string | null;
      vehicle_year: string | null;
    };
  };
  onAccept: (notificationId: string) => Promise<void>;
  onDecline: (notificationId: string) => Promise<void>;
}

const DriverNotificationCard = ({
  notification,
  onAccept,
  onDecline,
}: DriverNotificationCardProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(notification.expires_at).getTime() - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [notification.expires_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setIsResponding(true);
    try {
      await onAccept(notification.id);
    } finally {
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    setIsResponding(true);
    try {
      await onDecline(notification.id);
    } finally {
      setIsResponding(false);
    }
  };

  const timerProgress = (timeLeft / 120) * 100;
  const isUrgent = timeLeft < 30;

  const vehicleInfo = notification.lead 
    ? [notification.lead.vehicle_year, notification.lead.vehicle_make, notification.lead.vehicle_model].filter(Boolean).join(' ')
    : null;

  return (
    <Card className={cn(
      "border-2 transition-all animate-pulse-once",
      isUrgent ? "border-destructive bg-destructive/5" : "border-primary bg-primary/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            New Shipment Request
          </CardTitle>
          <Badge variant={isUrgent ? "destructive" : "default"} className="gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(timeLeft)}
          </Badge>
        </div>
        <Progress 
          value={timerProgress} 
          className={cn("h-1", isUrgent && "[&>div]:bg-destructive")} 
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Offer Amount */}
        <div className="text-center py-4 rounded-lg bg-background/50">
          <p className="text-sm text-muted-foreground">Offered Price</p>
          <p className="text-3xl font-bold text-primary">
            ${notification.offer_amount.toLocaleString()}
          </p>
        </div>

        {/* Distance */}
        {notification.distance_meters !== null && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {notification.distance_meters < 1000
                ? `${Math.round(notification.distance_meters)}m away`
                : `${(notification.distance_meters / 1000).toFixed(1)}km away`
              }
            </span>
          </div>
        )}

        {/* Route Info */}
        {notification.lead && (
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium">{notification.lead.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="font-medium">{notification.lead.delivery_address}</p>
              </div>
            </div>
            {vehicleInfo && (
              <div className="flex items-center gap-2 pt-1">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{vehicleInfo}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            onClick={handleAccept} 
            disabled={isResponding || timeLeft === 0}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Accept
          </Button>
          <Button 
            onClick={handleDecline} 
            variant="outline"
            disabled={isResponding || timeLeft === 0}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverNotificationCard;
