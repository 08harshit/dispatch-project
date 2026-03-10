import { useEffect, useMemo, useState } from "react";
import { Truck as TruckIcon, LayoutGrid, Calendar, ArrowUpDown } from "lucide-react";
import { LoadsTypeTabs } from "@/components/loads/LoadsTypeTabs";
import { LoadStatusTabs } from "@/components/loads/LoadStatusTabs";
import { AssignedLoadsTable } from "@/components/loads/AssignedLoadsTable";
import { AvailableLoadsTable } from "@/components/loads/AvailableLoadsTable";
import { RouteDayPlanner } from "@/components/loads/RouteDayPlanner";
import { SmartRouteNotifications } from "@/components/loads/SmartRouteNotifications";
import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import { AvailableLoadsFilters, AvailableLoadsFiltersState, defaultFilters } from "@/components/filters/AvailableLoadsFilters";
import { getConditionScore } from "@/components/loads/ConditionIcons";
import { AssignedLoadsFilters, AssignedLoadsFiltersState, defaultAssignedFilters } from "@/components/filters/AssignedLoadsFilters";
import { RoutePlannerButton } from "@/components/loads/RoutePlannerButton";
import { RoutePlannerWizard } from "@/components/loads/RoutePlannerWizard";
import { Load } from "@/components/loads/LoadsTable";
import { useLoadNotifications, LoadNotification } from "@/hooks/useLoadNotifications";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";
import { useSavedLoads } from "@/hooks/useSavedLoads";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { parse, isWithinInterval, isAfter, isBefore, differenceInDays } from "date-fns";
import { addDemoAssignedNotification, demoNotificationToAssignedLoad, getDemoAssignedNotifications } from "@/lib/demoAssignedLoads";
import { useCourierContractsQuery } from "@/hooks/queries/useCourierContracts";


