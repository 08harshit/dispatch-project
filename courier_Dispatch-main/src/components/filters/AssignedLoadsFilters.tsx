import { useState } from "react";
import { SlidersHorizontal, ChevronDown, RotateCcw, DollarSign, MapPin, Clock, ArrowUpDown, Route, Gauge, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface AssignedLoadsFiltersState {
  minPrice: number;
  maxPrice: number;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  maxDaysListed: number;
  minDistance: number;
  maxDistance: number;
  minPerMile: number;
  minRating: number;
}

export const defaultAssignedFilters: AssignedLoadsFiltersState = {
  minPrice: 0,
  maxPrice: 5000,
  pickupCity: "",
  pickupState: "",
  deliveryCity: "",
  deliveryState: "",
  maxDaysListed: 30,
  minDistance: 0,
  maxDistance: 1000,
  minPerMile: 0,
  minRating: 0,
};

interface AssignedLoadsFiltersProps {
  filters: AssignedLoadsFiltersState;
  onFiltersChange: (filters: AssignedLoadsFiltersState) => void;
  onReset: () => void;
  resultCount: number;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

export const AssignedLoadsFilters = ({
  filters,
  onFiltersChange,
  onReset,
  resultCount,
  sortBy = "date",
  onSortChange,
}: AssignedLoadsFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = 
    filters.minPrice > 0 ||
    filters.maxPrice < 5000 ||
    filters.pickupCity !== "" ||
    filters.pickupState !== "" ||
    filters.deliveryCity !== "" ||
    filters.deliveryState !== "" ||
    filters.maxDaysListed < 30 ||
    filters.minDistance > 0 ||
    filters.maxDistance < 1000 ||
    filters.minPerMile > 0 ||
    filters.minRating > 0;

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 px-3 rounded-xl gap-2 transition-all",
              isOpen 
                ? "bg-emerald-50 text-emerald-700" 
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          )}
          <span className="text-sm text-muted-foreground font-medium">
            {resultCount} load{resultCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <CollapsibleContent className="pt-4">
        <ScrollArea className="h-[300px] [&_[data-radix-scroll-area-scrollbar]]:bg-stone-100 [&_[data-radix-scroll-area-scrollbar]]:rounded-full [&_[data-radix-scroll-area-scrollbar]]:w-2.5 [&_[data-radix-scroll-area-thumb]]:bg-stone-400 [&_[data-radix-scroll-area-thumb]]:rounded-full">
        <div className="bg-white/80 rounded-2xl border border-stone-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Distance Range */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Route className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-foreground">Distance</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-md bg-stone-100 text-foreground font-medium">{filters.minDistance} mi</span>
                <span className="text-muted-foreground">—</span>
                <span className="px-2 py-1 rounded-md bg-stone-100 text-foreground font-medium">{filters.maxDistance} mi</span>
              </div>
              <Slider
                value={[filters.minDistance]}
                onValueChange={([val]) => onFiltersChange({ ...filters, minDistance: Math.min(val, filters.maxDistance - 50) })}
                max={1000}
                step={25}
              />
              <Slider
                value={[filters.maxDistance]}
                onValueChange={([val]) => onFiltersChange({ ...filters, maxDistance: Math.max(val, filters.minDistance + 50) })}
                max={1000}
                step={25}
              />
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-foreground">Price Range</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-md bg-stone-100 text-foreground font-medium">
                  {formatCurrency(filters.minPrice)}
                </span>
                <span className="text-muted-foreground">—</span>
                <span className="px-2 py-1 rounded-md bg-stone-100 text-foreground font-medium">
                  {formatCurrency(filters.maxPrice)}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <Slider
                  value={[filters.minPrice]}
                  onValueChange={([val]) => onFiltersChange({ ...filters, minPrice: Math.min(val, filters.maxPrice - 100) })}
                  max={5000}
                  step={100}
                />
                <Slider
                  value={[filters.maxPrice]}
                  onValueChange={([val]) => onFiltersChange({ ...filters, maxPrice: Math.max(val, filters.minPrice + 100) })}
                  max={5000}
                  step={100}
                />
              </div>
            </div>

            {/* Min $/Mile */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-stone-100 flex items-center justify-center">
                  <Gauge className="h-3.5 w-3.5 text-stone-600" />
                </div>
                <span className="text-sm font-medium text-foreground">Min $/Mile</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-md bg-stone-100 text-foreground font-medium">
                  ${filters.minPerMile.toFixed(2)}/mi
                </span>
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
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Pickup Location</span>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="City"
                  value={filters.pickupCity}
                  onChange={(e) => onFiltersChange({ ...filters, pickupCity: e.target.value })}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-primary/30"
                />
                <Input
                  placeholder="State (e.g. CA, TX)"
                  value={filters.pickupState}
                  onChange={(e) => onFiltersChange({ ...filters, pickupState: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-primary/30 uppercase"
                />
              </div>
            </div>

            {/* Delivery Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-foreground">Delivery Location</span>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="City"
                  value={filters.deliveryCity}
                  onChange={(e) => onFiltersChange({ ...filters, deliveryCity: e.target.value })}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-emerald-300"
                />
                <Input
                  placeholder="State (e.g. AZ, GA)"
                  value={filters.deliveryState}
                  onChange={(e) => onFiltersChange({ ...filters, deliveryState: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="h-9 text-sm bg-white border-stone-200 rounded-lg placeholder:text-muted-foreground focus-visible:ring-emerald-300 uppercase"
                />
              </div>
            </div>

            {/* Days Listed Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-stone-100 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-stone-600" />
                </div>
                <span className="text-sm font-medium text-foreground">Max Days Listed</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-md bg-stone-100 text-foreground font-medium">
                  {filters.maxDaysListed === 30 ? "Any" : `≤ ${filters.maxDaysListed}d`}
                </span>
              </div>

              <Slider
                value={[filters.maxDaysListed]}
                onValueChange={([val]) => onFiltersChange({ ...filters, maxDaysListed: val })}
                min={0}
                max={30}
                step={1}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-white [&_[role=slider]]:border-stone-300 [&>span:first-child]:bg-stone-100 [&>span:first-child>span]:bg-stone-400"
              />
            </div>

            {/* Min Rating */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="h-3.5 w-3.5 text-primary/80 fill-primary/60" />
                </div>
                <span className="text-sm font-medium text-foreground">Min Rating</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-md bg-stone-100 text-foreground font-medium">
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
            </div>

            {/* Sort By */}
            {onSortChange && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-stone-100 flex items-center justify-center">
                    <ArrowUpDown className="h-3.5 w-3.5 text-stone-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Sort By</span>
                </div>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger className="h-9 text-sm bg-white border-stone-200 rounded-lg focus:ring-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="pickup-date">Pickup Date (Soonest)</SelectItem>
                    <SelectItem value="delivery-date">Delivery Date (Soonest)</SelectItem>
                    <SelectItem value="price-desc">Price (High → Low)</SelectItem>
                    <SelectItem value="price-asc">Price (Low → High)</SelectItem>
                    <SelectItem value="distance-asc">Distance (Short → Long)</SelectItem>
                    <SelectItem value="distance-desc">Distance (Long → Short)</SelectItem>
                    <SelectItem value="pickup-city">Pickup City (A → Z)</SelectItem>
                    <SelectItem value="delivery-city">Delivery City (A → Z)</SelectItem>
                    <SelectItem value="condition">Condition (Best First)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
};
