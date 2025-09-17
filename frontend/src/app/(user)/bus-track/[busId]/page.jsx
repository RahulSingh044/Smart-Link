'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, InfoIcon } from "lucide-react";
import RouteMap from "./_components/RouteMap";
import StopTimeline from './_components/StopTimeline';
import BusTrackingSkeleton from './_components/BusTrackingLoadingSkeleton';
import { getTripData } from '@/app/utils/getTripById';

export default function BusTrackingPage() {
  const { busId } = useParams()
  const router = useRouter();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeId, setRouteId] = useState(null);

  useEffect(() => {
    async function fetchTrip() {
      try {
        if (!busId) return;
        const tripRes = await getTripData(busId);
        setRouteId(tripRes.routeId?.code)
        console.log("Trip page", tripRes)
        setTrip(tripRes);
      } catch (err) {
        console.error('Failed to fetch trip data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrip();
  }, []);

  if (loading || !trip) {
    return <BusTrackingSkeleton />;
  }

  // ✅ Normalize bus details
  const bus = {
    route: trip?.routeName || 'Route',
    origin: trip?.startStation?.name || 'Origin',
    destination: trip?.endStation?.name || 'Destination',
    busNumber: trip?.busId?.busNumber || trip?.bus?.busNumber || 'N/A',
    estimatedArrival: trip?.estimatedArrival || 'N/A',
    minutesRemaining: trip?.minutesRemaining || 'N/A',
    status: trip?.status || 'Unknown',
    stops: trip?.stops || [],
  };

  // ✅ Convert trip stops into a normalized array for RouteMap
  const stops = [
    {
      name: bus.origin,
      lat: trip?.startStation?.coordinates?.[1],
      lng: trip?.startStation?.coordinates?.[0],
    },
    ...(bus.stops || []).map((stop) => ({
      name: stop?.name,
      lat: stop?.coordinates?.[1],
      lng: stop?.coordinates?.[0],
    })),
    {
      name: bus.destination,
      lat: trip?.endStation?.coordinates?.[1],
      lng: trip?.endStation?.coordinates?.[0],
    },
  ].filter((s) => s.lat && s.lng); // remove invalid entries

  console.log("BUSID PAJ", bus.busNumber);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft />
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-semibold text-lg">{bus.route}</h1>
          <p className="text-sm text-gray-500">
            {bus.origin} → {bus.destination}
          </p>
        </div>
        <button className="text-blue-600 flex items-center space-x-1">
          <InfoIcon />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Map Section */}
      <div className="w-full h-screen">
        <RouteMap
          stops={stops}
          busNumber={bus.busNumber}
        />
      </div>


      {/* Details Section */}
      {/* <div className="flex-1 bg-white rounded-t-2xl shadow-lg p-4 -mt-4 relative z-10 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">
              Estimated Arrival at {bus.destination}
            </p>
            <p className="text-3xl font-bold flex items-baseline">
              {bus.estimatedArrival}
              <span className="ml-2 text-base font-normal text-gray-600">
                ({bus.minutesRemaining})
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-4xl">🚌</span>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              {bus.status}
            </span>
          </div>
        </div> */}

        {/* <p className="text-sm text-gray-500 mb-4">
          Bus No:{" "}
          <span className="font-semibold text-gray-800">
            {bus.busNumber}
          </span>
        </p> */}

        {/* Stop Timeline */}
        {/* <StopTimeline stops={bus.stops} /> */}
      {/* </div> */}
    </div>
  );
}
