import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Building2, User, Shield, Truck } from "lucide-react";

export interface CourierFormData {
  courierName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  businessType: string;
  businessPhone: string;
  fax: string;
  businessEmail: string;
  website: string;
  hours: string;
  timezone: string;
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  deskPhone: string;
  contactEmail: string;
  contactHours: string;
  usdot: string;
  usdotLink: string;
  mcNumber: string;
  mcLink: string;
  operatingStatus: string;
  mcs150Status: string;
  outOfServiceDate: string;
  authorityStatus: string;
  insuranceCompany: string;
  insuranceAgent: string;
  insurancePhone: string;
  insuranceEmail: string;
  physicalDamageLimit: string;
  numTrucks: string;
  equipmentType: string;
  routes: string;
}

interface AddCourierFormProps {
  onSuccess: () => void;
  initialData?: Partial<CourierFormData>;
  isEditing?: boolean;
  editingId?: string;
}

export function AddCourierForm({ onSuccess, initialData, isEditing = false, editingId }: AddCourierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CourierFormData>({
    courierName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    businessType: "",
    businessPhone: "",
    fax: "",
    businessEmail: "",
    website: "",
    hours: "",
    timezone: "",
    contactName: "",
    contactPosition: "",
    contactPhone: "",
    deskPhone: "",
    contactEmail: "",
    contactHours: "",
    usdot: "",
    usdotLink: "",
    mcNumber: "",
    mcLink: "",
    operatingStatus: "",
    mcs150Status: "",
    outOfServiceDate: "",
    authorityStatus: "",
    insuranceCompany: "",
    insuranceAgent: "",
    insurancePhone: "",
    insuranceEmail: "",
    physicalDamageLimit: "",
    numTrucks: "",
    equipmentType: "",
    routes: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const updateField = (field: keyof CourierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && editingId) {
        const { updateCourier } = await import("@/services/courierService");
        await updateCourier(editingId, formData as unknown as Record<string, string>);
        toast.success("Courier updated successfully!");
      } else {
        const { createCourier } = await import("@/services/courierService");
        await createCourier(formData as unknown as Record<string, string>);
        toast.success("Courier added successfully!");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Failed to save courier:", err);
      toast.error(err.message || "Failed to save courier");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="company" className="flex items-center gap-1.5 text-xs py-2">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1.5 text-xs py-2">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-1.5 text-xs py-2">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-1.5 text-xs py-2">
            <Truck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Equipment</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="courierName">Courier Name *</Label>
              <Input id="courierName" placeholder="Enter courier company name" required value={formData.courierName} onChange={(e) => updateField("courierName", e.target.value)} />
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
              <Label htmlFor="businessType">Business Type</Label>
              <Select value={formData.businessType} onValueChange={(value) => updateField("businessType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llc">LLC</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="sole-proprietor">Sole Proprietor</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone #</Label>
              <Input id="businessPhone" type="tel" placeholder="(555) 123-4567" value={formData.businessPhone} onChange={(e) => updateField("businessPhone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">Fax #</Label>
              <Input id="fax" type="tel" placeholder="(555) 123-4568" value={formData.fax} onChange={(e) => updateField("fax", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input id="businessEmail" type="email" placeholder="info@company.com" value={formData.businessEmail} onChange={(e) => updateField("businessEmail", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://www.company.com" value={formData.website} onChange={(e) => updateField("website", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Business Hours</Label>
              <Input id="hours" placeholder="Mon-Fri 8AM-5PM" value={formData.hours} onChange={(e) => updateField("hours", e.target.value)} />
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
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person Name *</Label>
              <Input id="contactName" placeholder="Full name" required value={formData.contactName} onChange={(e) => updateField("contactName", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPosition">Position</Label>
              <Input id="contactPosition" placeholder="e.g. Operations Manager" value={formData.contactPosition} onChange={(e) => updateField("contactPosition", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone #</Label>
              <Input id="contactPhone" type="tel" placeholder="(555) 123-4567" value={formData.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskPhone">Desk #</Label>
              <Input id="deskPhone" type="tel" placeholder="(555) 123-4567 ext 101" value={formData.deskPhone} onChange={(e) => updateField("deskPhone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" type="email" placeholder="contact@company.com" value={formData.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactHours">Contact Hours</Label>
              <Input id="contactHours" placeholder="Mon-Fri 9AM-5PM" value={formData.contactHours} onChange={(e) => updateField("contactHours", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="usdot">USDOT # *</Label>
              <Input id="usdot" placeholder="1234567" required value={formData.usdot} onChange={(e) => updateField("usdot", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usdotLink">USDOT Link</Label>
              <Input id="usdotLink" type="url" placeholder="FMCSA verification link" value={formData.usdotLink} onChange={(e) => updateField("usdotLink", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcNumber">MC # *</Label>
              <Input id="mcNumber" placeholder="MC-123456" required value={formData.mcNumber} onChange={(e) => updateField("mcNumber", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcLink">MC Link</Label>
              <Input id="mcLink" type="url" placeholder="FMCSA verification link" value={formData.mcLink} onChange={(e) => updateField("mcLink", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatingStatus">Status</Label>
              <Select value={formData.operatingStatus} onValueChange={(value) => updateField("operatingStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="not-active">Not Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcs150Status">MCS-150 Status</Label>
              <Select value={formData.mcs150Status} onValueChange={(value) => updateField("mcs150Status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outOfServiceDate">Out of Service Date</Label>
              <Input id="outOfServiceDate" type="date" value={formData.outOfServiceDate} onChange={(e) => updateField("outOfServiceDate", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorityStatus">Authority Status</Label>
              <Select value={formData.authorityStatus} onValueChange={(value) => updateField("authorityStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="authorized">Authorized</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="insuranceCompany">Insurance Company</Label>
              <Input id="insuranceCompany" placeholder="Insurance company name" value={formData.insuranceCompany} onChange={(e) => updateField("insuranceCompany", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceAgent">Agent Name</Label>
              <Input id="insuranceAgent" placeholder="Insurance agent name" value={formData.insuranceAgent} onChange={(e) => updateField("insuranceAgent", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurancePhone">Agent Phone #</Label>
              <Input id="insurancePhone" type="tel" placeholder="(555) 123-4567" value={formData.insurancePhone} onChange={(e) => updateField("insurancePhone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceEmail">Agent Email</Label>
              <Input id="insuranceEmail" type="email" placeholder="agent@insurance.com" value={formData.insuranceEmail} onChange={(e) => updateField("insuranceEmail", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="physicalDamageLimit">Physical Damage Limit</Label>
              <Input id="physicalDamageLimit" placeholder="$1,000,000" value={formData.physicalDamageLimit} onChange={(e) => updateField("physicalDamageLimit", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numTrucks"># of Trucks</Label>
              <Input id="numTrucks" type="number" placeholder="0" min="0" value={formData.numTrucks} onChange={(e) => updateField("numTrucks", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentType">Equipment Type</Label>
              <Select value={formData.equipmentType} onValueChange={(value) => updateField("equipmentType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open Transport">Open Transport</SelectItem>
                  <SelectItem value="Enclosed Transport">Enclosed Transport</SelectItem>
                  <SelectItem value="Flatbed">Flatbed</SelectItem>
                  <SelectItem value="Hotshot">Hotshot</SelectItem>
                  <SelectItem value="Multi-Car Carrier">Multi-Car Carrier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="routes">Routes/Coverage Area</Label>
              <Textarea id="routes" placeholder="e.g. East Coast, Midwest, Nationwide" rows={3} value={formData.routes} onChange={(e) => updateField("routes", e.target.value)} />
            </div>
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
