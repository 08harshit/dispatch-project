import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  DamageItem,
  DamageType,
  damageConditionOptions,
  damageTypeOptions,
} from "@/types/conditionReport";

interface DamageItemsSectionProps {
  title: string;
  icon: React.ReactNode;
  items: DamageItem[];
  onChange: (items: DamageItem[]) => void;
  commonParts: string[];
  defaultType: DamageType;
}

const DamageItemsSection = ({
  title,
  icon,
  items,
  onChange,
  commonParts,
  defaultType,
}: DamageItemsSectionProps) => {
  const [isOpen, setIsOpen] = useState(items.length > 0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const addItem = (description: string = "") => {
    const newItem: DamageItem = {
      id: crypto.randomUUID(),
      description,
      condition: "other",
      type: defaultType,
      additionalInfo: "",
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<DamageItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "severe_damage":
      case "broken":
      case "cracked":
        return "text-rose-500";
      case "worn":
      case "gouged":
      case "dent":
      case "scratched":
        return "text-amber-500";
      case "missing":
      case "flat":
        return "text-rose-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-semibold">{title}</span>
            {items.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-medium">
                {items.length}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3 space-y-3">
        {/* Quick Add Common Parts */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="w-full justify-between"
          >
            Quick Add Common Parts
            {showQuickAdd ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showQuickAdd && (
            <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-muted/10 border border-border/20">
              {commonParts.slice(0, 20).map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => addItem(part)}
                  className="px-2 py-1 rounded-md bg-muted/30 hover:bg-primary/10 hover:text-primary text-xs transition-colors border border-transparent hover:border-primary/20"
                >
                  {part}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Damage Items List */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-muted/10 border border-border/20 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-5 h-5 flex items-center justify-center rounded bg-muted/30">
                    {index + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Part name..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Condition</Label>
                      <Select
                        value={item.condition}
                        onValueChange={(val) => updateItem(item.id, { condition: val as any })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {damageConditionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Type</Label>
                      <Select
                        value={item.type}
                        onValueChange={(val) => updateItem(item.id, { type: val as DamageType })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {damageTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Additional Info */}
                <Input
                  value={item.additionalInfo || ""}
                  onChange={(e) => updateItem(item.id, { additionalInfo: e.target.value })}
                  placeholder="Additional info (e.g., Requires Conventional Repair)..."
                  className="h-7 text-[10px] bg-muted/10"
                />
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Item */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addItem()}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Custom Item
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DamageItemsSection;
