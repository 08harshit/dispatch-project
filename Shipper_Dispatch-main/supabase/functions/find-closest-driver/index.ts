import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Courier {
  id: string;
  name: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  is_available: boolean;
  available_capacity: number;
}

interface MatchingRequest {
  id: string;
  lead_id: string;
  status: string;
  initial_offer: number;
  pickup_latitude: number;
  pickup_longitude: number;
  search_radius_meters: number;
  current_courier_id: string | null;
  couriers_tried: string[];
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, matching_request_id, lead_id, initial_offer, pickup_latitude, pickup_longitude, courier_id, response } = await req.json();

    console.log('Action:', action, 'Request ID:', matching_request_id);

    if (action === 'start') {
      // Create a new matching request
      const { data: matchingRequest, error: createError } = await supabase
        .from('matching_requests')
        .insert({
          lead_id,
          initial_offer,
          pickup_latitude,
          pickup_longitude,
          status: 'searching',
          search_radius_meters: 5000000, // 5000km radius to cover North America
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating matching request:', createError);
        throw createError;
      }

      console.log('Created matching request:', matchingRequest.id);

      // Find and notify the first closest driver
      const result = await findAndNotifyNextDriver(supabase, matchingRequest);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'driver_response') {
      // Handle driver's response (accept/decline)
      const { data: notification, error: notifError } = await supabase
        .from('driver_notifications')
        .select('*, matching_requests(*)')
        .eq('id', matching_request_id)
        .single();

      if (notifError) {
        console.error('Error fetching notification:', notifError);
        throw notifError;
      }

      // Prevent late accepts/declines after the notification already expired.
      // This avoids "ghost accepts" that never correctly transition the matching request.
      try {
        const now = new Date();
        const expiresAt = new Date(notification.expires_at);
        if (Number.isFinite(expiresAt.getTime()) && now > expiresAt) {
          console.log(
            'Driver response rejected: notification expired',
            'notification:', matching_request_id,
            'now:', now.toISOString(),
            'expires_at:', notification.expires_at
          );

          await supabase
            .from('driver_notifications')
            .update({ status: 'expired' })
            .eq('id', matching_request_id)
            .eq('status', 'pending');

          return new Response(
            JSON.stringify({
              success: false,
              status: 'expired',
              message: 'Notification expired',
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (e) {
        console.error('Expiry validation failed (non-fatal):', e);
      }

      if (response === 'accepted') {
        // Update notification
        await supabase
          .from('driver_notifications')
          .update({ status: 'accepted', responded_at: new Date().toISOString() })
          .eq('id', matching_request_id);

        // Update matching request to negotiating
        await supabase
          .from('matching_requests')
          .update({ status: 'negotiating' })
          .eq('id', notification.matching_request_id);

        return new Response(JSON.stringify({ 
          success: true, 
          action: 'start_negotiation',
          courier_id: notification.courier_id,
          matching_request_id: notification.matching_request_id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Driver declined - update notification and find next driver
        await supabase
          .from('driver_notifications')
          .update({ status: 'declined', responded_at: new Date().toISOString() })
          .eq('id', matching_request_id);

        // Get the matching request
        const { data: matchingRequest } = await supabase
          .from('matching_requests')
          .select('*')
          .eq('id', notification.matching_request_id)
          .single();

        if (matchingRequest) {
          // Find next driver
          const result = await findAndNotifyNextDriver(supabase, matchingRequest);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    if (action === 'check_timeout') {
      // Check if current notification has timed out
      const { data: matchingRequest, error } = await supabase
        .from('matching_requests')
        .select('*')
        .eq('id', matching_request_id)
        .single();

      if (error) throw error;

      console.log('Check timeout for:', matching_request_id, 'Status:', matchingRequest.status, 'Deadline:', matchingRequest.response_deadline);

      // If already in a different state, just return current status
      if (matchingRequest.status !== 'pending_response') {
        return new Response(JSON.stringify({ 
          success: true, 
          status: matchingRequest.status 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (matchingRequest.response_deadline) {
        const deadline = new Date(matchingRequest.response_deadline);
        const now = new Date();
        
        if (now > deadline) {
          console.log('Timeout detected, finding next driver. Now:', now.toISOString(), 'Deadline:', deadline.toISOString());
          
          // Expire the current notification
          await supabase
            .from('driver_notifications')
            .update({ status: 'expired' })
            .eq('matching_request_id', matching_request_id)
            .eq('courier_id', matchingRequest.current_courier_id)
            .eq('status', 'pending');

          // Find next driver
          const result = await findAndNotifyNextDriver(supabase, matchingRequest);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Not yet timed out - return remaining time info
          const remainingSeconds = Math.ceil((deadline.getTime() - now.getTime()) / 1000);
          console.log('Not timed out yet. Remaining seconds:', remainingSeconds);
          
          return new Response(JSON.stringify({ 
            success: true, 
            status: matchingRequest.status,
            remaining_seconds: remainingSeconds
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, status: matchingRequest.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel') {
      await supabase
        .from('matching_requests')
        .update({ status: 'cancelled' })
        .eq('id', matching_request_id);

      // Expire any pending notifications
      await supabase
        .from('driver_notifications')
        .update({ status: 'expired' })
        .eq('matching_request_id', matching_request_id)
        .eq('status', 'pending');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Edge function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function findAndNotifyNextDriver(supabase: any, matchingRequest: MatchingRequest) {
  const { pickup_latitude, pickup_longitude, search_radius_meters, couriers_tried, id, lead_id, initial_offer } = matchingRequest;

  console.log('Finding next driver. Already tried:', couriers_tried);

  // Get all available couriers with location
  const { data: couriers, error } = await supabase
    .from('couriers')
    .select('*')
    .eq('is_available', true)
    .gt('available_capacity', 0)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) {
    console.error('Error fetching couriers:', error);
    throw error;
  }

  console.log('Found couriers:', couriers?.length);

  // Filter out already tried couriers and calculate distances
  const availableCouriers = (couriers as Courier[])
    .filter(c => !couriers_tried.includes(c.id))
    .map(courier => ({
      ...courier,
      distance: calculateDistance(
        pickup_latitude,
        pickup_longitude,
        courier.latitude!,
        courier.longitude!
      )
    }))
    .filter(c => c.distance <= search_radius_meters)
    .sort((a, b) => a.distance - b.distance);

  console.log('Available couriers after filtering:', availableCouriers.length);

  if (availableCouriers.length === 0) {
    // No more drivers available
    await supabase
      .from('matching_requests')
      .update({ status: 'failed' })
      .eq('id', id);

    return { 
      success: false, 
      message: 'No drivers available in your area',
      status: 'failed'
    };
  }

  const closestCourier = availableCouriers[0];
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  console.log('Selected courier:', closestCourier.name, 'Distance:', closestCourier.distance);

  // Create notification for the driver
  const { data: notification, error: notifError } = await supabase
    .from('driver_notifications')
    .insert({
      matching_request_id: id,
      courier_id: closestCourier.id,
      lead_id,
      offer_amount: initial_offer,
      distance_meters: closestCourier.distance,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (notifError) {
    console.error('Error creating notification:', notifError);
    throw notifError;
  }

  // Update matching request
  const newCouriersTried = [...couriers_tried, closestCourier.id];
  await supabase
    .from('matching_requests')
    .update({
      status: 'pending_response',
      current_courier_id: closestCourier.id,
      courier_notified_at: new Date().toISOString(),
      response_deadline: expiresAt.toISOString(),
      couriers_tried: newCouriersTried
    })
    .eq('id', id);

  return {
    success: true,
    status: 'pending_response',
    notification_id: notification.id,
    courier: {
      id: closestCourier.id,
      name: closestCourier.name,
      distance: Math.round(closestCourier.distance)
    },
    expires_at: expiresAt.toISOString(),
    drivers_remaining: availableCouriers.length - 1
  };
}
