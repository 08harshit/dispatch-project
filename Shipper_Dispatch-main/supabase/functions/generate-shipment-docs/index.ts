import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  lead_id: string;
  document_type: "invoice" | "bill_of_lading";
  generated_by?: "shipper" | "courier";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lead_id, document_type, generated_by = "shipper" }: RequestBody = await req.json();

    if (!lead_id || !document_type) {
      return new Response(
        JSON.stringify({ error: "lead_id and document_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating ${document_type} for lead ${lead_id}`);

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      console.error("Lead fetch error:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch accepted negotiation with courier info
    const { data: negotiation, error: negError } = await supabase
      .from("negotiations")
      .select(`
        *,
        couriers (
          id,
          name,
          email,
          phone,
          mc_number,
          dot_number,
          legal_name
        )
      `)
      .eq("lead_id", lead_id)
      .eq("status", "accepted")
      .single();

    if (negError) {
      console.log("No accepted negotiation found, using default values");
    }

    const vehicleTitle = `${lead.vehicle_year || ""} ${lead.vehicle_make || ""} ${lead.vehicle_model || ""}`.trim();
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const docNumber = `${document_type === "invoice" ? "INV" : "BOL"}-${lead.listing_id}-${Date.now().toString(36).toUpperCase()}`;
    const courier = negotiation?.couriers || { name: "TBD", mc_number: "N/A", dot_number: "N/A" };
    const agreedPrice = negotiation?.current_offer || lead.initial_price || 0;

    let htmlContent = "";

    if (document_type === "invoice") {
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${docNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 40px; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 40px; }
    .header h1 { font-size: 32px; margin-bottom: 8px; }
    .header .doc-number { opacity: 0.9; font-size: 14px; }
    .content { padding: 40px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1e3a5f; }
    .info-box h4 { color: #1e3a5f; margin-bottom: 8px; }
    .info-box p { color: #333; line-height: 1.6; }
    .vehicle-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 24px; border-radius: 8px; margin-bottom: 30px; }
    .vehicle-card h3 { color: #1e3a5f; font-size: 20px; margin-bottom: 8px; }
    .vehicle-card .vin { color: #666; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 16px; text-align: left; border-bottom: 1px solid #e9ecef; }
    th { background: #f8f9fa; color: #666; font-size: 12px; text-transform: uppercase; font-weight: 600; }
    .total-row { background: #1e3a5f; color: white; }
    .total-row td { font-size: 18px; font-weight: 600; }
    .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; color: #666; font-size: 14px; }
    .status-badge { display: inline-block; background: #28a745; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>INVOICE</h1>
      <div class="doc-number">${docNumber} • ${today}</div>
    </div>
    <div class="content">
      <div class="vehicle-card">
        <h3>${vehicleTitle}</h3>
        <div class="vin">VIN: ${lead.vehicle_vin || "N/A"}</div>
        <div style="margin-top: 8px;">Listing ID: ${lead.listing_id}</div>
      </div>
      
      <div class="info-grid">
        <div class="info-box">
          <h4>Pickup Location</h4>
          <p>${lead.pickup_address}</p>
          ${lead.pickup_contact_name ? `<p style="margin-top: 8px;"><strong>Contact:</strong> ${lead.pickup_contact_name}</p>` : ""}
          ${lead.pickup_contact_phone ? `<p>${lead.pickup_contact_phone}</p>` : ""}
        </div>
        <div class="info-box">
          <h4>Delivery Location</h4>
          <p>${lead.delivery_address}</p>
          ${lead.delivery_contact_name ? `<p style="margin-top: 8px;"><strong>Contact:</strong> ${lead.delivery_contact_name}</p>` : ""}
          ${lead.delivery_contact_phone ? `<p>${lead.delivery_contact_phone}</p>` : ""}
        </div>
      </div>

      <div class="section" style="margin-top: 30px;">
        <div class="section-title">Carrier Information</div>
        <div class="info-box">
          <h4>${courier.legal_name || courier.name}</h4>
          <p>MC#: ${courier.mc_number || "N/A"} • DOT#: ${courier.dot_number || "N/A"}</p>
          ${courier.phone ? `<p>Phone: ${courier.phone}</p>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Details</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Vehicle Transport Service</strong></td>
            <td>${vehicleTitle}</td>
            <td style="text-align: right;">$${agreedPrice.toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">TOTAL DUE</td>
            <td style="text-align: right;">$${agreedPrice.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <span class="status-badge">Payment: ${lead.payment_type || "TBD"}</span>
      </div>
    </div>
    <div class="footer">
      Generated on ${today} • Document ID: ${docNumber}
    </div>
  </div>
</body>
</html>`;
    } else {
      // Bill of Lading
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill of Lading - ${docNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 40px; }
    .bol { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 28px; }
    .header .doc-info { text-align: right; }
    .header .doc-number { font-size: 18px; font-weight: 600; }
    .header .date { opacity: 0.9; margin-top: 4px; }
    .content { padding: 40px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
    .card { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .card-header .icon { width: 32px; height: 32px; background: #0d47a1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; }
    .card-header h3 { color: #0d47a1; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .card p { color: #333; line-height: 1.6; }
    .vehicle-section { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 24px; border-radius: 8px; margin-bottom: 30px; }
    .vehicle-section h2 { color: #0d47a1; font-size: 20px; margin-bottom: 16px; }
    .vehicle-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .detail-item { background: white; padding: 12px; border-radius: 6px; }
    .detail-item label { display: block; font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    .detail-item span { font-weight: 600; color: #333; }
    .condition-section { margin-bottom: 30px; }
    .condition-section h3 { color: #0d47a1; margin-bottom: 16px; font-size: 14px; text-transform: uppercase; }
    .condition-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .condition-item { background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center; }
    .condition-item .status { font-size: 20px; margin-bottom: 4px; }
    .condition-item label { font-size: 11px; color: #666; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; padding-top: 30px; border-top: 2px dashed #ddd; }
    .signature-box { text-align: center; }
    .signature-line { border-bottom: 2px solid #333; height: 60px; margin-bottom: 8px; }
    .signature-label { font-size: 12px; color: #666; }
    .footer { background: #f8f9fa; padding: 20px 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="bol">
    <div class="header">
      <h1>BILL OF LADING</h1>
      <div class="doc-info">
        <div class="doc-number">${docNumber}</div>
        <div class="date">${today}</div>
      </div>
    </div>
    <div class="content">
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="icon">P</div>
            <h3>Pickup Location</h3>
          </div>
          <p><strong>${lead.pickup_address}</strong></p>
          ${lead.pickup_contact_name ? `<p style="margin-top: 8px;">Contact: ${lead.pickup_contact_name}</p>` : ""}
          ${lead.pickup_contact_phone ? `<p>Phone: ${lead.pickup_contact_phone}</p>` : ""}
          <p style="margin-top: 8px; color: #666;">Type: ${lead.pickup_location_type || "Standard"}</p>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="icon">D</div>
            <h3>Delivery Location</h3>
          </div>
          <p><strong>${lead.delivery_address}</strong></p>
          ${lead.delivery_contact_name ? `<p style="margin-top: 8px;">Contact: ${lead.delivery_contact_name}</p>` : ""}
          ${lead.delivery_contact_phone ? `<p>Phone: ${lead.delivery_contact_phone}</p>` : ""}
          <p style="margin-top: 8px; color: #666;">Type: ${lead.delivery_location_type || "Standard"}</p>
        </div>
      </div>

      <div class="vehicle-section">
        <h2>${vehicleTitle}</h2>
        <div class="vehicle-details">
          <div class="detail-item">
            <label>VIN</label>
            <span>${lead.vehicle_vin || "N/A"}</span>
          </div>
          <div class="detail-item">
            <label>Listing ID</label>
            <span>${lead.listing_id}</span>
          </div>
          <div class="detail-item">
            <label>Type</label>
            <span>${lead.vehicle_type || "Standard"}</span>
          </div>
          <div class="detail-item">
            <label>Color</label>
            <span>${lead.vehicle_color || "N/A"}</span>
          </div>
          <div class="detail-item">
            <label>Runs</label>
            <span>${lead.vehicle_runs ? "Yes" : "No"}</span>
          </div>
          <div class="detail-item">
            <label>Rolls</label>
            <span>${lead.vehicle_rolls ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 30px;">
        <div class="card-header">
          <div class="icon">C</div>
          <h3>Carrier Information</h3>
        </div>
        <p><strong>${courier.legal_name || courier.name}</strong></p>
        <p>MC#: ${courier.mc_number || "N/A"} • DOT#: ${courier.dot_number || "N/A"}</p>
        ${courier.phone ? `<p>Phone: ${courier.phone}</p>` : ""}
        ${courier.email ? `<p>Email: ${courier.email}</p>` : ""}
      </div>

      <div class="condition-section">
        <h3>Vehicle Condition at Pickup</h3>
        <div class="condition-grid">
          <div class="condition-item">
            <div class="status">✓</div>
            <label>Starts</label>
          </div>
          <div class="condition-item">
            <div class="status">✓</div>
            <label>Runs</label>
          </div>
          <div class="condition-item">
            <div class="status">✓</div>
            <label>Rolls</label>
          </div>
          <div class="condition-item">
            <div class="status">○</div>
            <label>Damages Noted</label>
          </div>
        </div>
      </div>

      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Shipper Signature / Date</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Driver Signature / Date</div>
        </div>
      </div>
    </div>
    <div class="footer">
      This Bill of Lading is subject to all terms and conditions of the carrier's tariff. • ${docNumber}
    </div>
  </div>
</body>
</html>`;
    }

    // Upload to storage
    const fileName = `${lead_id}/${document_type}-${Date.now()}.html`;
    const { error: uploadError } = await supabase.storage
      .from("shipment-documents")
      .upload(fileName, htmlContent, {
        contentType: "text/html",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload document" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("shipment-documents")
      .getPublicUrl(fileName);

    // Insert document record
    const { data: doc, error: insertError } = await supabase
      .from("shipment_documents")
      .insert({
        lead_id,
        document_type,
        file_name: `${document_type === "invoice" ? "Invoice" : "Bill of Lading"} - ${vehicleTitle}.html`,
        file_url: urlData.publicUrl,
        file_size: new TextEncoder().encode(htmlContent).length,
        mime_type: "text/html",
        uploaded_by: generated_by,
        notes: `Auto-generated ${document_type === "invoice" ? "Invoice" : "Bill of Lading"}`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully generated ${document_type} for lead ${lead_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: doc,
        file_url: urlData.publicUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
