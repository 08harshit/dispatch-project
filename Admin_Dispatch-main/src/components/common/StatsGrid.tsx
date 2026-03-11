import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatItem {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: "primary" | "success" | "destructive" | "warning" | "accent";
    delay?: number;
}

interface StatsGridProps {
    stats: StatItem[];
    /** Number of grid columns at lg breakpoint. Defaults to the number of stats items. */
    columns?: number;
    className?: string;
}

const colorMap = {
    primary: {
        gradient: "bg-gradient-to-br from-primary/10 to-transparent",
        iconBg: "bg-primary/10",
        iconText: "text-primary",
        textColor: "",
        accentLine: "bg-gradient-to-r from-primary to-primary/50",
    },
    success: {
        gradient: "bg-gradient-to-br from-success/10 to-transparent",
        iconBg: "bg-success/10",
        iconText: "text-success",
        textColor: "text-success",
        accentLine: "bg-gradient-to-r from-success to-success/50",
    },
    destructive: {
        gradient: "bg-gradient-to-br from-destructive/10 to-transparent",
        iconBg: "bg-destructive/10",
        iconText: "text-destructive",
        textColor: "text-destructive",
        accentLine: "bg-gradient-to-r from-destructive to-destructive/50",
    },
    warning: {
        gradient: "bg-gradient-to-br from-warning/10 to-transparent",
        iconBg: "bg-warning/10",
        iconText: "text-warning",
        textColor: "text-warning",
        accentLine: "bg-gradient-to-r from-warning to-warning/50",
    },
    accent: {
        gradient: "bg-gradient-to-br from-accent/10 to-transparent",
        iconBg: "bg-accent/10",
        iconText: "text-accent",
        textColor: "text-accent",
        accentLine: "bg-gradient-to-r from-accent to-accent/50",
    },
};

/**
 * Reusable stats bento grid — used by Couriers, Shippers, Loads, Tickets.
 *
 * Renders a responsive grid of stat cards with hover animations,
 * gradient overlays, and bottom accent lines.
 */
export function StatsGrid({ stats, columns, className }: StatsGridProps) {
    const cols = columns ?? stats.length;
    return (
        <div
            className={cn(
                "grid gap-4 grid-cols-2",
                cols === 4 && "lg:grid-cols-4",
                cols === 5 && "lg:grid-cols-5",
                cols === 3 && "lg:grid-cols-3",
                className
            )}
        >
            {stats.map((stat, index) => {
                const colors = colorMap[stat.color];
                const staggerClass = `stagger-${stat.delay ?? index + 1}`;
                return (
                    <div
                        key={stat.label}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-500 hover:-translate-y-1 cursor-pointer animate-fade-in",
                            staggerClass
                        )}
                    >
                        {/* Gradient overlay on hover */}
                        <div
                            className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                                colors.gradient
                            )}
                        />

                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                    {stat.label}
                                </p>
                                <p
                                    className={cn(
                                        "text-3xl font-bold mt-1 transition-transform duration-300 group-hover:scale-110 origin-left",
                                        colors.textColor
                                    )}
                                >
                                    {stat.value}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    "rounded-2xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
                                    colors.iconBg
                                )}
                            >
                                <stat.icon className={cn("h-6 w-6", colors.iconText)} />
                            </div>
                        </div>

                        {/* Bottom accent line */}
                        <div
                            className={cn(
                                "absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500",
                                colors.accentLine
                            )}
                        />
                    </div>
                );
            })}
        </div>
    );
}
