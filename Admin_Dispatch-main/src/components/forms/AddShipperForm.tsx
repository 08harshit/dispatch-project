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
import { Building2, User, FileText, Clock, FileUp } from "lucide-react";
import { type CreateShipperPayload } from "@/services/shipperService";
import { useCreateShipperMutation, useUpdateShipperMutation } from "@/hooks/queries/useShippers";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";

export interface ShipperFormData {
  businessName: string;
  businessType: string;
  yearEstablished: string;
  street: string;
  aptUnit: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  mailingStreet: string;
  mailingAptUnit: string;
  mailingCity: string;
  mailingState: string;
  mailingZipCode: string;
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
  initialData?: Partial<ShipperFormData> & { id?: string };
  isEditing?: boolean;
}

export function AddShipperForm({ onSuccess, initialData, isEditing = false }: AddShipperFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mailingSameAsBusiness, setMailingSameAsBusiness] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const { mutateAsync: createShipper } = useCreateShipperMutation();
  const { mutateAsync: updateShipper } = useUpdateShipperMutation();
  const [formData, setFormData] = useState<ShipperFormData>({
    businessName: "",
    businessType: "",
    yearEstablished: "",
    street: "",
    aptUnit: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    mailingStreet: "",
    mailingAptUnit: "",
    mailingCity: "",
    mailingState: "",
    mailingZipCode: "",
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
      const d = { ...initialData } as Record<string, unknown>;
      if (d.address && !d.street) {
        d.street = d.address;
      }
      setFormData(prev => ({ ...prev, ...d }));
    }
  }, [initialData]);

  const updateField = (field: keyof ShipperFormData, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (mailingSameAsBusiness && typeof value === "string" && ["street", "aptUnit", "city", "state", "zipCode"].includes(field)) {
        const mailingMap: Record<string, keyof ShipperFormData> = {
          street: "mailingStreet",
          aptUnit: "mailingAptUnit",
          city: "mailingCity",
          state: "mailingState",
          zipCode: "mailingZipCode",
        };
        if (mailingMap[field]) {
          (updated as Record<string, unknown>)[mailingMap[field]] = value;
        }
      }
      return updated;
    });
  };

  const handleMailingSameToggle = (checked: boolean) => {
    setMailingSameAsBusiness(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        mailingStreet: prev.street,
        mailingAptUnit: prev.aptUnit,
        mailingCity: prev.city,
        mailingState: prev.state,
        mailingZipCode: prev.zipCode,
      }));
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const addressValue = [formData.street, formData.aptUnit].filter(Boolean).join(", ") || formData.address || undefined;
      const payload: CreateShipperPayload = {
        name: formData.businessName.trim(),
        contact_email: formData.dealerContactEmail || undefined,
        phone: formData.dealerPhone || undefined,
        address: addressValue,
        business_type: formData.businessType || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        tax_exempt: formData.taxExempt,
        ein: formData.ein || undefined,
        hours_pickup: formData.hoursPickup || undefined,
        hours_dropoff: formData.hoursDropoff || undefined,
        principal_name: formData.principalName || undefined,
      };
      if (isEditing && initialData?.id) {
        await updateShipper({ id: initialData.id, data: payload });
        toast.success("Shipper updated successfully!");
      } else {
        await createShipper(payload);
        toast.success("Shipper added successfully!");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save shipper");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
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
          <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs py-2">
            <FileUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Documents</span>
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

            <AddressAutocomplete
              label=""
              idPrefix="shipper"
              values={{
                street: formData.street || formData.address,
                aptUnit: formData.aptUnit,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
              }}
              onUpdate={(field, value) => updateField(field as keyof ShipperFormData, value)}
              fieldMap={{
                street: "street",
                aptUnit: "aptUnit",
                city: "city",
                state: "state",
                zipCode: "zipCode",
              }}
            />

            <div className="sm:col-span-2 flex items-center space-x-2 pt-2">
              <Checkbox
                id="mailingSame"
                checked={mailingSameAsBusiness}
                onCheckedChange={(checked) => handleMailingSameToggle(!!checked)}
              />
              <Label htmlFor="mailingSame" className="font-normal">
                Mailing address is the same as business address
              </Label>
            </div>

            {!mailingSameAsBusiness && (
              <AddressAutocomplete
                label="Mailing"
                idPrefix="mailing"
                values={{
                  street: formData.mailingStreet,
                  aptUnit: formData.mailingAptUnit,
                  city: formData.mailingCity,
                  state: formData.mailingState,
                  zipCode: formData.mailingZipCode,
                }}
                onUpdate={(field, value) => updateField(field as keyof ShipperFormData, value)}
                fieldMap={{
                  street: "mailingStreet",
                  aptUnit: "mailingAptUnit",
                  city: "mailingCity",
                  state: "mailingState",
                  zipCode: "mailingZipCode",
                }}
              />
            )}

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
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 pt-4">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("shipper-file-upload")?.click()}
          >
            <FileUp className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              PDF, DOC, DOCX, JPG, PNG, WEBP (max 20MB)
            </p>
            <input
              id="shipper-file-upload"
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files ({uploadedFiles.length})</Label>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
