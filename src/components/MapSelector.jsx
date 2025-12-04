import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: marker,
  iconRetinaUrl: marker2x,
  shadowUrl: shadow,
});

// -------------------------------
// CLICK HANDLING COMPONENT
// -------------------------------
function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

export default function MapSelector({ position, onChange }) {
  if (!position) return null;

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={15}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      <ClickHandler onChange={onChange} />

      <Marker position={[position.lat, position.lng]} />
    </MapContainer>
  );
}
