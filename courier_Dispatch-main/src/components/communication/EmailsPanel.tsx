import { useState, useRef } from "react";
import { Search, Mail, Send, Reply, Paperclip, MoreVertical, Trash2, Star, StarOff, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

export interface EmailItem {
  id: number;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
}

interface EmailsPanelProps {
  emails: EmailItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMarkRead: (id: number) => void;
  onAddEmail: (email: Omit<EmailItem, "id">) => void;
}

const emailColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

const getEmailInitials = (email: string) => {
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
};

type ViewMode = "list" | "compose";

export const EmailsPanel = ({ emails, searchQuery, onSearchChange, onMarkRead, onAddEmail }: EmailsPanelProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [starredEmails, setStarredEmails] = useState<Set<number>>(new Set());
  const [replySent, setReplySent] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = emails.filter(
    (e) =>
      !searchQuery ||
      e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: starred first
  const sorted = [...filtered].sort((a, b) => {
    const aStarred = starredEmails.has(a.id) ? 0 : 1;
    const bStarred = starredEmails.has(b.id) ? 0 : 1;
    return aStarred - bStarred;
  });

  const selected = emails.find((e) => e.id === selectedId) || null;

  const handleSelect = (email: EmailItem) => {
    setSelectedId(email.id);
    setViewMode("list");
    setShowReply(false);
    setReplyText("");
    setReplySent(false);
    onMarkRead(email.id);
  };

  const handleStar = (id: number) => {
    setStarredEmails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: "Unstarred", description: "Email removed from starred" });
      } else {
        next.add(id);
        toast({ title: "Starred", description: "Email added to starred" });
      }
      return next;
    });
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selected) return;
    onMarkRead(selected.id);
    setReplySent(true);
    toast({ title: "Reply sent", description: `Reply sent to ${selected.from}` });
    setTimeout(() => {
      setShowReply(false);
      setReplyText("");
      setReplySent(false);
    }, 1500);
  };

  const handleCompose = () => {
    setSelectedId(null);
    setViewMode("compose");
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
  };

  const handleSendCompose = () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    onAddEmail({
      from: composeTo.trim(),
      subject: composeSubject.trim(),
      preview: composeBody.trim(),
      time: "Just now",
      unread: false,
    });
    toast({ title: "Email sent", description: `Email sent to ${composeTo}` });
    setViewMode("list");
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
  };

  const handleDelete = () => {
    if (!selectedId) return;
    toast({ title: "Email deleted", description: `Email from ${selected?.from} deleted` });
    setSelectedId(null);
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "File attached", description: `${file.name} attached to email` });
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex" style={{ height: 520 }}>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* Left: Email List */}
      <div className="w-[340px] border-r border-stone-100 flex flex-col">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-stone-800">Emails</h2>
            <Button
              onClick={handleCompose}
              size="sm"
              className="h-8 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-sm text-xs px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Compose
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-stone-50 border-stone-200 rounded-xl h-9 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-stone-50">
            {sorted.map((email, idx) => {
              const initials = getEmailInitials(email.from);
              const origIdx = emails.findIndex((e) => e.id === email.id);
              const colorClass = emailColors[origIdx % emailColors.length];
              const isActive = selectedId === email.id && viewMode === "list";
              const starred = starredEmails.has(email.id);
              return (
                <button
                  key={email.id}
                  onClick={() => handleSelect(email)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 px-4 text-left transition-colors",
                    isActive ? "bg-emerald-50/60" : "hover:bg-stone-50/70"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", colorClass)}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        {starred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        <p className={cn("text-sm font-semibold truncate", email.unread ? "text-stone-800" : "text-stone-600")}>{email.from}</p>
                      </div>
                      <span className="text-[11px] text-stone-400 flex-shrink-0 ml-2">{email.time}</span>
                    </div>
                    <p className={cn("text-xs truncate mt-0.5", email.unread ? "text-stone-700 font-medium" : "text-stone-500")}>{email.subject}</p>
                    <p className="text-[10px] text-stone-400 truncate mt-0.5">{email.preview}</p>
                  </div>
                  {email.unread && <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Email View or Compose */}
      <div className="flex-1 flex flex-col">
        {viewMode === "compose" ? (
          <>
            {/* Compose Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewMode("list")}>
                <ArrowLeft className="h-4 w-4 text-stone-500" />
              </Button>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-bold text-stone-800">New Email</p>
            </div>

            {/* Compose Body */}
            <div className="flex-1 px-5 py-4 space-y-3 overflow-auto">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">To</label>
                <Input
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="e.g. dispatch@company.com"
                  type="email"
                  className="rounded-xl h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Subject</label>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g. Load Confirmation #1234"
                  className="rounded-xl h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Message</label>
                <Textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Compose your email..."
                  className="rounded-xl min-h-[180px] text-sm"
                />
              </div>
            </div>

            {/* Compose Footer */}
            <div className="flex items-center gap-2 px-5 py-3 border-t border-stone-100">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-stone-100" onClick={handleAttachment}>
                <Paperclip className="h-4 w-4 text-stone-400" />
              </Button>
              <div className="flex-1" />
              <Button
                onClick={handleSendCompose}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white h-9 px-5 text-sm shadow-sm"
              >
                <Send className="h-4 w-4 mr-1.5" /> Send Email
              </Button>
            </div>
          </>
        ) : selected ? (
          <>
            {/* Email Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", emailColors[emails.indexOf(selected) % emailColors.length])}>
                  {getEmailInitials(selected.from)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{selected.from}</p>
                  <p className="text-[11px] text-stone-400 truncate">{selected.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-amber-50"
                  onClick={() => handleStar(selected.id)}
                >
                  {starredEmails.has(selected.id) ? (
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <StarOff className="h-4 w-4 text-stone-400" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-stone-100">
                      <MoreVertical className="h-4 w-4 text-stone-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => { setShowReply(true); }} className="gap-2 text-sm">
                      <Reply className="h-4 w-4" /> Reply
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="gap-2 text-sm text-red-500 focus:text-red-500">
                      <Trash2 className="h-4 w-4" /> Delete email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Email Content */}
            <ScrollArea className="flex-1 px-5 py-4">
              <h3 className="text-base font-bold text-stone-800 mb-3">{selected.subject}</h3>
              <Separator className="bg-stone-100 mb-4" />
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{selected.preview}</p>
            </ScrollArea>

            {/* Reply Area */}
            <div className="border-t border-stone-100">
              {!showReply && !replySent && (
                <div className="px-5 py-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowReply(true)}
                    className="rounded-xl border-stone-200 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                  >
                    <Reply className="h-4 w-4 mr-1.5" /> Reply
                  </Button>
                </div>
              )}

              {showReply && !replySent && (
                <div className="px-5 py-3 space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="rounded-xl min-h-[80px] text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) { e.preventDefault(); handleSendReply(); } }}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSendReply} className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl text-sm h-9">
                      <Send className="h-4 w-4 mr-1.5" /> Send Reply
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowReply(false); setReplyText(""); }} className="rounded-xl text-stone-500 text-sm h-9">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {replySent && (
                <div className="px-5 py-3">
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3">
                    <Send className="h-4 w-4" />
                    <p className="text-sm font-medium">Reply sent successfully!</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : emails.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="p-4 rounded-2xl bg-stone-50 mb-4">
              <Mail className="h-8 w-8 text-stone-400" />
            </div>
            <p className="text-lg font-semibold text-stone-700">No emails yet</p>
            <p className="text-sm text-stone-500 mt-1 max-w-xs">When you receive emails from shippers or dispatch, they will appear here.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
            <Mail className="h-8 w-8 text-stone-300" />
            Select an email to read or compose a new one
          </div>
        )}
      </div>
    </div>
  );
};
