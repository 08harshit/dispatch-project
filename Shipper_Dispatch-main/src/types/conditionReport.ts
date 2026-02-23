export type ConditionStatus = 'okay' | 'may_need_future' | 'attention' | 'not_checked';

export type DamageType = 'paint_and_body' | 'cosmetic_conventional' | 'miscellaneous' | 'prev_repair' | 'mechanical' | 'interior' | 'structural';
export type DamageCondition = 'broken' | 'missing' | 'worn' | 'gouged' | 'dent' | 'scratched' | 'cracked' | 'torn' | 'stained' | 'severe_damage' | 'curb_rash' | 'flat' | 'burns' | 'loose' | 'bent' | 'scraped' | 'other';

export interface DamageItem {
  id: string;
  description: string;
  condition: DamageCondition | string;
  type: DamageType;
  additionalInfo?: string;
  photoUrl?: string;
}

export interface VehicleHistoryData {
  historicalEvents: number;
  titleCheck: string;
  lastEventDate: string;
  odometerCheck: string;
  calculatedOwners: number;
  useEventCheck: string;
  lastReportedMileage: string;
  calculatedAccidents: number;
  buybackProtection: string;
  carfaxUrl?: string;
}

export interface VehicleDetails {
  exteriorColor: string;
  interiorColor: string;
  titleReceived?: string;
  workOrder?: string;
  msrp?: string;
  receivedDate?: string;
  inServiceDate?: string;
  titleState?: string;
  inspectionLocation?: string;
  driveType?: string; // FWD, RWD, AWD, 4WD
  engine?: string;
  fuelType?: string;
  transmission?: string;
  seatMaterial?: string; // Cloth, Leather, Vinyl
}

export interface TireWheelData {
  type: 'aluminum' | 'steel' | 'alloy' | 'other';
  tread: string; // e.g., "6/32"
  size: string; // e.g., "215/60R16"
}

export interface ConditionReport {
  id: string;
  vehicleId: string;
  
  // Drivability
  runsAndDrives: 'yes' | 'no' | 'unknown';
  starts: boolean;
  notDrivable: boolean;
  
  // Structural & Body
  noStructuralDamage: boolean;
  priorPaint: boolean;
  
  // Interior & Exterior
  tiresCondition: 'good' | 'fair' | 'poor' | 'needs_replacement';
  clean: boolean;
  otherOdor: boolean;
  smokeOdor: boolean;
  
  // Keys & Accessories
  keysAvailable: boolean;
  keyFobs: number;
  
  // Documentation
  invoiceAvailable: boolean;
  
  // NEW: Announcements (important notices about the vehicle)
  announcements: string[];
  
  // NEW: High Value Options
  highValueOptions: string[];
  
  // NEW: Exterior Damage Items (detailed list)
  exteriorDamageItems: DamageItem[];
  
  // NEW: Interior Damage Items (detailed list)
  interiorDamageItems: DamageItem[];
  
  // NEW: Mechanical Issues
  mechanicalIssues: DamageItem[];
  
  // NEW: Structural Issues
  structuralIssues: DamageItem[];
  
  // NEW: Vehicle History
  vehicleHistory: VehicleHistoryData;
  
  // NEW: Vehicle Details
  vehicleDetails: VehicleDetails;
  
  // NEW: Tires & Wheels detailed data
  tiresWheels: {
    leftFront: TireWheelData;
    rightFront: TireWheelData;
    leftRear: TireWheelData;
    rightRear: TireWheelData;
    spare: TireWheelData | null;
  };
  
  // Interior/Exterior Checklist
  exteriorChecklist: {
    headLights: ConditionStatus;
    tailLights: ConditionStatus;
    turnSignals: ConditionStatus;
    windshieldWipers: ConditionStatus;
    windshieldCondition: ConditionStatus;
    mirrors: ConditionStatus;
    horn: ConditionStatus;
    carpetUpholstery: ConditionStatus;
  };
  
  // Under Vehicle
  underVehicle: {
    shockAbsorbers: ConditionStatus;
    steeringLinkage: ConditionStatus;
    mufflerExhaust: ConditionStatus;
    engineOilLeaks: ConditionStatus;
    brakeLines: ConditionStatus;
    driveShaft: ConditionStatus;
    transmission: ConditionStatus;
    fuelLines: ConditionStatus;
  };
  
  // Under Hood
  underHood: {
    fluidLevels: ConditionStatus;
    engineAirFilter: ConditionStatus;
    driveBelts: ConditionStatus;
    coolingSystem: ConditionStatus;
    radiator: ConditionStatus;
    battery: ConditionStatus;
    coolantReservoir: ConditionStatus;
  };
  
  // Brakes & Tires
  brakesTires: {
    brakePads: ConditionStatus;
    rotorsDrums: ConditionStatus;
    leftFrontTire: { tread: string; pressure: string };
    rightFrontTire: { tread: string; pressure: string };
    leftRearTire: { tread: string; pressure: string };
    rightRearTire: { tread: string; pressure: string };
    alignmentNeeded: boolean;
    wheelBalanceNeeded: boolean;
  };
  
