import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/pages/Communication";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const ConversationList = ({ conversations, selectedId, onSelect, searchQuery, onSearchChange }: ConversationListProps) => {
  const filtered = conversations.filter(
    (c) =>
      c.courierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shipmentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto scrollbar-visible">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full flex items-start gap-3 p-4 text-left transition-colors duration-150 border-b border-border/50",
              selectedId === conv.id
                ? "bg-accent/60"
                : "hover:bg-muted/50"
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {conv.courierInitials}
              </div>
              {conv.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-foreground truncate">{conv.courierName}</span>
                <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{conv.lastMessageTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                {conv.unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground h-5 min-w-5 text-[10px] px-1.5 shrink-0">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 block">{conv.shipmentId}</span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No conversations found</div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
