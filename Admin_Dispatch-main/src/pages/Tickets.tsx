import { useState, useMemo, useEffect } from "react";
import { getTicketStatusConfig, getPriorityConfig as getSharedPriorityConfig } from "@/utils/styleHelpers";
import { Ticket, Priority, TicketStatus as Status, TicketComment, fetchTickets, createTicket, updateTicketStatus, addTicketComment, deleteTicket } from "@/services/ticketService";
import { useDialogManager } from "@/hooks/useDialogManager";
import { useTableSort } from "@/hooks/useTableSort";
import { StatsGrid } from "@/components/common/StatsGrid";
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



const getPriorityConfig = getSharedPriorityConfig;

const getStatusConfig = (s: Status) => {
  const config = getTicketStatusConfig(s);
  const iconMap: Record<string, typeof CircleDot> = {
    open: CircleDot,
    "in-progress": Clock,
    resolved: CheckCircle,
    closed: X,
  };
  return { ...config, icon: iconMap[s] || CircleDot };
};

type SortField = "id" | "title" | "priority" | "status" | "createdAt";
type SortDir = "asc" | "desc";

const priorityOrder: Record<Priority, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
const statusOrder: Record<Status, number> = { open: 0, "in-progress": 1, resolved: 2, closed: 3 };

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTickets()
      .then(setTickets)
      .catch((e) => setError(e?.message || "Failed to load tickets"))
      .finally(() => setLoading(false));
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const { sortField, sortDir, toggleSort } = useTableSort<SortField>("createdAt", "desc");

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const dialogs = useDialogManager<Ticket>();

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

  const handleAddTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error("Please fill in title and description"); return;
    }
    const created = await createTicket({ title: newTicket.title.trim(), description: newTicket.description.trim(), priority: newTicket.priority });
    if (created) {
      setTickets(prev => [...prev, created]);
      setNewTicket({ title: "", description: "", priority: "medium" });
      setAddDialogOpen(false);
      toast.success("Ticket created successfully");
    } else {
      toast.error("Failed to create ticket");
    }
  };

  const handleStatusChange = async (ticket: Ticket, newStatus: Status) => {
    const updated = await updateTicketStatus(ticket.id, newStatus);
    if (updated) {
      setTickets(prev => prev.map(t => t.id === ticket.id ? updated : t));
      if (dialogs.selected?.id === ticket.id) dialogs.setSelected(updated);
      toast.success(`Ticket updated to ${getStatusConfig(newStatus).label}`);
    } else {
      toast.error("Failed to update ticket status");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !dialogs.selected) return;
    const comment = await addTicketComment(dialogs.selected.id, newComment.trim());
    if (comment) {
      const updated = { ...dialogs.selected, comments: [...dialogs.selected.comments, comment], updatedAt: new Date().toISOString().slice(0, 10) };
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      dialogs.setSelected(updated);
      setNewComment("");
      toast.success("Comment added");
    } else {
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async (ticket: Ticket) => {
    const ok = await deleteTicket(ticket.id);
    if (ok) {
      setTickets(prev => prev.filter(t => t.id !== ticket.id));
      if (dialogs.selected?.id === ticket.id) dialogs.setOpen("view", false);
      toast.success("Ticket deleted");
    } else {
      toast.error("Failed to delete ticket");
    }
  };


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

        <StatsGrid
          stats={[
            { label: "Open", value: openCount, icon: CircleDot, color: "primary", delay: 1 },
            { label: "In Progress", value: inProgressCount, icon: Clock, color: "warning", delay: 2 },
            { label: "Resolved", value: resolvedCount, icon: CheckCircle, color: "success", delay: 3 },
            { label: "High Priority", value: urgentCount, icon: AlertTriangle, color: "warning", delay: 4 },
          ]}
          columns={4}
        />

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
                {loading && (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading tickets...</TableCell></TableRow>
                )}
                {!loading && error && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">
                    <span className="text-destructive">{error}</span>
                  </TableCell></TableRow>
                )}
                {!loading && !error && filteredTickets.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No tickets found</TableCell></TableRow>
                )}
                {!loading && !error && filteredTickets.length > 0 && filteredTickets.map((ticket) => {
                    const priorityConf = getPriorityConfig(ticket.priority);
                    const statusConf = getStatusConfig(ticket.status);
                    const StatusIcon = statusConf.icon;
                    return (
                      <TableRow key={ticket.id} className="group hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => dialogs.open("view", ticket)}>
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
                              <DropdownMenuItem onClick={() => dialogs.open("view", ticket)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
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
        <Dialog open={dialogs.isOpen("view")} onOpenChange={dialogs.setOpen.bind(null, "view")}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            {dialogs.selected && (() => {
              const pc = getPriorityConfig(dialogs.selected.priority);
              const sc = getStatusConfig(dialogs.selected.status);
              const SI = sc.icon;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                      <span className="font-mono text-primary">{dialogs.selected.id}</span>
                      {dialogs.selected.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-2">
                    {/* Meta */}
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline" className={cn("gap-1", sc.className)}><SI className="h-3 w-3" />{sc.label}</Badge>
                      <Badge variant="outline" className={cn(pc.className)}>{pc.label}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Created {dialogs.selected.createdAt}</span>
                    </div>

                    {/* Description */}
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-sm text-foreground leading-relaxed">{dialogs.selected.description}</p>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2">
                      {dialogs.selected.status === "open" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(dialogs.selected, "in-progress")} className="gap-1"><Clock className="h-3.5 w-3.5" />Start</Button>}
                      {dialogs.selected.status === "in-progress" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(dialogs.selected, "resolved")} className="gap-1"><CheckCircle className="h-3.5 w-3.5" />Resolve</Button>}
                      {dialogs.selected.status === "resolved" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(dialogs.selected, "closed")} className="gap-1"><X className="h-3.5 w-3.5" />Close</Button>}
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" /> Notes ({dialogs.selected.comments.length})
                      </h3>
                      {dialogs.selected.comments.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                      )}
                      {dialogs.selected.comments.map((c) => (
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
