import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

interface AddressParts {
  street: string;
  aptUnit: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

interface AddressAutocompleteProps {
  label: string;
  idPrefix: string;
  values: AddressParts;
  onUpdate: (field: string, value: string) => void;
  fieldMap: {
    street: string;
    aptUnit: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export function AddressAutocomplete({
  label,
  idPrefix,
  values,
  onUpdate,
  fieldMap,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { action: "autocomplete", input },
      });
      if (!error && data?.predictions) {
        setPredictions(data.predictions);
        setShowDropdown(true);
      }
    } catch {
      console.error("Failed to fetch address suggestions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStreetChange = (value: string) => {
    onUpdate(fieldMap.street, value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(value), 300);
  };

  const handleSelect = async (prediction: Prediction) => {
    setShowDropdown(false);
    setPredictions([]);
    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { action: "details", placeId: prediction.place_id },
      });
      if (error || !data?.result?.address_components) return;

      const components = data.result.address_components as Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;

      let streetNumber = "";
      let route = "";
      let city = "";
      let state = "";
      let zip = "";

      for (const c of components) {
        if (c.types.includes("street_number")) streetNumber = c.long_name;
        if (c.types.includes("route")) route = c.long_name;
        if (c.types.includes("locality")) city = c.long_name;
        if (c.types.includes("sublocality_level_1") && !city) city = c.long_name;
        if (c.types.includes("administrative_area_level_1")) state = c.short_name;
        if (c.types.includes("postal_code")) zip = c.long_name;
      }

      onUpdate(fieldMap.street, `${streetNumber} ${route}`.trim());
      onUpdate(fieldMap.city, city);
      onUpdate(fieldMap.state, state);
      onUpdate(fieldMap.zipCode, zip);
    } catch {
      console.error("Failed to fetch place details");
    }
  };

  return (
    <>
      <div className="sm:col-span-2 space-y-2 relative" ref={wrapperRef}>
        <Label htmlFor={`${idPrefix}Street`}>{label ? `${label} ` : ""}Street Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}Street`}
            placeholder="Start typing an address..."
            className="pl-9"
            value={values.street}
            onChange={(e) => handleStreetChange(e.target.value)}
            onFocus={() => predictions.length > 0 && setShowDropdown(true)}
            autoComplete="off"
          />
        </div>
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {predictions.map((p) => (
              <button
                key={p.place_id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => handleSelect(p)}
              >
                {p.description}
              </button>
            ))}
          </div>
        )}
        {isLoading && (
          <div className="absolute right-3 top-9 text-xs text-muted-foreground">
            Loading...
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}AptUnit`}>{label ? `${label} ` : ""}Apt/Unit #</Label>
        <Input
          id={`${idPrefix}AptUnit`}
          placeholder="Apt, Suite, Unit"
          value={values.aptUnit}
          onChange={(e) => onUpdate(fieldMap.aptUnit, e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}City`}>{label ? `${label} ` : ""}City</Label>
        <Input
          id={`${idPrefix}City`}
          placeholder="City"
          value={values.city}
          onChange={(e) => onUpdate(fieldMap.city, e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}State`}>{label ? `${label} ` : ""}State</Label>
        <Input
          id={`${idPrefix}State`}
          placeholder="State"
          value={values.state}
          onChange={(e) => onUpdate(fieldMap.state, e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}ZipCode`}>{label ? `${label} ` : ""}Zip Code</Label>
        <Input
          id={`${idPrefix}ZipCode`}
          placeholder="Zip Code"
          value={values.zipCode}
          onChange={(e) => onUpdate(fieldMap.zipCode, e.target.value)}
        />
      </div>
    </>
  );
}
