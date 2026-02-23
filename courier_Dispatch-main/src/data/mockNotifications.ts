export interface LoadNotification {
  id: string;
  shipper: {
    name: string;
    company: string;
    rating: number;
    totalLoads: number;
    phone: string;
  };
  pickup: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number]; // [lat, lng]
    date: string;
    time: string;
  };
  delivery: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
    date: string;
    time: string;
  };
  vehicle: {
    year: number;
    make: string;
    model: string;
    type: string;
  };
  price: number;
  distance: number; // in miles
  createdAt: string;
  expiresIn: number; // seconds
}

export interface SimilarRoute {
  id: string;
  shippersCount: number;
  pickup: {
    city: string;
    state: string;
    coordinates: [number, number];
  };
  delivery: {
    city: string;
    state: string;
    coordinates: [number, number];
  };
  priceRange: {
    min: number;
    max: number;
  };
  distance: number;
  loads: LoadNotification[];
}

export const mockNotifications: LoadNotification[] = [
  {
    id: "notif-001",
    shipper: {
      name: "John Smith",
      company: "AutoMax Dealers",
      rating: 4.8,
      totalLoads: 156,
      phone: "+1 (555) 123-4567",
    },
    pickup: {
      address: "1234 Market Street",
      city: "Los Angeles",
      state: "CA",
      coordinates: [34.0522, -118.2437],
      date: "2024-01-25",
      time: "09:00",
    },
    delivery: {
      address: "5678 Broadway Ave",
      city: "Phoenix",
      state: "AZ",
      coordinates: [33.4484, -112.074],
      date: "2024-01-26",
      time: "14:00",
    },
    vehicle: {
      year: 2023,
      make: "Toyota",
      model: "Camry",
      type: "Sedan",
    },
    price: 650,
    distance: 370,
    createdAt: new Date().toISOString(),
    expiresIn: 1800,
  },
  {
    id: "notif-002",
    shipper: {
      name: "Sarah Johnson",
      company: "Premier Auto Sales",
      rating: 4.5,
      totalLoads: 89,
      phone: "+1 (555) 234-5678",
    },
    pickup: {
      address: "789 Sunset Blvd",
      city: "Los Angeles",
      state: "CA",
      coordinates: [34.0928, -118.3287],
      date: "2024-01-25",
      time: "11:00",
    },
    delivery: {
      address: "321 Central Ave",
      city: "Phoenix",
      state: "AZ",
      coordinates: [33.4631, -112.0733],
      date: "2024-01-26",
      time: "16:00",
    },
    vehicle: {
      year: 2022,
      make: "Honda",
      model: "Accord",
      type: "Sedan",
    },
    price: 580,
    distance: 375,
    createdAt: new Date().toISOString(),
    expiresIn: 2400,
  },
  {
    id: "notif-003",
    shipper: {
      name: "Mike Davis",
      company: "Classic Cars LLC",
      rating: 4.9,
      totalLoads: 234,
      phone: "+1 (555) 345-6789",
    },
    pickup: {
      address: "456 Hollywood Blvd",
      city: "Los Angeles",
      state: "CA",
      coordinates: [34.1016, -118.3267],
      date: "2024-01-25",
      time: "08:00",
    },
    delivery: {
      address: "987 Desert Road",
      city: "Tucson",
      state: "AZ",
      coordinates: [32.2226, -110.9747],
      date: "2024-01-27",
      time: "10:00",
    },
    vehicle: {
      year: 2024,
      make: "Ford",
      model: "Mustang",
      type: "Coupe",
    },
    price: 720,
    distance: 485,
    createdAt: new Date().toISOString(),
    expiresIn: 3600,
  },
];

export const mockSimilarRoutes: SimilarRoute[] = [
  {
    id: "route-001",
    shippersCount: 3,
    pickup: {
      city: "Los Angeles",
      state: "CA",
      coordinates: [34.0522, -118.2437],
    },
    delivery: {
      city: "Phoenix",
      state: "AZ",
      coordinates: [33.4484, -112.074],
    },
    priceRange: {
      min: 550,
      max: 720,
    },
    distance: 370,
    loads: mockNotifications.filter((n) => 
      n.delivery.city === "Phoenix"
    ),
  },
  {
    id: "route-002",
    shippersCount: 1,
    pickup: {
      city: "Los Angeles",
      state: "CA",
      coordinates: [34.0522, -118.2437],
    },
    delivery: {
      city: "Tucson",
      state: "AZ",
      coordinates: [32.2226, -110.9747],
    },
    priceRange: {
      min: 700,
      max: 750,
    },
    distance: 485,
    loads: mockNotifications.filter((n) => 
      n.delivery.city === "Tucson"
    ),
  },
];
