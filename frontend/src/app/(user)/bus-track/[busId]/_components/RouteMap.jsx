"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBusDataById } from "@/utils/api";

// Fly map to bus location smoothly
// const FlyToBus = ({ busCoords }) => {
//   const map = useMap();
//   const lastMove = useRef(0);

//   useEffect(() => {
//     if (!busCoords) return;
//     const now = Date.now();
//     if (now - lastMove.current > 5000) {
//       map.flyTo([busCoords.lat, busCoords.lng], 16, { duration: 1.2 });
//       lastMove.current = now;
//     }
//   }, [busCoords, map]);

//   return null;
// };

// Fit map to all stops
const FitBounds = ({ stops }) => {
  const map = useMap();
  useEffect(() => {
    if (!stops || stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
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
  const animDuration = 3000;

  if (!stops || stops.length === 0) {
    return <p className="text-center text-gray-600">Loading Stops</p>;
  }

  // Normalize stops: convert coordinates -> lat/lng
  const normalizedStops = useMemo(() => {
    return stops.map((s) => ({
      ...s,
      lat: s.coordinates[1],
      lng: s.coordinates[0],
    }));
  }, [stops])

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

  // Fetch OSRM route
  useEffect(() => {
    const fetchRoute = async () => {
      if (!normalizedStops || normalizedStops.length < 2) return;
      try {
        const coordsStr = normalizedStops
          .map((s) => `${s.lng},${s.lat}`) // lng,lat for OSRM
          .join(";");

        const res = await fetch(
          `http://10.117.25.38/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data?.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteCoords(coords);
        }
      } catch (err) {
        console.error("Error fetching OSRM route:", err);
      }
    };

    fetchRoute();
  }, [normalizedStops]);

  // Fetch bus location and ETA
  useEffect(() => {
    if (!busNumber) return;

    let interval;
    const fetchBus = async () => {
      try {
        const res = await getBusDataById(busNumber);
        setEta(res.data.eta?.scheduled_arrival_time || null);

        const loc = res.data.location;
        if (loc?.latitude && loc?.longitude) {
          prevCoords.current = nextCoords.current || { lat: loc.latitude, lng: loc.longitude };
          nextCoords.current = { lat: loc.latitude, lng: loc.longitude };
          animStart.current = performance.now();
          animate();
        }
      } catch (err) {
        console.error("Bus fetch failed:", err);
      }
    };

    fetchBus();
    interval = setInterval(fetchBus, 2000);
    return () => clearInterval(interval);
  }, [busNumber]);

  // Animate bus smoothly
  const animate = () => {
    if (!prevCoords.current || !nextCoords.current) return;

    const now = performance.now();
    const elapsed = now - animStart.current;
    const t = Math.min(elapsed / animDuration, 1);

    const lat = prevCoords.current.lat + (nextCoords.current.lat - prevCoords.current.lat) * t;
    const lng = prevCoords.current.lng + (nextCoords.current.lng - prevCoords.current.lng) * t;

    setBusCoords({ lat, lng });

    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([lat, lng]);
    }

    if (t < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  return (
  <>
    {normalizedStops && normalizedStops.length > 0 ? (
      <MapContainer
        center={[normalizedStops[0].lat, normalizedStops[0].lng]}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <FitBounds stops={normalizedStops} />
        {/* <FlyToBus busCoords={busCoords} /> */}

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          detectRetina={true}
          maxZoom={25}
        />

        {normalizedStops.map((stop, idx) => (
          <Marker key={idx} position={[stop.lat, stop.lng]} />
        ))}

        {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={4} />}

        {busCoords && (
          <Marker
            position={[busCoords.lat, busCoords.lng]}
            icon={busIcon}
            ref={busMarkerRef}
          />
        )}
      </MapContainer>
    ) : (
      <p className="text-center text-gray-600">Loading map...</p>
    )}
  </>
);
};

export default RouteMap;
