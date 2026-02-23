import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RouteMapProps {
  pickup: {
    coordinates: [number, number];
    city: string;
    state: string;
  };
  delivery: {
    coordinates: [number, number];
    city: string;
    state: string;
  };
  className?: string;
}

function FitBounds({ pickup, delivery }: { pickup: [number, number]; delivery: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([pickup, delivery]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pickup, delivery]);

  return null;
}

export const RouteMap = ({ pickup, delivery, className }: RouteMapProps) => {
  const center: [number, number] = [
    (pickup.coordinates[0] + delivery.coordinates[0]) / 2,
    (pickup.coordinates[1] + delivery.coordinates[1]) / 2,
  ];

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full rounded-xl"
        style={{ minHeight: "200px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pickup={pickup.coordinates} delivery={delivery.coordinates} />
        
        {/* Pickup Marker */}
        <Marker position={pickup.coordinates} icon={pickupIcon}>
          <Popup>
            <strong>Pickup</strong><br />
            {pickup.city}, {pickup.state}
          </Popup>
        </Marker>

        {/* Delivery Marker */}
        <Marker position={delivery.coordinates} icon={deliveryIcon}>
          <Popup>
            <strong>Delivery</strong><br />
            {delivery.city}, {delivery.state}
          </Popup>
        </Marker>

        {/* Route Line */}
        <Polyline
          positions={[pickup.coordinates, delivery.coordinates]}
          pathOptions={{ color: "#f97316", weight: 3, dashArray: "10, 10" }}
        />
      </MapContainer>
    </div>
  );
};
