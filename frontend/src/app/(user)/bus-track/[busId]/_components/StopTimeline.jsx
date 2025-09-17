"use client";
import React, { useEffect, useState } from "react";
import { getPlaceName } from "@/app/utils/getPlaceByGeo";

const StopTimeline = ({ stops }) => {
  const [placeNames, setPlaceNames] = useState([]);

  useEffect(() => {
    async function fetchPlaces() {
      const names = await Promise.all(
        stops.map(async (stop) => {
          if (stop?.coordinates?.length === 2) {
            return await getPlaceName(stop.coordinates[1], stop.coordinates[0]);
          }
          return "Unknown Location";
        })
      );
      setPlaceNames(names);
    }

    if (stops?.length > 0) {
      fetchPlaces();
    }
  }, [stops]);

  return (
    <div className="relative pl-6 overflow-y-scroll">
      {stops.map((stop, index) => (
        <div key={index} className="mb-4 flex items-start">
          {/* Stop details */}
          <div className="ml-4">
            <h3 className="font-semibold">
              {placeNames[index] || "Loading..."}
            </h3>
            <p className="text-sm text-gray-500">{stop.scheduledTime}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StopTimeline;
