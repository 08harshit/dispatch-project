import { useState } from "react";
import { TrendingUp, DollarSign, Package, Clock, BarChart3, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Zap, Target, Route, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const AnalyticsPage = () => {
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const metrics = [
    { label: 'Total Revenue', value: '$128,450', change: '+12.5%', up: true, icon: DollarSign, color: 'emerald' },
    { label: 'Completed Loads', value: '342', change: '+8.2%', up: true, icon: Package, color: 'amber' },
    { label: 'Avg. Delivery Time', value: '2.4 days', change: '-15%', up: true, icon: Clock, color: 'emerald' },
    { label: 'Success Rate', value: '94.8%', change: '+2.1%', up: true, icon: Target, color: 'amber' },
  ];

  const monthlyData = [
    { month: 'Jan', revenue: 45, loads: 65 },
    { month: 'Feb', revenue: 52, loads: 70 },
    { month: 'Mar', revenue: 48, loads: 62 },
    { month: 'Apr', revenue: 70, loads: 80 },
    { month: 'May', revenue: 65, loads: 75 },
    { month: 'Jun', revenue: 85, loads: 90 },
    { month: 'Jul', revenue: 78, loads: 85 },
    { month: 'Aug', revenue: 92, loads: 95 },
    { month: 'Sep', revenue: 88, loads: 88 },
    { month: 'Oct', revenue: 95, loads: 92 },
    { month: 'Nov', revenue: 100, loads: 98 },
    { month: 'Dec', revenue: 90, loads: 85 },
  ];

  const topRoutes = [
    { route: 'Los Angeles → Phoenix', loads: 45, revenue: '$18,450', growth: '+15%' },
    { route: 'Dallas → Houston', loads: 38, revenue: '$14,200', growth: '+8%' },
    { route: 'Chicago → Detroit', loads: 32, revenue: '$12,800', growth: '+12%' },
    { route: 'Miami → Atlanta', loads: 28, revenue: '$11,200', growth: '+5%' },
    { route: 'New York → Boston', loads: 25, revenue: '$9,800', growth: '+10%' },
  ];

  const loadTypes = [
    { type: 'Sedan', percentage: 35, color: 'bg-amber-200' },
    { type: 'SUV', percentage: 28, color: 'bg-emerald-200' },
    { type: 'Truck', percentage: 22, color: 'bg-orange-200' },
    { type: 'Luxury', percentage: 15, color: 'bg-teal-200' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-[1.25rem_1.75rem_1.25rem_1.75rem] bg-gradient-to-br from-emerald-100 via-teal-50 to-amber-50 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-emerald-700" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs text-emerald-600/70 font-semibold uppercase tracking-widest">Analytics</p>
            <h1 className="text-2xl font-bold text-stone-700">Performance Insights</h1>
          </div>
        </div>
        
        {/* Time filter pills */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-stone-100">
          {['7D', '30D', '90D', 'YTD'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300",
                selectedPeriod === period 
                  ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md shadow-amber-200/50" 
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid - Innovative Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const isEmerald = metric.color === 'emerald';
          return (
            <div 
              key={i}
              className={cn(
                "group relative p-5 bg-white border rounded-[1.5rem_2rem_1.5rem_2rem] overflow-hidden transition-all duration-500",
                "hover:shadow-xl hover:-translate-y-1",
                isEmerald 
                  ? "border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-100/50" 
                  : "border-amber-100 hover:border-amber-200 hover:shadow-amber-100/50"
              )}
            >
              {/* Decorative gradient blob */}
              <div className={cn(
                "absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-40 group-hover:scale-125",
                isEmerald ? "bg-emerald-400" : "bg-amber-400"
              )} />
              
              {/* Accent bar */}
              <div className={cn(
                "absolute left-0 top-4 bottom-4 w-1 rounded-r-full",
                isEmerald 
                  ? "bg-gradient-to-b from-emerald-400 to-teal-400" 
                  : "bg-gradient-to-b from-amber-400 to-orange-400"
              )} />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "h-12 w-12 rounded-[0.75rem_1rem_0.75rem_1rem] flex items-center justify-center transition-all duration-300",
                    isEmerald 
                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 group-hover:from-emerald-100 group-hover:to-teal-100" 
                      : "bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100"
                  )}>
                    <metric.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isEmerald ? "text-emerald-600" : "text-amber-600"
                    )} strokeWidth={2} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold",
                    metric.up 
                      ? "bg-emerald-50 text-emerald-600" 
                      : "bg-rose-50 text-rose-600"
                  )}>
                    {metric.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {metric.change}
                  </div>
                </div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">{metric.label}</p>
                <p className="text-2xl font-bold text-stone-700 mt-1">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue & Loads Chart - Innovative Design */}
        <div className="lg:col-span-8 relative p-6 bg-gradient-to-br from-white via-stone-50/30 to-amber-50/20 border border-stone-100/80 rounded-[2rem_2.5rem_2rem_2.5rem] overflow-hidden">
          {/* Floating decorative elements */}
          <div className="absolute top-4 right-4 h-20 w-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full blur-2xl opacity-60" />
          <div className="absolute bottom-4 left-1/3 h-16 w-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-2xl opacity-50" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-[1rem_1.25rem_1rem_1.25rem] bg-gradient-to-br from-stone-50 to-white border border-stone-100 flex items-center justify-center shadow-sm">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Sparkles className="h-2.5 w-2.5 text-emerald-500" />
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-stone-700">Revenue & Load Trends</h2>
                  <p className="text-xs text-stone-400">Monthly performance overview</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-200 ring-2 ring-emerald-100" />
                  <span className="text-xs font-medium text-stone-500">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-200 ring-2 ring-amber-100" />
                  <span className="text-xs font-medium text-stone-500">Loads</span>
                </div>
              </div>
            </div>
            
            {/* Innovative Bar Chart - Light pastel colors */}
            <div className="relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((_, i) => (
                  <div key={i} className="border-t border-dashed border-stone-100" />
                ))}
              </div>
              
              <div className="flex items-end gap-2 h-52 relative">
                {monthlyData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-stone-800 text-white text-[10px] px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap">
                      Rev: ${data.revenue}k • Loads: {data.loads}
                    </div>
                    
                    <div className="w-full flex gap-1 items-end h-44">
                      {/* Revenue bar - very light emerald with rounded pill shape */}
                      <div 
                        className="flex-1 bg-emerald-200/80 hover:bg-emerald-300 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                        style={{ height: `${data.revenue}%` }}
                      />
                      {/* Loads bar - very light amber */}
                      <div 
                        className="flex-1 bg-amber-200/80 hover:bg-amber-300 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                        style={{ height: `${data.loads}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Summary stats below chart */}
            <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-stone-100/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">$128K</p>
                <p className="text-xs text-stone-400">Total Revenue</p>
              </div>
              <div className="h-8 w-px bg-stone-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">342</p>
                <p className="text-xs text-stone-400">Total Loads</p>
              </div>
              <div className="h-8 w-px bg-stone-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-600">$375</p>
                <p className="text-xs text-stone-400">Avg per Load</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Types - Innovative Visualization */}
        <div className="lg:col-span-4 relative p-6 bg-white border border-stone-100 rounded-[2rem_2.5rem_2rem_2.5rem] overflow-hidden">
          <div className="absolute -bottom-12 -right-12 h-40 w-40 bg-gradient-to-br from-amber-200 to-emerald-200 rounded-full blur-3xl opacity-30" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-[0.75rem_1rem_0.75rem_1rem] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-stone-700">Vehicle Types</h2>
                <p className="text-xs text-stone-400">Load distribution</p>
              </div>
            </div>
            
            {/* Innovative circular progress bars */}
            <div className="space-y-5 mb-6">
              {loadTypes.map((type, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-3">
                    {/* Circular indicator */}
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                      type.color,
                      "group-hover:scale-110 group-hover:shadow-md"
                    )}>
                      {type.percentage}%
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-stone-600">{type.type}</span>
                        <span className="text-xs text-stone-400">{Math.round(342 * type.percentage / 100)} loads</span>
                      </div>
                      {/* Progress bar with lighter colors */}
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            type.color
                          )}
                          style={{ width: `${type.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total indicator */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100/50 border border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-stone-500">Total Vehicles</span>
                </div>
                <span className="text-xl font-bold text-stone-700">342</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Routes - Innovative Table */}
      <div className="relative p-6 bg-white border border-stone-100 rounded-[2rem_2.5rem_2rem_2.5rem] overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-48 h-48 bg-amber-100 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-20" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-[0.75rem_1rem_0.75rem_1rem] bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 flex items-center justify-center">
                <Route className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-stone-700">Top Performing Routes</h2>
                <p className="text-xs text-stone-400">Most profitable corridors this month</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAllRoutes(true)}
              className="px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
            >
              View All
            </button>
          </div>
          
          {/* Innovative staggered card layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {topRoutes.map((route, i) => (
              <div 
                key={i}
                className={cn(
                  "group relative p-4 rounded-[1.25rem_1.75rem_1.25rem_1.75rem] transition-all duration-500 cursor-pointer overflow-hidden",
                  i === 0 
                    ? "bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50/30 border-2 border-amber-200/50 shadow-lg shadow-amber-100/50 md:col-span-2" 
                    : "bg-white border border-stone-100 hover:border-amber-100 hover:shadow-md hover:shadow-amber-50"
                )}
              >
                {/* Floating decoration for top route */}
                {i === 0 && (
                  <>
                    <div className="absolute -top-6 -right-6 h-16 w-16 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full blur-2xl opacity-40" />
                    <div className="absolute -bottom-4 -left-4 h-12 w-12 bg-gradient-to-br from-emerald-300 to-teal-300 rounded-full blur-xl opacity-30" />
                  </>
                )}
                
                {/* Accent bar */}
                <div className={cn(
                  "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300",
                  i === 0 
                    ? "bg-gradient-to-b from-amber-400 via-orange-400 to-amber-300" 
                    : "bg-stone-200 group-hover:bg-gradient-to-b group-hover:from-amber-300 group-hover:to-orange-300"
                )} />
                
                <div className="relative pl-3">
                  {/* Rank + Route header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      "flex-shrink-0 h-9 w-9 rounded-[0.5rem_0.75rem_0.5rem_0.75rem] flex items-center justify-center font-bold text-sm transition-all duration-300",
                      i === 0 
                        ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-md shadow-amber-200/50" 
                        : "bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-700"
                    )}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold truncate transition-colors",
                        i === 0 ? "text-stone-800" : "text-stone-600 group-hover:text-stone-800"
                      )}>
                        {route.route.split(' → ')[0]}
                      </p>
                      <p className={cn(
                        "text-xs font-medium",
                        i === 0 ? "text-amber-600" : "text-stone-400"
                      )}>
                        → {route.route.split(' → ')[1]}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stats row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Package className={cn(
                        "h-3.5 w-3.5",
                        i === 0 ? "text-amber-500" : "text-stone-400"
                      )} />
                      <span className={cn(
                        "text-xs font-semibold",
                        i === 0 ? "text-amber-700" : "text-stone-500"
                      )}>
                        {route.loads}
                      </span>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                      i === 0 
                        ? "bg-emerald-100 text-emerald-600" 
                        : "bg-stone-50 text-stone-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                    )}>
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      {route.growth}
                    </div>
                  </div>
                  
                  {/* Revenue for top route */}
                  {i === 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-500">Revenue</span>
                        <span className="text-lg font-bold text-emerald-600">{route.revenue}</span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* All Routes Sheet */}
      <Sheet open={showAllRoutes} onOpenChange={setShowAllRoutes}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[0.75rem_1rem_0.75rem_1rem] bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                <Route className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-stone-700">All Routes</p>
                <p className="text-xs text-stone-400 font-normal">Performance rankings</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-3">
            {topRoutes.map((route, i) => (
              <div 
                key={i}
                className={cn(
                  "group relative p-4 rounded-[1rem_1.25rem_1rem_1.25rem] transition-all duration-300 cursor-pointer overflow-hidden border",
                  i === 0 
                    ? "bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200" 
                    : "bg-white border-stone-100 hover:border-amber-100 hover:bg-amber-50/30"
                )}
              >
                {/* Accent bar */}
                <div className={cn(
                  "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
                  i === 0 
                    ? "bg-gradient-to-b from-amber-400 to-orange-400" 
                    : "bg-stone-200 group-hover:bg-amber-300"
                )} />
                
                <div className="pl-3 flex items-center gap-4">
                  {/* Rank */}
                  <div className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-[0.5rem_0.75rem_0.5rem_0.75rem] flex items-center justify-center font-bold text-sm",
                    i === 0 
                      ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-md shadow-amber-200/50" 
                      : "bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-700"
                  )}>
                    #{i + 1}
                  </div>
                  
                  {/* Route info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-700">{route.route}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {route.loads} loads
                      </span>
                    </div>
                  </div>
                  
                  {/* Revenue & Growth */}
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{route.revenue}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-500">{route.growth}</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 pl-3">
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        i === 0 ? "bg-gradient-to-r from-amber-300 to-orange-300" : "bg-emerald-200 group-hover:bg-emerald-300"
                      )}
                      style={{ width: `${(route.loads / 45) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
