import { useState } from "react";
import { Megaphone, Plus, Trash2, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { commonHighValueOptions } from "@/types/conditionReport";

interface AnnouncementsSectionProps {
  announcements: string[];
  highValueOptions: string[];
  onAnnouncementsChange: (announcements: string[]) => void;
  onHighValueOptionsChange: (options: string[]) => void;
}

const AnnouncementsSection = ({
  announcements,
  highValueOptions,
  onAnnouncementsChange,
  onHighValueOptionsChange,
}: AnnouncementsSectionProps) => {
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newOption, setNewOption] = useState("");
  const [showOptionsPicker, setShowOptionsPicker] = useState(false);

  const addAnnouncement = () => {
    if (newAnnouncement.trim()) {
      onAnnouncementsChange([...announcements, newAnnouncement.trim()]);
      setNewAnnouncement("");
    }
  };

  const removeAnnouncement = (index: number) => {
    onAnnouncementsChange(announcements.filter((_, i) => i !== index));
  };

  const addHighValueOption = (option: string) => {
    if (!highValueOptions.includes(option)) {
      onHighValueOptionsChange([...highValueOptions, option]);
    }
  };

  const addCustomOption = () => {
    if (newOption.trim() && !highValueOptions.includes(newOption.trim())) {
      onHighValueOptionsChange([...highValueOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeHighValueOption = (option: string) => {
    onHighValueOptionsChange(highValueOptions.filter((o) => o !== option));
  };

  return (
    <div className="space-y-6">
      {/* Announcements */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Megaphone className="h-4 w-4 text-amber-500" />
          Announcements
        </div>

        {announcements.length > 0 && (
          <div className="space-y-2">
            {announcements.map((announcement, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <span className="flex-1 text-sm text-amber-700 dark:text-amber-400">
                  {announcement}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-amber-600 hover:text-amber-700"
                  onClick={() => removeAnnouncement(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="e.g., TRA/ENGINE RUNS/TRANS ENGAGES"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAnnouncement())}
          />
          <Button type="button" variant="outline" size="sm" onClick={addAnnouncement}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* High Value Options */}
      <Collapsible>
        <div className="space-y-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:from-primary/10 hover:to-primary/15 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">High Value Options</span>
                {highValueOptions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {highValueOptions.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3">
            {highValueOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {highValueOptions.map((option) => (
                  <Badge
                    key={option}
                    variant="secondary"
                    className="gap-1 py-1 px-2 bg-primary/10 text-primary border-primary/20"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => removeHighValueOption(option)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Quick Add Common Options */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOptionsPicker(!showOptionsPicker)}
                className="w-full justify-between"
              >
                Quick Add Options
                {showOptionsPicker ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showOptionsPicker && (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-muted/10 border border-border/20 max-h-40 overflow-y-auto">
                  {commonHighValueOptions
                    .filter((opt) => !highValueOptions.includes(opt))
                    .map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => addHighValueOption(opt)}
                        className="px-2 py-1 rounded-md bg-muted/30 hover:bg-primary/10 hover:text-primary text-xs transition-colors border border-transparent hover:border-primary/20"
                      >
                        {opt}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Custom Option */}
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add custom option..."
                className="flex-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomOption())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomOption}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};

export default AnnouncementsSection;
