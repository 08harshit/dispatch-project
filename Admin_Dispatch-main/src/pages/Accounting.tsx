import { useState, useMemo, useEffect } from "react";
import { Transaction, AccountingStats, fetchTransactions, fetchAccountingStats } from "@/services/accountingService";
import { fetchInvoice } from "@/services/invoiceService";
import { downloadInvoiceAsHtml } from "@/utils/generateInvoiceHtml";
import { MainLayout } from "@/components/layout/MainLayout";
import { generateAccountingReport } from "@/utils/generateAccountingReport";
import { getColorClasses, getAccountingStatusConfig } from "@/utils/styleHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  Building2,
  Truck,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



const getStatusConfig = (status: string) => {
  const config = getAccountingStatusConfig(status);
  const iconMap: Record<string, typeof CheckCircle2> = {
    completed: CheckCircle2,
    pending: Clock,
    overdue: AlertCircle,
  };
  return { ...config, icon: iconMap[status] || Clock };
};

export default function Accounting() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<AccountingStats[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTransactions().then(setTransactions);
    fetchAccountingStats().then(setStats);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.description.toLowerCase().includes(q) && !t.party.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [statusFilter, typeFilter, dateFrom, dateTo, searchQuery]);

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || dateFrom || dateTo || searchQuery;

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  return (
    <MainLayout>
      <div className="relative space-y-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-gradient-radial from-success/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
                  <p className="text-muted-foreground">Financial overview and transactions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-fade-in stagger-1">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const headers = ["ID", "Date", "Description", "Type", "Amount", "Status", "Party", "Party Type"];
                const rows = filteredTransactions.map(t => [t.id, t.date, t.description, t.type, t.amount.toFixed(2), t.status, t.party, t.partyType]);
                const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button size="sm" className="gap-2 btn-primary" onClick={() => generateAccountingReport(transactions, stats)}>
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
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

        {/* Transactions Section */}
        <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in stagger-2">
          <CardHeader className="border-b bg-muted/30 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">Recent Transactions</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  {filteredTransactions.length} records
                </Badge>
              </div>
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md bg-primary/15">
                  <Search className="h-3.5 w-3.5 text-primary" />
                </div>
                <Input
                  placeholder="Search by name, ID, or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-background/80 rounded-lg border-border/50"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`gap-2 ${dateFrom || dateTo ? 'border-primary text-primary' : ''}`}>
                    <Calendar className="h-4 w-4" />
                    {dateFrom || dateTo ? 'Date Set' : 'Date Range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 space-y-3" align="end">
                  <p className="text-sm font-medium text-foreground">Date Range</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">From</label>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">To</label>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`h-9 w-[130px] text-sm ${statusFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className={`h-9 w-[130px] text-sm ${typeFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredTransactions.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No transactions match your filters</p>
                  <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">Clear all filters</Button>
                </div>
              )}
              {filteredTransactions.map((transaction, index) => {
                const statusConfig = getStatusConfig(transaction.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={transaction.id}
                    className="group relative flex items-center gap-4 p-4 hover:bg-primary/5 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${(index + 5) * 50}ms` }}
                  >
                    {/* Transaction type indicator */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${transaction.type === 'income'
                      ? 'bg-success/10'
                      : 'bg-warning/10'
                      }`}>
                      {transaction.partyType === 'shipper' ? (
                        <Building2 className={`h-5 w-5 ${transaction.type === 'income' ? 'text-success' : 'text-warning'}`} />
                      ) : (
                        <Truck className={`h-5 w-5 ${transaction.type === 'income' ? 'text-success' : 'text-warning'}`} />
                      )}
                    </div>

                    {/* Transaction details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{transaction.description}</p>
                        {transaction.status === 'overdue' && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-muted-foreground">{transaction.id}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{transaction.date}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{transaction.party}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-success' : 'text-warning'
                        }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 gap-1 text-xs ${statusConfig.className}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={async () => {
                              try {
                                const inv = await fetchInvoice(transaction.id);
                                if (inv) downloadInvoiceAsHtml(inv);
                                else toast.error("Invoice not found");
                              } catch {
                                toast.error("Failed to load invoice");
                              }
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            Download Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
                  </div>
                );
              })}
            </div>

            {/* Footer with summary */}
            <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </p>
              <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary">
                View All Transactions
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
