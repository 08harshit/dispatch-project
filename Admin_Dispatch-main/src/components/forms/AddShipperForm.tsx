import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, User, FileText, Clock } from "lucide-react";

export interface ShipperFormData {
  businessName: string;
  businessType: string;
  yearEstablished: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  timezone: string;
  website: string;
  dealerContactEmail: string;
  dealerPhone: string;
  dealerAddress: string;
  principalName: string;
  principalPhone: string;
  principalEmail: string;
  hoursPickup: string;
  hoursDropoff: string;
  specialInstructions: string;
  businessLicenseCity: string;
  expiryDateCity: string;
  businessLicenseState: string;
  expiryDateState: string;
  ein: string;
  taxExemptNumber: string;
  taxExempt: boolean;
}

interface AddShipperFormProps {
  onSuccess: () => void;
  initialData?: Partial<ShipperFormData>;
  isEditing?: boolean;
}

export function AddShipperForm({ onSuccess, initialData, isEditing = false }: AddShipperFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ShipperFormData>({
    businessName: "",
    businessType: "",
    yearEstablished: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    timezone: "",
    website: "",
    dealerContactEmail: "",
    dealerPhone: "",
    dealerAddress: "",
    principalName: "",
    principalPhone: "",
    principalEmail: "",
    hoursPickup: "",
    hoursDropoff: "",
    specialInstructions: "",
    businessLicenseCity: "",
    expiryDateCity: "",
    businessLicenseState: "",
    expiryDateState: "",
    ein: "",
    taxExemptNumber: "",
    taxExempt: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const updateField = (field: keyof ShipperFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(isEditing ? "Shipper updated successfully!" : "Shipper added successfully!");
    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="business" className="flex items-center gap-1.5 text-xs py-2">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1.5 text-xs py-2">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-1.5 text-xs py-2">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>
          <TabsTrigger value="licenses" className="flex items-center gap-1.5 text-xs py-2">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Licenses</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Info Tab */}
        <TabsContent value="business" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" placeholder="Enter business name" required value={formData.businessName} onChange={(e) => updateField("businessName", e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select value={formData.businessType} onValueChange={(value) => updateField("businessType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dealer">Dealer</SelectItem>
                  <SelectItem value="auction">Auction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearEstablished">Year Established</Label>
              <Input id="yearEstablished" type="number" placeholder="2000" min="1900" max="2099" value={formData.yearEstablished} onChange={(e) => updateField("yearEstablished", e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Street address" rows={2} value={formData.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" value={formData.city} onChange={(e) => updateField("city", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="State" value={formData.state} onChange={(e) => updateField("state", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input id="zipCode" placeholder="Zip Code" value={formData.zipCode} onChange={(e) => updateField("zipCode", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => updateField("timezone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="est">Eastern (EST)</SelectItem>
                  <SelectItem value="cst">Central (CST)</SelectItem>
                  <SelectItem value="mst">Mountain (MST)</SelectItem>
                  <SelectItem value="pst">Pacific (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://www.company.com" value={formData.website} onChange={(e) => updateField("website", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4 pt-4">
          <h4 className="text-sm font-medium text-muted-foreground">Dealer Contact</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dealerContactEmail">Dealer Contact Email *</Label>
              <Input id="dealerContactEmail" type="email" placeholder="contact@dealer.com" required value={formData.dealerContactEmail} onChange={(e) => updateField("dealerContactEmail", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealerPhone">Dealer Phone #</Label>
              <Input id="dealerPhone" type="tel" placeholder="(555) 123-4567" value={formData.dealerPhone} onChange={(e) => updateField("dealerPhone", e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="dealerAddress">Dealer Address</Label>
              <Input id="dealerAddress" placeholder="Dealer specific address (if different)" value={formData.dealerAddress} onChange={(e) => updateField("dealerAddress", e.target.value)} />
            </div>
          </div>

          <h4 className="text-sm font-medium text-muted-foreground pt-4">Principal/Owner</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="principalName">Principal Name</Label>
              <Input id="principalName" placeholder="Full name" value={formData.principalName} onChange={(e) => updateField("principalName", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="principalPhone">Principal Phone #</Label>
              <Input id="principalPhone" type="tel" placeholder="(555) 123-4567" value={formData.principalPhone} onChange={(e) => updateField("principalPhone", e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="principalEmail">Principal Email</Label>
              <Input id="principalEmail" type="email" placeholder="principal@company.com" value={formData.principalEmail} onChange={(e) => updateField("principalEmail", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hoursPickup">Hours Pickup</Label>
              <Input id="hoursPickup" placeholder="e.g. Mon-Fri 8AM-5PM" value={formData.hoursPickup} onChange={(e) => updateField("hoursPickup", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursDropoff">Hours Dropoff</Label>
              <Input id="hoursDropoff" placeholder="e.g. Mon-Fri 8AM-5PM" value={formData.hoursDropoff} onChange={(e) => updateField("hoursDropoff", e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea id="specialInstructions" placeholder="Any special pickup/dropoff instructions" rows={3} value={formData.specialInstructions} onChange={(e) => updateField("specialInstructions", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        {/* Licenses & Tax Tab */}
        <TabsContent value="licenses" className="space-y-4 pt-4">
          <h4 className="text-sm font-medium text-muted-foreground">Business Licenses</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessLicenseCity">Business License # (City)</Label>
              <Input id="businessLicenseCity" placeholder="City license number" value={formData.businessLicenseCity} onChange={(e) => updateField("businessLicenseCity", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDateCity">Expiry Date (City License)</Label>
              <Input id="expiryDateCity" type="date" value={formData.expiryDateCity} onChange={(e) => updateField("expiryDateCity", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessLicenseState">Business License # (State)</Label>
              <Input id="businessLicenseState" placeholder="State license number" value={formData.businessLicenseState} onChange={(e) => updateField("businessLicenseState", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDateState">Expiry Date (State License)</Label>
              <Input id="expiryDateState" type="date" value={formData.expiryDateState} onChange={(e) => updateField("expiryDateState", e.target.value)} />
            </div>
          </div>

          <h4 className="text-sm font-medium text-muted-foreground pt-4">Tax Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ein">EIN # (Tax ID)</Label>
              <Input id="ein" placeholder="XX-XXXXXXX" value={formData.ein} onChange={(e) => updateField("ein", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxExemptNumber">Tax Exempt #</Label>
              <Input id="taxExemptNumber" placeholder="Exemption number" value={formData.taxExemptNumber} onChange={(e) => updateField("taxExemptNumber", e.target.value)} />
            </div>

            <div className="sm:col-span-2 flex items-center space-x-2">
              <Checkbox id="taxExempt" checked={formData.taxExempt} onCheckedChange={(checked) => updateField("taxExempt", !!checked)} />
              <Label htmlFor="taxExempt" className="font-normal">
                This business is tax exempt
              </Label>
            </div>
          </div>

          <h4 className="text-sm font-medium text-muted-foreground pt-4">Documents</h4>
          <div className="space-y-2">
            <Label htmlFor="docs">Upload Documents</Label>
            <Input id="docs" type="file" multiple className="cursor-pointer" />
            <p className="text-xs text-muted-foreground">Upload business licenses, tax exemption certificates, etc.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update" : "Submit")}
        </Button>
      </div>
    </form>
  );
}
