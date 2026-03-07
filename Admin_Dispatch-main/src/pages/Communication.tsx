import { useState } from "react";
import { MessageCircle, Mail, Phone, Search, Plus, ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagesPanel, type MessageItem } from "@/components/communication/MessagesPanel";
import { EmailsPanel, type EmailItem } from "@/components/communication/EmailsPanel";
import { NewCallDialog } from "@/components/communication/NewCallDialog";
import { ViewCallDialog } from "@/components/communication/ViewCallDialog";
import { MainLayout } from "@/components/layout/MainLayout";

type CommTab = "messages" | "emails" | "calls";

const tabs: { id: CommTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "calls", label: "Calls", icon: Phone },
];

interface CallItem { id: number; contact: string; number: string; type: "incoming" | "outgoing" | "missed"; duration: string; time: string }

const initialMessages: MessageItem[] = [
  { id: 1, from: "Mike's Transport", preview: "I'll be at pickup in 20 minutes", time: "2 min ago", unread: true, loadId: "LD-024", unreadCount: 2, initials: "MT" },
  { id: 2, from: "FastHaul LLC", preview: "BOL has been uploaded", time: "15 min ago", unread: true, loadId: "LD-019", initials: "FH" },
  { id: 3, from: "Express Auto Carriers", preview: "Vehicle delivered successfully", time: "1 hr ago", unread: false, loadId: "LD-022", initials: "EA" },
  { id: 4, from: "Summit Logistics", preview: "Need updated delivery address", time: "3 hr ago", unread: true, loadId: "LD-018", unreadCount: 1, initials: "SL" },
  { id: 5, from: "Prime Auto Ship", preview: "Please update the BOL with the correct VIN", time: "5 hr ago", unread: false, loadId: "LD-015", initials: "PA" },
];

const initialEmails: EmailItem[] = [
  { id: 1, from: "dispatch@primecarriers.com", subject: "Load Confirmation #8834", preview: "Your load has been confirmed. Please review the attached BOL...", time: "10m ago", unread: true },
  { id: 2, from: "billing@autoship.com", subject: "Payment Received - Invoice #2291", preview: "We have processed your payment of $1,250.00...", time: "45m ago", unread: true },
  { id: 3, from: "ops@expresslogistics.com", subject: "Route Update - I-95 Closure", preview: "Please be advised of a route change due to construction...", time: "2h ago", unread: false },
  { id: 4, from: "support@safehavl.com", subject: "Document Upload Required", preview: "Please upload the signed VCR for load #7721...", time: "4h ago", unread: false },
];

const initialCalls: CallItem[] = [
  { id: 1, contact: "John's Auto Transport", number: "(555) 123-4567", type: "incoming", duration: "4:32", time: "30m ago" },
  { id: 2, contact: "Express Logistics", number: "(555) 987-6543", type: "outgoing", duration: "2:15", time: "2h ago" },
  { id: 3, contact: "Prime Carriers", number: "(555) 456-7890", type: "missed", duration: "-", time: "3h ago" },
  { id: 4, contact: "AutoShip Pro", number: "(555) 321-0987", type: "incoming", duration: "8:45", time: "Yesterday" },
];

const Communication = () => {
  const [activeTab, setActiveTab] = useState<CommTab>("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [emails, setEmails] = useState<EmailItem[]>(initialEmails);
  const [calls, setCalls] = useState<CallItem[]>(initialCalls);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallItem | null>(null);

  const unreadCounts = {
    messages: messages.filter((m) => m.unread).length,
    emails: emails.filter((e) => e.unread).length,
    calls: calls.filter((c) => c.type === "missed").length,
  };

  const handleNewEmail = (email: Omit<EmailItem, "id">) => {
    setEmails((prev) => [{ ...email, id: Date.now() }, ...prev]);
  };

  const handleNewCall = (call: Omit<CallItem, "id">) => {
    setCalls((prev) => [{ ...call, id: Date.now() }, ...prev]);
  };

  const handleMarkMessageRead = (id: number) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, unread: false } : m));
  };

  const handleMarkEmailRead = (id: number) => {
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, unread: false } : e));
  };

  return (
    <MainLayout>
      <div className="space-y-6 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-gradient-radial from-success/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="page-header flex items-center gap-3">
          <div className="h-12 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary/50 flex-shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Communication</h1>
            <p className="text-sm text-muted-foreground mt-1">Messages, emails, and call history with shippers</p>
          </div>
        </div>

        <div className="rounded-2xl bg-muted/30 border border-border/50 px-4 py-2 text-sm text-muted-foreground">
          Demo mode - data is not persisted. Backend integration coming soon.
        </div>

        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = unreadCounts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {count > 0 && (
                  <Badge className={cn(
                    "rounded-full text-[10px] px-1.5 h-5 border-0",
                    isActive ? "bg-primary-foreground/25 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "messages" && (
          <MessagesPanel
            messages={messages}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onMarkRead={handleMarkMessageRead}
            onAddMessage={(msg) => setMessages((prev) => [msg, ...prev])}
          />
        )}

        {activeTab === "emails" && (
          <EmailsPanel emails={emails} searchQuery={searchQuery} onSearchChange={setSearchQuery} onMarkRead={handleMarkEmailRead} onAddEmail={handleNewEmail} />
        )}

        {activeTab === "calls" && (
          <>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search calls..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border rounded-xl h-10" />
              </div>
              <Button onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground rounded-xl h-10 shadow-sm hover:shadow-md transition-shadow">
                <Plus className="h-4 w-4 mr-1.5" /> New Call
              </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y divide-border/50">
                  {calls.filter((c) => !searchQuery || c.contact.toLowerCase().includes(searchQuery.toLowerCase()) || c.number.includes(searchQuery)).map((call) => (
                    <div key={call.id} onClick={() => setSelectedCall(call)} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        call.type === "missed" ? "bg-destructive/10" : "bg-accent/10"
                      )}>
                        {call.type === "incoming" ? (
                          <Phone className="h-5 w-5 text-accent" />
                        ) : call.type === "outgoing" ? (
                          <ArrowUpRight className="h-5 w-5 text-accent" />
                        ) : (
                          <Phone className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold", call.type === "missed" ? "text-destructive" : "text-foreground")}>{call.contact}</p>
                        <p className="text-xs text-muted-foreground">{call.number}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {call.duration !== "-" ? call.duration : "Missed"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{call.time}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-accent/10" onClick={() => window.open(`tel:${call.number}`, "_self")}>
                        <Phone className="h-4 w-4 text-accent" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <NewCallDialog open={dialogOpen} onOpenChange={setDialogOpen} onCall={handleNewCall} />
            <ViewCallDialog open={!!selectedCall} onOpenChange={(o) => { if (!o) setSelectedCall(null); }} call={selectedCall} />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Communication;
