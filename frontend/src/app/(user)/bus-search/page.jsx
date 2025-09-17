"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUpDown, SlidersHorizontal } from "lucide-react"
import BusCard from './_components/BusCard';
import BusSearchSkeleton from './_components/BusSearchLoadingPageSkeleton';
import { getRoute } from '@/hooks/useRoute';

export default function BusSearchPage() {
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState([]);
  const [routeName, setRouteName] = useState();
  const [fare, setFare] = useState();

  const { route, loading, error } = getRoute('R003');

  useEffect(() => {
    if (route?.trips) {
      console.log("trips", route.trips)
      setFare(route?.fare?.maxFare)
      setRouteName(route?.name)
      setTrip(route.trips);
    }
  }, [route]);

  if (loading) {
    return <BusSearchSkeleton />
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mt-6 mb-4 text-sm text-gray-600">
          <span>Found {trip.length} buses</span>
          <div className="flex space-x-4">
            <button className="flex items-center space-x-1">
              <ArrowUpDown size={18} />
              <span>Sort</span>
            </button>
            <button className="flex items-center space-x-1">
              <SlidersHorizontal size={18} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {trip.map((bus) => (
            <BusCard key={bus.busId.busNumber} bus={bus} routeName={routeName} fare={fare} />
          ))}
        </div>
      </div>
    </div>
  );
}
