import { useEffect, useState, useMemo } from "react";
import { getStops } from "@/utils/api";

const useTrips = (trips) => {
  const [data, setData] = useState([]); // continuous stops array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log("Trips Hook", trips);

  // Memoize trips so it doesn’t change reference every render
  const stableTrips = useMemo(() => trips || [], [JSON.stringify(trips)]);

  useEffect(() => {
    if (stableTrips.length === 0) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let continuousStops = [];

        for (let i = 0; i < stableTrips.length; i++) {
          const trip = stableTrips[i];
          const res = await getStops(trip.tripId, trip.fromstopId, trip.tostopId);
          const stops = res.data;

          if (i === 0) {
            // push all stops of first trip
            continuousStops.push(...stops);
          } else {
            // remove the first stop if it duplicates the last stop of previous trip
            const filteredStops = stops.filter(
              (stop, idx) =>
                !(idx === 0 && stop.stopId === continuousStops[continuousStops.length - 1]?.stopId)
            );
            continuousStops.push(...filteredStops);
          }
        }

        setData(continuousStops); // single continuous stops array
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stableTrips]);

  return { data, loading, error };
};

export default useTrips;
