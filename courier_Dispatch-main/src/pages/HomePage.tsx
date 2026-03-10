import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, DollarSign, Users, Clock, ArrowUpRight, TrendingUp, Activity, ChevronRight, ScanLine, Car, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { VinScannerDialog } from "@/components/loads/VinScannerDialog";
import { BOLViewerDialog } from "@/components/loads/BOLViewerDialog";
import { InvoiceViewerDialog } from "@/components/loads/InvoiceViewerDialog";
import { useBolManager, findLoadByVin } from "@/hooks/useBolManager";
import { useCourierOverviewQuery } from "@/hooks/queries/useCourierDashboard";
import { useAnalyticsStatsQuery, useDeliveryTrendsQuery } from "@/hooks/queries/useAnalytics";
import { contractToLoad } from "@/lib/contractToLoad";
import { toast } from "sonner";
import { generateInvoice } from "@/utils/generateInvoice";
import type { Load } from "@/components/loads/LoadsTable";

export const HomePage = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [invoiceScannerOpen, setInvoiceScannerOpen] = useState(false);
  const [bolViewerOpen, setBolViewerOpen] = useState(false);
  const [invoiceViewerOpen, setInvoiceViewerOpen] = useState(false);
  const [matchedLoad, setMatchedLoad] = useState<Load | null>(null);
  const [invoiceLoad, setInvoiceLoad] = useState<Load | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [scannedVin, setScannedVin] = useState("");

  const { addBol, addInvoice } = useBolManager();
  const { data: overview } = useCourierOverviewQuery();
  const { data: analyticsStats = [] } = useAnalyticsStatsQuery("30days");
  const { data: trendData = [] } = useDeliveryTrendsQuery("7days");

  const assignedLoads: Load[] = overview?.contracts ? overview.contracts.map(contractToLoad) : [];

  const handleVinScanned = (vin: string) => {
    // Find matching load by VIN
    const load = findLoadByVin(assignedLoads, vin);
    
    if (load) {
      // Add BOL to the load
      addBol(load.id, vin, load.loadId);
      setMatchedLoad(load);
      setScannedVin(vin);
      
      toast.success("Load Found!", {
        description: `BOL generated for ${load.vehicleInfo.year} ${load.vehicleInfo.make} ${load.vehicleInfo.model}`,
      });
      
      // Open BOL viewer
      setBolViewerOpen(true);
    } else {
      toast.error("No matching load found", {
        description: "The scanned VIN doesn't match any of your assigned loads.",
      });
    }
    
    setScannerOpen(false);
  };

  const handleInvoiceVinScanned = (vin: string) => {
    // Find matching load by VIN
    const load = findLoadByVin(assignedLoads, vin);
    
    if (load) {
      // Generate invoice
      const url = generateInvoice(load);
      addInvoice(load.id, load.loadId, url);
      setInvoiceLoad(load);
      setInvoiceUrl(url);
      
      toast.success("Invoice Created!", {
        description: `Invoice generated for ${load.vehicleInfo.year} ${load.vehicleInfo.make} ${load.vehicleInfo.model}`,
      });
      
      // Open Invoice viewer
      setInvoiceViewerOpen(true);
    } else {
      toast.error("No matching load found", {
        description: "The entered VIN doesn't match any of your assigned loads.",
      });
    }
    
    setInvoiceScannerOpen(false);
  };

  const onTimeStat = analyticsStats.find((s) => s.title === "On-Time Rate");
  const stats = [
    { label: 'Active Shipments', value: String(overview?.stats.assignedCount ?? 0), change: '', icon: Package, color: 'amber' as const, page: 'loads' as const },
    { label: 'Revenue', value: overview?.stats.revenue ?? '$0', change: '', icon: DollarSign, color: 'emerald' as const, page: 'accounting' as const },
    { label: 'Total Clients', value: '-', change: '', icon: Users, color: 'amber' as const, page: 'communication' as const },
    { label: 'On-Time Rate', value: onTimeStat?.value ?? '0%', change: '', icon: Clock, color: 'emerald' as const, page: 'analytics' as const },
  ];

  const recentActivity = (overview?.recentActivity ?? []).slice(0, 4).map((a, i) => ({
    id: a.id,
    message: `${a.action} - ${a.entity}`,
    time: a.date,
    icon: a.status === "completed" ? DollarSign : Package,
    color: (a.status === "completed" ? "emerald" : "amber") as "emerald" | "amber",
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Package className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-amber-600/70 font-semibold uppercase tracking-widest">Dashboard</p>
            <h1 className="text-2xl font-bold text-stone-700">Welcome back</h1>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-emerald-200/50">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-stone-600">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const isEmerald = stat.color === 'emerald';
          return (
            <Link
              key={i}
              to={`/dashboard/${stat.page}`}
              className={cn(
                "group p-4 bg-white border rounded-xl hover:shadow-md transition-all duration-300 cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 block",
                isEmerald ? "border-emerald-100 hover:border-emerald-200" : "border-amber-100 hover:border-amber-200"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                  isEmerald ? "bg-emerald-50 group-hover:bg-emerald-100" : "bg-amber-50 group-hover:bg-amber-100"
                )}>
                  <stat.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isEmerald ? "text-emerald-600 group-hover:text-emerald-700" : "text-amber-600 group-hover:text-amber-700"
                  )} strokeWidth={2} />
                </div>
                {stat.change ? (
                  <span className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-lg",
                    isEmerald ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                  )}>
                    {stat.change}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-stone-400 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-stone-700">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Scan & Invoice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Scan Card */}
        <button
          onClick={() => setScannerOpen(true)}
          className="group p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:scale-105 transition-transform">
              <ScanLine className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <div className="text-left flex-1">
              <p className="text-lg font-bold text-stone-700">Quick Scan</p>
              <p className="text-sm text-stone-500">Scan VIN to generate BOL</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <Car className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </button>

        {/* Create Invoice Card */}
        <button
          onClick={() => setInvoiceScannerOpen(true)}
          className="group p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-dashed border-amber-200 rounded-2xl hover:border-amber-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-200/30 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-105 transition-transform">
              <Receipt className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <div className="text-left flex-1">
              <p className="text-lg font-bold text-stone-700">Create Invoice</p>
              <p className="text-sm text-stone-500">Enter VIN to generate invoice</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-amber-300 rounded-full" />
          <h2 className="text-lg font-semibold text-stone-700">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'View Loads', desc: 'Manage shipments', icon: Package, page: 'loads' },
            { label: 'Accounting', desc: 'Financial overview', icon: DollarSign, page: 'accounting' },
            { label: 'Analytics', desc: 'Performance insights', icon: TrendingUp, page: 'analytics' },
          ].map((action, i) => (
            <Link
              key={i}
              to={`/dashboard/${action.page}`}
              className="group flex items-center gap-4 p-4 bg-white border border-amber-100 rounded-xl text-left hover:shadow-md hover:border-amber-200 transition-all duration-300"
            >
              <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <action.icon className="h-5 w-5 text-amber-600 group-hover:text-amber-700 transition-colors" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-700">{action.label}</p>
                <p className="text-sm text-stone-400">{action.desc}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <ArrowUpRight className="h-4 w-4 text-amber-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-7 p-5 bg-white border border-amber-100 rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Activity className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="font-semibold text-stone-700">Recent Activity</h2>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {(recentActivity.length > 0 ? recentActivity : [
              { id: "1", message: "No recent activity", time: "", icon: Activity, color: "amber" as const },
            ]).map((activity) => {
              const isEmerald = activity.color === 'emerald';
              return (
                <div 
                  key={activity.id}
                  className={cn(
                    "group flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer",
                    isEmerald ? "hover:bg-emerald-50/50" : "hover:bg-amber-50/50"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                    isEmerald ? "bg-emerald-50 group-hover:bg-emerald-100" : "bg-amber-50 group-hover:bg-amber-100"
                  )}>
                    <activity.icon className={cn(
                      "h-4 w-4",
                      isEmerald ? "text-emerald-600" : "text-amber-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700">{activity.message}</p>
                    <p className="text-xs text-stone-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Performance Card */}
        <div className="lg:col-span-5 p-5 bg-white border border-emerald-100 rounded-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Performance</p>
              <p className="text-sm text-stone-500">This month</p>
            </div>
          </div>
          
          {/* Value */}
          <p className="text-4xl font-bold text-stone-700 mb-1">
            {trendData.length > 0 ? `${trendData.reduce((s, t) => s + t.deliveries, 0)} deliveries` : "0"}
          </p>
          <p className="text-stone-400 text-sm">Last 7 days</p>
          
          {/* Mini chart */}
          <div className="flex items-end gap-2 mt-6 h-16">
            {(trendData.length > 0 ? trendData.map((t) => t.percentage) : [0, 0, 0, 0, 0, 0, 0]).map((h, i) => (
              <div 
                key={i}
                className={cn(
                  "flex-1 rounded-t transition-colors duration-300 cursor-pointer",
                  i % 2 === 0 ? "bg-amber-100 hover:bg-amber-300" : "bg-emerald-100 hover:bg-emerald-300"
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-stone-400">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs text-stone-400">Shipments</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIN Scanner Dialog for BOL */}
      <VinScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onVinScanned={handleVinScanned}
        existingVin=""
      />

      {/* VIN Scanner Dialog for Invoice */}
      <VinScannerDialog
        open={invoiceScannerOpen}
        onOpenChange={setInvoiceScannerOpen}
        onVinScanned={handleInvoiceVinScanned}
        existingVin=""
        mode="invoice"
      />

      {/* BOL Viewer Dialog */}
      <BOLViewerDialog
        open={bolViewerOpen}
        onOpenChange={setBolViewerOpen}
        load={matchedLoad}
        scannedVin={scannedVin}
      />

      {/* Invoice Viewer Dialog */}
      <InvoiceViewerDialog
        open={invoiceViewerOpen}
        onOpenChange={setInvoiceViewerOpen}
        load={invoiceLoad}
        invoiceUrl={invoiceUrl}
      />
    </div>
  );
};
