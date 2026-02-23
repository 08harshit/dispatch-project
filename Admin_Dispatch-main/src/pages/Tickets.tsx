import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  ArrowUpDown,
  TicketCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  CircleDot,
  MessageSquare,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high" | "urgent";
type Status = "open" | "in-progress" | "resolved" | "closed";

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

const mockTickets: Ticket[] = [
  {
    id: "TK-001",
    title: "Update courier payment schedule",
    description: "Need to revise the payment terms for Q2 courier contracts to align with new budget.",
    priority: "high",
    status: "open",
    createdAt: "2024-01-20",
    updatedAt: "2024-01-22",
    comments: [
      { id: "c1", author: "Admin", text: "Flagged as high priority for finance review.", date: "2024-01-21" },
    ],
  },
  {
    id: "TK-002",
    title: "Onboard new shipper: Metro Auto Sales",
    description: "Complete onboarding paperwork and system setup for Metro Auto Sales.",
    priority: "medium",
    status: "in-progress",
    createdAt: "2024-01-18",
    updatedAt: "2024-01-23",
    comments: [
      { id: "c2", author: "Admin", text: "Documents received, pending verification.", date: "2024-01-19" },
      { id: "c3", author: "Admin", text: "Verification complete, setting up account.", date: "2024-01-23" },
    ],
  },
  {
    id: "TK-003",
    title: "Investigate late delivery LD-002",
    description: "Load LD-002 was delayed by 2 days. Investigate cause and update shipper.",
    priority: "urgent",
    status: "open",
    createdAt: "2024-01-25",
    updatedAt: "2024-01-25",
    comments: [],
  },
  {
    id: "TK-004",
    title: "Prepare monthly analytics report",
    description: "Compile delivery stats, revenue, and courier performance for January.",
    priority: "low",
    status: "resolved",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-28",
    comments: [
      { id: "c4", author: "Admin", text: "Report drafted and sent for review.", date: "2024-01-28" },
    ],
  },
  {
    id: "TK-005",
    title: "Fix billing discrepancy for Express Logistics",
    description: "Invoice #1042 shows incorrect amount. Needs correction before end of month.",
    priority: "high",
    status: "closed",
    createdAt: "2024-01-05",
    updatedAt: "2024-01-15",
    comments: [
      { id: "c5", author: "Admin", text: "Corrected invoice sent. Confirmed by client.", date: "2024-01-15" },
    ],
  },
];

const getPriorityConfig = (p: Priority) => {
  switch (p) {
    case "urgent": return { label: "Urgent", className: "bg-destructive/15 text-destructive border-destructive/20" };
    case "high": return { label: "High", className: "bg-warning/15 text-warning border-warning/20" };
    case "medium": return { label: "Medium", className: "bg-primary/15 text-primary border-primary/20" };
    case "low": return { label: "Low", className: "bg-muted text-muted-foreground border-border" };
  }
};

const getStatusConfig = (s: Status) => {
  switch (s) {
    case "open": return { label: "Open", icon: CircleDot, className: "bg-primary/15 text-primary border-primary/20" };
    case "in-progress": return { label: "In Progress", icon: Clock, className: "bg-warning/15 text-warning border-warning/20" };
    case "resolved": return { label: "Resolved", icon: CheckCircle, className: "bg-success/15 text-success border-success/20" };
    case "closed": return { label: "Closed", icon: X, className: "bg-muted text-muted-foreground border-border" };
  }
};

type SortField = "id" | "title" | "priority" | "status" | "createdAt";
type SortDir = "asc" | "desc";

