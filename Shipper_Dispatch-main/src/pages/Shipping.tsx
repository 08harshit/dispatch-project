import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, AlertTriangle, DollarSign, Calendar, Truck, Clock, MapPin, Sparkles, Send, FileText, Check } from "lucide-react";
import { isWithinInterval, parse, format } from "date-fns";
import MainLayout from "@/components/layout/MainLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import StatusTabs from "@/components/dashboard/StatusTabs";
import SearchFilter from "@/components/dashboard/SearchFilter";
import FilterCards, { FilterCardData } from "@/components/dashboard/FilterCards";
import VehicleTable, { Vehicle, LocationType, PaymentMethod } from "@/components/dashboard/VehicleTable";
import ViewVehicleModal from "@/components/dashboard/ViewVehicleModal";
import EditVehicleModal from "@/components/dashboard/EditVehicleModal";
import DeleteVehicleModal from "@/components/dashboard/DeleteVehicleModal";
import AssignVehicleModal from "@/components/dashboard/AssignVehicleModal";
import AutoMatchingModal from "@/components/shipping/AutoMatchingModal";
import MatchingHistoryModal from "@/components/shipping/MatchingHistoryModal";
import ConditionReportModal from "@/components/shipping/ConditionReportModal";
import ShipmentDocsModal from "@/components/shipping/ShipmentDocsModal";
import ColumnFiltersBar, { ColumnFilters } from "@/components/shipping/ColumnFiltersBar";
import { Button } from "@/components/ui/button";
import { mockVehicles as initialMockVehicles } from "@/data/mockVehicles";
import { useToast } from "@/hooks/use-toast";
import LocationSection from "@/components/post-vehicle/LocationSection";
import VehicleEntryCard from "@/components/post-vehicle/VehicleEntryCard";
import VehicleSelector from "@/components/post-vehicle/VehicleSelector";
import ShippingDetailsSection from "@/components/post-vehicle/ShippingDetailsSection";
import { VehicleEntry, LocationContact, PostVehicleFormData } from "@/types/vehicle";
import { ConditionReport } from "@/types/conditionReport";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const createEmptyVehicle = (): VehicleEntry => ({
  id: crypto.randomUUID(),
  vin: "",
  year: "",
  make: "",
  model: "",
  type: "",
  color: "",
  condition: {
    runs: true,
    rolls: true,
    starts: true,
    damaged: false,
  },
  conditionNotes: "",
  conditionPhotos: [],
});

const createEmptyContact = (): LocationContact => ({
  name: "",
  phone: "",
  email: "",
});

const createEmptyFormData = (): PostVehicleFormData => ({
  pickupAddress: "",
  pickupLocationType: "",
  pickupContact: createEmptyContact(),
  pickupCoordinates: { latitude: null, longitude: null },
  deliveryAddress: "",
  deliveryLocationType: "",
  deliveryContact: createEmptyContact(),
  deliveryCoordinates: { latitude: null, longitude: null },
  vehicles: [],
  dateAvailable: undefined,
  etaDeliveryFrom: undefined,
  etaDeliveryTo: undefined,
  price: "",
  paymentType: "",
  notes: "",
});

