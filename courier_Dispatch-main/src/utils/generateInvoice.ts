import jsPDF from "jspdf";
import type { Load } from "@/components/loads/LoadsTable";

export const generateInvoice = (load: Load): string => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Colors (amber/emerald theme)
  const amberColor: [number, number, number] = [245, 158, 11];
  const emeraldColor: [number, number, number] = [16, 185, 129];
  const stoneColor: [number, number, number] = [120, 113, 108];
  const darkColor: [number, number, number] = [41, 37, 36];

  // Generate invoice number
  const invoiceNumber = `INV-${load.loadId.replace("LD-", "")}-${Date.now().toString().slice(-6)}`;
  const issueDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // ===== TOP DECORATIVE HEADER BAR =====
  doc.setFillColor(...amberColor);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Gradient-like effect with emerald accent
  doc.setFillColor(...emeraldColor);
  doc.rect(pageWidth - 60, 0, 60, 8, "F");

  // ===== COMPANY HEADER SECTION =====
  let yPos = 25;

  // Company name (left aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...darkColor);
  doc.text("AutoHaul", margin, yPos);
  
  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...stoneColor);
  doc.text("Premium Vehicle Transport", margin, yPos + 6);

  // INVOICE label (right aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...amberColor);
  doc.text("INVOICE", pageWidth - margin, yPos, { align: "right" });

  // Invoice number below
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...stoneColor);
  doc.text(invoiceNumber, pageWidth - margin, yPos + 8, { align: "right" });

  // ===== DIVIDER LINE =====
  yPos = 45;
  doc.setDrawColor(...amberColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // ===== BILL TO & INVOICE DETAILS ROW =====
  yPos = 55;
  
  // Bill To section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...emeraldColor);
  doc.text("BILL TO", margin, yPos);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(load.shipper.name, margin, yPos + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...stoneColor);
  if (load.shipper.company) {
    doc.text(load.shipper.company, margin, yPos + 12);
  }
  doc.text(load.shipper.phone, margin, yPos + (load.shipper.company ? 18 : 12));

  // Invoice details (right side)
  const detailsX = pageWidth - margin - 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...emeraldColor);
  doc.text("INVOICE DETAILS", detailsX, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...stoneColor);
  doc.text("Issue Date:", detailsX, yPos + 8);
  doc.text("Due Date:", detailsX, yPos + 14);
  doc.text("Load ID:", detailsX, yPos + 20);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkColor);
  doc.text(issueDate, pageWidth - margin, yPos + 8, { align: "right" });
  doc.text(dueDate, pageWidth - margin, yPos + 14, { align: "right" });
  doc.text(load.loadId, pageWidth - margin, yPos + 20, { align: "right" });

  // ===== QUICK INFO BAR =====
  yPos = 90;
  const barHeight = 18;
  const barWidth = (pageWidth - margin * 2 - 9) / 4;
  
  // Invoice No box (amber)
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(margin, yPos, barWidth, barHeight, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...amberColor);
  doc.text("INVOICE NO.", margin + 4, yPos + 5);
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(invoiceNumber.slice(0, 12), margin + 4, yPos + 12);
  
  // Issue Date box
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(margin + barWidth + 3, yPos, barWidth, barHeight, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...emeraldColor);
  doc.text("ISSUE DATE", margin + barWidth + 7, yPos + 5);
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(issueDate, margin + barWidth + 7, yPos + 12);
  
  // Due Date box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin + (barWidth + 3) * 2, yPos, barWidth, barHeight, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...amberColor);
  doc.text("DUE DATE", margin + (barWidth + 3) * 2 + 4, yPos + 5);
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(dueDate, margin + (barWidth + 3) * 2 + 4, yPos + 12);
  
  // Total box (emerald filled)
  doc.setFillColor(...emeraldColor);
  doc.roundedRect(margin + (barWidth + 3) * 3, yPos, barWidth, barHeight, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL DUE", margin + (barWidth + 3) * 3 + 4, yPos + 5);
  doc.setFontSize(12);
  doc.text(`$${load.price.toLocaleString()}`, margin + (barWidth + 3) * 3 + 4, yPos + 13);

  // ===== VEHICLE DETAILS SECTION =====
  yPos = 120;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...emeraldColor);
  doc.text("VEHICLE INFORMATION", margin, yPos);
  
  // Vehicle info card
  yPos += 6;
  doc.setFillColor(250, 250, 249); // stone-50
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 24, 3, 3, "F");
  
  // Left side - vehicle details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(`${load.vehicleInfo.year} ${load.vehicleInfo.make} ${load.vehicleInfo.model}`, margin + 5, yPos + 9);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...stoneColor);
  doc.text(`VIN: ${load.vehicleInfo.vin}`, margin + 5, yPos + 16);
  doc.text(`STC: ${load.vehicleInfo.stc}`, margin + 5, yPos + 21);

  // ===== ROUTE SECTION =====
  yPos = 158;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...amberColor);
  doc.text("TRANSPORT ROUTE", margin, yPos);
  
  yPos += 6;
  const routeBoxWidth = (pageWidth - margin * 2 - 20) / 2;
  
  // Pickup box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, yPos, routeBoxWidth, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...amberColor);
  doc.text("PICKUP", margin + 5, yPos + 6);
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(`${load.pickup.city}, ${load.pickup.state}`, margin + 5, yPos + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...stoneColor);
  doc.text(load.pickupDate, margin + 5, yPos + 21);
  doc.text(`ID: ${load.pickup.ampId}`, margin + 5, yPos + 26);

  // Arrow in middle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...emeraldColor);
  doc.text("→", margin + routeBoxWidth + 7, yPos + 16);

  // Delivery box
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin + routeBoxWidth + 20, yPos, routeBoxWidth, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...emeraldColor);
  doc.text("DELIVERY", margin + routeBoxWidth + 25, yPos + 6);
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(`${load.delivery.city}, ${load.delivery.state}`, margin + routeBoxWidth + 25, yPos + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...stoneColor);
  doc.text(load.deliveryDate, margin + routeBoxWidth + 25, yPos + 21);
  doc.text(`ZIP: ${load.delivery.zipcode}`, margin + routeBoxWidth + 25, yPos + 26);

  // ===== LINE ITEMS TABLE =====
  yPos = 200;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...emeraldColor);
  doc.text("SERVICES", margin, yPos);
  
  yPos += 6;
  
  // Table header
  doc.setFillColor(...emeraldColor);
  doc.rect(margin, yPos, pageWidth - margin * 2, 10, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Description", margin + 5, yPos + 7);
  doc.text("Qty", margin + 100, yPos + 7);
  doc.text("Unit Price", margin + 120, yPos + 7);
  doc.text("Amount", pageWidth - margin - 5, yPos + 7, { align: "right" });
  
  // Table row 1 - Transport service
  yPos += 10;
  doc.setFillColor(250, 250, 249);
  doc.rect(margin, yPos, pageWidth - margin * 2, 12, "F");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text("Vehicle Transport Service", margin + 5, yPos + 8);
  doc.text("1", margin + 103, yPos + 8);
  doc.text(`$${load.price.toLocaleString()}.00`, margin + 120, yPos + 8);
  doc.setFont("helvetica", "bold");
  doc.text(`$${load.price.toLocaleString()}.00`, pageWidth - margin - 5, yPos + 8, { align: "right" });
  
  // Table row 2 - Details
  yPos += 12;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...stoneColor);
  doc.text(`${load.pickup.city}, ${load.pickup.state} → ${load.delivery.city}, ${load.delivery.state}`, margin + 10, yPos + 7);

  // ===== TOTALS SECTION =====
  yPos += 20;
  const totalsX = pageWidth - margin - 70;
  
  doc.setDrawColor(231, 229, 228); // stone-200
  doc.setLineWidth(0.3);
  doc.line(totalsX, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...stoneColor);
  doc.text("Subtotal:", totalsX, yPos);
  doc.setTextColor(...darkColor);
  doc.text(`$${load.price.toLocaleString()}.00`, pageWidth - margin, yPos, { align: "right" });
  
  yPos += 8;
  doc.setTextColor(...stoneColor);
  doc.text("Tax (0%):", totalsX, yPos);
  doc.setTextColor(...darkColor);
  doc.text("$0.00", pageWidth - margin, yPos, { align: "right" });
  
  yPos += 4;
  doc.line(totalsX, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setFillColor(...emeraldColor);
  doc.roundedRect(totalsX - 5, yPos - 6, 80, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL DUE:", totalsX, yPos + 3);
  doc.setFontSize(12);
  doc.text(`$${load.price.toLocaleString()}.00`, pageWidth - margin - 3, yPos + 3, { align: "right" });

  // ===== PAYMENT METHOD =====
  yPos += 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...amberColor);
  doc.text("PAYMENT METHOD", margin, yPos);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(load.paymentMethod, margin, yPos + 8);

  // ===== FOOTER =====
  const footerY = pageHeight - 25;
  
  // Footer line
  doc.setDrawColor(...amberColor);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...stoneColor);
  doc.text("Thank you for choosing AutoHaul for your vehicle transport needs.", pageWidth / 2, footerY, { align: "center" });
  doc.text("Questions? Contact us at support@autohaul.com", pageWidth / 2, footerY + 5, { align: "center" });

  // Bottom decorative bar
  doc.setFillColor(...emeraldColor);
  doc.rect(0, pageHeight - 6, pageWidth, 6, "F");
  doc.setFillColor(...amberColor);
  doc.rect(0, pageHeight - 6, 60, 6, "F");

  // Generate blob URL
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
};