export const LoadsPage = () => {
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);
  const { addLoad, isInRoute } = useRoutePlanner();
  const { toggleBookmark, isBookmarked, bookmarkCount, bookmarkedIds } = useBookmarks();
  const { user } = useAuth();
  const { isSaved: isSavedByLead, toggleSave: onToggleSaveByLead } = useSavedLoads(!!user);

  // Main tab: available vs assigned vs bookmarked
  const [mainTab, setMainTab] = useState<"available" | "assigned" | "bookmarked">("available");
  
  // View mode: list vs planner
  const [viewMode, setViewMode] = useState<"list" | "planner">("list");
  
  // For assigned loads: status filter
  const [statusTab, setStatusTab] = useState("all");
  
  // Assigned loads state
  const [loads, setLoads] = useState<Load[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  
  // Available loads filters
  const [availableFilters, setAvailableFilters] = useState<AvailableLoadsFiltersState>(defaultFilters);
  
  // Sort
  const [availableSortBy, setAvailableSortBy] = useState<string>("date");
  const [assignedSortBy, setAssignedSortBy] = useState<string>("date");
  
  // Assigned loads filters
  const [assignedFilters, setAssignedFilters] = useState<AssignedLoadsFiltersState>(defaultAssignedFilters);

  // Available loads from shipper
  const { 
    notifications: availableLoads, 
    loading: availableLoading,
    acceptLoad,
    sendCounterOffer
  } = useLoadNotifications();

  const { loads: apiLoads, isLoading: apiLoading } = useCourierContractsQuery("signed,active,completed");

  useEffect(() => {
    if (apiLoads.length > 0) {
      setLoads(apiLoads);
    } else if (!apiLoading) {
      const demoAssigned = getDemoAssignedNotifications().map(demoNotificationToAssignedLoad);
      setLoads(demoAssigned);
    }
  }, [apiLoads, apiLoading]);

  // Counts for assigned loads status tabs
  const statusCounts = {
    all: loads.length,
    pickup: loads.filter((l) => l.status === "pickup").length,
    late: loads.filter((l) => l.status === "late").length,
    done: loads.filter((l) => l.status === "done").length,
  };

  // Filter and sort assigned loads
  const filteredAssignedLoads = useMemo(() => {
    const filtered = loads
      .filter((load) => statusTab === "all" || load.status === statusTab)
      .filter((load) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          load.loadId.toLowerCase().includes(query) ||
          load.vehicleInfo.make.toLowerCase().includes(query) ||
          load.vehicleInfo.model.toLowerCase().includes(query) ||
          load.pickup.city.toLowerCase().includes(query) ||
          load.delivery.city.toLowerCase().includes(query)
        );
      })
      .filter((load) => {
        if (!fromDate && !toDate) return true;
        const pickupDate = parse(load.pickupDate, "MM-dd-yyyy", new Date());
        if (fromDate && toDate) {
          return isWithinInterval(pickupDate, { start: fromDate, end: toDate });
        }
        if (fromDate) {
          return isAfter(pickupDate, fromDate) || pickupDate.getTime() === fromDate.getTime();
        }
        if (toDate) {
          return isBefore(pickupDate, toDate) || pickupDate.getTime() === toDate.getTime();
        }
        return true;
      })
      .filter((load) => {
        if (load.price < assignedFilters.minPrice || load.price > assignedFilters.maxPrice) {
          return false;
        }
        if (assignedFilters.pickupCity && !load.pickup.city.toLowerCase().includes(assignedFilters.pickupCity.toLowerCase())) {
          return false;
        }
        if (assignedFilters.pickupState && load.pickup.state.toUpperCase() !== assignedFilters.pickupState.toUpperCase()) {
          return false;
        }
        if (assignedFilters.deliveryCity && !load.delivery.city.toLowerCase().includes(assignedFilters.deliveryCity.toLowerCase())) {
          return false;
        }
        if (assignedFilters.deliveryState && load.delivery.state.toUpperCase() !== assignedFilters.deliveryState.toUpperCase()) {
          return false;
        }
        // Days listed filter
        if (assignedFilters.maxDaysListed < 30) {
          const daysListed = differenceInDays(new Date(), parse(load.pickupDate, "MM-dd-yyyy", new Date()));
          if (daysListed > assignedFilters.maxDaysListed) return false;
        }
        // Distance filter (assigned loads may not have distance, skip if undefined)
        if ((load as any).distance !== undefined) {
          if ((load as any).distance < assignedFilters.minDistance || (load as any).distance > assignedFilters.maxDistance) return false;
          if (assignedFilters.minPerMile > 0) {
            const ppm = load.price / (load as any).distance;
            if (ppm < assignedFilters.minPerMile) return false;
          }
        }
        return true;
      });
    
    // Sort
    return [...filtered].sort((a, b) => {
      switch (assignedSortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "pickup-city": return a.pickup.city.localeCompare(b.pickup.city);
        case "delivery-city": return a.delivery.city.localeCompare(b.delivery.city);
        case "city": return a.pickup.city.localeCompare(b.pickup.city);
        case "distance-asc": return ((a as any).distance || 0) - ((b as any).distance || 0);
        case "distance-desc": return ((b as any).distance || 0) - ((a as any).distance || 0);
        case "condition": {
          const defaultCond = { runs: true, starts: true, drivable: true, rolls: true };
          return getConditionScore(b.vehicleInfo.condition || defaultCond) - getConditionScore(a.vehicleInfo.condition || defaultCond);
        }
        case "pickup-date": {
          const dateA = parse(a.pickupDate, "MM-dd-yyyy", new Date());
          const dateB = parse(b.pickupDate, "MM-dd-yyyy", new Date());
          return dateA.getTime() - dateB.getTime();
        }
        case "delivery-date": {
          const dateA = parse(a.deliveryDate, "MM-dd-yyyy", new Date());
          const dateB = parse(b.deliveryDate, "MM-dd-yyyy", new Date());
          return dateA.getTime() - dateB.getTime();
        }
        case "date":
        default: {
          const dateA = parse(a.pickupDate, "MM-dd-yyyy", new Date());
          const dateB = parse(b.pickupDate, "MM-dd-yyyy", new Date());
          return dateB.getTime() - dateA.getTime();
        }
      }
    });
  }, [loads, statusTab, searchQuery, fromDate, toDate, assignedFilters, assignedSortBy]);

  // Filter and sort available loads
  const filteredAvailableLoads = useMemo(() => {
    const filtered = availableLoads
      .filter((load) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch = 
            load.vehicle.make.toLowerCase().includes(query) ||
            load.vehicle.model.toLowerCase().includes(query) ||
            load.pickup.city.toLowerCase().includes(query) ||
            load.delivery.city.toLowerCase().includes(query) ||
            load.shipper.name.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }
        
        if (load.distance < availableFilters.minDistance || load.distance > availableFilters.maxDistance) {
          return false;
        }
        if (load.price < availableFilters.minPrice || load.price > availableFilters.maxPrice) {
          return false;
        }
        const pricePerMile = load.price / load.distance;
        if (pricePerMile < availableFilters.minPerMile) {
          return false;
        }
        if (availableFilters.pickupCity && !load.pickup.city.toLowerCase().includes(availableFilters.pickupCity.toLowerCase())) {
          return false;
        }
        if (availableFilters.pickupState && load.pickup.state.toUpperCase() !== availableFilters.pickupState.toUpperCase()) {
          return false;
        }
        if (availableFilters.deliveryCity && !load.delivery.city.toLowerCase().includes(availableFilters.deliveryCity.toLowerCase())) {
          return false;
        }
        if (availableFilters.deliveryState && load.delivery.state.toUpperCase() !== availableFilters.deliveryState.toUpperCase()) {
          return false;
        }
        // Days listed filter
        if (availableFilters.maxDaysListed < 30) {
          const daysListed = differenceInDays(new Date(), new Date(load.createdAt));
          if (daysListed > availableFilters.maxDaysListed) return false;
        }
        // Shipper rating filter
        if (availableFilters.minRating > 0 && load.shipper.rating < availableFilters.minRating) {
          return false;
        }
        return true;
      });
    
    // Sort
    return [...filtered].sort((a, b) => {
      switch (availableSortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "distance-asc": return a.distance - b.distance;
        case "distance-desc": return b.distance - a.distance;
        case "pickup-city": return a.pickup.city.localeCompare(b.pickup.city);
        case "delivery-city": return a.delivery.city.localeCompare(b.delivery.city);
        case "city": return a.pickup.city.localeCompare(b.pickup.city);
        case "rating-desc": return b.shipper.rating - a.shipper.rating;
        case "pickup-date": return new Date(a.pickup.date).getTime() - new Date(b.pickup.date).getTime();
        case "delivery-date": return new Date(a.delivery.date).getTime() - new Date(b.delivery.date).getTime();
        case "condition": {
          const defaultCond = { runs: true, starts: true, drivable: true, rolls: true };
          return getConditionScore(b.vehicle.condition || defaultCond) - getConditionScore(a.vehicle.condition || defaultCond);
        }
        case "date":
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [availableLoads, searchQuery, availableFilters, availableSortBy]);

  // Bookmarked loads: merge available + assigned that are bookmarked
  const bookmarkedAvailableLoads = useMemo(() => {
    return availableLoads.filter((l) => bookmarkedIds.has(l.id));
  }, [availableLoads, bookmarkedIds]);

  const bookmarkedAssignedLoads = useMemo(() => {
    return loads.filter((l) => bookmarkedIds.has(l.id));
  }, [loads, bookmarkedIds]);

  const handleEdit = (load: Load) => {
    toast.info(`Editing load ${load.loadId}`);
  };

  const handleDelete = (loadId: string) => {
    setLoads((prev) => prev.filter((l) => l.id !== loadId));
    toast.success("Load deleted successfully");
  };

  const handleCancel = (loadId: string) => {
    setLoads((prev) => prev.filter((l) => l.id !== loadId));
    toast.success("Load cancelled successfully");
  };

  const handleView = (load: Load) => {
    toast.info(`Viewing load ${load.loadId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFromDate(undefined);
    setToDate(undefined);
    setAvailableFilters(defaultFilters);
    setAssignedFilters(defaultAssignedFilters);
  };
  
  const handleResetAvailableFilters = () => {
    setAvailableFilters(defaultFilters);
  };
  
  const handleResetAssignedFilters = () => {
    setAssignedFilters(defaultAssignedFilters);
  };

  const handleBid = async (loadId: string, price: number) => {
    const result = await sendCounterOffer(loadId, price);
    if (result.requiresAuth) {
      toast.error("Please sign in to submit offers");
    }
    return result;
  };

  const handleAccept = async (loadId: string, price: number) => {
    const source = availableLoads.find((l) => l.id === loadId);
    const result = await acceptLoad(loadId, price);
    if (result.requiresAuth) {
      toast.error("Please sign in to accept loads");
    }
    if (!result.requiresAuth && source) {
      setLoads((prev) => [demoNotificationToAssignedLoad({ ...source, status: "accepted" }), ...prev]);
    }
    return result;
  };

  const handleAddDemoAssignedLoads = () => {
    const candidates = availableLoads.slice(0, 3);
    if (candidates.length === 0) {
      toast.error("No available loads to assign");
      return;
    }
    const mapped = candidates.map((l) => {
      const accepted = { ...l, status: "accepted" };
      addDemoAssignedNotification(accepted);
      return demoNotificationToAssignedLoad(accepted);
    });
    setLoads((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const next = mapped.filter((m) => !existing.has(m.id));
      return [...next, ...prev];
    });
  };

  const handleAddToRoute = (load: LoadNotification) => {
    if (isInRoute(load.id)) {
      toast.info(`${load.vehicle.make} ${load.vehicle.model} is already in your route`);
      return;
    }
    addLoad(load);
    toast.success(`Added ${load.vehicle.year} ${load.vehicle.make} ${load.vehicle.model} to route`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <TruckIcon className="h-5 w-5 text-amber-700" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[10px] text-amber-600 uppercase tracking-[0.25em] font-medium">Management</p>
          <h1 className="text-2xl font-semibold text-stone-700 tracking-tight">Loads</h1>
        </div>
      </div>

      {/* Main Type Tabs: Available / Assigned / Bookmarked */}
      <LoadsTypeTabs
        activeTab={mainTab}
        onTabChange={setMainTab}
        availableCount={availableLoads.length}
        assignedCount={loads.length}
        bookmarkedCount={bookmarkCount}
      />

      {/* Search, Date Filters, View Toggle and Route Planner */}
      {mainTab !== "bookmarked" && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={mainTab === "available" 
                ? "Search by vehicle, city, shipper..." 
                : "Search by Load ID, vehicle, city..."}
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onClearFilters={handleClearFilters}
            />
          </div>
          
          {mainTab === "available" && (
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-9 px-3 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-amber-100 text-amber-700 shadow-sm font-semibold"
                    : "text-stone-400 hover:text-stone-600"
                )}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("planner")}
                className={cn(
                  "h-9 px-3 rounded-lg transition-all",
                  viewMode === "planner"
                    ? "bg-emerald-100 text-emerald-700 shadow-sm font-semibold"
                    : "text-stone-400 hover:text-stone-600"
                )}
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                Planner
              </Button>
            </div>
          )}
          
          <RoutePlannerButton onClick={() => setRoutePlannerOpen(true)} />
        </div>
      )}

      {/* Route Planner Wizard */}
      <RoutePlannerWizard 
        open={routePlannerOpen} 
        onOpenChange={setRoutePlannerOpen}
        availableLoads={availableLoads}
      />

      {/* Content based on main tab */}
      {mainTab === "available" ? (
        <>
          <AvailableLoadsFilters
            filters={availableFilters}
            onFiltersChange={setAvailableFilters}
            onReset={handleResetAvailableFilters}
            resultCount={filteredAvailableLoads.length}
            sortBy={availableSortBy}
            onSortChange={setAvailableSortBy}
          />
          
          {viewMode === "list" ? (
            <AvailableLoadsTable
              loads={filteredAvailableLoads}
              onBid={handleBid}
              onAccept={handleAccept}
              onAddToRoute={handleAddToRoute}
              loading={availableLoading}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
              isSavedByLead={user ? isSavedByLead : undefined}
              onToggleSaveByLead={user ? (leadId) => onToggleSaveByLead(leadId).catch(() => toast.error("Failed to save")) : undefined}
            />
          ) : (
            <RouteDayPlanner
              loads={filteredAvailableLoads}
              onAddToRoute={handleAddToRoute}
              isInRoute={isInRoute}
            />
          )}
        </>
      ) : mainTab === "assigned" ? (
        <>
          <LoadStatusTabs
            activeTab={statusTab}
            onTabChange={setStatusTab}
            counts={statusCounts}
          />
          <AssignedLoadsFilters
            filters={assignedFilters}
            onFiltersChange={setAssignedFilters}
            onReset={handleResetAssignedFilters}
            resultCount={filteredAssignedLoads.length}
            sortBy={assignedSortBy}
            onSortChange={setAssignedSortBy}
          />
          <AssignedLoadsTable
            loads={filteredAssignedLoads}
            loading={apiLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onCancel={handleCancel}
            onAddDemoLoads={handleAddDemoAssignedLoads}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        </>
      ) : (
        /* Bookmarked Tab */
        <div className="space-y-6">
          {bookmarkedAvailableLoads.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Available Loads</h3>
              <AvailableLoadsTable
                loads={bookmarkedAvailableLoads}
                onBid={handleBid}
                onAccept={handleAccept}
                onAddToRoute={handleAddToRoute}
                isBookmarked={isBookmarked}
                onToggleBookmark={toggleBookmark}
                isSavedByLead={user ? isSavedByLead : undefined}
                onToggleSaveByLead={user ? (leadId) => onToggleSaveByLead(leadId).catch(() => toast.error("Failed to save")) : undefined}
              />
            </div>
          )}
          {bookmarkedAssignedLoads.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Assigned Loads</h3>
              <AssignedLoadsTable
                loads={bookmarkedAssignedLoads}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onCancel={handleCancel}
                isBookmarked={isBookmarked}
                onToggleBookmark={toggleBookmark}
              />
            </div>
          )}
          {bookmarkedAvailableLoads.length === 0 && bookmarkedAssignedLoads.length === 0 && (
            <div className="bg-white rounded-2xl border border-violet-100 p-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <TruckIcon className="h-7 w-7 text-violet-400" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-stone-700">No bookmarked loads</p>
                  <p className="text-sm text-stone-400 mt-1">Bookmark loads from the Available or Assigned tabs to see them here</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Route Notifications */}
      <SmartRouteNotifications 
        loads={loads}
        onLoadUpdate={(loadId, status) => {
          setLoads(prev => prev.map(l => 
            l.id === loadId ? { ...l, status: status as "pickup" | "late" | "done" } : l
          ));
        }}
      />
    </div>
  );
};
