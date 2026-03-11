import { useState, useRef } from "react";
import { Search, Phone, MoreVertical, Paperclip, Send, User, Trash2, VolumeX, Pin, Image, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

export interface MessageItem {
  id: number;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
  loadId?: string;
  unreadCount?: number;
  initials?: string;
  phone?: string;
}

interface ChatMessage {
  text: string;
  time: string;
  isMine: boolean;
  isImage?: boolean;
}

interface MessagesPanelProps {
  messages: MessageItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMarkRead: (id: number) => void;
}

const getInitials = (name: string) => {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
};

const initialsColors = [
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

export const MessagesPanel = ({ messages, searchQuery, onSearchChange, onMarkRead }: MessagesPanelProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<number, ChatMessage[]>>({});
  const [mutedConversations, setMutedConversations] = useState<Set<number>>(new Set());
  const [pinnedConversations, setPinnedConversations] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = messages.filter(
    (m) =>
      !searchQuery ||
      m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned first
  const sorted = [...filtered].sort((a, b) => {
    const aPinned = pinnedConversations.has(a.id) ? 0 : 1;
    const bPinned = pinnedConversations.has(b.id) ? 0 : 1;
    return aPinned - bPinned;
  });

  const selected = messages.find((m) => m.id === selectedId) || null;

  const handleSelect = (msg: MessageItem) => {
    setSelectedId(msg.id);
    onMarkRead(msg.id);
  };

  const handleSend = () => {
    if (!reply.trim() || !selectedId) return;
    setChatHistory((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] || []),
        { text: reply.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isMine: true },
      ],
    }));
    setReply("");
  };

  const handleCall = () => {
    if (!selected) return;
    const phone = selected.phone || "(555) 000-0000";
    window.open(`tel:${phone}`, "_self");
    toast({ title: "Calling...", description: `Initiating call to ${selected.from}` });
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setChatHistory((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] || []),
        { text: `📎 ${file.name}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isMine: true },
      ],
    }));
    toast({ title: "File attached", description: `${file.name} sent successfully` });
    e.target.value = "";
  };

  const handleMute = () => {
    if (!selectedId) return;
    setMutedConversations((prev) => {
      const next = new Set(prev);
      if (next.has(selectedId)) { next.delete(selectedId); toast({ title: "Unmuted", description: `${selected?.from} notifications enabled` }); }
      else { next.add(selectedId); toast({ title: "Muted", description: `${selected?.from} notifications muted` }); }
      return next;
    });
  };

  const handlePin = () => {
    if (!selectedId) return;
    setPinnedConversations((prev) => {
      const next = new Set(prev);
      if (next.has(selectedId)) { next.delete(selectedId); toast({ title: "Unpinned", description: `${selected?.from} unpinned` }); }
      else { next.add(selectedId); toast({ title: "Pinned", description: `${selected?.from} pinned to top` }); }
      return next;
    });
  };

  const handleDeleteChat = () => {
    if (!selectedId) return;
    setChatHistory((prev) => { const next = { ...prev }; delete next[selectedId]; return next; });
    toast({ title: "Chat cleared", description: `Conversation with ${selected?.from} cleared` });
  };

  const currentChat = selectedId ? chatHistory[selectedId] || [] : [];
  const isMuted = selectedId ? mutedConversations.has(selectedId) : false;
  const isPinned = selectedId ? pinnedConversations.has(selectedId) : false;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex" style={{ height: 520 }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />

      {/* Left: Conversation List */}
      <div className="w-[340px] border-r border-stone-100 flex flex-col">
        <div className="p-4 pb-3">
          <h2 className="text-lg font-bold text-stone-800 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-stone-50 border-stone-200 rounded-xl h-9 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-stone-50">
            {sorted.map((msg, idx) => {
              const initials = msg.initials || getInitials(msg.from);
              const origIdx = messages.findIndex((m) => m.id === msg.id);
              const colorClass = initialsColors[origIdx % initialsColors.length];
              const isActive = selectedId === msg.id;
              const pinned = pinnedConversations.has(msg.id);
              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 px-4 text-left transition-colors",
                    isActive ? "bg-amber-50/60" : "hover:bg-stone-50/70"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", colorClass)}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        {pinned && <Pin className="h-3 w-3 text-amber-400 flex-shrink-0" />}
                        <p className={cn("text-sm font-semibold truncate", msg.unread ? "text-stone-800" : "text-stone-600")}>{msg.from}</p>
                      </div>
                      <span className="text-[11px] text-stone-400 flex-shrink-0 ml-2">{msg.time}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {msg.unread && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                      <p className="text-xs text-stone-500 truncate">{msg.preview}</p>
                    </div>
                    {msg.loadId && (
                      <p className="text-[10px] text-stone-400 mt-0.5">{msg.loadId}</p>
                    )}
                  </div>
                  {msg.unread && msg.unreadCount && msg.unreadCount > 0 && (
                    <Badge className="rounded-full text-[10px] px-1.5 h-5 bg-amber-500 text-white border-0 flex-shrink-0 mt-1">
                      {msg.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Chat View */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold", initialsColors[messages.indexOf(selected) % initialsColors.length])}>
                  {selected.initials || getInitials(selected.from)}
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800">{selected.from}</p>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                      Offline
                    </span>
                    {selected.loadId && (
                      <span className="flex items-center gap-1">
                        🚛 {selected.loadId}
                      </span>
                    )}
                    {isMuted && <span className="text-stone-300">🔇</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-50" onClick={handleCall}>
                  <Phone className="h-4 w-4 text-emerald-500" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-stone-100">
                      <MoreVertical className="h-4 w-4 text-stone-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={handlePin} className="gap-2 text-sm">
                      <Pin className="h-4 w-4" /> {isPinned ? "Unpin" : "Pin"} conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMute} className="gap-2 text-sm">
                      <VolumeX className="h-4 w-4" /> {isMuted ? "Unmute" : "Mute"} notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteChat} className="gap-2 text-sm text-red-500 focus:text-red-500">
                      <Trash2 className="h-4 w-4" /> Clear chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
                    <p className="text-sm text-stone-700">{selected.preview}</p>
                    <p className="text-[10px] text-stone-400 mt-1">{selected.time}</p>
                  </div>
                </div>
                {currentChat.map((r, i) => (
                  <div key={i} className={cn("flex", r.isMine ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 max-w-[75%]",
                      r.isMine
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-tr-sm"
                        : "bg-stone-100 text-stone-700 rounded-tl-sm"
                    )}>
                      <p className="text-sm">{r.text}</p>
                      <p className={cn("text-[10px] mt-1", r.isMine ? "text-white/70" : "text-stone-400")}>{r.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-100">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-stone-100 flex-shrink-0" onClick={handleAttachment}>
                <Paperclip className="h-4 w-4 text-stone-400" />
              </Button>
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-stone-50 border-stone-200 h-9 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="h-9 w-9 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white flex-shrink-0 shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="p-4 rounded-2xl bg-stone-50 mb-4">
              <MessageCircle className="h-8 w-8 text-stone-400" />
            </div>
            <p className="text-lg font-semibold text-stone-700">No messages yet</p>
            <p className="text-sm text-stone-500 mt-1 max-w-xs">When shippers reach out, your conversations will appear here.</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};
