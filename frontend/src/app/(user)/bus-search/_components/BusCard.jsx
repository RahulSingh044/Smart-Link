import React from 'react';
import { useRouter } from 'next/navigation';
import { calculateDuration } from "@/app/utils/calculateDuration"

export default function BusCard({ bus, routeName, fare }) {
  const router = useRouter();

  const handleTrackClick = () => {
    console.log("Click track", bus.busId.busNumber)
    router.push(`/bus-track/${encodeURIComponent(bus._id)}`)
  };

  const start = bus.startStation?.scheduledTime;
  const end = bus.endStation?.scheduledTime;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Bus {bus.busId?.busNumber}</h3>
          <p className="text-sm text-gray-500">Route ID: {routeName}</p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          {bus.busId?.currentStatus}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="font-medium text-lg">{ start || "--:--"}</p>
          <p className="text-sm text-gray-500">{bus.startStation?.location?.address?.city}</p>
        </div>
        <div className="flex-1 mx-4 text-center">
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <div className="flex-1 h-px bg-gray-400 border-dashed border-t"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{calculateDuration(start, end )}</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-lg">{end || "--:--"}</p>
          <p className="text-sm text-gray-500">{bus.endStation?.location?.address?.city}</p>
        </div>
      </div>

      <div className="flex items-centre justify-between mt-4 border-t pt-4">
        <span className="font-bold text-xl">₹ {fare || 0}</span>
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
