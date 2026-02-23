export interface VehicleCondition {
  runs: boolean;
  rolls: boolean;
  starts: boolean;
  damaged: boolean;
}

export interface VehicleEntry {
  id: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  type: string;
  color: string;
  condition: VehicleCondition;
  conditionNotes: string;
  conditionPhotos: string[];
}

export interface LocationContact {
  name: string;
  phone: string;
  email: string;
}

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface PostVehicleFormData {
  // Pickup Location
  pickupAddress: string;
  pickupLocationType: string;
  pickupContact: LocationContact;
  pickupCoordinates: Coordinates;
  
  // Delivery Location
  deliveryAddress: string;
  deliveryLocationType: string;
  deliveryContact: LocationContact;
  deliveryCoordinates: Coordinates;
  
  // Vehicles
  vehicles: VehicleEntry[];
  
  // Shipping Details
  dateAvailable: Date | undefined;
  etaDeliveryFrom: Date | undefined;
  etaDeliveryTo: Date | undefined;
  price: string;
  paymentType: string;
  notes: string;
}
