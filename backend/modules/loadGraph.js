const { client } = require('./redisClient');

async function loadGraph(trip, route, k) {
  const tripId = String(trip._id);

  // stringify all details for direct storage
  for (let i = 0; i < trip.journey.length; i++) {
    const stop = trip.journey[i];
    const stopData = route.journey[i];
    const stopId = String(stopData.pointId._id);
    const key = `trips:${tripId}:${stopId}:eta`;
    const payload = JSON.stringify({
      tripId: String(trip._doc._id),
      last: i < trip.journey.length-1 ? false : true,
      busNumber: route.buses[k].busId.busNumber,
      fare: route.fares[k][i],
      routeName: route.name,
      stopName: stopData.pointId.name,
      nearbyStops: stopData.pointId.nearbyStops,
      time: stop.expectedTime.getTime(),
    });


    // Insert or update only if the new sequence is greater
    const etaMs = stop.expectedTime.getTime(); // absolute UTC ms
    await client.zAdd(key, { score: etaMs, value: payload });
  }

  return;
}

module.exports = { loadGraph };