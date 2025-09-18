const { client } = require('./redisClient');
const { MinPriorityQueue } = require('@datastructures-js/priority-queue');

async function getTripsForStop(stopId, afterMs) {
  const keys = await client.keys(`trips:*:${stopId}:eta`);
  if (!keys.length) return [];

  const pipeline = client.multi();

  for (const key of keys) {
    pipeline.addCommand(['ZRANGE', key, String(afterMs), '+inf', 'BYSCORE', 'LIMIT', '0', '5']);
  }

  const results = await pipeline.exec();

  return results.flat().map(m => JSON.parse(m));
}

function reconstructPath(node) {
  const segments = [];
  let current = node;

  while (current && current.parent) {
    const parent = current.parent;

    if (segments.length && segments[0].tripId === current.tripId) {
      segments[0].fromStopId = parent.stopId;
    } else {
      segments.unshift({
        tripId: current.tripId,
        routeId: current.routeId,
        fromStopId: parent.stopId,
        toStopId: current.stopId,
        arrivalTime: current.arrivalTime
      });
    }

    current = parent;
  }

  return segments;
}

module.exports = async function findEarliestPath(startStopId, destStopId, startTimeMs) {
  const pq = new MinPriorityQueue(x => x.arrivalTime);
  pq.enqueue({
    stopId: startStopId,
    arrivalTime: startTimeMs,
    tripId: null,
    parent: null
  });

  const bestArrival = new Map();

  while (!pq.isEmpty()) {
    const node = pq.dequeue();
    const { stopId, arrivalTime } = node;
    if (stopId === destStopId) {
      return reconstructPath(node);
    }

    if (bestArrival.has(stopId) && bestArrival.get(stopId) <= arrivalTime) {
      continue;
    }

    bestArrival.set(stopId, arrivalTime);

    const trips = await getTripsForStop(stopId, arrivalTime);
    for (const trip of trips) {

      const { tripId, nearbyStops } = trip;
      for (const nb of nearbyStops) {
        const walkMinutes = parseInt(nb.walktime, 10);
        const nextArrival = arrivalTime + walkMinutes * 60 * 1000;

        pq.enqueue({
          stopId: nb.pointId,
          arrivalTime: nextArrival,
          tripId,
          parent: node
        });
      }
    }
  }

  return null; // no path found
};
