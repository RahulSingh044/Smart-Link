const { client } = require('./redisClient');
const { MinPriorityQueue } = require('@datastructures-js/priority-queue');

async function getTripsForStop(stopId, afterMs) {
  const keys = await client.keys(`trips:*:${stopId}:eta`);
  if (!keys.length) return [];

  const pipeline = client.multi();
  for (const key of keys) {
    // node-redis v4 syntax
    pipeline.zRangeByScore(key, afterMs, '+inf');
  }

  const results = await pipeline.exec();

  return results.flat().map(m => JSON.parse(m));
}

async function reconstructPath(node) {
  const segments = [];
  let current = node;
  const key = `trips:${node.tripId}:${node.stopId}:eta`;
  const endNode = await client.zRangeByScore(key, node.arrivalTime, '+inf');
  if (!endNode.length) return [];
  let endObj = JSON.parse(endNode[0]);
  let { time, stopName, fare } = endObj;
  while (current && current.parent) {
    const parent = current.parent;

    if (segments.length && segments[0].tripId === current.tripId) {
      // extend previous segment
      segments[0].fromstopId = parent.stopId;
      segments[0].fromStopName = stopName;
      segments[0].departureTime = time;
      segments[0].fare = fare;
    } else {
      segments.unshift({
        tripId: current.tripId,
        routeName: current.routeName,
        busNumber: current.busNumber,
        fromstopId: parent.stopId,
        fromStopName: current.stopName,
        departureTime: current.arrivalTime,
        tostopId: current.stopId,
        toStopName: stopName,
        fare: fare,
        arrivalTime: time
      });
    }
    segments[0].fromStopName = stopName;
    segments[0].departureTime = time;
    segments[0].fare = fare;

    time = current.arrivalTime;
    stopName = current.stopName;
    fare = current.fare;

    current = parent;
  }
  return segments;
}

module.exports = async function findAllTrips(startStopId, destStopId, startTimeMs) {

  const pq = new MinPriorityQueue((x) => x.arrivalTime);

  pq.enqueue({
    stopId: startStopId,
    stopName: null,
    arrivalTime: startTimeMs,
    fare: 0,
    tripId: null,
    routeName: null,
    busNumber: null,
    parent: null,
    changes: 0
  });


  const bestArrival = new Map();
  const results = [];
  let bestDuration = Infinity;

  while (!pq.isEmpty()) {
    const node = pq.dequeue();
    const { stopId, arrivalTime, changes } = node;

    // destination reached → reconstruct and collect
    if (stopId === destStopId) {
      const path = await reconstructPath(node);
      if (path.length) {
        const duration = path[path.length - 1].arrivalTime - path[0].departureTime;
        bestDuration = Math.min(bestDuration, duration);
        results.push({ path, duration, changes });
      }
      continue; // don’t stop, collect all possible trips
    }

    if (bestArrival.has(stopId) && bestArrival.get(stopId) <= arrivalTime) {
      continue;
    }
    bestArrival.set(stopId, arrivalTime);

    if (changes > 2) continue; // discard paths with > 2 transfers

    const trips = await getTripsForStop(stopId, arrivalTime);
    for (const trip of trips) {
      const { tripId, nearbyStops, routeName, fare, busNumber, time, stopName } = trip;
      for (const nb of nearbyStops) {
        const nextArrival = time;

        pq.enqueue({
          stopId: nb.pointId,
          stopName: stopName, // keep stop name if available
          fare: fare,
          arrivalTime: nextArrival,
          tripId, routeName, busNumber, time,
          parent: node,
          changes: node.tripId && node.tripId !== tripId ? node.changes + 1 : node.changes
        });
      }
    }
  }
  // filter out trips with much higher durations
  const filtered = results.filter(r => r.duration <= bestDuration + 3600000);
  // return only arrays of segments
  return filtered.map(r => r.path);
};