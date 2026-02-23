import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NegotiateRequest {
  action: 'accept' | 'decline' | 'counter';
  negotiation_id: string;
  actor: 'shipper' | 'courier';
  counter_amount?: number;
  courier_id?: string; // Required for courier actions
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, negotiation_id, actor, counter_amount, courier_id }: NegotiateRequest = await req.json();

    console.log('Negotiate action:', action, 'Actor:', actor, 'Negotiation:', negotiation_id);

    // Get current negotiation state
    const { data: negotiation, error: fetchError } = await supabase
      .from('negotiations')
      .select('*, courier:couriers(*), lead:leads(*)')
      .eq('id', negotiation_id)
      .single();

    if (fetchError || !negotiation) {
      console.error('Negotiation not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Negotiation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify courier is authorized (for courier actions)
    if (actor === 'courier' && courier_id && negotiation.courier_id !== courier_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized courier' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const responseDeadline = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes for response

    if (action === 'accept') {
      console.log('Processing acceptance from:', actor);
      
      // Mark negotiation as accepted
      const { error: updateError } = await supabase
        .from('negotiations')
        .update({
          status: 'accepted',
          accepted_at: now.toISOString(),
        })
        .eq('id', negotiation_id);

      if (updateError) {
        console.error('Failed to update negotiation:', updateError);
        throw updateError;
      }

      // Update lead status to booked
      await supabase
        .from('leads')
        .update({ status: 'booked' })
        .eq('id', negotiation.lead_id);

      // Update matching request if exists
      await supabase
        .from('matching_requests')
        .update({ status: 'matched' })
        .eq('lead_id', negotiation.lead_id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Offer accepted',
        status: 'accepted',
        final_price: negotiation.current_offer
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'decline') {
      console.log('Processing decline from:', actor);
      
      await supabase
        .from('negotiations')
        .update({ status: 'declined' })
        .eq('id', negotiation_id);

      // Unlock the lead
      await supabase
        .from('leads')
        .update({ is_locked: false, locked_by_courier_id: null })
        .eq('id', negotiation.lead_id);

      // Reset matching request to search for next driver
      const { data: matchingRequest } = await supabase
        .from('matching_requests')
        .select('*')
        .eq('lead_id', negotiation.lead_id)
        .single();

      if (matchingRequest) {
        console.log('Triggering search for next driver after decline');
        await supabase
          .from('matching_requests')
          .update({ 
            status: 'searching',
            current_courier_id: null,
            courier_notified_at: null,
            response_deadline: null
          })
          .eq('id', matchingRequest.id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Offer declined - searching for next driver',
        status: 'declined',
        next_action: 'search_next'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'counter') {
      if (!counter_amount || counter_amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid counter amount' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newCount = (negotiation.counter_count || 0) + 1;
      console.log('Processing counter from:', actor, 'Amount:', counter_amount, 'Count:', newCount);

      if (newCount > 3) {
        // Counter limit reached - expire negotiation and search for next driver
        await supabase
          .from('negotiations')
          .update({ status: 'expired' })
          .eq('id', negotiation_id);

        await supabase
          .from('leads')
          .update({ is_locked: false, locked_by_courier_id: null })
          .eq('id', negotiation.lead_id);

        // Reset matching request to search for next driver
        const { data: matchingRequest } = await supabase
          .from('matching_requests')
          .select('*')
          .eq('lead_id', negotiation.lead_id)
          .single();

        if (matchingRequest) {
          console.log('Triggering search for next driver after counter limit');
          await supabase
            .from('matching_requests')
            .update({ 
              status: 'searching',
              current_courier_id: null,
              courier_notified_at: null,
              response_deadline: null
            })
            .eq('id', matchingRequest.id);
        }

        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Counter limit reached (3 max) - searching for next driver',
          status: 'expired',
          next_action: 'search_next'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert counter offer
      const { error: offerError } = await supabase
        .from('offers')
        .insert({
          negotiation_id,
          offered_by: actor, // 'shipper' or 'courier'
          amount: counter_amount,
          response: 'pending',
        });

      if (offerError) {
        console.error('Failed to insert offer:', offerError);
        throw offerError;
      }

      // Update negotiation with new offer and deadline for the OTHER party
      const updateData: Record<string, unknown> = {
        counter_count: newCount,
        current_offer: counter_amount,
      };

      // Set deadline for the party who needs to respond
      if (actor === 'courier') {
        updateData.shipper_response_deadline = responseDeadline.toISOString();
        updateData.courier_response_deadline = null;
      } else {
        updateData.courier_response_deadline = responseDeadline.toISOString();
        updateData.shipper_response_deadline = null;
      }

      await supabase
        .from('negotiations')
        .update(updateData)
        .eq('id', negotiation_id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Counter offer sent',
        status: 'negotiating',
        counter_count: newCount,
        current_offer: counter_amount,
        waiting_for: actor === 'courier' ? 'shipper' : 'courier'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Negotiate error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
