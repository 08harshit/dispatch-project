import { jsPDF } from "jspdf";
import type { Load } from "@/components/loads/LoadsTable";

export const generateBOL = (load: Load, scannedVin: string): { blob: Blob; fileName: string } => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Header
  doc.setFillColor(245, 158, 11); // Amber
  doc.rect(0, 0, pageWidth, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("BILL OF LADING", pageWidth / 2, 18, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Load ID: ${load.loadId}`, pageWidth / 2, 28, { align: "center" });

  y = 45;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Date and BOL Number
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${today}`, margin, y);
  doc.text(`BOL #: BOL-${load.loadId}-${Date.now().toString().slice(-6)}`, pageWidth - margin, y, { align: "right" });
  
  y += 12;

  // Vehicle Information Section
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, "F");
  
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("VEHICLE INFORMATION", margin + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  y += 15;
  doc.text(`Year/Make/Model: ${load.vehicleInfo.year} ${load.vehicleInfo.make} ${load.vehicleInfo.model}`, margin + 5, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text(`VIN: ${scannedVin}`, margin + 5, y);
  doc.setFont("helvetica", "normal");
  y += 7;
  doc.text(`STC: ${load.vehicleInfo.stc}`, margin + 5, y);
  
  y += 18;

  // Origin & Destination
  const boxWidth = (pageWidth - 2 * margin - 10) / 2;
  
  // Origin Box
  doc.setFillColor(220, 252, 231); // Emerald-100
  doc.roundedRect(margin, y, boxWidth, 40, 3, 3, "F");
  
  doc.setTextColor(6, 95, 70); // Emerald-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ORIGIN", margin + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Location: ${load.pickup.city}, ${load.pickup.state}`, margin + 5, y + 18);
  doc.text(`ZIP: ${load.pickup.zipcode}`, margin + 5, y + 25);
  doc.text(`Type: ${load.pickup.type}`, margin + 5, y + 32);
  
  // Destination Box
  const destX = margin + boxWidth + 10;
  doc.setFillColor(219, 234, 254); // Blue-100
  doc.roundedRect(destX, y, boxWidth, 40, 3, 3, "F");
  
  doc.setTextColor(30, 64, 175); // Blue-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATION", destX + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Location: ${load.delivery.city}, ${load.delivery.state}`, destX + 5, y + 18);
  doc.text(`ZIP: ${load.delivery.zipcode}`, destX + 5, y + 25);
  
  y += 50;

  // Dates Section
  doc.setFillColor(243, 244, 246); // Gray-100
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, "F");
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Pickup Date: ${load.pickupDate}`, margin + 10, y + 12);
  doc.text(`Delivery Date: ${load.deliveryDate}`, pageWidth / 2 + 10, y + 12);
  
  y += 30;

  // Shipper Information
  doc.setFillColor(254, 226, 226); // Rose-100
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 3, 3, "F");
  
  doc.setTextColor(159, 18, 57); // Rose-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SHIPPER INFORMATION", margin + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${load.shipper.name}`, margin + 5, y + 18);
  doc.text(`Company: ${load.shipper.company}`, margin + 80, y + 18);
  doc.text(`Phone: ${load.shipper.phone}`, margin + 5, y + 25);
  
  y += 40;

  // Payment Information
  doc.setFillColor(237, 233, 254); // Violet-100
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, "F");
  
  doc.setTextColor(91, 33, 182); // Violet-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT", margin + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(load.price);
  doc.text(`${formattedPrice} - ${load.paymentMethod}`, margin + 5, y + 16);
  
  y += 30;

  // Condition Checklist
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("VEHICLE CONDITION AT PICKUP", margin, y);
  
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const conditions = [
    "[ ] Front Bumper",
    "[ ] Rear Bumper",
    "[ ] Hood",
    "[ ] Roof",
    "[ ] Left Side",
    "[ ] Right Side",
    "[ ] Windshield",
    "[ ] Rear Glass",
  ];
  
  const cols = 4;
  const colWidth = (pageWidth - 2 * margin) / cols;
  conditions.forEach((condition, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    doc.text(condition, margin + col * colWidth, y + row * 6);
  });
  
  y += 20;

  // Signatures Section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  
  const sigWidth = (pageWidth - 2 * margin - 20) / 2;
  
  // Driver Signature
  doc.line(margin, y + 15, margin + sigWidth, y + 15);
  doc.setFontSize(8);
  doc.text("Driver Signature", margin, y + 20);
  doc.text("Date: ________________", margin, y + 26);
  
  // Shipper Signature
  doc.line(margin + sigWidth + 20, y + 15, pageWidth - margin, y + 15);
  doc.text("Shipper Signature", margin + sigWidth + 20, y + 20);
  doc.text("Date: ________________", margin + sigWidth + 20, y + 26);
  
  // Footer
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 280, pageWidth, 17, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("This Bill of Lading is subject to all terms and conditions as set forth by the carrier.", pageWidth / 2, 288, { align: "center" });

  const fileName = `BOL-${load.loadId}-${scannedVin.slice(-6)}.pdf`;
  const blob = doc.output("blob");
  
  return { blob, fileName };
};

export const downloadBOL = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
