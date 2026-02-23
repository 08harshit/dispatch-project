import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export type ConditionIconVariant = "positive" | "negative" | "neutral";

export interface ConditionIconButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  variant?: ConditionIconVariant;
  onClick: () => void;
  useCustomIcon?: boolean;
}

/**
 * Compact illustrated-style icon button matching the reference design.
 * Shows icon in a rounded square with label below, plus a small status indicator.
 */
const ConditionIconButton = ({
  icon,
  label,
  isActive,
  variant = "neutral",
  onClick,
  useCustomIcon = false,
}: ConditionIconButtonProps) => {
  // Status indicator colors based on variant when active
  const getIndicatorColor = () => {
    if (!isActive) return "bg-muted-foreground/40";
    switch (variant) {
      case "positive":
        return "bg-status-delivered";
      case "negative":
        return "bg-destructive";
      default:
        return "bg-primary";
    }
  };

  const getIconContainerStyle = () => {
    if (!isActive) {
      return "border-border bg-muted/30 text-muted-foreground";
    }
    switch (variant) {
      case "positive":
        return "border-status-delivered/40 bg-status-delivered/10 text-status-delivered";
      case "negative":
        return "border-destructive/40 bg-destructive/10 text-destructive";
      default:
        return "border-primary/40 bg-primary/10 text-primary";
    }
  };

  const getIconColor = () => {
    if (!isActive) return "text-muted-foreground";
    switch (variant) {
      case "positive":
        return "text-status-delivered";
      case "negative":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:bg-muted/30 min-w-[80px]"
    >
      {/* Icon container with status indicator */}
      <div className="relative">
        {useCustomIcon ? (
          // Custom SVG icons - render at full size with color
          <div className={cn("flex items-center justify-center", getIconColor())}>
            {icon}
          </div>
        ) : (
          // Lucide icons - wrapped in styled container
          <div
            className={cn(
              "h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-all",
              getIconContainerStyle()
            )}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: "h-6 w-6",
            })}
          </div>
        )}
        
        {/* Small status indicator dot */}
        <div
          className={cn(
            "absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center transition-colors",
            getIndicatorColor()
          )}
        >
          {isActive ? (
            variant === "negative" ? (
              <X className="h-2.5 w-2.5 text-white" />
            ) : (
              <Check className="h-2.5 w-2.5 text-white" />
            )
          ) : (
            <X className="h-2.5 w-2.5 text-white/70" />
          )}
        </div>
      </div>

      {/* Label */}
      <span
        className={cn(
          "text-[10px] font-medium text-center leading-tight max-w-[75px]",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
};

export default ConditionIconButton;
