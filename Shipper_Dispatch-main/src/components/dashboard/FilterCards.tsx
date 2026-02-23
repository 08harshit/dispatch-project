import { cn } from "@/lib/utils";

export interface FilterCardData {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface FilterCardsProps {
  cards: FilterCardData[];
  activeFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
}

const FilterCards = ({ cards, activeFilter, onFilterChange }: FilterCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
      {cards.map((card, index) => {
        const isActive = activeFilter === card.id;
        
        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(isActive ? null : card.id)}
            className={cn(
              "group relative p-6 rounded-3xl transition-all duration-500 ease-out",
              "bg-white border-2",
              isActive 
                ? "border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                : "border-border/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background gradient on active */}
            <div className={cn(
              "absolute inset-0 rounded-3xl transition-opacity duration-500",
              "bg-gradient-to-br from-primary/5 via-transparent to-primary/10",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            )} />
            
            {/* Floating orb decoration */}
            <div className={cn(
              "absolute -top-2 -right-2 w-20 h-20 rounded-full blur-2xl transition-all duration-500",
              isActive 
                ? "bg-primary/20 scale-100" 
                : "bg-primary/5 scale-75 group-hover:scale-100 group-hover:bg-primary/10"
            )} />

            <div className="relative z-10">
              {/* Icon container */}
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                isActive
                  ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 rotate-3"
                  : "bg-gradient-to-br from-muted to-muted/50 text-muted-foreground group-hover:from-primary/20 group-hover:to-primary/10 group-hover:text-primary group-hover:rotate-3"
              )}>
                <span className={cn(
                  "transition-transform duration-500",
                  isActive && "scale-110",
                  "group-hover:scale-110"
                )}>
                  {card.icon}
                </span>
              </div>
              
              {/* Label */}
              <h3 className={cn(
                "text-base font-semibold mb-1 transition-colors duration-300",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {card.label}
              </h3>
              
              {/* Value */}
              <p className="text-sm text-muted-foreground">
                {card.value}
              </p>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-4 right-4">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default FilterCards;
