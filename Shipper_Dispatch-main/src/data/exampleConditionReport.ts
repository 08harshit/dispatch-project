import { ConditionReport } from "@/types/conditionReport";

export const createExampleConditionReport = (vehicleId: string): ConditionReport => ({
  id: crypto.randomUUID(),
  vehicleId,
  
  // Drivability - Runs & Drives
  runsAndDrives: 'yes',
  starts: true,
  notDrivable: false,
  
  // Structural & Body
  noStructuralDamage: true,
  priorPaint: true,
  
  // Interior & Exterior
  tiresCondition: 'fair',
  clean: true,
  otherOdor: false,
  smokeOdor: false,
  
  // Keys & Accessories
  keysAvailable: true,
  keyFobs: 2,
  
  // Documentation
  invoiceAvailable: true,
  
  // Announcements
  announcements: [
    'TRA/ENGINE RUNS/TRANS ENGAGES',
    'PRIOR PAINT - LEFT FENDER AND FRONT BUMPER',
    'HEATED SEATS - DRIVER AND PASSENGER',
  ],
  
  // High Value Options
  highValueOptions: [
    'Navigation System',
    'Leather Seats',
    'Heated Seats',
    'Backup Camera',
    'Bluetooth Connection',
    'Sunroof/Moonroof',
    'Premium Sound System',
    'Apple CarPlay',
  ],
  
  // Exterior Damage Items
  exteriorDamageItems: [
    {
      id: '1',
      description: 'Front Bumper Cover',
      condition: 'severe_damage',
      type: 'paint_and_body',
      additionalInfo: 'Deep scratch and paint missing',
    },
    {
      id: '2',
      description: 'Left Fender',
      condition: 'dent',
      type: 'paint_and_body',
      additionalInfo: 'Minor dent near wheel well',
    },
    {
      id: '3',
      description: 'Right Rear Door',
      condition: 'scratched',
      type: 'cosmetic_conventional',
      additionalInfo: 'Light surface scratches',
    },
    {
      id: '4',
      description: 'Rear Bumper Cover',
      condition: 'scraped',
      type: 'paint_and_body',
      additionalInfo: 'Scrape marks from parking',
    },
  ],
  
  // Interior Damage Items
  interiorDamageItems: [
    {
      id: '5',
      description: 'Driver Seat',
      condition: 'worn',
      type: 'interior',
      additionalInfo: 'Leather showing wear on bolster',
    },
    {
      id: '6',
      description: 'Carpet - Front',
      condition: 'stained',
      type: 'interior',
      additionalInfo: 'Small stain near driver footwell',
    },
  ],
  
  // Mechanical Issues
  mechanicalIssues: [
    {
      id: '7',
      description: 'Brake Pads - Front',
      condition: 'worn',
      type: 'mechanical',
      additionalInfo: 'Approximately 30% remaining',
    },
  ],
  
  // Structural Issues - None
  structuralIssues: [],
  
  // Vehicle History
  vehicleHistory: {
    historicalEvents: 42,
    titleCheck: 'Clean',
    lastEventDate: '2024-12-15',
    odometerCheck: 'Verified',
    calculatedOwners: 3,
    useEventCheck: 'Personal Use',
    lastReportedMileage: '97,850',
    calculatedAccidents: 1,
    buybackProtection: 'Eligible',
    carfaxUrl: 'https://www.carfax.com/vehicle/example',
  },
  
  // Vehicle Details
  vehicleDetails: {
    exteriorColor: 'Glacier White Metallic',
    interiorColor: 'Black Leather',
    titleReceived: 'Yes',
    workOrder: 'WO-2024-78543',
    msrp: '$42,500',
    receivedDate: '2025-01-15',
    inServiceDate: '2021-03-22',
    titleState: 'California',
    inspectionLocation: 'Los Angeles Auto Auction',
    driveType: 'AWD',
    engine: '3.5L V6',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    seatMaterial: 'Leather',
  },
  
  // Tires & Wheels
  tiresWheels: {
    leftFront: { type: 'alloy', tread: '6/32', size: '245/45R18' },
    rightFront: { type: 'alloy', tread: '5/32', size: '245/45R18' },
    leftRear: { type: 'alloy', tread: '6/32', size: '245/45R18' },
    rightRear: { type: 'alloy', tread: '4/32', size: '245/45R18' },
    spare: { type: 'steel', tread: 'Full', size: 'Compact' },
  },
  
  // Exterior Checklist
  exteriorChecklist: {
    headLights: 'okay',
    tailLights: 'okay',
    turnSignals: 'okay',
    windshieldWipers: 'may_need_future',
    windshieldCondition: 'okay',
    mirrors: 'okay',
    horn: 'okay',
    carpetUpholstery: 'may_need_future',
  },
  
  // Under Vehicle
  underVehicle: {
    shockAbsorbers: 'okay',
    steeringLinkage: 'okay',
    mufflerExhaust: 'okay',
    engineOilLeaks: 'okay',
    brakeLines: 'okay',
    driveShaft: 'okay',
    transmission: 'okay',
    fuelLines: 'okay',
  },
  
  // Under Hood
  underHood: {
    fluidLevels: 'okay',
    engineAirFilter: 'may_need_future',
    driveBelts: 'okay',
    coolingSystem: 'okay',
    radiator: 'okay',
    battery: 'okay',
    coolantReservoir: 'okay',
  },
  
  // Brakes & Tires
  brakesTires: {
    brakePads: 'may_need_future',
    rotorsDrums: 'okay',
    leftFrontTire: { tread: '6/32', pressure: '35' },
    rightFrontTire: { tread: '5/32', pressure: '35' },
    leftRearTire: { tread: '6/32', pressure: '33' },
    rightRearTire: { tread: '4/32', pressure: '33' },
    alignmentNeeded: false,
    wheelBalanceNeeded: false,
  },
  
  // Damage Areas
  damageAreas: {
    frontBumper: true,
    rearBumper: true,
    hoodRoof: false,
    leftSide: true,
    rightSide: true,
    windshield: false,
    rearWindow: false,
  },
  
  // Notes
  conditionNotes: 'Vehicle is in overall good condition with minor cosmetic issues. The front bumper has significant damage that will require professional repair. The left fender shows evidence of prior paint work. Interior is clean and well-maintained with normal wear for mileage.',
  mechanicComments: 'Recommend replacing front brake pads within the next 5,000 miles. Engine air filter should be replaced soon. All fluids are at proper levels and appear clean. No major mechanical concerns detected.',
  estimatedRepairCost: '$2,850.00',
  
  // Photos (placeholder URLs)
  photos: [],
  
  // Mileage
  mileage: '99,208',
  
  // Metadata
  createdAt: new Date(),
  updatedAt: new Date(),
});
