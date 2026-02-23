import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface DeliveryTimerProps {
  /** Total duration in seconds */
  totalDuration?: number;
  /** Initial time remaining in seconds (defaults to totalDuration) */
  initialTime?: number;
  /** Label to display */
  label?: string;
}

export const DeliveryTimer = ({
  totalDuration = 3600, // 1 hour default
  initialTime,
  label = "Time remaining",
}: DeliveryTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime ?? totalDuration);

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
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (timeRemaining / totalDuration) * 100;
  const isUrgent = timeRemaining < totalDuration * 0.25;
  const isCritical = timeRemaining === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={
            isCritical
              ? "text-destructive font-semibold"
              : isUrgent
              ? "text-orange-500 font-medium"
              : "text-primary font-medium"
          }
        >
          {formatTime(timeRemaining)}
        </span>
      </div>
      <Progress
        value={progressPercentage}
        className={`h-2 ${
          isCritical
            ? "[&>div]:bg-destructive"
            : isUrgent
            ? "[&>div]:bg-orange-500"
            : "[&>div]:bg-primary"
        }`}
      />
    </div>
  );
};
