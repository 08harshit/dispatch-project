import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileSettings } from "@/hooks/useSettings";

interface ProfileTabProps {
  profile: ProfileSettings;
  onChange: (values: Partial<ProfileSettings>) => void;
}

export default function ProfileTab({ profile, onChange }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={profile.companyName}
            onChange={e => onChange({ companyName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact Name</Label>
          <Input
            id="contactName"
            value={profile.contactName}
            onChange={e => onChange({ contactName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={e => onChange({ email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={profile.phone}
            onChange={e => onChange({ phone: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={profile.address}
          onChange={e => onChange({ address: e.target.value })}
        />
      </div>
    </div>
  );
}
