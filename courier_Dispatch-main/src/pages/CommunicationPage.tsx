import { useState } from "react";
import { MessageCircle, Mail, Phone, Search, Plus, ArrowUpRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagesPanel, type MessageItem } from "@/components/communication/MessagesPanel";
import { EmailsPanel, type EmailItem } from "@/components/communication/EmailsPanel";
import { NewCallDialog } from "@/components/communication/NewCallDialog";
import { ViewCallDialog } from "@/components/communication/ViewCallDialog";

type CommTab = "messages" | "emails" | "calls";

const tabs: { id: CommTab; label: string; icon: typeof MessageCircle; gradient: string; light: string; text: string }[] = [
  { id: "messages", label: "Messages", icon: MessageCircle, gradient: "from-amber-400 to-amber-500", light: "bg-amber-50", text: "text-amber-600" },
  { id: "emails", label: "Emails", icon: Mail, gradient: "from-emerald-400 to-teal-500", light: "bg-emerald-50", text: "text-emerald-600" },
  { id: "calls", label: "Calls", icon: Phone, gradient: "from-sky-400 to-blue-500", light: "bg-sky-50", text: "text-sky-600" },
];

interface CallItem { id: number; contact: string; number: string; type: "incoming" | "outgoing" | "missed"; duration: string; time: string }

export const CommunicationPage = () => {
  const [activeTab, setActiveTab] = useState<CommTab>("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [calls, setCalls] = useState<CallItem[]>([]);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Communication</h1>
        <p className="text-sm text-stone-500 mt-1">Messages, emails, and call history with shippers</p>
      </div>

      {/* Tab Pills */}
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
                  ? cn("bg-gradient-to-r text-white shadow-sm", tab.gradient)
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count > 0 && (
                <Badge className={cn(
                  "rounded-full text-[10px] px-1.5 h-5 border-0",
                  isActive ? "bg-white/25 text-white" : "bg-stone-300 text-stone-600"
                )}>
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "messages" && (
        <MessagesPanel
          messages={messages}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMarkRead={handleMarkMessageRead}
        />
      )}

      {activeTab === "emails" && (
        <EmailsPanel
          emails={emails}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMarkRead={handleMarkEmailRead}
          onAddEmail={handleNewEmail}
        />
      )}

      {activeTab === "calls" && (
        <>
          {/* Search & Actions for calls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-stone-200 rounded-xl h-10"
              />
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl h-10 shadow-sm hover:shadow-md transition-shadow"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Call
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <ScrollArea className="max-h-[500px]">
              <div className="divide-y divide-stone-50">
                {calls.filter((c) => !searchQuery || c.contact.toLowerCase().includes(searchQuery.toLowerCase()) || c.number.includes(searchQuery)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                    <div className="p-4 rounded-2xl bg-stone-50 mb-4">
                      <Phone className="h-8 w-8 text-stone-400" />
                    </div>
                    <p className="text-lg font-semibold text-stone-700">No calls yet</p>
                    <p className="text-sm text-stone-500 mt-1 max-w-xs">Your call history with shippers will appear here.</p>
                  </div>
                ) : calls.filter((c) => !searchQuery || c.contact.toLowerCase().includes(searchQuery.toLowerCase()) || c.number.includes(searchQuery)).map((call) => (
                  <div key={call.id} onClick={() => setSelectedCall(call)} className="flex items-center gap-4 p-4 hover:bg-stone-50/50 transition-colors cursor-pointer">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                      call.type === "missed"
                        ? "bg-gradient-to-br from-red-100 to-rose-100"
                        : "bg-gradient-to-br from-emerald-100 to-teal-100"
                    )}>
                      {call.type === "incoming" ? (
                        <Phone className="h-5 w-5 text-emerald-500" />
                      ) : call.type === "outgoing" ? (
                        <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Phone className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", call.type === "missed" ? "text-red-500" : "text-stone-700")}>{call.contact}</p>
                      <p className="text-xs text-stone-400">{call.number}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock className="h-3 w-3" />
                        {call.duration !== "-" ? call.duration : "Missed"}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">{call.time}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-50" onClick={() => window.open(`tel:${call.number}`, "_self")}>
                      <Phone className="h-4 w-4 text-emerald-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Dialogs */}
          <NewCallDialog open={dialogOpen} onOpenChange={setDialogOpen} onCall={handleNewCall} />
          <ViewCallDialog open={!!selectedCall} onOpenChange={(o) => { if (!o) setSelectedCall(null); }} call={selectedCall} />
        </>
      )}
    </div>
  );
};
