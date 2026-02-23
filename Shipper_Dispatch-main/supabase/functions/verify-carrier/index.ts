import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FMCSACarrierInfo {
  dotNumber: string;
  mcNumber?: string;
  legalName: string;
  operatingStatus: string;
  phone?: string;
  email?: string;
  isValid: boolean;
}

// Scrape FMCSA SAFER website for carrier info
async function fetchFMCSAData(dotNumber: string): Promise<FMCSACarrierInfo | null> {
  try {
    console.log(`Fetching FMCSA data for DOT: ${dotNumber}`);
    
    // FMCSA SAFER snapshot URL
    const url = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dotNumber}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`FMCSA request failed: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Parse HTML to extract carrier information
    // Look for key fields in the SAFER snapshot page
    
    // Check if carrier was found
    if (html.includes('No records matching your search criteria were found') || 
        html.includes('INVALID FORMAT')) {
      console.log('No carrier found for DOT:', dotNumber);
      return null;
    }

    // Extract legal name (usually in a table cell after "Legal Name:")
    const legalNameMatch = html.match(/Legal Name[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                           html.match(/<td[^>]*>Legal Name[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
    const legalName = legalNameMatch ? legalNameMatch[1].trim() : '';

    // Extract operating status
    const statusMatch = html.match(/Operating Status[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                        html.match(/<td[^>]*>Operating Status[^<]*<\/td>\s*<td[^>]*>([^<]+)/i) ||
                        html.match(/Operation Classification[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
    const operatingStatus = statusMatch ? statusMatch[1].trim() : 'UNKNOWN';

    // Extract MC/MX number if present
    const mcMatch = html.match(/MC\/MX\/FF Number[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                    html.match(/<td[^>]*>MC\/MX\/FF[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
    const mcNumber = mcMatch ? mcMatch[1].trim().replace(/[^\dMC-]/g, '') : undefined;

    // Extract phone
    const phoneMatch = html.match(/Phone[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                       html.match(/<td[^>]*>Phone[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
    const phone = phoneMatch ? phoneMatch[1].trim() : undefined;

    // Determine if carrier is valid (active operating status)
    const isValid = operatingStatus.toLowerCase().includes('authorized') || 
                    operatingStatus.toLowerCase().includes('active') ||
                    !operatingStatus.toLowerCase().includes('not authorized') &&
                    !operatingStatus.toLowerCase().includes('inactive') &&
                    !operatingStatus.toLowerCase().includes('out of service');

    console.log('Parsed carrier info:', { legalName, operatingStatus, isValid });

    if (!legalName) {
      // If we couldn't parse the name, the carrier might not exist
      return null;
    }

    return {
      dotNumber,
      mcNumber: mcNumber || undefined,
      legalName,
      operatingStatus,
      phone,
      isValid,
    };
  } catch (error) {
    console.error('Error fetching FMCSA data:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dotNumber, courierId } = await req.json();

    if (!dotNumber) {
      return new Response(
        JSON.stringify({ error: 'DOT number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying carrier with DOT: ${dotNumber}`);

    // Fetch FMCSA data
    const carrierInfo = await fetchFMCSAData(dotNumber);

    if (!carrierInfo) {
      // Update courier as unverified if courierId provided
      if (courierId) {
        await supabase
          .from('couriers')
          .update({
            dot_number: dotNumber,
            verification_status: 'not_found',
            updated_at: new Date().toISOString(),
          })
          .eq('id', courierId);
      }

      return new Response(
        JSON.stringify({ 
          verified: false, 
          status: 'not_found',
          message: 'No carrier found with this DOT number' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine verification status
    const verificationStatus = carrierInfo.isValid ? 'verified' : 'flagged';

    // Update courier if courierId provided
    if (courierId) {
      const { error: updateError } = await supabase
        .from('couriers')
        .update({
          dot_number: carrierInfo.dotNumber,
          mc_number: carrierInfo.mcNumber,
          legal_name: carrierInfo.legalName,
          operating_status: carrierInfo.operatingStatus,
          verification_status: verificationStatus,
          verified_at: carrierInfo.isValid ? new Date().toISOString() : null,
          phone: carrierInfo.phone || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courierId);

      if (updateError) {
        console.error('Error updating courier:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        verified: carrierInfo.isValid,
        status: verificationStatus,
        carrier: carrierInfo,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-carrier:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
