import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { getColorClasses, getPerformanceStatusConfig } from "@/utils/styleHelpers";
import {
  DateRange,
  PerformanceFilter,
  dateRangeLabels,
  AnalyticsStatItem,
  DeliveryTrendItem,
  CourierPerformanceItem,
  fetchAnalyticsStats,
  fetchDeliveryTrends,
  fetchCourierPerformance,
} from "@/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  Zap,
  Target,
  Clock,
  Package,
  X,
  RotateCcw
} from "lucide-react";



const getStatusConfig = getPerformanceStatusConfig;

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>("7days");
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statsData, setStatsData] = useState<Record<DateRange, AnalyticsStatItem[]>>({} as Record<DateRange, AnalyticsStatItem[]>);
  const [deliveryTrendsData, setDeliveryTrendsData] = useState<Record<DateRange, DeliveryTrendItem[]>>({} as Record<DateRange, DeliveryTrendItem[]>);
  const [courierPerformance, setCourierPerformance] = useState<CourierPerformanceItem[]>([]);

  useEffect(() => {
    const ranges: DateRange[] = ["7days", "14days", "30days", "90days"];
    const loadAll = async () => {
      const statsEntries = await Promise.all(
        ranges.map(async (r) => [r, await fetchAnalyticsStats(r)] as const)
      );
      setStatsData(Object.fromEntries(statsEntries) as Record<DateRange, AnalyticsStatItem[]>);
      const trendEntries = await Promise.all(
        ranges.map(async (r) => [r, await fetchDeliveryTrends(r)] as const)
      );
      setDeliveryTrendsData(Object.fromEntries(trendEntries) as Record<DateRange, DeliveryTrendItem[]>);
      setCourierPerformance(await fetchCourierPerformance());
    };
    loadAll();
  }, []);

  const currentStats = statsData[dateRange] || [];
  const currentDeliveryTrends = deliveryTrendsData[dateRange] || [];

  const filteredCouriers = useMemo(() => {
    if (performanceFilter === "all") return courierPerformance;
    return courierPerformance.filter(c => c.status === performanceFilter);
  }, [performanceFilter, courierPerformance]);

  const totalDeliveries = currentDeliveryTrends.reduce((sum, d) => sum + d.deliveries, 0);

  const hasActiveFilters = dateRange !== "7days" || performanceFilter !== "all";

  const clearFilters = () => {
    setDateRange("7days");
    setPerformanceFilter("all");
  };

  return (
    <MainLayout>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-success/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative space-y-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                  <p className="text-muted-foreground">Performance metrics and insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-fade-in stagger-1">
              {/* Date Range Selector */}
              <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger className="w-[150px] gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dateRangeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filters Popover */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 relative">
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Filters</h4>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          onClick={clearFilters}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Courier Performance
                      </label>
                      <Select value={performanceFilter} onValueChange={(value: PerformanceFilter) => setPerformanceFilter(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Performers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Performers</SelectItem>
                          <SelectItem value="top">Top Performers</SelectItem>
                          <SelectItem value="good">Good Performers</SelectItem>
                          <SelectItem value="average">Average Performers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2 border-t">
                      <Button
                        className="w-full gap-2"
                        size="sm"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button size="sm" className="gap-2 btn-primary">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap animate-fade-in">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {dateRange !== "7days" && (
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                {dateRangeLabels[dateRange]}
                <button onClick={() => setDateRange("7days")} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {performanceFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-0">
                {performanceFilter === "top" ? "Top Performers" : performanceFilter === "good" ? "Good Performers" : "Average Performers"}
                <button onClick={() => setPerformanceFilter("all")} className="ml-1 hover:bg-success/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Bento Grid Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {currentStats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <div
                key={stat.title}
                className="group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm p-6 transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Glow effect on hover */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className={`stat-icon ${colors.bg} transition-transform duration-300 group-hover:scale-110`}>
                      <stat.icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${stat.isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {stat.isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                    <p className={`mt-1 text-3xl font-bold ${colors.text}`}>{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.border} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Delivery Trends */}
          <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in stagger-2">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 relative">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Delivery Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {dateRange === "7days" ? "Daily" : dateRange === "14days" ? "Weekly" : dateRange === "30days" ? "Weekly" : "Monthly"} overview
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  {dateRangeLabels[dateRange]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {currentDeliveryTrends.map((day, index) => {
                  const isMax = day.deliveries === Math.max(...currentDeliveryTrends.map(d => d.deliveries));
                  const isMin = day.deliveries === Math.min(...currentDeliveryTrends.map(d => d.deliveries));
                  return (
                    <div
                      key={day.day}
                      className="group relative animate-fade-in"
                      style={{ animationDelay: `${(index + 5) * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 text-sm font-semibold transition-colors duration-300 ${isMax ? 'text-success' : isMin ? 'text-destructive' : 'text-muted-foreground'
                          } group-hover:text-foreground`}>
                          {day.day}
                        </div>
                        <div className="flex-1 relative">
                          {/* Background track */}
                          <div className="h-10 bg-muted/30 rounded-xl overflow-hidden relative border border-transparent group-hover:border-primary/20 transition-all duration-300">
                            {/* Animated gradient bar */}
                            <div
                              className={`h-full rounded-xl transition-all duration-700 ease-out relative overflow-hidden ${isMax ? 'bg-gradient-to-r from-success via-success/80 to-success/60' :
                                isMin ? 'bg-gradient-to-r from-warning/60 via-warning/50 to-warning/40' :
                                  'bg-gradient-to-r from-primary via-primary/80 to-primary/60'
                                }`}
                              style={{
                                width: `${day.percentage}%`,
                                animationDelay: `${index * 100}ms`
                              }}
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                              {/* Inner glow */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                            </div>

                            {/* Value display */}
                            <div className="absolute inset-0 flex items-center justify-end pr-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold transition-all duration-300 ${day.percentage > 50 ? 'text-white drop-shadow-sm' : 'text-foreground'
                                  }`}>
                                  {day.deliveries.toLocaleString()}
                                </span>
                                {isMax && (
                                  <span className="text-xs px-1.5 py-0.5 bg-success/20 text-success rounded-full font-medium animate-pulse">
                                    Peak
                                  </span>
                                )}
                                {isMin && (
                                  <span className="text-xs px-1.5 py-0.5 bg-destructive/20 text-destructive rounded-full font-medium">
                                    Low
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Hover tooltip */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                            <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs font-medium shadow-elevated whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3" />
                                <span>{day.deliveries.toLocaleString()} deliveries</span>
                                <span className="text-muted">•</span>
                                <span className={isMax ? 'text-success' : isMin ? 'text-destructive' : ''}>
                                  {day.percentage}% capacity
                                </span>
                              </div>
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-foreground" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced footer */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                      <span className="text-xs text-muted-foreground">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-success to-success/60" />
                      <span className="text-xs text-muted-foreground">Peak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-warning/60 to-warning/40" />
                      <span className="text-xs text-muted-foreground">Low</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full">
                      <Package className="h-4 w-4 text-success" />
                      <span className="text-sm font-semibold text-success">{totalDeliveries.toLocaleString()} total</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary group/btn">
                      View Details
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courier Performance */}
          <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in stagger-3">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <PieChart className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Courier Performance</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {performanceFilter === "all" ? "All performers" : `${performanceFilter.charAt(0).toUpperCase() + performanceFilter.slice(1)} performers`}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success border-0">
                  {filteredCouriers.length} Couriers
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCouriers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-3">
                    <PieChart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No couriers match the current filter</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-primary"
                    onClick={() => setPerformanceFilter("all")}
                  >
                    Clear filter
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredCouriers.map((courier, index) => {
                    const statusConfig = getStatusConfig(courier.status);
                    return (
                      <div
                        key={courier.name}
                        className="group relative flex items-center gap-4 p-4 hover:bg-primary/5 transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${(index + 5) * 50}ms` }}
                      >
                        {/* Rank indicator */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-warning/20 text-warning' :
                          index === 1 ? 'bg-muted text-muted-foreground' :
                            index === 2 ? 'bg-accent/20 text-accent' :
                              'bg-muted/50 text-muted-foreground'
                          }`}>
                          {index + 1}
                        </div>

                        {/* Courier info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">{courier.name}</p>
                            {index === 0 && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{courier.deliveries} deliveries</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">⭐ {courier.rating}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{courier.onTime}% on-time</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </Badge>

                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCouriers.length} of {courierPerformance.length} couriers
                </p>
                <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary">
                  View All Couriers
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
