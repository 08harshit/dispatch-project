import { useState, useRef, useEffect } from "react";
import { Search, Mail, Send, Reply, Paperclip, MoreVertical, Trash2, Star, StarOff, Plus, ArrowLeft, Truck, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface RecipientResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: "courier" | "shipper";
}

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
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [recipientResults, setRecipientResults] = useState<RecipientResult[]>([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [showRecipientResults, setShowRecipientResults] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientResult | null>(null);
  const [emailSignature, setEmailSignature] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stub: loadSignature - wrap in try/catch, on error leave empty
  useEffect(() => {
    const loadSignature = async () => {
      try {
        setEmailSignature("");
      } catch {
        setEmailSignature("");
      }
    };
    loadSignature();
  }, []);

  const filtered = emails.filter(
    (e) => !searchQuery || e.from.toLowerCase().includes(searchQuery.toLowerCase()) || e.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      if (next.has(id)) { next.delete(id); toast({ title: "Unstarred" }); }
      else { next.add(id); toast({ title: "Starred" }); }
      return next;
    });
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selected) return;
    onMarkRead(selected.id);
    setReplySent(true);
    toast({ title: "Reply sent", description: `Reply sent to ${selected.from}` });
    setTimeout(() => { setShowReply(false); setReplyText(""); setReplySent(false); }, 1500);
  };

  const handleCompose = () => {
    setSelectedId(null);
    setViewMode("compose");
    setComposeTo("");
    setComposeSubject("");
    setComposeBody(emailSignature ? `\n\n--\n${emailSignature}` : "");
    setSelectedRecipient(null);
    setRecipientResults([]);
    setShowRecipientResults(false);
  };

  // Stub: recipient search returns empty - user can type manually
  useEffect(() => {
    if (selectedRecipient || !composeTo.trim() || composeTo.trim().length < 2) {
      setRecipientResults([]);
      setShowRecipientResults(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setRecipientLoading(true);
      try {
        setRecipientResults([]);
        setShowRecipientResults(true);
      } catch {
        setRecipientResults([]);
      } finally {
        setRecipientLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [composeTo, selectedRecipient]);

  const handleSelectRecipient = (r: RecipientResult) => {
    setSelectedRecipient(r);
    setComposeTo(r.email || r.name);
    setShowRecipientResults(false);
  };

  const handleClearRecipient = () => {
    setSelectedRecipient(null);
    setComposeTo("");
  };

  const handleSendCompose = () => {
    const toValue = composeTo.trim();
    if (!toValue || !composeSubject.trim() || !composeBody.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    onAddEmail({ from: toValue, subject: composeSubject.trim(), preview: composeBody.trim(), time: "Just now", unread: false });
    toast({ title: "Email sent", description: `Email sent to ${selectedRecipient?.name || toValue}` });
    setViewMode("list");
    setSelectedRecipient(null);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    toast({ title: "Email deleted" });
    setSelectedId(null);
  };

  const handleAttachment = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "File attached", description: `${file.name} attached` });
    e.target.value = "";
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex" style={{ height: 520 }}>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="w-[340px] border-r border-border flex flex-col">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Emails</h2>
            <Button onClick={handleCompose} size="sm" className="h-8 rounded-xl bg-accent text-accent-foreground shadow-sm text-xs px-3">
              <Plus className="h-3.5 w-3.5 mr-1" /> Compose
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search emails..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 bg-muted/50 border-border rounded-xl h-9 text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/50">
            {sorted.map((email) => {
              const initials = getEmailInitials(email.from);
              const origIdx = emails.findIndex((e) => e.id === email.id);
              const colorClass = emailColors[origIdx % emailColors.length];
              const isActive = selectedId === email.id && viewMode === "list";
              const starred = starredEmails.has(email.id);
              return (
                <button key={email.id} onClick={() => handleSelect(email)} className={cn("w-full flex items-start gap-3 p-3 px-4 text-left transition-colors", isActive ? "bg-accent/10" : "hover:bg-muted/50")}>
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", colorClass)}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        {starred && <Star className="h-3 w-3 text-primary fill-primary flex-shrink-0" />}
                        <p className={cn("text-sm font-semibold truncate", email.unread ? "text-foreground" : "text-muted-foreground")}>{email.from}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">{email.time}</span>
                    </div>
                    <p className={cn("text-xs truncate mt-0.5", email.unread ? "text-foreground font-medium" : "text-muted-foreground")}>{email.subject}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{email.preview}</p>
                  </div>
                  {email.unread && <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {viewMode === "compose" ? (
          <>
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewMode("list")}><ArrowLeft className="h-4 w-4 text-muted-foreground" /></Button>
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center"><Mail className="h-4 w-4 text-accent-foreground" /></div>
              <p className="text-sm font-bold text-foreground">New Email</p>
            </div>
            <div className="flex-1 px-5 py-4 space-y-3 overflow-auto">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                {selectedRecipient ? (
                  <div className="flex items-center gap-2 rounded-xl h-9 bg-muted/30 border border-border px-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {selectedRecipient.type === "courier" ? <Truck className="h-3.5 w-3.5 text-accent flex-shrink-0" /> : <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                      <span className="text-sm font-medium text-foreground truncate">{selectedRecipient.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 h-5 flex-shrink-0">{selectedRecipient.type}</Badge>
                      {selectedRecipient.email && <span className="text-xs text-muted-foreground truncate">{selectedRecipient.email}</span>}
                    </div>
                    <button onClick={handleClearRecipient} className="text-muted-foreground hover:text-foreground text-xs">x</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    {recipientLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />}
                    <Input
                      value={composeTo}
                      onChange={(e) => { setComposeTo(e.target.value); setSelectedRecipient(null); }}
                      onFocus={() => recipientResults.length > 0 && setShowRecipientResults(true)}
                      placeholder="Type email or name (demo mode)"
                      className="pl-9 rounded-xl h-9 text-sm"
                      autoComplete="off"
                    />
                    {showRecipientResults && !selectedRecipient && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-[180px] overflow-y-auto">
                        {recipientResults.length === 0 && !recipientLoading ? (
                          <div className="px-4 py-3 text-sm text-muted-foreground text-center">Demo mode - type recipient manually</div>
                        ) : (
                          recipientResults.map((r) => (
                            <button
                              key={`${r.type}-${r.id}`}
                              onClick={() => handleSelectRecipient(r)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors text-left"
                            >
                              <div className={cn(
                                "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                r.type === "courier" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                              )}>
                                {r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{r.email || r.phone || ""}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px] px-1.5 h-5 flex-shrink-0">
                                {r.type === "courier" ? <><Truck className="h-3 w-3 mr-1" />Courier</> : <><Building2 className="h-3 w-3 mr-1" />Shipper</>}
                              </Badge>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Subject</label><Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="e.g. Load Confirmation #1234" className="rounded-xl h-9 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Message</label><Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Compose your email..." className="rounded-xl min-h-[180px] text-sm" /></div>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 border-t border-border">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" onClick={handleAttachment}><Paperclip className="h-4 w-4 text-muted-foreground" /></Button>
              <div className="flex-1" />
              <Button onClick={handleSendCompose} className="rounded-xl bg-accent text-accent-foreground h-9 px-5 text-sm shadow-sm"><Send className="h-4 w-4 mr-1.5" /> Send Email</Button>
            </div>
          </>
        ) : selected ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", emailColors[emails.indexOf(selected) % emailColors.length])}>{getEmailInitials(selected.from)}</div>
                <div className="min-w-0"><p className="text-sm font-bold text-foreground truncate">{selected.from}</p><p className="text-[11px] text-muted-foreground truncate">{selected.time}</p></div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => handleStar(selected.id)}>
                  {starredEmails.has(selected.id) ? <Star className="h-4 w-4 text-primary fill-primary" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setShowReply(true)} className="gap-2 text-sm"><Reply className="h-4 w-4" /> Reply</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="gap-2 text-sm text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Delete email</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <ScrollArea className="flex-1 px-5 py-4">
              <h3 className="text-base font-bold text-foreground mb-3">{selected.subject}</h3>
              <Separator className="bg-border mb-4" />
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.preview}</p>
            </ScrollArea>
            <div className="border-t border-border">
              {!showReply && !replySent && (
                <div className="px-5 py-3"><Button variant="outline" onClick={() => setShowReply(true)} className="rounded-xl border-border text-muted-foreground hover:bg-accent/10 hover:text-accent"><Reply className="h-4 w-4 mr-1.5" /> Reply</Button></div>
              )}
              {showReply && !replySent && (
                <div className="px-5 py-3 space-y-3">
                  <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." className="rounded-xl min-h-[80px] text-sm" onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) { e.preventDefault(); handleSendReply(); } }} />
                  <div className="flex gap-2">
                    <Button onClick={handleSendReply} className="bg-accent text-accent-foreground rounded-xl text-sm h-9"><Send className="h-4 w-4 mr-1.5" /> Send Reply</Button>
                    <Button variant="ghost" onClick={() => { setShowReply(false); setReplyText(""); }} className="rounded-xl text-muted-foreground text-sm h-9">Cancel</Button>
                  </div>
                </div>
              )}
              {replySent && (
                <div className="px-5 py-3"><div className="flex items-center gap-2 text-accent bg-accent/10 rounded-xl px-4 py-3"><Send className="h-4 w-4" /><p className="text-sm font-medium">Reply sent successfully!</p></div></div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <Mail className="h-8 w-8 text-muted-foreground/50" />
            Select an email to read or compose a new one
          </div>
        )}
      </div>
    </div>
  );
};
