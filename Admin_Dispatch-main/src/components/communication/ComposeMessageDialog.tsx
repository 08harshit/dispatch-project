import { useState, useEffect, useRef } from "react";
import { Send, Search, Truck, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  name: string;
  phone: string | null;
  type: "courier" | "shipper";
}

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (message: { recipient: string; subject: string; body: string }) => void;
  contacts: { name: string; initials: string }[];
}

export const ComposeMessageDialog = ({
  open,
  onOpenChange,
  onSend,
  contacts,
}: ComposeMessageDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<SearchResult | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [body, setBody] = useState("");
  const [messageSignature, setMessageSignature] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setMessageSignature("");
    } catch {
      setMessageSignature("");
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      try {
        setResults([]);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSelect = (result: SearchResult) => {
    setSelectedRecipient(result);
    setSearchQuery(result.name);
    setShowResults(false);
  };

  const handleClearRecipient = () => {
    setSelectedRecipient(null);
    setSearchQuery("");
  };

  const handleSend = () => {
    const recipientName = selectedRecipient?.name || searchQuery.trim();
    if (!recipientName) {
      toast({ title: "Recipient required", description: "Please search and select a recipient", variant: "destructive" });
      return;
    }
    if (!body.trim()) {
      toast({ title: "Message required", description: "Please enter a message", variant: "destructive" });
      return;
    }
    const fullBody = messageSignature ? `${body.trim()}\n\n${messageSignature}` : body.trim();
    onSend({ recipient: recipientName, subject: "(No subject)", body: fullBody });
    resetForm();
    onOpenChange(false);
    toast({ title: "Message sent", description: `Message sent to ${recipientName}` });
  };

  const resetForm = () => {
    setSearchQuery("");
    setSelectedRecipient(null);
    setResults([]);
    setShowResults(false);
    setBody("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Send className="h-4 w-4 text-primary" />
              </div>
              New Message
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Search by name or phone number to find a courier or shipper
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">To</Label>
            <div className="relative">
              {selectedRecipient ? (
                <div className="flex items-center gap-2 rounded-xl h-10 bg-muted/30 border border-border px-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {selectedRecipient.type === "courier" ? (
                      <Truck className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">{selectedRecipient.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 h-5 flex-shrink-0">{selectedRecipient.type}</Badge>
                    {selectedRecipient.phone && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">{selectedRecipient.phone}</span>
                    )}
                  </div>
                  <button onClick={handleClearRecipient} className="text-muted-foreground hover:text-foreground text-xs">x</button>
                </div>
              ) : (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
                  <Input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSelectedRecipient(null); }}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder="Type recipient name (demo mode)"
                    className="pl-10 rounded-xl h-10 bg-muted/30 border-border"
                    maxLength={100}
                    autoComplete="off"
                  />
                </>
              )}
              {showResults && !selectedRecipient && (
                <div ref={resultsRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                  {results.length === 0 && !loading ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">Demo mode - type recipient name manually</div>
                  ) : (
                    results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                          result.type === "courier" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                        )}>
                          {getInitials(result.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{result.name}</p>
                          {result.phone && <p className="text-xs text-muted-foreground">{result.phone}</p>}
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 flex-shrink-0">
                          {result.type === "courier" ? <><Truck className="h-3 w-3 mr-1" />Courier</> : <><Building2 className="h-3 w-3 mr-1" />Shipper</>}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              className="rounded-xl bg-muted/30 border-border min-h-[140px] resize-none"
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground text-right">{body.length}/2000</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="ghost" onClick={handleClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSend} className="rounded-xl bg-primary text-primary-foreground gap-2 shadow-sm">
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