  // Damage Areas
  damageAreas: {
    frontBumper: boolean;
    rearBumper: boolean;
    hoodRoof: boolean;
    leftSide: boolean;
    rightSide: boolean;
    windshield: boolean;
    rearWindow: boolean;
  };
  
  // Additional Notes
  conditionNotes: string;
  mechanicComments: string;
  estimatedRepairCost: string;
  
  // Photos
  photos: string[];
  
  // PDF Upload
  pdfReportUrl?: string;
  
  // Mileage
  mileage: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export const createEmptyConditionReport = (vehicleId: string): ConditionReport => ({
  id: crypto.randomUUID(),
  vehicleId,
  runsAndDrives: 'unknown',
  starts: false,
  notDrivable: false,
  noStructuralDamage: true,
  priorPaint: false,
  tiresCondition: 'good',
  clean: true,
  otherOdor: false,
  smokeOdor: false,
  keysAvailable: true,
  keyFobs: 1,
  invoiceAvailable: false,
  announcements: [],
  highValueOptions: [],
  exteriorDamageItems: [],
  interiorDamageItems: [],
  mechanicalIssues: [],
  structuralIssues: [],
  vehicleHistory: {
    historicalEvents: 0,
    titleCheck: '',
    lastEventDate: '',
    odometerCheck: '',
    calculatedOwners: 0,
    useEventCheck: '',
    lastReportedMileage: '',
    calculatedAccidents: 0,
    buybackProtection: '',
  },
  vehicleDetails: {
    exteriorColor: '',
    interiorColor: '',
    driveType: '',
    engine: '',
    fuelType: '',
    transmission: '',
    seatMaterial: '',
  },
  tiresWheels: {
    leftFront: { type: 'aluminum', tread: '', size: '' },
    rightFront: { type: 'aluminum', tread: '', size: '' },
    leftRear: { type: 'aluminum', tread: '', size: '' },
    rightRear: { type: 'aluminum', tread: '', size: '' },
    spare: null,
  },
  exteriorChecklist: {
    headLights: 'not_checked',
    tailLights: 'not_checked',
    turnSignals: 'not_checked',
    windshieldWipers: 'not_checked',
    windshieldCondition: 'not_checked',
    mirrors: 'not_checked',
    horn: 'not_checked',
    carpetUpholstery: 'not_checked',
  },
  underVehicle: {
    shockAbsorbers: 'not_checked',
    steeringLinkage: 'not_checked',
    mufflerExhaust: 'not_checked',
    engineOilLeaks: 'not_checked',
    brakeLines: 'not_checked',
    driveShaft: 'not_checked',
    transmission: 'not_checked',
    fuelLines: 'not_checked',
  },
  underHood: {
    fluidLevels: 'not_checked',
    engineAirFilter: 'not_checked',
    driveBelts: 'not_checked',
    coolingSystem: 'not_checked',
    radiator: 'not_checked',
    battery: 'not_checked',
    coolantReservoir: 'not_checked',
  },
  brakesTires: {
    brakePads: 'not_checked',
    rotorsDrums: 'not_checked',
    leftFrontTire: { tread: '', pressure: '' },
    rightFrontTire: { tread: '', pressure: '' },
    leftRearTire: { tread: '', pressure: '' },
    rightRearTire: { tread: '', pressure: '' },
    alignmentNeeded: false,
    wheelBalanceNeeded: false,
  },
  damageAreas: {
    frontBumper: false,
    rearBumper: false,
    hoodRoof: false,
    leftSide: false,
    rightSide: false,
    windshield: false,
    rearWindow: false,
  },
  conditionNotes: '',
  mechanicComments: '',
  estimatedRepairCost: '',
  photos: [],
  mileage: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export interface ConditionItem {
  id: string;
  label: string;
  icon: string;
  category: 'drivability' | 'structure' | 'condition' | 'accessories';
  type: 'toggle' | 'select' | 'number';
  options?: string[];
}

export const conditionItems: ConditionItem[] = [
  // Drivability
  { id: 'runsAndDrives', label: 'Runs & Drives', icon: 'car', category: 'drivability', type: 'toggle' },
  { id: 'starts', label: 'Starts', icon: 'key', category: 'drivability', type: 'toggle' },
  { id: 'notDrivable', label: 'Not Drivable', icon: 'car-off', category: 'drivability', type: 'toggle' },
  
  // Structure
  { id: 'noStructuralDamage', label: 'No Structural Damage', icon: 'shield-check', category: 'structure', type: 'toggle' },
  { id: 'priorPaint', label: 'Prior Paint', icon: 'paintbrush', category: 'structure', type: 'toggle' },
  
  // Condition
  { id: 'tiresCondition', label: 'Tires', icon: 'circle', category: 'condition', type: 'select', options: ['good', 'fair', 'poor', 'needs_replacement'] },
  { id: 'clean', label: 'Clean', icon: 'sparkles', category: 'condition', type: 'toggle' },
  { id: 'otherOdor', label: 'Other Odor', icon: 'wind', category: 'condition', type: 'toggle' },
  { id: 'smokeOdor', label: 'Smoke Odor', icon: 'cigarette', category: 'condition', type: 'toggle' },
  
  // Accessories
  { id: 'keysAvailable', label: 'Keys', icon: 'key-round', category: 'accessories', type: 'toggle' },
  { id: 'keyFobs', label: 'Key Fobs', icon: 'key-square', category: 'accessories', type: 'number' },
];

// Damage condition options for dropdowns
export const damageConditionOptions: { value: DamageCondition; label: string }[] = [
  { value: 'broken', label: 'Broken' },
  { value: 'missing', label: 'Missing' },
  { value: 'worn', label: 'Worn' },
  { value: 'gouged', label: 'Gouged' },
  { value: 'dent', label: 'Dent' },
  { value: 'scratched', label: 'Scratched' },
  { value: 'cracked', label: 'Cracked' },
  { value: 'torn', label: 'Torn' },
  { value: 'stained', label: 'Stained' },
  { value: 'severe_damage', label: 'Severe Damage' },
  { value: 'curb_rash', label: 'Curb Rash' },
  { value: 'flat', label: 'Flat' },
  { value: 'burns', label: 'Burns' },
  { value: 'loose', label: 'Loose' },
  { value: 'bent', label: 'Bent' },
  { value: 'scraped', label: 'Scraped' },
  { value: 'other', label: 'Other' },
];

export const damageTypeOptions: { value: DamageType; label: string }[] = [
  { value: 'paint_and_body', label: 'Paint and Body' },
  { value: 'cosmetic_conventional', label: 'Cosmetic Conventional' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
  { value: 'prev_repair', label: 'Previous Repair' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'interior', label: 'Interior' },
  { value: 'structural', label: 'Structural' },
];

// Common exterior parts for quick selection
export const commonExteriorParts = [
  'Front Bumper Cover', 'Rear Bumper Cover', 'Front Bumper Center Grille', 'Hood', 'Roof',
  'Left Fender', 'Right Fender', 'Left Front Door', 'Right Front Door', 'Left Rear Door', 'Right Rear Door',
  'Left Quarter Panel', 'Right Quarter Panel', 'Deck Lid/Trunk', 'Windshield', 'Rear Window',
  'Left Mirror', 'Right Mirror', 'Left Fog Light', 'Right Fog Light', 'Left Headlight', 'Right Headlight',
  'Left Taillight', 'Right Taillight', 'Front Emblem', 'Rear Emblem', 'Left Rocker Panel', 'Right Rocker Panel',
  'Left Front Wheel', 'Right Front Wheel', 'Left Rear Wheel', 'Right Rear Wheel',
  'Left Front Tire', 'Right Front Tire', 'Left Rear Tire', 'Right Rear Tire',
];

export const commonInteriorParts = [
  'Driver Seat', 'Passenger Seat', 'Left Rear Seat', 'Right Rear Seat', 'Headliner',
  'Dashboard', 'Center Console', 'Left Sun Visor', 'Right Sun Visor', 'Steering Wheel',
  'Door Panel - LF', 'Door Panel - RF', 'Door Panel - LR', 'Door Panel - RR',
  'Carpet - Front', 'Carpet - Rear', 'Floor Mats', 'Trunk Liner',
];

export const commonMechanicalParts = [
  'Brake Pads - Front', 'Brake Pads - Rear', 'Rotors - Front', 'Rotors - Rear',
  'Left Front Control Arm', 'Right Front Control Arm', 'Brake Caliper - LF', 'Brake Caliper - RF',
  'Hub Bearing - LF', 'Hub Bearing - RF', 'Hub Bearing - LR', 'Hub Bearing - RR',
  'CV Axle - Left', 'CV Axle - Right', 'Tie Rod - Left', 'Tie Rod - Right',
  'Ball Joint - Left', 'Ball Joint - Right', 'Strut - LF', 'Strut - RF', 'Shock - LR', 'Shock - RR',
  'Exhaust System', 'Catalytic Converter', 'Muffler', 'Engine Mount', 'Transmission Mount',
];

export const commonHighValueOptions = [
  'Navigation System', 'Bluetooth Connection', 'Satellite Radio', 'WiFi Hotspot',
  'Leather Seats', 'Heated Seats', 'Cooled Seats', 'Sunroof/Moonroof', 'Panoramic Roof',
  'Backup Camera', '360 Camera', 'Parking Sensors', 'Blind Spot Monitor', 'Lane Departure Warning',
  'Adaptive Cruise Control', 'Premium Sound System', 'Apple CarPlay', 'Android Auto',
  'Power Liftgate', 'Remote Start', 'Keyless Entry', 'Push Button Start',
  'Tire Pressure Monitor', 'Alloy Wheels', 'LED Headlights', 'Fog Lights',
];