const priorityOrder: Record<Priority, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
const statusOrder: Record<Status, number> = { open: 0, "in-progress": 1, resolved: 2, closed: 3 };

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // New ticket form
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "medium" as Priority });

  // Comment input
  const [newComment, setNewComment] = useState("");

  const filteredTickets = useMemo(() => {
    let result = tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.id.toLowerCase().includes(q) && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "priority") cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      else if (sortField === "status") cmp = statusOrder[a.status] - statusOrder[b.status];
      else { const av = a[sortField], bv = b[sortField]; cmp = av < bv ? -1 : av > bv ? 1 : 0; }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [tickets, searchQuery, statusFilter, priorityFilter, sortField, sortDir]);

  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || searchQuery;
  const clearFilters = () => { setStatusFilter("all"); setPriorityFilter("all"); setSearchQuery(""); };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleAddTicket = () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error("Please fill in title and description"); return;
    }
    const id = `TK-${String(tickets.length + 1).padStart(3, "0")}`;
    const today = new Date().toISOString().slice(0, 10);
    setTickets(prev => [...prev, { id, ...newTicket, status: "open", createdAt: today, updatedAt: today, comments: [] }]);
    setNewTicket({ title: "", description: "", priority: "medium" });
    setAddDialogOpen(false);
    toast.success("Ticket created successfully");
  };

  const handleStatusChange = (ticket: Ticket, newStatus: Status) => {
    const today = new Date().toISOString().slice(0, 10);
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus, updatedAt: today } : t));
    if (selectedTicket?.id === ticket.id) setSelectedTicket({ ...ticket, status: newStatus, updatedAt: today });
    toast.success(`Ticket ${ticket.id} updated to ${getStatusConfig(newStatus).label}`);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTicket) return;
    const today = new Date().toISOString().slice(0, 10);
    const comment: Comment = { id: `c${Date.now()}`, author: "Admin", text: newComment.trim(), date: today };
    const updated = { ...selectedTicket, comments: [...selectedTicket.comments, comment], updatedAt: today };
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTicket(updated);
    setNewComment("");
    toast.success("Comment added");
  };

  const handleDelete = (ticket: Ticket) => {
    setTickets(prev => prev.filter(t => t.id !== ticket.id));
    toast.success(`Ticket ${ticket.id} deleted`);
  };

  const handleView = (ticket: Ticket) => { setSelectedTicket(ticket); setViewDialogOpen(true); };

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3.5 w-3.5 transition-colors", sortField === field ? "text-primary" : "text-muted-foreground/40")} />
      </div>
    </TableHead>
  );

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in-progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;
  const urgentCount = tickets.filter(t => t.priority === "urgent" || t.priority === "high").length;

  return (
    <MainLayout>
      <div className="space-y-8 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-gradient-radial from-success/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow">
                <TicketCheck className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-background flex items-center justify-center">
                <span className="text-[9px] font-bold text-success-foreground">{tickets.length}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Tickets</h1>
              <p className="mt-0.5 text-muted-foreground flex items-center gap-2">
                Manage tasks and issues
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {openCount} open
                </span>
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Open", value: openCount, icon: CircleDot, color: "primary", delay: 1 },
            { label: "In Progress", value: inProgressCount, icon: Clock, color: "warning", delay: 2 },
            { label: "Resolved", value: resolvedCount, icon: CheckCircle, color: "success", delay: 3 },
            { label: "High Priority", value: urgentCount, icon: AlertTriangle, color: "warning", delay: 4 },
          ].map((stat) => (
            <div key={stat.label} className={cn("group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-500 hover:-translate-y-1 cursor-pointer animate-fade-in", `stagger-${stat.delay}`)}>
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                stat.color === "primary" && "bg-gradient-to-br from-primary/10 to-transparent",
                stat.color === "success" && "bg-gradient-to-br from-success/10 to-transparent",
                stat.color === "warning" && "bg-gradient-to-br from-warning/10 to-transparent"
              )} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <p className={cn("text-3xl font-bold mt-1 transition-transform duration-300 group-hover:scale-110 origin-left",
                    stat.color === "success" && "text-success",
                    stat.color === "warning" && "text-warning"
                  )}>{stat.value}</p>
                </div>
                <div className={cn("rounded-2xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
                  stat.color === "primary" && "bg-primary/10",
                  stat.color === "success" && "bg-success/10",
                  stat.color === "warning" && "bg-warning/10"
                )}>
                  <stat.icon className={cn("h-6 w-6",
                    stat.color === "primary" && "text-primary",
                    stat.color === "success" && "text-success",
                    stat.color === "warning" && "text-warning"
                  )} />
                </div>
              </div>
              <div className={cn("absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500",
                stat.color === "primary" && "bg-gradient-to-r from-primary to-primary/50",
                stat.color === "success" && "bg-gradient-to-r from-success to-success/50",
                stat.color === "warning" && "bg-gradient-to-r from-warning to-warning/50"
              )} />
            </div>
          ))}
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-0 shadow-elevated bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/30 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">All Tickets</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{filteredTickets.length} records</Badge>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md bg-primary/15">
                  <Search className="h-3.5 w-3.5 text-primary" />
                </div>
                <Input placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm bg-background/80 rounded-lg border-border/50" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`h-9 w-[140px] text-sm ${statusFilter !== "all" ? "border-primary text-primary" : ""}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className={`h-9 w-[140px] text-sm ${priorityFilter !== "all" ? "border-primary text-primary" : ""}`}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <SortableHead field="id">ID</SortableHead>
                  <SortableHead field="title">Title</SortableHead>
                  <SortableHead field="priority">Priority</SortableHead>
                  <SortableHead field="status">Status</SortableHead>
                  <SortableHead field="createdAt">Created</SortableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No tickets found</TableCell></TableRow>
                ) : (
                  filteredTickets.map((ticket) => {
                    const priorityConf = getPriorityConfig(ticket.priority);
                    const statusConf = getStatusConfig(ticket.status);
                    const StatusIcon = statusConf.icon;
                    return (
                      <TableRow key={ticket.id} className="group hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleView(ticket)}>
                        <TableCell className="font-mono text-xs text-primary/80">{ticket.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ticket.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", priorityConf.className)}>{priorityConf.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] gap-1", statusConf.className)}>
                            <StatusIcon className="h-3 w-3" /> {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ticket.createdAt}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(ticket)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                              {ticket.status === "open" && <DropdownMenuItem onClick={() => handleStatusChange(ticket, "in-progress")}><Clock className="h-4 w-4 mr-2" />Start</DropdownMenuItem>}
                              {ticket.status === "in-progress" && <DropdownMenuItem onClick={() => handleStatusChange(ticket, "resolved")}><CheckCircle className="h-4 w-4 mr-2" />Resolve</DropdownMenuItem>}
                              {ticket.status === "resolved" && <DropdownMenuItem onClick={() => handleStatusChange(ticket, "closed")}><X className="h-4 w-4 mr-2" />Close</DropdownMenuItem>}
                              <DropdownMenuItem onClick={() => handleDelete(ticket)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Ticket Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input placeholder="Ticket title" value={newTicket.title} onChange={(e) => setNewTicket(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea placeholder="Describe the task or issue..." value={newTicket.description} onChange={(e) => setNewTicket(p => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket(p => ({ ...p, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTicket} className="gap-2 bg-gradient-to-r from-primary to-primary/80"><Plus className="h-4 w-4" /> Create Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Ticket Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedTicket && (() => {
              const pc = getPriorityConfig(selectedTicket.priority);
              const sc = getStatusConfig(selectedTicket.status);
              const SI = sc.icon;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                      <span className="font-mono text-primary">{selectedTicket.id}</span>
                      {selectedTicket.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-2">
                    {/* Meta */}
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline" className={cn("gap-1", sc.className)}><SI className="h-3 w-3" />{sc.label}</Badge>
                      <Badge variant="outline" className={cn(pc.className)}>{pc.label}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Created {selectedTicket.createdAt}</span>
                    </div>

                    {/* Description */}
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-sm text-foreground leading-relaxed">{selectedTicket.description}</p>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2">
                      {selectedTicket.status === "open" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedTicket, "in-progress")} className="gap-1"><Clock className="h-3.5 w-3.5" />Start</Button>}
                      {selectedTicket.status === "in-progress" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedTicket, "resolved")} className="gap-1"><CheckCircle className="h-3.5 w-3.5" />Resolve</Button>}
                      {selectedTicket.status === "resolved" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedTicket, "closed")} className="gap-1"><X className="h-3.5 w-3.5" />Close</Button>}
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" /> Notes ({selectedTicket.comments.length})
                      </h3>
                      {selectedTicket.comments.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                      )}
                      {selectedTicket.comments.map((c) => (
                        <div key={c.id} className="rounded-lg border bg-background p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">{c.author}</span>
                            <span className="text-[10px] text-muted-foreground">{c.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.text}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input placeholder="Add a note..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddComment()} className="flex-1" />
                        <Button size="icon" onClick={handleAddComment} className="bg-gradient-to-r from-primary to-primary/80 shrink-0"><Send className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
