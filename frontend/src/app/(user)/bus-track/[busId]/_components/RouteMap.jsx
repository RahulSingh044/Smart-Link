"use client";
import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBusDataById } from "@/utils/api";

// Smooth FlyTo for bus
const FlyToBus = ({ busCoords }) => {
  const map = useMap();
  const lastMove = useRef(0);

  useEffect(() => {
    if (busCoords) {
      const now = Date.now();
      if (now - lastMove.current > 5000) {
        map.flyTo([busCoords.lat, busCoords.lng], 16, { duration: 1.2 });
        lastMove.current = now;
      }
    }
  }, [busCoords, map]);

  return null;
};

// Initial fit bounds
const FitBounds = ({ stops }) => {
  const map = useMap();
  useEffect(() => {
    if (stops?.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stops, map]);
  return null;
};

const RouteMap = ({ stops, busNumber }) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [busCoords, setBusCoords] = useState(null);
  const [eta, setEta] = useState(null);

  const busMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const prevCoords = useRef(null);
  const nextCoords = useRef(null);
  const animStart = useRef(null);
  const animDuration = 3000; // 3s per update

  if (!stops || stops.length < 2) {
    return <p className="text-center text-gray-600">Need at least 2 stops</p>;
  }

  // Default icon
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  // Bus icon
  const busIcon = L.icon({
    iconUrl: "/bus-lane.png",
    iconSize: [40, 40],
  });

  // Fetch OSRM route with waypoints (all stops)
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const coordsStr = stops.map((s) => `${s.lng},${s.lat}`).join(";");
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data?.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          setRouteCoords(coords);
        }
      } catch (err) {
        console.error("Error fetching OSRM route:", err);
      }
    };
    fetchRoute();
  }, [stops]);

  // Fetch bus coords + ETA
  useEffect(() => {
    if (!busNumber) return;
    let interval;
    const fetchBus = async () => {
      try {
        const res = await getBusDataById(busNumber);
        console.log("Track Bus", res.data.eta.scheduled_arrival_time)
        setEta(res.data.eta?.scheduled_arrival_time || null);
        // console.log("ETA", res.data?.eta?.estimated_arrival_time );
        const data = res.data.location;
        if (data?.latitude && data?.longitude) {
          prevCoords.current = nextCoords.current || { lat: data.latitude, lng: data.longitude };
          nextCoords.current = { lat: data.latitude, lng: data.longitude };
          animStart.current = performance.now();
          animate();
        }
      } catch (err) {
        console.error("Bus fetch failed:", err);
      }
    };

    fetchBus();
    interval = setInterval(fetchBus, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [busNumber]);

  // Animate smoothly
  const animate = () => {
    if (!prevCoords.current || !nextCoords.current) return;

    const now = performance.now();
    const elapsed = now - animStart.current;
    const t = Math.min(elapsed / animDuration, 1);

    const lat =
      prevCoords.current.lat +
      (nextCoords.current.lat - prevCoords.current.lat) * t;
    const lng =
      prevCoords.current.lng +
      (nextCoords.current.lng - prevCoords.current.lng) * t;

    setBusCoords({ lat, lng });

    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([lat, lng]);
    }

    if (t < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Map takes full height minus ETA panel */}
      <div className="flex-1 h-full">
        <MapContainer
          center={[stops[0].lat, stops[0].lng]}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <FitBounds stops={stops} />
          <FlyToBus busCoords={busCoords} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            detectRetina={true}
            maxZoom={17}
          />

          {/* Stop markers */}
          {stops.map((stop, idx) => (
            <Marker key={idx} position={[stop.lat, stop.lng]} />
          ))}

          {/* Polyline route */}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="blue" weight={4} />
          )}

          {/* Bus marker */}
          {busCoords && (
            <Marker
              position={[busCoords.lat, busCoords.lng]}
              icon={busIcon}
              ref={busMarkerRef}
            />
          )}


        </MapContainer>

        {/* ETA Panel - fixed height */}
        <div className="h-16 bg-white shadow-lg rounded-t-2xl p-4 flex justify-between items-center">
          <p className="text-gray-700 font-semibold">
            Bus {busNumber} ETA:{" "}
            <span className="text-blue-600">
              {eta !== null ? `${eta}` : "Calculating..."}
            </span>
          </p>
        </div>

      </div>
    </div>
  )
};

export default RouteMap;
