import { useState } from "react";
import { 
  Route, DollarSign, Gauge, ChevronDown, 
  RotateCcw, Target, Zap, MapPin, Clock, ArrowUpDown, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AvailableLoadsFiltersState {
  minDistance: number;
  maxDistance: number;
  minPrice: number;
  maxPrice: number;
  minPerMile: number;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  maxDaysListed: number;
  minRating: number;
}

interface AvailableLoadsFiltersProps {
  filters: AvailableLoadsFiltersState;
  onFiltersChange: (filters: AvailableLoadsFiltersState) => void;
  onReset: () => void;
  resultCount: number;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

export const defaultFilters: AvailableLoadsFiltersState = {
  minDistance: 0,
  maxDistance: 1000,
  minPrice: 0,
  maxPrice: 5000,
  minPerMile: 0,
  pickupCity: "",
  pickupState: "",
  deliveryCity: "",
  deliveryState: "",
  maxDaysListed: 30,
  minRating: 0,
};

export const AvailableLoadsFilters = ({
  filters,
  onFiltersChange,
  onReset,
  resultCount,
  sortBy = "date",
  onSortChange,
}: AvailableLoadsFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasActiveFilters = 
    filters.minDistance > 0 || 
    filters.maxDistance < 1000 || 
    filters.minPrice > 0 || 
    filters.maxPrice < 5000 || 
    filters.minPerMile > 0 ||
    filters.pickupCity !== "" ||
    filters.pickupState !== "" ||
    filters.deliveryCity !== "" ||
    filters.deliveryState !== "" ||
    filters.maxDaysListed < 30 ||
    filters.minRating > 0;

  return (
    <div className="relative">
      <div className={cn(
        "relative bg-white/90 backdrop-blur-sm border transition-all duration-300 overflow-hidden",
        isExpanded 
          ? "rounded-2xl border-stone-200 shadow-md" 
          : "rounded-xl border-stone-200 shadow-sm"
      )}>
        {/* Toggle Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 group"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
              hasActiveFilters ? "bg-primary/15" : "bg-stone-100"
            )}>
              <Target className={cn(
                "h-4 w-4",
                hasActiveFilters ? "text-primary" : "text-stone-500"
              )} strokeWidth={1.5} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm">Filters</span>
                {hasActiveFilters && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                    <Zap className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-700">{resultCount} results</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center transition-all duration-300",
            isExpanded ? "bg-stone-200 rotate-180" : "bg-stone-100"
          )}>
            <ChevronDown className={cn(
              "h-4 w-4",
              isExpanded ? "text-stone-700" : "text-stone-500"
            )} />
          </div>
        </button>

        {/* Expanded Content */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <ScrollArea className="h-full max-h-[400px] [&>div>div[style]]:!block [&_[data-radix-scroll-area-scrollbar]]:bg-stone-100 [&_[data-radix-scroll-area-scrollbar]]:rounded-full [&_[data-radix-scroll-area-scrollbar]]:w-2 [&_[data-radix-scroll-area-thumb]]:bg-stone-300 [&_[data-radix-scroll-area-thumb]]:rounded-full">
          <div className="px-4 pb-4 space-y-5">
            <div className="h-px bg-stone-100" />

            {/* Distance Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <span className="text-sm text-foreground font-medium">Distance</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {filters.minDistance} - {filters.maxDistance} mi
                </span>
              </div>
              
              <div className="relative pt-1">
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-200"
                    style={{
                      marginLeft: `${(filters.minDistance / 1000) * 100}%`,
                      width: `${((filters.maxDistance - filters.minDistance) / 1000) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">0</span>
                  <span className="text-[10px] text-muted-foreground">1000 mi</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Min</span>
                  <Slider
                    value={[filters.minDistance]}
                    onValueChange={([val]) => onFiltersChange({ ...filters, minDistance: Math.min(val, filters.maxDistance - 50) })}
                    max={1000}
                    step={25}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Max</span>
                  <Slider
                    value={[filters.maxDistance]}
                    onValueChange={([val]) => onFiltersChange({ ...filters, maxDistance: Math.max(val, filters.minDistance + 50) })}
                    max={1000}
                    step={25}
                  />
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                  <span className="text-sm text-foreground font-medium">Price</span>
                </div>
                <span className="text-sm font-semibold text-emerald-700">
                  ${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()}
                </span>
              </div>
              
              <div className="relative pt-1">
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-200"
                    style={{
                      marginLeft: `${(filters.minPrice / 5000) * 100}%`,
                      width: `${((filters.maxPrice - filters.minPrice) / 5000) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">$0</span>
                  <span className="text-[10px] text-muted-foreground">$5,000</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Min</span>
                  <Slider
                    value={[filters.minPrice]}
                    onValueChange={([val]) => onFiltersChange({ ...filters, minPrice: Math.min(val, filters.maxPrice - 100) })}
                    max={5000}
                    step={100}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Max</span>
                  <Slider
                    value={[filters.maxPrice]}
                    onValueChange={([val]) => onFiltersChange({ ...filters, maxPrice: Math.max(val, filters.minPrice + 100) })}
                    max={5000}
                    step={100}
                  />
                </div>
              </div>
            </div>

            {/* Price Per Mile */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <span className="text-sm text-foreground font-medium">Min $/Mile</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  ${filters.minPerMile.toFixed(2)}/mi
                </span>
              </div>
              
              <div className="relative pt-1">
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-200"
                    style={{ width: `${(filters.minPerMile / 3) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">$0</span>
                  <span className="text-[10px] text-muted-foreground">$3/mi</span>
                </div>
              </div>
              
              <Slider
                value={[filters.minPerMile]}
                onValueChange={([val]) => onFiltersChange({ ...filters, minPerMile: val })}
                min={0}
                max={3}
                step={0.25}
              />
            </div>

            {/* Pickup Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="text-sm text-foreground font-medium">Pickup Location</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={filters.pickupCity}
                  onChange={(e) => onFiltersChange({ ...filters, pickupCity: e.target.value })}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-primary/30 focus-visible:border-primary/40"
                />
                <Input
                  placeholder="State (e.g. CA)"
                  value={filters.pickupState}
                  onChange={(e) => onFiltersChange({ ...filters, pickupState: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-primary/30 focus-visible:border-primary/40 uppercase"
                />
              </div>
            </div>

            {/* Delivery Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                <span className="text-sm text-foreground font-medium">Delivery Location</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={filters.deliveryCity}
                  onChange={(e) => onFiltersChange({ ...filters, deliveryCity: e.target.value })}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-emerald-300 focus-visible:border-emerald-300"
                />
                <Input
                  placeholder="State (e.g. AZ)"
                  value={filters.deliveryState}
                  onChange={(e) => onFiltersChange({ ...filters, deliveryState: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-emerald-300 focus-visible:border-emerald-300 uppercase"
                />
              </div>
            </div>

            {/* Days Listed Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-sm text-foreground font-medium">Max Days Listed</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {filters.maxDaysListed === 30 ? "Any" : `≤ ${filters.maxDaysListed}d`}
                </span>
              </div>
              
              <Slider
                value={[filters.maxDaysListed]}
                onValueChange={([val]) => onFiltersChange({ ...filters, maxDaysListed: val })}
                min={0}
                max={30}
                step={1}
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">Today</span>
                <span className="text-[10px] text-muted-foreground">30 days</span>
              </div>
            </div>

            {/* Shipper Rating */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary/80 fill-primary/60" strokeWidth={1.5} />
                  <span className="text-sm text-foreground font-medium">Min Rating</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {filters.minRating === 0 ? "Any" : `≥ ${filters.minRating.toFixed(1)}★`}
                </span>
              </div>
              
              <Slider
                value={[filters.minRating]}
                onValueChange={([val]) => onFiltersChange({ ...filters, minRating: val })}
                min={0}
                max={5}
                step={0.5}
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">Any</span>
                <span className="text-[10px] text-muted-foreground">5★</span>
              </div>
            </div>

            {/* Sort By */}
            {onSortChange && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-sm text-foreground font-medium">Sort By</span>
                </div>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger className="h-9 text-sm bg-white border-stone-200 rounded-lg focus:ring-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="date">Date Listed (Newest)</SelectItem>
                    <SelectItem value="pickup-date">Pickup Date (Soonest)</SelectItem>
                    <SelectItem value="delivery-date">Delivery Date (Soonest)</SelectItem>
                    <SelectItem value="price-desc">Price (High → Low)</SelectItem>
                    <SelectItem value="price-asc">Price (Low → High)</SelectItem>
                    <SelectItem value="distance-asc">Distance (Short → Long)</SelectItem>
                    <SelectItem value="distance-desc">Distance (Long → Short)</SelectItem>
                    <SelectItem value="pickup-city">Pickup City (A → Z)</SelectItem>
                    <SelectItem value="delivery-city">Delivery City (A → Z)</SelectItem>
                    <SelectItem value="rating-desc">Rating (Best First)</SelectItem>
                    <SelectItem value="condition">Condition (Best First)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {[
                { label: "Local (<100mi)", apply: () => onFiltersChange({ ...filters, maxDistance: 100 }) },
                { label: "High Pay", apply: () => onFiltersChange({ ...filters, minPrice: 2000 }) },
                { label: "Top Rated", apply: () => onFiltersChange({ ...filters, minRating: 4 }) },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={preset.apply}
                  className="px-3 py-1.5 text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200/60 rounded-lg transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <div className="pt-1">
                <button
                  onClick={onReset}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset all filters
                </button>
              </div>
            )}
          </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
