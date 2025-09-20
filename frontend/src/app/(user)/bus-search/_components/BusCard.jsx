'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
// import { calculateDuration } from "@/app/utils/calculateDuration"

export default function BusCard({ trip }) {
  const router = useRouter();

  const handleTrackClick = () => {
    console.log("Searched Trip", trip)
    localStorage.setItem("currentTrip", JSON.stringify(trip));
    console.log("Bus Num", trip.busNumber);
    router.push(`/bus-track/${trip[0].busNumber}`)
  };

  // fare
  const fare = trip[trip.length - 1]?.fare;

  // Time Management
  const options = {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  };

  // keep Date objects for math
  const startDate = new Date(trip[0]?.departureTime);
  const endDate = new Date(trip[trip.length - 1]?.arrivalTime);

  // format start/end for display
  const start = startDate.toLocaleTimeString("en-GB", options);
  const end = endDate.toLocaleTimeString("en-GB", options);

  // duration in ms
  let durationMs = endDate - startDate;

  // handle cases where arrival is past midnight
  if (durationMs < 0) {
    durationMs += 24 * 60 * 60 * 1000;
  }

  // convert duration to hh:mm
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = `${durationHours}h ${durationMinutes}m`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Bus: {trip[0]?.busNumber}</h3>
          <p className="text-sm text-gray-500">Route: {trip[0]?.routeName}</p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          {/* {bus.busId?.currentStatus} */}
          active
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="font-medium text-lg">{start || "--:--"}</p>
          <p className="text-sm text-gray-500">{trip[0]?.fromStopName || "--:--"}</p>
        </div>
        <div className="flex-1 mx-4 text-center">
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <div className="flex-1 h-px bg-gray-400 border-dashed border-t"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{duration}</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-lg">{end || "--:--"}</p>
          <p className="text-sm text-gray-500">{trip[trip.length - 1]?.toStopName || "--:--"}</p>
        </div>
      </div>

      <div className="flex items-centre justify-between mt-4 border-t pt-4">
        <span className="font-bold text-xl">₹ {fare}</span>
        <div className="flex space-x-2">
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg">
            Book
          </button>
          <button
            onClick={handleTrackClick}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg">
            Track
          </button>
        </div>
      </div>
    </div>
  );
}
