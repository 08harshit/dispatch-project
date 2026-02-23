import { useEffect, useState } from "react";
import { shipperSupabase } from "@/integrations/supabase/shipperClient";
import { useToast } from "@/hooks/use-toast";
import { addDemoAssignedNotification } from "@/lib/demoAssignedLoads";

export interface LoadNotification {
  id: string;
  matchingRequestId: string;
  courierId: string;
  leadId: string;
  shipper: {
    name: string;
    company: string;
    rating: number;
    totalLoads: number;
    phone: string;
  };
  pickup: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
    date: string;
    time: string;
  };
  delivery: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
    date: string;
    time: string;
  };
  vehicle: {
    year: number;
    make: string;
    model: string;
    type: string;
    condition?: {
      runs: boolean;
      starts: boolean;
      drivable: boolean;
      rolls: boolean;
    };
  };
  price: number;
  distance: number;
  createdAt: string;
  expiresIn: number;
  status: string;
}

// Shipper's actual driver_notifications schema
interface DbNotification {
  id: string;
  matching_request_id: string;
  courier_id: string;
  lead_id: string;
  status: string;
  distance_meters: number;
  offer_amount: number;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
  // Joined lead data (optional - may come from joins)
  leads?: {
    id: string;
    origin_city: string;
    origin_state: string;
    origin_zip: string;
    destination_city: string;
    destination_state: string;
    destination_zip: string;
    vehicle_year: number;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_type: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
}

const transformDbToNotification = (db: DbNotification): LoadNotification => {
  const expiresAt = new Date(db.expires_at);
  const now = new Date();
  const expiresIn = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

  // Use lead data if available, otherwise use placeholder values
  const lead = db.leads;

  return {
    id: db.id,
    matchingRequestId: db.matching_request_id,
    courierId: db.courier_id,
    leadId: db.lead_id,
    shipper: {
      name: lead ? `${lead.first_name} ${lead.last_name}` : "Shipper",
      company: "",
      rating: 5.0,
      totalLoads: 0,
      phone: lead?.phone || "",
    },
    pickup: {
      address: "",
      city: lead?.origin_city || "Origin",
      state: lead?.origin_state || "",
      coordinates: [0, 0] as [number, number],
      date: new Date().toISOString().split("T")[0],
      time: "TBD",
    },
    delivery: {
      address: "",
      city: lead?.destination_city || "Destination",
      state: lead?.destination_state || "",
      coordinates: [0, 0] as [number, number],
      date: new Date().toISOString().split("T")[0],
      time: "TBD",
    },
    vehicle: {
      year: lead?.vehicle_year || new Date().getFullYear(),
      make: lead?.vehicle_make || "Vehicle",
      model: lead?.vehicle_model || "",
      type: lead?.vehicle_type || "Sedan",
    },
    price: Number(db.offer_amount),
    distance: Math.round(Number(db.distance_meters) / 1609.34), // Convert meters to miles
    createdAt: db.created_at,
    expiresIn,
    status: db.status,
  };
};

// Example mock notifications for demo purposes - multiple loads to show corridor detection
const createMockNotifications = (): LoadNotification[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const day3 = new Date(today);
  day3.setDate(day3.getDate() + 3);

  return [
    // ========== LA to Phoenix corridor (3 loads) ==========
    {
      id: "demo-1",
      matchingRequestId: "demo-match-1",
      courierId: "",
      leadId: "demo-lead-1",
      shipper: { name: "John Smith", company: "Auto Transport Co.", rating: 4.8, totalLoads: 156, phone: "(555) 123-4567" },
      pickup: { address: "123 Main Street", city: "Los Angeles", state: "CA", coordinates: [34.0522, -118.2437] as [number, number], date: today.toISOString().split("T")[0], time: "10:00 AM" },
      delivery: { address: "456 Oak Avenue", city: "Phoenix", state: "AZ", coordinates: [33.4484, -112.074] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "3:00 PM" },
      vehicle: { year: 2022, make: "Toyota", model: "Camry", type: "Sedan", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 450, distance: 372, createdAt: new Date().toISOString(), expiresIn: 3600, status: "pending",
    },
    {
      id: "demo-2",
      matchingRequestId: "demo-match-2",
      courierId: "",
      leadId: "demo-lead-2",
      shipper: { name: "Sarah Johnson", company: "Quick Auto Ship", rating: 4.9, totalLoads: 234, phone: "(555) 987-6543" },
      pickup: { address: "789 Sunset Blvd", city: "Pasadena", state: "CA", coordinates: [34.1478, -118.1445] as [number, number], date: today.toISOString().split("T")[0], time: "11:30 AM" },
      delivery: { address: "321 Desert Road", city: "Scottsdale", state: "AZ", coordinates: [33.4942, -111.9261] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "5:00 PM" },
      vehicle: { year: 2023, make: "Honda", model: "Accord", type: "Sedan", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 520, distance: 385, createdAt: new Date().toISOString(), expiresIn: 5400, status: "pending",
    },
    {
      id: "demo-3",
      matchingRequestId: "demo-match-3",
      courierId: "",
      leadId: "demo-lead-3",
      shipper: { name: "David Martinez", company: "West Coast Auto", rating: 4.7, totalLoads: 178, phone: "(555) 654-3210" },
      pickup: { address: "999 Beach Blvd", city: "Long Beach", state: "CA", coordinates: [33.7701, -118.1937] as [number, number], date: today.toISOString().split("T")[0], time: "12:00 PM" },
      delivery: { address: "444 Mesa Dr", city: "Mesa", state: "AZ", coordinates: [33.4152, -111.8315] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "6:00 PM" },
      vehicle: { year: 2024, make: "Mercedes", model: "E-Class", type: "Sedan", condition: { runs: false, starts: false, drivable: false, rolls: true } },
      price: 620, distance: 395, createdAt: new Date().toISOString(), expiresIn: 4800, status: "pending",
    },

    // ========== Dallas to Houston corridor (2 loads) ==========
    {
      id: "demo-4",
      matchingRequestId: "demo-match-4",
      courierId: "",
      leadId: "demo-lead-4",
      shipper: { name: "Mike Wilson", company: "Texas Auto Movers", rating: 4.6, totalLoads: 89, phone: "(555) 456-7890" },
      pickup: { address: "555 Commerce St", city: "Dallas", state: "TX", coordinates: [32.7767, -96.7970] as [number, number], date: today.toISOString().split("T")[0], time: "9:00 AM" },
      delivery: { address: "888 Gulf Freeway", city: "Houston", state: "TX", coordinates: [29.7604, -95.3698] as [number, number], date: today.toISOString().split("T")[0], time: "2:00 PM" },
      vehicle: { year: 2024, make: "Ford", model: "F-150", type: "Truck", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 380, distance: 240, createdAt: new Date().toISOString(), expiresIn: 7200, status: "pending",
    },
    {
      id: "demo-5",
      matchingRequestId: "demo-match-5",
      courierId: "",
      leadId: "demo-lead-5",
      shipper: { name: "Lisa Thompson", company: "Lone Star Transport", rating: 4.5, totalLoads: 67, phone: "(555) 789-0123" },
      pickup: { address: "100 Elm St", city: "Fort Worth", state: "TX", coordinates: [32.7555, -97.3308] as [number, number], date: today.toISOString().split("T")[0], time: "10:30 AM" },
      delivery: { address: "200 Main St", city: "Galveston", state: "TX", coordinates: [29.3013, -94.7977] as [number, number], date: today.toISOString().split("T")[0], time: "4:00 PM" },
      vehicle: { year: 2023, make: "Chevrolet", model: "Tahoe", type: "SUV", condition: { runs: true, starts: true, drivable: false, rolls: true } },
      price: 420, distance: 285, createdAt: new Date().toISOString(), expiresIn: 5400, status: "pending",
    },

    // ========== Chicago to Detroit corridor (2 loads) ==========
    {
      id: "demo-6",
      matchingRequestId: "demo-match-6",
      courierId: "",
      leadId: "demo-lead-6",
      shipper: { name: "Emily Chen", company: "Midwest Transport", rating: 5.0, totalLoads: 312, phone: "(555) 321-0987" },
      pickup: { address: "100 Michigan Ave", city: "Chicago", state: "IL", coordinates: [41.8781, -87.6298] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "8:00 AM" },
      delivery: { address: "200 Woodward Ave", city: "Detroit", state: "MI", coordinates: [42.3314, -83.0458] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "1:00 PM" },
      vehicle: { year: 2023, make: "BMW", model: "X5", type: "SUV", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 550, distance: 280, createdAt: new Date().toISOString(), expiresIn: 10800, status: "pending",
    },
    {
      id: "demo-7",
      matchingRequestId: "demo-match-7",
      courierId: "",
      leadId: "demo-lead-7",
      shipper: { name: "Robert Brown", company: "Great Lakes Auto", rating: 4.8, totalLoads: 145, phone: "(555) 234-5678" },
      pickup: { address: "500 Lake Shore Dr", city: "Evanston", state: "IL", coordinates: [42.0451, -87.6877] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "9:30 AM" },
      delivery: { address: "300 Grand River", city: "Ann Arbor", state: "MI", coordinates: [42.2808, -83.7430] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "2:30 PM" },
      vehicle: { year: 2024, make: "Audi", model: "Q7", type: "SUV", condition: { runs: true, starts: false, drivable: false, rolls: true } },
      price: 480, distance: 250, createdAt: new Date().toISOString(), expiresIn: 9000, status: "pending",
    },

    // ========== Miami to Atlanta corridor (2 loads) ==========
    {
      id: "demo-8",
      matchingRequestId: "demo-match-8",
      courierId: "",
      leadId: "demo-lead-8",
      shipper: { name: "Carlos Rodriguez", company: "Sunshine State Haulers", rating: 4.9, totalLoads: 203, phone: "(555) 876-5432" },
      pickup: { address: "1 Ocean Drive", city: "Miami", state: "FL", coordinates: [25.7617, -80.1918] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "7:00 AM" },
      delivery: { address: "100 Peachtree St", city: "Atlanta", state: "GA", coordinates: [33.7490, -84.3880] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "5:00 PM" },
      vehicle: { year: 2023, make: "Lexus", model: "RX 350", type: "SUV", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 720, distance: 660, createdAt: new Date().toISOString(), expiresIn: 7200, status: "pending",
    },
    {
      id: "demo-9",
      matchingRequestId: "demo-match-9",
      courierId: "",
      leadId: "demo-lead-9",
      shipper: { name: "Jennifer Lee", company: "Southeast Express", rating: 4.7, totalLoads: 178, phone: "(555) 345-6789" },
      pickup: { address: "200 Collins Ave", city: "Fort Lauderdale", state: "FL", coordinates: [26.1224, -80.1373] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "8:30 AM" },
      delivery: { address: "50 Marietta St", city: "Marietta", state: "GA", coordinates: [33.9526, -84.5499] as [number, number], date: tomorrow.toISOString().split("T")[0], time: "6:30 PM" },
      vehicle: { year: 2024, make: "Porsche", model: "Cayenne", type: "SUV", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 850, distance: 640, createdAt: new Date().toISOString(), expiresIn: 8400, status: "pending",
    },

    // ========== New York to Boston corridor (2 loads) ==========
    {
      id: "demo-10",
      matchingRequestId: "demo-match-10",
      courierId: "",
      leadId: "demo-lead-10",
      shipper: { name: "Amanda White", company: "Northeast Auto Transport", rating: 4.6, totalLoads: 98, phone: "(555) 567-8901" },
      pickup: { address: "350 5th Ave", city: "New York", state: "NY", coordinates: [40.7484, -73.9857] as [number, number], date: dayAfter.toISOString().split("T")[0], time: "6:00 AM" },
      delivery: { address: "100 Federal St", city: "Boston", state: "MA", coordinates: [42.3555, -71.0565] as [number, number], date: dayAfter.toISOString().split("T")[0], time: "11:00 AM" },
      vehicle: { year: 2022, make: "Tesla", model: "Model S", type: "Sedan", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 480, distance: 215, createdAt: new Date().toISOString(), expiresIn: 14400, status: "pending",
    },
    {
      id: "demo-11",
      matchingRequestId: "demo-match-11",
      courierId: "",
      leadId: "demo-lead-11",
      shipper: { name: "Kevin Park", company: "Empire State Movers", rating: 4.8, totalLoads: 167, phone: "(555) 678-9012" },
      pickup: { address: "1 Penn Plaza", city: "Newark", state: "NJ", coordinates: [40.7357, -74.1724] as [number, number], date: dayAfter.toISOString().split("T")[0], time: "7:30 AM" },
      delivery: { address: "200 State St", city: "Providence", state: "RI", coordinates: [41.8240, -71.4128] as [number, number], date: dayAfter.toISOString().split("T")[0], time: "12:00 PM" },
      vehicle: { year: 2024, make: "Rivian", model: "R1S", type: "SUV", condition: { runs: false, starts: false, drivable: false, rolls: false } },
      price: 420, distance: 180, createdAt: new Date().toISOString(), expiresIn: 12600, status: "pending",
    },

    // ========== Seattle to Portland (single load) ==========
    {
      id: "demo-12",
      matchingRequestId: "demo-match-12",
      courierId: "",
      leadId: "demo-lead-12",
      shipper: { name: "Michelle Green", company: "Pacific Northwest Auto", rating: 4.9, totalLoads: 221, phone: "(555) 890-1234" },
      pickup: { address: "400 Pine St", city: "Seattle", state: "WA", coordinates: [47.6062, -122.3321] as [number, number], date: today.toISOString().split("T")[0], time: "2:00 PM" },
      delivery: { address: "100 SW Morrison", city: "Portland", state: "OR", coordinates: [45.5152, -122.6784] as [number, number], date: today.toISOString().split("T")[0], time: "6:00 PM" },
      vehicle: { year: 2023, make: "Volvo", model: "XC90", type: "SUV", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 320, distance: 175, createdAt: new Date().toISOString(), expiresIn: 5400, status: "pending",
    },

    // ========== San Francisco to Las Vegas (single load) ==========
    {
      id: "demo-13",
      matchingRequestId: "demo-match-13",
      courierId: "",
      leadId: "demo-lead-13",
      shipper: { name: "Daniel Kim", company: "Golden Gate Transport", rating: 4.7, totalLoads: 134, phone: "(555) 901-2345" },
      pickup: { address: "1 Market St", city: "San Francisco", state: "CA", coordinates: [37.7749, -122.4194] as [number, number], date: dayAfter.toISOString().split("T")[0], time: "9:00 AM" },
      delivery: { address: "3570 Las Vegas Blvd", city: "Las Vegas", state: "NV", coordinates: [36.1699, -115.1398] as [number, number], date: dayAfter.toISOString().split("T")[0], time: "5:00 PM" },
      vehicle: { year: 2024, make: "Lucid", model: "Air", type: "Sedan", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 680, distance: 570, createdAt: new Date().toISOString(), expiresIn: 10800, status: "pending",
    },

    // ========== Denver to Salt Lake City (single load) ==========
    {
      id: "demo-14",
      matchingRequestId: "demo-match-14",
      courierId: "",
      leadId: "demo-lead-14",
      shipper: { name: "Rachel Adams", company: "Mountain Auto Movers", rating: 4.5, totalLoads: 76, phone: "(555) 012-3456" },
      pickup: { address: "1600 Broadway", city: "Denver", state: "CO", coordinates: [39.7392, -104.9903] as [number, number], date: day3.toISOString().split("T")[0], time: "8:00 AM" },
      delivery: { address: "50 W Temple", city: "Salt Lake City", state: "UT", coordinates: [40.7608, -111.8910] as [number, number], date: day3.toISOString().split("T")[0], time: "4:00 PM" },
      vehicle: { year: 2023, make: "Jeep", model: "Grand Cherokee", type: "SUV", condition: { runs: true, starts: true, drivable: false, rolls: true } },
      price: 580, distance: 525, createdAt: new Date().toISOString(), expiresIn: 18000, status: "pending",
    },

    // ========== Phoenix to Denver (single load) ==========
    {
      id: "demo-15",
      matchingRequestId: "demo-match-15",
      courierId: "",
      leadId: "demo-lead-15",
      shipper: { name: "Tom Harris", company: "Desert to Mountain Express", rating: 4.8, totalLoads: 189, phone: "(555) 123-7890" },
      pickup: { address: "2 E Jefferson", city: "Phoenix", state: "AZ", coordinates: [33.4484, -112.074] as [number, number], date: day3.toISOString().split("T")[0], time: "6:00 AM" },
      delivery: { address: "200 E Colfax", city: "Denver", state: "CO", coordinates: [39.7392, -104.9903] as [number, number], date: day3.toISOString().split("T")[0], time: "6:00 PM" },
      vehicle: { year: 2024, make: "Land Rover", model: "Defender", type: "SUV", condition: { runs: true, starts: true, drivable: true, rolls: true } },
      price: 890, distance: 602, createdAt: new Date().toISOString(), expiresIn: 16200, status: "pending",
    },
  ];
};

export const useLoadNotifications = () => {
  const [notifications, setNotifications] = useState<LoadNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch driver notifications (leads join may not be available)
        const { data, error } = await shipperSupabase
          .from("driver_notifications")
          .select("*")
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        const transformed = (data as DbNotification[]).map(transformDbToNotification);
        
        // If no real notifications, show demo notifications
        if (transformed.length === 0) {
          setNotifications(createMockNotifications());
        } else {
          setNotifications(transformed);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Show demo notifications on error too
        setNotifications(createMockNotifications());
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = shipperSupabase
      .channel("driver_notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_notifications",
        },
        (payload) => {
          const newNotification = transformDbToNotification(payload.new as DbNotification);
          setNotifications((prev) => [newNotification, ...prev]);
          toast({
            title: "New Load Available!",
            description: `${newNotification.pickup.city} → ${newNotification.delivery.city}`,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "driver_notifications",
        },
        (payload) => {
          const updated = payload.new as DbNotification;
          if (updated.status !== "pending") {
            // Remove from list if no longer pending
            setNotifications((prev) => prev.filter((n) => n.id !== updated.id));
          } else {
            // Update the notification
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updated.id ? transformDbToNotification(updated) : n
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "driver_notifications",
        },
        (payload) => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== (payload.old as { id: string }).id)
          );
        }
      )
      .subscribe();

    return () => {
      shipperSupabase.removeChannel(channel);
    };
  }, [toast]);

  const acceptLoad = async (id: string, price: number): Promise<{ requiresAuth: boolean }> => {
    try {
      // Demo mode: allow accepting demo loads even without authentication.
      if (id.startsWith("demo-")) {
        const demo = notifications.find((n) => n.id === id);
        if (demo) {
          addDemoAssignedNotification({ ...demo, status: "accepted" });
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast({
          title: "Load Accepted (Demo)",
          description: `You accepted the demo load for $${price}`,
        });
        return { requiresAuth: false };
      }

      const { data: { user } } = await shipperSupabase.auth.getUser();
      if (!user) {
        return { requiresAuth: true };
      }

      // Update status to accepted and set responded_at timestamp
      // The shipper's schema uses responded_at, not assigned_courier_id
      const { error } = await shipperSupabase
        .from("driver_notifications")
        .update({ 
          status: "accepted",
          responded_at: new Date().toISOString(),
          // Ensure the accepted load shows up in the courier's Assigned tab.
          courier_id: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast({
        title: "Load Accepted!",
        description: `You accepted the load for $${price}`,
      });
      return { requiresAuth: false };
    } catch (error) {
      console.error("Error accepting load:", error);

      // Fallback: if the backend update fails (e.g. this is mock data that doesn't exist
      // server-side), persist it as a demo-assigned load so it shows in the Assigned tab.
      const local = notifications.find((n) => n.id === id);
      if (local) {
        addDemoAssignedNotification({ ...local, status: "accepted" });
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast({
          title: "Load Accepted",
          description: `Saved locally for demo. $${price}`,
        });
        return { requiresAuth: false };
      }

      toast({
        title: "Error",
        description: "Failed to accept load. Please try again.",
        variant: "destructive",
      });
      return { requiresAuth: false };
    }
  };

  const declineLoad = async (id: string) => {
    // Just remove from local state - the load stays available for others
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({
      title: "Load Declined",
      description: "This load has been removed from your list.",
    });
  };

  const sendCounterOffer = async (notificationId: string, offerPrice: number, message?: string): Promise<{ requiresAuth: boolean }> => {
    try {
      const { data: { user } } = await shipperSupabase.auth.getUser();
      if (!user) {
        return { requiresAuth: true };
      }

      const { error } = await shipperSupabase.from("load_offers").insert({
        notification_id: notificationId,
        courier_id: user.id,
        offer_price: offerPrice,
        message,
      });

      if (error) throw error;

      // Update notification status
      await shipperSupabase
        .from("driver_notifications")
        .update({ status: "counter_offered" })
        .eq("id", notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast({
        title: "Offer Sent!",
        description: `Your counter offer of $${offerPrice} has been sent.`,
      });
      return { requiresAuth: false };
    } catch (error) {
      console.error("Error sending offer:", error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive",
      });
      return { requiresAuth: false };
    }
  };

  return {
    notifications,
    loading,
    acceptLoad,
    declineLoad,
    sendCounterOffer,
  };
};
