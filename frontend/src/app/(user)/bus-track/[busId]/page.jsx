'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, InfoIcon } from "lucide-react";
import StopTimeline from './_components/StopTimeline';
import BusTrackingSkeleton from './_components/BusTrackingLoadingSkeleton';
import useTrips from '@/hooks/useTrips';
import { getBusDataById } from '@/utils/api';
import dynamic from 'next/dynamic';

// Dynamically import RouteMap with no SSR
const RouteMap = dynamic(() => import("./_components/RouteMap"), { ssr: false });

export default function BusTrackingPage() {
  const router = useRouter();
  const { busId } = useParams();

  const [stop, setStop] = useState(null);
  const [busData, setBusData] = useState({});
  const [storedTrip, setStoredTrip] = useState(null);

  // Load currentTrip from localStorage
  useEffect(() => {
    const trip = localStorage.getItem("currentTrip");
    if (trip) setStoredTrip(JSON.parse(trip));
  }, []);

  // Fetch stops when storedTrip is ready
  const { data, loading } = useTrips(storedTrip || []);
  useEffect(() => {
    if (!loading && data && data.length > 0) {
      setStop(data);
    }
  }, [data, loading]);

  // Fetch bus info
  useEffect(() => {
    if (!busId) return;
    const fetchBusData = async () => {
      try {
        const res = await getBusDataById(busId);
        setBusData(res.data);
      } catch (err) {
        console.error("Bus fetch failed:", err);
      }
    }
    fetchBusData();
  }, [busId]);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm text-gray-500"></p>
        </div>
        <button className="text-blue-600 flex items-center space-x-1">
          <InfoIcon />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Map Section */}
      <div className="w-full h-[400px]">
        {stop ? (
          <RouteMap stops={stop} busNumber={busData.busNumber} />
        ) : (
          <BusTrackingSkeleton />
        )}
      </div>

      {/* Details Section */}
      <div className="flex-1 bg-white rounded-t-2xl shadow-lg p-4 -mt-4 relative z-10 overflow-y-auto">
        <p className="text-sm text-gray-500 mb-4">
          Bus No:{" "}
          <span className="font-semibold text-gray-800">
            {busData.busNumber || "Loading..."}
          </span>
        </p>

        {data && data.length > 0 ? (
          <StopTimeline trips={data} />
        ) : (
          <p className="text-gray-500">Loading stops...</p>
        )}
      </div>
    </div>
  );
}
