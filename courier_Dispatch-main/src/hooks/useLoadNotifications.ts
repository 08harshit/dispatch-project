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
        setNotifications(transformed);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
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
