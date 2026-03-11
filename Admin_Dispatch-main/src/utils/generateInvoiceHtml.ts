import type { Invoice } from "@/services/invoiceService";

export function generateInvoiceHtml(invoice: Invoice): string {
  const date = invoice.generated_at ? new Date(invoice.generated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const pickup = invoice.pickup_time ? new Date(invoice.pickup_time).toLocaleString() : "-";
  const delivered = invoice.delivered_at ? new Date(invoice.delivered_at).toLocaleString() : "-";
  const route = [invoice.start_location, invoice.end_location].filter(Boolean).join(" to ") || "-";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.id.slice(0, 8)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #fff; color: #1a1a1a; padding: 32px; max-width: 700px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e5e5; }
  .header h1 { font-size: 24px; font-weight: 700; color: #1a1a1a; }
  .header .id { font-size: 12px; color: #666; font-family: monospace; margin-top: 4px; }
  .meta { text-align: right; font-size: 13px; color: #666; line-height: 1.6; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .row:last-child { border: none; }
  .label { color: #666; }
  .value { font-weight: 500; }
  .amount { font-size: 20px; font-weight: 700; margin-top: 16px; padding-top: 16px; border-top: 2px solid #1a1a1a; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Invoice</h1>
      <div class="id">${invoice.id.slice(0, 8)}</div>
    </div>
    <div class="meta">
      Generated: ${date}<br>
      Trip: ${invoice.trip_id.slice(0, 8)}
    </div>
  </div>

  <div class="section">
    <h2>Parties</h2>
    <div class="row"><span class="label">Shipper</span><span class="value">${invoice.shipper_name ?? "-"}</span></div>
    <div class="row"><span class="label">Courier</span><span class="value">${invoice.courier_name ?? "-"}</span></div>
  </div>

  <div class="section">
    <h2>Load</h2>
    <div class="row"><span class="label">Description</span><span class="value">${invoice.load_description ?? "-"}</span></div>
    <div class="row"><span class="label">Route</span><span class="value">${route}</span></div>
    <div class="row"><span class="label">Pickup time</span><span class="value">${pickup}</span></div>
    <div class="row"><span class="label">Delivered at</span><span class="value">${delivered}</span></div>
  </div>

  <div class="section">
    <div class="row amount"><span class="label">Amount</span><span class="value">$${Number(invoice.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div class="footer">
    This invoice was generated automatically when the trip was completed. No stored PDF; generated from invoice data.
  </div>
</body>
</html>`;
  return html;
}

export function downloadInvoiceAsHtml(invoice: Invoice): void {
  const html = generateInvoiceHtml(invoice);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${invoice.id.slice(0, 8)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
