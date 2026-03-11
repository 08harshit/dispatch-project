import { useState, useEffect } from "react";
import { Phone, Search, Truck, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  name: string;
  phone: string | null;
  type: "courier" | "shipper";
}

interface NewCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCall: (call: { contact: string; number: string; type: "outgoing"; duration: string; time: string }) => void;
}

export const NewCallDialog = ({ open, onOpenChange, onCall }: NewCallDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  useEffect(() => {
    if (selected || !searchQuery.trim() || searchQuery.trim().length < 2) {
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
  }, [searchQuery, selected]);

  const handleSelect = (r: SearchResult) => {
    setSelected(r);
    setSearchQuery(r.phone || r.name);
    setShowResults(false);
  };

  const handleClear = () => {
    setSelected(null);
    setSearchQuery("");
  };

  const handleCall = () => {
    const phone = selected?.phone || searchQuery.trim();
    if (!phone) {
      toast({ title: "Phone number required", description: "Please search and select a contact or enter a number.", variant: "destructive" });
      return;
    }
    const contactName = selected?.name || phone;
    onCall({ contact: contactName, number: phone, type: "outgoing", duration: "0:00", time: "Just now" });
    window.open(`tel:${phone}`, "_self");
    toast({ title: "Calling...", description: `Dialing ${contactName} at ${phone}` });
    setSelected(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) { setSelected(null); setSearchQuery(""); setResults([]); setShowResults(false); }
    onOpenChange(o);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <Phone className="h-4 w-4 text-accent-foreground" />
            </div>
            New Call
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Search by name or phone number to find a courier or shipper
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Phone Number</Label>
            {selected ? (
              <div className="flex items-center gap-2 rounded-xl h-10 bg-muted/30 border border-border px-3 mt-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selected.type === "courier" ? <Truck className="h-3.5 w-3.5 text-accent flex-shrink-0" /> : <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  <span className="text-sm font-medium text-foreground truncate">{selected.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 flex-shrink-0">{selected.type}</Badge>
                  {selected.phone && <span className="text-xs text-muted-foreground flex-shrink-0">{selected.phone}</span>}
                </div>
                <button onClick={handleClear} className="text-muted-foreground hover:text-foreground text-xs">x</button>
              </div>
            ) : (
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
                <Input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelected(null); }}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  placeholder="Type phone number (demo mode)"
                  className="pl-10 rounded-xl"
                  autoComplete="off"
                />
                {showResults && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                    {results.length === 0 && !loading ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">Demo mode - type phone number manually</div>
                    ) : (
                      results.map((r) => (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => handleSelect(r)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                            r.type === "courier" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                          )}>
                            {getInitials(r.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                            {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
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
          <Button onClick={handleCall} className="w-full bg-accent text-accent-foreground rounded-xl h-10">
            <Phone className="h-4 w-4 mr-1.5" /> Start Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
