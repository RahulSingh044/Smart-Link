"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getRoute } from "@/app/utils/getDistanceFromLocation";

function FlyToDestination({ end }) {
  const map = useMap();

  useEffect(() => {
    if (end) {
      map.flyTo([end.lat, end.lon], 15, { duration: 1.5 }); // zoom into destination
    }
  }, [end, map]);

  return null;
}

export default function DirectionsMap({ lon, lat }) {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [route, setRoute] = useState(null);

  // Default icon
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  L.Marker.prototype.options.icon = DefaultIcon;

useEffect(() => {
  async function fetchRoute() {
    try {
      const userStart = { lon: 75.829387, lat: 30.236568 };
      const userEnd = lon && lat ? { lon, lat } : null;

      if (!userEnd) return;

      setStart(userStart);
      setEnd(userEnd);

      const coords = await getRoute(userStart, userEnd);
      setRoute(coords);
    } catch (err) {
      console.error("Error fetching route:", err);
    }
  }

  fetchRoute();
}, [lon, lat]);

  return (
    <div className="mt-4">
      <MapContainer
        center={[30.7333, 76.7794]}// Default Punjab
        zoom={13}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <FlyToDestination end={end} />

        {start && (
          <Marker position={[start.lat, start.lon]}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {end && (
          <Marker position={[end.lat, end.lon]}>
            <Popup>{end}</Popup>
          </Marker>
        )}

        {route && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </div>
  );
}
