const { client } = require('./redisClient');

async function loadGraph(trip, route, k) {
  const tripId = String(trip._id);

  // stringify all details for direct storage
  for (let i = 0; i < trip.journey.length; i++) {
    const stopId = trip.journey[i].pointId;
    const key = `trips:${tripId}:${stopId}:eta`;
    const payload = JSON.stringify({
      tripId: String(trip._doc._id),
      busNumber: route.buses[k].busId.busNumber,
      fare: i < trip.journey.length-1 ? route.fares[k][i+1] - route.fares[k][i] : 0, // fare between this stop and next stop
      routeName: route.name,
      thisStopName: trip.journey[i].name,
      nextStopName: i < trip.journey.length-1 ? trip.journey[i+1].name : null,
      nextStopId: i < trip.journey.length-1 ? String(trip.journey[i+1].pointId) : null,
      thisStopTime: trip.journey[i].expectedTime.getTime(),
      nextStopTime: i < trip.journey.length-1 ? trip.journey[i+1].expectedTime.getTime() : null,
    });


    // Insert or update only if the new sequence is greater
    const etaMs = trip.journey[i].expectedTime.getTime(); // absolute UTC ms
    await client.zAdd(key, { score: etaMs, value: payload });
  }

  return;
}

module.exports = { loadGraph };