const Shipping = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialMockVehicles);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterCard, setActiveFilterCard] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    pickupState: "",
    deliveryState: "",
    status: "",
    pickupType: "",
    deliveryType: "",
    paymentMethod: "",
    available: "",
  });

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Post Vehicle Modal state
  const [isPostVehicleOpen, setIsPostVehicleOpen] = useState(false);
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<VehicleEntry | null>(null);
  const [formData, setFormData] = useState<PostVehicleFormData>(createEmptyFormData());
  
  // Condition Report state (for Post Vehicle form)
  const [conditionReportOpen, setConditionReportOpen] = useState(false);
  const [conditionReport, setConditionReport] = useState<ConditionReport | null>(null);
  const [conditionReportVehicle, setConditionReportVehicle] = useState<VehicleEntry | null>(null);
  
  // Condition Report state (for existing vehicles in table)
  const [vehicleConditionReports, setVehicleConditionReports] = useState<Record<string, ConditionReport>>({});
  const [tableConditionReportOpen, setTableConditionReportOpen] = useState(false);
  const [tableConditionReportVehicleId, setTableConditionReportVehicleId] = useState<string | null>(null);
  const [tableConditionReport, setTableConditionReport] = useState<ConditionReport | null>(null);
  
  // Auto Matching Modal state
  const [isAutoMatchingOpen, setIsAutoMatchingOpen] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [currentLeadPrice, setCurrentLeadPrice] = useState<number>(0);
  const [currentPickupCoords, setCurrentPickupCoords] = useState<{ lat: number; lng: number }>({ lat: 36.29, lng: 6.73 });
  const [currentDeliveryCoords, setCurrentDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // History Modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLeadId, setHistoryLeadId] = useState<string | null>(null);
  const [historyListingId, setHistoryListingId] = useState<string | undefined>(undefined);

  // Shipment Docs Modal state
  const [isShipmentDocsOpen, setIsShipmentDocsOpen] = useState(false);
  const [shipmentDocsVehicle, setShipmentDocsVehicle] = useState<Vehicle | null>(null);

  // Fetch booked leads from Supabase and merge with mock data
  useEffect(() => {
    const fetchBookedLeads = async () => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          *,
          negotiations!inner(
            status,
            current_offer,
            courier_id,
            couriers:courier_id(name)
          )
        `)
        .eq('negotiations.status', 'accepted');

      if (error) {
        console.error('Error fetching booked leads:', error);
        return;
      }

      if (leads && leads.length > 0) {
        // Convert leads to Vehicle format
        const bookedVehicles: Vehicle[] = leads.map((lead) => {
          const negotiation = lead.negotiations[0];
          const finalPrice = negotiation?.current_offer || lead.initial_price || 0;
          
          // Parse address to extract city, state, zip
          const parseAddress = (address: string) => {
            // Simple parsing - assumes format like "City, State ZIP" or full address
            const parts = address.split(',').map(p => p.trim());
            const lastPart = parts[parts.length - 1] || '';
            const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})?/);
            
            return {
              city: parts[0] || address,
              state: stateZipMatch?.[1] || '',
              zip: stateZipMatch?.[2] || '',
            };
          };

          const pickupParsed = parseAddress(lead.pickup_address);
          const deliveryParsed = parseAddress(lead.delivery_address);

          const mapLocationType = (type: string | null): LocationType => {
            if (type === 'auction' || type === 'dealer' || type === 'private') {
              return type;
            }
            return 'dealer';
          };

          const mapPaymentMethod = (type: string | null): PaymentMethod => {
            if (type === 'cod' || type === 'ach' || type === 'wire' || type === 'check') {
              return type;
            }
            return 'cod';
          };

          return {
            id: lead.id,
            listingId: lead.listing_id,
            make: lead.vehicle_make || 'Unknown',
            model: lead.vehicle_model || 'Unknown',
            year: parseInt(lead.vehicle_year || '0') || new Date().getFullYear(),
            vin: lead.vehicle_vin || '',
            stockNumber: lead.listing_id,
            pickupLocation: lead.pickup_address,
            pickupCity: pickupParsed.city,
            pickupState: pickupParsed.state,
            pickupZip: pickupParsed.zip,
            pickupType: mapLocationType(lead.pickup_location_type),
            deliveryLocation: lead.delivery_address,
            deliveryCity: deliveryParsed.city,
            deliveryState: deliveryParsed.state,
            deliveryZip: deliveryParsed.zip,
            deliveryType: mapLocationType(lead.delivery_location_type),
            pickupDate: format(new Date(), 'MM-dd-yyyy'),
            deliveryDate: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'MM-dd-yyyy'),
            status: 'assigned' as const,
            isActive: true,
            cost: finalPrice,
            paymentMethod: mapPaymentMethod(lead.payment_type),
          };
        });

        // Merge with mock vehicles (booked ones come first)
        setVehicles([...bookedVehicles, ...initialMockVehicles]);
      }
    };

    fetchBookedLeads();

    // Subscribe to realtime updates for negotiations
    const channel = supabase
      .channel('booked-leads')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negotiations',
          filter: 'status=eq.accepted',
        },
        () => {
          // Refetch when a negotiation is accepted
          fetchBookedLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Post Vehicle form handlers
  const updatePickupContact = (field: keyof LocationContact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      pickupContact: { ...prev.pickupContact, [field]: value },
    }));
  };

  const updateDeliveryContact = (field: keyof LocationContact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      deliveryContact: { ...prev.deliveryContact, [field]: value },
    }));
  };

  // Add vehicle from inventory dropdown
  const handleAddFromInventory = (inventoryVehicle: {
    id: string;
    vin: string;
    year: string;
    make: string;
    model: string;
    type: string;
    color: string;
  }) => {
    const vehicle: VehicleEntry = {
      id: crypto.randomUUID(),
      vin: inventoryVehicle.vin,
      year: inventoryVehicle.year,
      make: inventoryVehicle.make,
      model: inventoryVehicle.model,
      type: inventoryVehicle.type,
      color: inventoryVehicle.color,
      condition: {
        runs: true,
        rolls: true,
        starts: true,
        damaged: false,
      },
      conditionNotes: "",
      conditionPhotos: [],
    };
    
    setFormData((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, vehicle],
    }));
  };

  // Handle add new vehicle click (for manual entry)
  const handleAddNewVehicle = () => {
    setNewVehicle(createEmptyVehicle());
    setShowNewVehicleForm(true);
  };

  // Update new vehicle being entered
  const updateNewVehicle = (id: string, updates: Partial<VehicleEntry>) => {
    if (newVehicle) {
      setNewVehicle({ ...newVehicle, ...updates });
    }
  };

  // Save new vehicle from manual entry
  const handleSaveNewVehicle = () => {
    if (newVehicle && newVehicle.vin && newVehicle.year && newVehicle.make && newVehicle.model) {
      setFormData((prev) => ({
        ...prev,
        vehicles: [...prev.vehicles, newVehicle],
      }));
      setNewVehicle(null);
      setShowNewVehicleForm(false);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in VIN, Year, Make, and Model.",
        variant: "destructive",
      });
    }
  };

  // Cancel new vehicle entry
  const handleCancelNewVehicle = () => {
    setNewVehicle(null);
    setShowNewVehicleForm(false);
  };

  const updateVehicle = (id: string, updates: Partial<VehicleEntry>) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    }));
  };

  const removeVehicle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
    }));
  };

  const handlePostVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in pickup and delivery addresses.",
        variant: "destructive",
      });
      return;
    }

    if (formData.vehicles.some(v => !v.vin || !v.year || !v.make || !v.model)) {
      toast({
        title: "Missing Vehicle Information",
        description: "Please fill in all required vehicle fields (VIN, Year, Make, Model).",
        variant: "destructive",
      });
      return;
    }

    // Save lead to database
    const vehicle = formData.vehicles[0]; // For now, save first vehicle
    const listingId = `VH-${Date.now().toString(36).toUpperCase()}`;
    const price = parseFloat(formData.price) || 0;

    try {
      const { data: lead, error } = await supabase.from('leads').insert({
        listing_id: listingId,
        pickup_address: formData.pickupAddress,
        pickup_location_type: formData.pickupLocationType,
        pickup_contact_name: formData.pickupContact.name,
        pickup_contact_phone: formData.pickupContact.phone,
        pickup_contact_email: formData.pickupContact.email,
        delivery_address: formData.deliveryAddress,
        delivery_location_type: formData.deliveryLocationType,
        delivery_contact_name: formData.deliveryContact.name,
        delivery_contact_phone: formData.deliveryContact.phone,
        delivery_contact_email: formData.deliveryContact.email,
        vehicle_year: vehicle.year,
        vehicle_make: vehicle.make,
        vehicle_model: vehicle.model,
        vehicle_vin: vehicle.vin,
        vehicle_type: vehicle.type,
        vehicle_color: vehicle.color,
        vehicle_runs: vehicle.condition.runs,
        vehicle_rolls: vehicle.condition.rolls,
        initial_price: price,
        payment_type: formData.paymentType,
        notes: formData.notes,
      }).select().single();

      if (error) throw error;

      toast({
        title: "Vehicle Posted Successfully",
        description: "Now let's find a courier for your shipment.",
      });
      
      setIsPostVehicleOpen(false);
      setFormData(createEmptyFormData());
      
      // Open auto matching modal
      if (lead) {
        setCurrentLeadId(lead.id);
        setCurrentLeadPrice(price);
        // Use pickup coordinates if available, otherwise default
        if (formData.pickupCoordinates.latitude && formData.pickupCoordinates.longitude) {
          setCurrentPickupCoords({ 
            lat: formData.pickupCoordinates.latitude, 
            lng: formData.pickupCoordinates.longitude 
          });
        }
        setIsAutoMatchingOpen(true);
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Error",
        description: "Failed to save vehicle listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenPostVehicle = () => {
    setFormData(createEmptyFormData());
    setIsPostVehicleOpen(true);
  };

  const statusCounts = useMemo(() => ({
    all: vehicles.length,
    not_assigned: vehicles.filter((v) => v.status === "not_assigned").length,
    assigned: vehicles.filter((v) => v.status === "assigned").length,
    picked_up: vehicles.filter((v) => v.status === "picked_up").length,
    delivered: vehicles.filter((v) => v.status === "delivered").length,
    canceled: vehicles.filter((v) => v.status === "canceled").length,
  }), [vehicles]);

  const statusTabs = [
    { id: "all", label: "All", count: statusCounts.all },
    { id: "not_assigned", label: "Not Assigned", count: statusCounts.not_assigned },
    { id: "assigned", label: "Assigned", count: statusCounts.assigned },
    { id: "picked_up", label: "Picked Up", count: statusCounts.picked_up },
    { id: "delivered", label: "Delivered", count: statusCounts.delivered },
    { id: "canceled", label: "Canceled", count: statusCounts.canceled },
  ];

  const filterCardCounts = useMemo(() => {
    return {
      today: vehicles.filter(v => v.pickupDate.includes("01-20")).length,
      inTransit: vehicles.filter(v => v.status === "picked_up").length,
      delayed: vehicles.filter(v => v.status === "not_assigned").length,
      nearbyLocations: [...new Set(vehicles.map(v => v.pickupLocation.split(",")[1]?.trim()))].length,
    };
  }, [vehicles]);

  const filterCards: FilterCardData[] = [
    {
      id: "today",
      label: "Pickup Today",
      value: `${filterCardCounts.today} vehicles`,
      icon: <Calendar size={18} />,
    },
    {
      id: "in-transit",
      label: "In Transit",
      value: `${filterCardCounts.inTransit} vehicles`,
      icon: <Truck size={18} />,
    },
    {
      id: "delayed",
      label: "Delayed",
      value: `${filterCardCounts.delayed} vehicle${filterCardCounts.delayed !== 1 ? "s" : ""}`,
      icon: <Clock size={18} />,
    },
    {
      id: "nearby",
      label: "Pickup States",
      value: `${filterCardCounts.nearbyLocations} states`,
      icon: <MapPin size={18} />,
    },
  ];

  // Compute available filter options from vehicles data
  const filterOptions = useMemo(() => {
    const pickupStates = [...new Set(vehicles.map(v => v.pickupState).filter(Boolean))].sort();
    const deliveryStates = [...new Set(vehicles.map(v => v.deliveryState).filter(Boolean))].sort();
    const statuses = [...new Set(vehicles.map(v => v.status).filter(Boolean))].sort();
    const locationTypes = ["auction", "dealer", "private"];
    const paymentMethods = ["cod", "ach", "wire", "check"];
    const availableStatuses = ["Active", "Not Active"];
    
    return {
      pickupStates,
      deliveryStates,
      statuses,
      locationTypes,
      paymentMethods,
      availableStatuses,
    };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    let result = activeStatus === "all" ? vehicles : vehicles.filter(v => v.status === activeStatus);
    
    if (activeFilterCard) {
      switch (activeFilterCard) {
        case "today":
          result = result.filter(v => v.pickupDate.includes("01-20"));
          break;
        case "in-transit":
          result = result.filter(v => v.status === "picked_up");
          break;
        case "delayed":
          result = result.filter(v => v.status === "not_assigned");
          break;
        case "nearby":
          result = result.filter(v => v.pickupLocation.includes("CA"));
          break;
      }
    }
    
    // Apply column filters
    if (columnFilters.pickupState) {
      result = result.filter(v => v.pickupState === columnFilters.pickupState);
    }
    if (columnFilters.deliveryState) {
      result = result.filter(v => v.deliveryState === columnFilters.deliveryState);
    }
    if (columnFilters.status) {
      result = result.filter(v => v.status === columnFilters.status);
    }
    if (columnFilters.pickupType) {
      result = result.filter(v => v.pickupType === columnFilters.pickupType);
    }
    if (columnFilters.deliveryType) {
      result = result.filter(v => v.deliveryType === columnFilters.deliveryType);
    }
    if (columnFilters.paymentMethod) {
      result = result.filter(v => v.paymentMethod === columnFilters.paymentMethod);
    }
    if (columnFilters.available) {
      const isActive = columnFilters.available === "Active";
      result = result.filter(v => v.isActive === isActive);
    }
    
    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      result = result.filter(v => {
        // Parse the date string (format: "MM-DD-YYYY")
        const pickupDate = parse(v.pickupDate, "MM-dd-yyyy", new Date());
        const deliveryDate = parse(v.deliveryDate, "MM-dd-yyyy", new Date());
        
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(pickupDate, { start: dateRange.from, end: dateRange.to }) ||
                 isWithinInterval(deliveryDate, { start: dateRange.from, end: dateRange.to });
        } else if (dateRange.from) {
          return pickupDate >= dateRange.from || deliveryDate >= dateRange.from;
        } else if (dateRange.to) {
          return pickupDate <= dateRange.to || deliveryDate <= dateRange.to;
        }
        return true;
      });
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.vin.toLowerCase().includes(query) ||
          v.listingId.toLowerCase().includes(query) ||
          v.pickupLocation.toLowerCase().includes(query) ||
          v.deliveryLocation.toLowerCase().includes(query) ||
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [vehicles, activeStatus, searchQuery, activeFilterCard, dateRange, columnFilters]);

  const totalCost = vehicles.reduce((sum, v) => sum + v.cost, 0);
  const alertCount = statusCounts.not_assigned + statusCounts.canceled;

  const hasColumnFilters = Object.values(columnFilters).some(Boolean);
  const hasActiveFilters = activeFilterCard || searchQuery || dateRange.from || dateRange.to || hasColumnFilters;

  const clearAllFilters = () => {
    setActiveFilterCard(null);
    setSearchQuery("");
    setDateRange({ from: undefined, to: undefined });
    setColumnFilters({
      pickupState: "",
      deliveryState: "",
      status: "",
      pickupType: "",
      deliveryType: "",
      paymentMethod: "",
      available: "",
    });
  };

  return (
    <MainLayout>
      {/* Header with gradient accent */}
      <div className="relative mb-10">
        {/* Decorative background elements */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-20 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <Truck size={20} className="text-white" />
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  Live Dashboard
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Shipping Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage and track your vehicle shipments in real-time</p>
            </div>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={handleOpenPostVehicle}>
              <Sparkles size={18} />
              Post Vehicle
            </Button>
          </div>
        </div>

        {/* Stats Cards with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Listings"
            value={statusCounts.all}
            icon={<Package size={24} />}
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="Alerts"
            value={alertCount}
            icon={<AlertTriangle size={24} />}
            trend={{ value: 3, positive: false }}
          />
          <StatsCard
            title="Total Cost"
            value={`$${totalCost.toLocaleString()}`}
            icon={<DollarSign size={24} />}
            trend={{ value: 8, positive: true }}
          />
        </div>

        {/* Filter Cards */}
        <FilterCards
          cards={filterCards}
          activeFilter={activeFilterCard}
          onFilterChange={setActiveFilterCard}
        />

        {/* Status Tabs Section */}
        <div className="mb-4">
          <StatusTabs
            tabs={statusTabs}
            activeTab={activeStatus}
            onTabChange={setActiveStatus}
          />
        </div>

        {/* Search and Date Filter Section */}
        <div className="flex items-center justify-end gap-4 mb-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30">
          <SearchFilter
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* Column Filters Section */}
        <div className="mb-6 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30">
          <ColumnFiltersBar
            filters={columnFilters}
            onFiltersChange={setColumnFilters}
            availableOptions={filterOptions}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredVehicles.length}</span> vehicles
          </p>
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Vehicle Table */}
        <VehicleTable
          vehicles={filteredVehicles}
          conditionReports={vehicleConditionReports}
          onView={(v) => {
            setSelectedVehicle(v);
            setViewModalOpen(true);
          }}
          onEdit={(v) => {
            setSelectedVehicle(v);
            setEditModalOpen(true);
          }}
          onDelete={(v) => {
            setSelectedVehicle(v);
            setDeleteModalOpen(true);
          }}
          onAssign={(v) => {
            setSelectedVehicle(v);
            setAssignModalOpen(true);
          }}
          onChain={(v) => console.log("Chain:", v)}
          onHistory={(v) => {
            setHistoryListingId(v.listingId);
            setHistoryLeadId(v.id);
            setIsHistoryOpen(true);
          }}
          onViewDocs={(v) => {
            setShipmentDocsVehicle(v);
            setIsShipmentDocsOpen(true);
          }}
          onStatusChange={async (v, newStatus) => {
            const previousStatus = v.status;
            setVehicles(prev => prev.map(vehicle => 
              vehicle.id === v.id ? { ...vehicle, status: newStatus } : vehicle
            ));
            
            // Log the status change to activity_log
            try {
              await supabase.from('activity_log').insert({
                lead_id: v.id,
                action_type: 'status_change',
                previous_value: previousStatus,
                new_value: newStatus,
                performed_by: 'Admin', // TODO: Replace with actual user name when auth is added
                notes: `Status changed from "${previousStatus}" to "${newStatus}"`,
              });
            } catch (err) {
              console.error('Error logging activity:', err);
            }
            
            toast({
              title: "Status Updated",
              description: `${v.listingId} status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
            });
          }}
          onToggleActive={(v, isActive) => {
            setVehicles(prev => prev.map(vehicle => {
              if (vehicle.id !== v.id) return vehicle;
              // When deactivating, set status to not_assigned
              // When activating, keep current status
              const newStatus = !isActive ? 'not_assigned' : vehicle.status;
              return { ...vehicle, isActive, status: newStatus as Vehicle["status"] };
            }));
            toast({
              title: isActive ? "Vehicle Activated" : "Vehicle Deactivated",
              description: `${v.listingId} is now ${isActive ? 'active' : 'inactive'}`,
            });
          }}
        />

        {/* Empty State */}
        {filteredVehicles.length === 0 && (
          <div className="dashboard-card py-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Package size={40} className="text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No vehicles found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery || activeFilterCard
                  ? "Try adjusting your search or filters to find what you're looking for"
                  : "Get started by posting your first vehicle to the platform"}
              </p>
              {!searchQuery && !activeFilterCard && (
                <Button className="mt-6 gap-2" onClick={handleOpenPostVehicle}>
                  <Plus size={18} />
                  Post Your First Vehicle
                </Button>
              )}
            </div>
          </div>
        )}


        {/* Modals */}
        <ViewVehicleModal
          vehicle={selectedVehicle}
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
        />

        <EditVehicleModal
          vehicle={selectedVehicle}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSave={(updatedVehicle) => {
            setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
          }}
        />

        <DeleteVehicleModal
          vehicle={selectedVehicle}
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={(vehicleToDelete) => {
            setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id));
          }}
        />

        <AssignVehicleModal
          vehicle={selectedVehicle}
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
        />

        {/* Post Vehicle Dialog */}
        <Dialog open={isPostVehicleOpen} onOpenChange={setIsPostVehicleOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Post Vehicle</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handlePostVehicleSubmit} className="space-y-6 mt-4">
              <LocationSection
                type="pickup"
                address={formData.pickupAddress}
                locationType={formData.pickupLocationType}
                contact={formData.pickupContact}
                onAddressChange={(value) =>
                  setFormData((prev) => ({ ...prev, pickupAddress: value }))
                }
                onLocationTypeChange={(value) =>
                  setFormData((prev) => ({ ...prev, pickupLocationType: value }))
                }
                onContactChange={updatePickupContact}
                onCoordinatesChange={(lat, lng) =>
                  setFormData((prev) => ({ ...prev, pickupCoordinates: { latitude: lat, longitude: lng } }))
                }
              />

              <LocationSection
                type="delivery"
                address={formData.deliveryAddress}
                locationType={formData.deliveryLocationType}
                contact={formData.deliveryContact}
                onAddressChange={(value) =>
                  setFormData((prev) => ({ ...prev, deliveryAddress: value }))
                }
                onLocationTypeChange={(value) =>
                  setFormData((prev) => ({ ...prev, deliveryLocationType: value }))
                }
                onContactChange={updateDeliveryContact}
                onCoordinatesChange={(lat, lng) =>
                  setFormData((prev) => ({ ...prev, deliveryCoordinates: { latitude: lat, longitude: lng } }))
                }
              />

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Vehicles</h2>
                
                {/* Show new vehicle form if adding manually */}
                {showNewVehicleForm && newVehicle ? (
                  <div className="space-y-3">
                    <VehicleEntryCard
                      vehicle={newVehicle}
                      index={formData.vehicles.length}
                      onUpdate={updateNewVehicle}
                      onRemove={() => {}}
                      canRemove={false}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelNewVehicle}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveNewVehicle}
                      >
                        <Plus size={14} className="mr-1" />
                        Add Vehicle
                      </Button>
                    </div>
                  </div>
                ) : (
                  <VehicleSelector
                    selectedVehicles={formData.vehicles}
                    onAddFromInventory={handleAddFromInventory}
                    onRemoveVehicle={removeVehicle}
                    onAddNewVehicle={handleAddNewVehicle}
                  />
                )}
              </div>

              {/* Condition Report Section */}
              {formData.vehicles.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Condition Report
                  </h2>
                  <div className="grid gap-2">
                    {formData.vehicles.map((vehicle) => (
                      <Button
                        key={vehicle.id}
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start gap-3",
                          conditionReport && conditionReportVehicle?.id === vehicle.id
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                            : ""
                        )}
                        onClick={() => {
                          setConditionReportVehicle(vehicle);
                          setConditionReportOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 text-left">
                          {vehicle.year} {vehicle.make} {vehicle.model || 'Vehicle'}
                        </span>
                        {conditionReport && conditionReportVehicle?.id === vehicle.id ? (
                          <>
                            <span className="text-xs text-emerald-600">Report Added</span>
                            <Check className="h-4 w-4" />
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Add Report</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <ShippingDetailsSection
                dateAvailable={formData.dateAvailable}
                etaDeliveryFrom={formData.etaDeliveryFrom}
                etaDeliveryTo={formData.etaDeliveryTo}
                price={formData.price}
                paymentType={formData.paymentType}
                notes={formData.notes}
                onDateAvailableChange={(date) =>
                  setFormData((prev) => ({ ...prev, dateAvailable: date }))
                }
                onEtaDeliveryFromChange={(date) =>
                  setFormData((prev) => ({ ...prev, etaDeliveryFrom: date }))
                }
                onEtaDeliveryToChange={(date) =>
                  setFormData((prev) => ({ ...prev, etaDeliveryTo: date }))
                }
                onPriceChange={(value) =>
                  setFormData((prev) => ({ ...prev, price: value }))
                }
                onPaymentTypeChange={(value) =>
                  setFormData((prev) => ({ ...prev, paymentType: value }))
                }
                onNotesChange={(value) =>
                  setFormData((prev) => ({ ...prev, notes: value }))
                }
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPostVehicleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Send size={18} className="mr-2" />
                  Post Vehicle
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Auto Matching Modal */}
        <AutoMatchingModal
          open={isAutoMatchingOpen}
          onOpenChange={setIsAutoMatchingOpen}
          leadId={currentLeadId}
          initialPrice={currentLeadPrice}
          pickupLatitude={currentPickupCoords.lat}
          pickupLongitude={currentPickupCoords.lng}
          deliveryLatitude={currentDeliveryCoords?.lat}
          deliveryLongitude={currentDeliveryCoords?.lng}
        />
        
        {/* History Modal */}
        <MatchingHistoryModal
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          leadId={historyLeadId}
          listingId={historyListingId}
        />
        
        {/* Condition Report Modal (Post Vehicle form) */}
        {conditionReportVehicle && (
          <ConditionReportModal
            open={conditionReportOpen}
            onOpenChange={setConditionReportOpen}
            vehicleId={conditionReportVehicle.id}
            vehicleInfo={{
              year: conditionReportVehicle.year,
              make: conditionReportVehicle.make,
              model: conditionReportVehicle.model,
              vin: conditionReportVehicle.vin,
            }}
            existingReport={conditionReport || undefined}
            onSave={(report) => setConditionReport(report)}
          />
        )}
        
        {/* Condition Report Modal (Table Docs column) */}
        {tableConditionReportVehicleId && (
          <ConditionReportModal
            open={tableConditionReportOpen}
            onOpenChange={setTableConditionReportOpen}
            vehicleId={tableConditionReportVehicleId}
            vehicleInfo={{
              year: filteredVehicles.find(v => v.id === tableConditionReportVehicleId)?.year?.toString() || '',
              make: filteredVehicles.find(v => v.id === tableConditionReportVehicleId)?.make || '',
              model: filteredVehicles.find(v => v.id === tableConditionReportVehicleId)?.model || '',
              vin: filteredVehicles.find(v => v.id === tableConditionReportVehicleId)?.vin || '',
            }}
            existingReport={tableConditionReport || undefined}
            onSave={(report) => {
              setTableConditionReport(report);
              setVehicleConditionReports(prev => ({
                ...prev,
                [tableConditionReportVehicleId]: report
              }));
              toast({
                title: "Condition Report Saved",
                description: "The vehicle condition report has been saved successfully.",
              });
            }}
            onDelete={() => {
              setVehicleConditionReports(prev => {
                const updated = { ...prev };
                delete updated[tableConditionReportVehicleId];
                return updated;
              });
              setTableConditionReport(null);
              toast({
                title: "Condition Report Deleted",
                description: "The vehicle condition report has been removed.",
              });
            }}
          />
        )}

        {/* Shipment Documents Modal */}
        {shipmentDocsVehicle && (
          <ShipmentDocsModal
            open={isShipmentDocsOpen}
            onOpenChange={setIsShipmentDocsOpen}
            leadId={shipmentDocsVehicle.id}
            vehicleInfo={{
              listingId: shipmentDocsVehicle.listingId,
              year: shipmentDocsVehicle.year,
              make: shipmentDocsVehicle.make,
              model: shipmentDocsVehicle.model,
              vin: shipmentDocsVehicle.vin,
            }}
            hasConditionReport={!!vehicleConditionReports[shipmentDocsVehicle.id]}
            onOpenConditionReport={() => {
              setTableConditionReportVehicleId(shipmentDocsVehicle.id);
              setTableConditionReport(vehicleConditionReports[shipmentDocsVehicle.id] || null);
              setTableConditionReportOpen(true);
            }}
          />
        )}
    </MainLayout>
  );
};

export default Shipping;
