const { client } = require('./redisClient');

async function loadGraph(trip, route) {
  const routeId = String(route._id);

  // stringify all details for direct storage
  for (let i = 0; i < trip.journey.length; i++) {
    const stop = trip.journey[i];
    const stopData = route.journey[i];
    const stopId = String(stopData.pointId._id);
    const key = `trips:${routeId}:${stopId}:eta`;

    const payload = JSON.stringify({
      tripId: String(trip._doc._id),
      nearbyStops: stopData.pointId.nearbyStops,
      time: stop.expectedTime.toISOString(),
    });


    // Insert or update only if the new sequence is greater
    const etaMs = stop.expectedTime.getTime(); // absolute UTC ms
    await client.zAdd(key, { score: etaMs, value: payload });
  }

  return;
}

module.exports = { loadGraph };