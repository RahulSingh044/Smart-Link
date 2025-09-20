"use client";
import React from "react";
import { MapPin } from "lucide-react";

export default function StopTimeline({ trips }) {

  if (!trips || trips.length === 0) {
    return <p className="text-gray-500">No stops available</p>;
  }

  // Now trips is a flat array of stops
  const stops = trips;

  // Format stops for display
  const formattedStops = stops.map((stop, index) => ({
    id: stop._id || stop.stopId || index,
    name: stop.name,
    expectedTime: new Date(stop.expectedTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    coordinates: stop.coordinates,
    isFirst: index === 0,
    isLast: index === stops.length - 1,
  }));

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Stop Timeline</h2>
      <div className="relative pl-6">
        {formattedStops.map((stop) => (
          <div key={stop.id} className="relative flex items-start mb-6">
            {/* Timeline line */}
            {!stop.isLast && (
              <div className="absolute left-2 top-4 w-px h-full bg-gray-300"></div>
            )}

            {/* Stop Dot */}
            <div className="w-4 h-4 rounded-full bg-blue-600 z-10 absolute left-0 top-1.5"></div>

            {/* Stop Info */}
            <div className="ml-6">
              <p className="text-sm text-gray-500">{stop.expectedTime}</p>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-blue-600" />
                <p className="font-medium text-gray-800">{stop.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
