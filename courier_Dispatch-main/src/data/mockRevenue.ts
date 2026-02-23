import { RevenueRecord } from "@/components/accounting/RevenueTable";

export const mockRevenue: RevenueRecord[] = [
  {
    id: "1",
    revenue: 850,
    bookingId: "BK-001",
    date: "01-20-2026",
    paymentMethod: "COD",
    hasDocs: true,
  },
  {
    id: "2",
    revenue: 1200,
    bookingId: "BK-002",
    date: "01-18-2026",
    paymentMethod: "COP",
    hasDocs: true,
  },
  {
    id: "3",
    revenue: 1500,
    bookingId: "BK-003",
    date: "01-15-2026",
    paymentMethod: "Wire",
    hasDocs: true,
  },
  {
    id: "4",
    revenue: 1800,
    bookingId: "BK-004",
    date: "01-12-2026",
    paymentMethod: "COD",
    hasDocs: false,
  },
  {
    id: "5",
    revenue: 950,
    bookingId: "BK-005",
    date: "01-10-2026",
    paymentMethod: "Check",
    hasDocs: true,
  },
  {
    id: "6",
    revenue: 1100,
    bookingId: "BK-006",
    date: "01-08-2026",
    paymentMethod: "Wire",
    hasDocs: true,
  },
];
