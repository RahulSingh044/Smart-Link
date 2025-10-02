const { client } = require('./redisClient');
const { MinPriorityQueue } = require('@datastructures-js/priority-queue');
// const fs = require('fs');

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
  
  while (current && current.parent) {
    const parent = current.parent;
    if (segments.length && segments[0].tripId === current.tripId) {
      // extend previous segment
      segments[0].fromstopId = parent.stopId;
      segments[0].fromStopName = current.prevStopName;
      segments[0].departureTime = current.prevArrivalTime;
      segments[0].fare += current.fare;
    } else {
      segments.unshift({
        tripId: current.tripId,
        routeName: current.routeName,
        busNumber: current.busNumber,
        fromstopId: parent.stopId,
        fromStopName: current.prevStopName,
        departureTime: current.prevArrivalTime,
        tostopId: current.stopId,
        toStopName: current.stopName,
        arrivalTime: current.arrivalTime,
        fare: current.fare,
      });
    }

    current = parent;
  }
  return segments;
}

// function formatNode(node, level = 0) {
//   const indent = '  '.repeat(level);
//   let output = `${indent}Stop: ${node.stopId} (${node.stopName || 'Unknown'})`;
  
//   if (node.tripId) {
//     output += `\n${indent}Trip: ${node.tripId}`;
//     output += `\n${indent}Route: ${node.routeName || 'N/A'}`;
//     output += `\n${indent}Bus: ${node.busNumber || 'N/A'}`;
//     output += `\n${indent}Arrival Time: ${node.arrivalTime ? new Date(node.arrivalTime).toLocaleTimeString() : 'N/A'}`;
//     output += `\n${indent}Previous Stop: ${node.prevStopName || 'Unknown'}`;
//     output += `\n${indent}Previous Time: ${node.prevArrivalTime ? new Date(node.prevArrivalTime).toLocaleTimeString() : 'N/A'}`;
//     output += `\n${indent}Fare: ${node.fare || 'N/A'}`;
//   }
  
//   output += `\n${indent}Changes: ${node.changes}`;
  
//   return output;
// }

// async function writeDebugLog(message, debugStream) {
//   const timestamp = new Date().toLocaleTimeString();
//   await debugStream.write(`[${timestamp}] ${message}\n`);
// }

// function formatPath(path) {
//   let output = [];
//   let totalFare = 0;
//   let totalDuration = 0;
//   let lastDepartureTime = null;

//   path.forEach((segment, i) => {
//     totalFare += segment.fare;
//     if (i === path.length - 1) {
//       totalDuration = segment.arrivalTime - path[0].departureTime;
//     }

//     const waitTime = lastDepartureTime && segment.departureTime - lastDepartureTime;
//     lastDepartureTime = segment.arrivalTime;

//     output.push(`\nSegment ${i + 1}:
//   Route: ${segment.routeName} (Trip: ${segment.tripId || 'Walking'})
//   Bus Number: ${segment.busNumber || 'N/A'}
//   From: ${segment.fromStopName} (${segment.fromstopId})
//   To: ${segment.toStopName} (${segment.tostopId})
//   Departure: ${new Date(segment.departureTime).toLocaleTimeString()}
//   Arrival: ${new Date(segment.arrivalTime).toLocaleTimeString()}
//   Duration: ${Math.floor((segment.arrivalTime - segment.departureTime) / 1000 / 60)} minutes
//   ${waitTime ? `Wait Time: ${Math.floor(waitTime / 1000 / 60)} minutes\n  ` : ''}Segment Fare: ${segment.fare}
//   Cumulative Fare: ${totalFare}`);
//   });

//   let summary = '\n==================== PATH SUMMARY ====================';
//   summary += `\nTotal Duration: ${Math.floor(totalDuration / 1000 / 60)} minutes`;
//   summary += `\nTotal Fare: ${totalFare}`;
//   summary += `\nTotal Segments: ${path.length}`;
//   summary += '\n====================================================';

//   output.push(summary);
//   return output.join('\n');
// }

module.exports = async function findAllTrips(startStopId, destStopId, startTimeMs) {
  // // Create debug log file with timestamp
  // const debugLogPath = `route_search_${Date.now()}.log`;
  // const debugStream = fs.createWriteStream(debugLogPath, { flags: 'a' });

  // await writeDebugLog('🚀 ROUTE SEARCH STARTED', debugStream);
  // await writeDebugLog(`From: ${startStopId}`, debugStream);
  // await writeDebugLog(`To: ${destStopId}`, debugStream);
  // await writeDebugLog(`Start Time: ${new Date(startTimeMs).toLocaleString()}\n`, debugStream);

  const pq = new MinPriorityQueue((x) => x.arrivalTime);

  const startNode = {
    stopId: startStopId,
    tripId: null,
    routeName: null,
    busNumber: null,
    arrivalTime: startTimeMs,
    prevStopName: null,
    prevArrivalTime: startTimeMs,
    prevFare: null,
    parent: null,
    changes: 0,
  };

  pq.enqueue(startNode);
  // await writeDebugLog('Initial State:', debugStream);
  // await writeDebugLog(formatNode(startNode), debugStream);

  const bestArrival = new Map();
  const results = [];
  let bestDuration = Infinity;
  let exploredCount = 0;
  let pathsFound = 0;

  while (!pq.isEmpty()) {
    const node = pq.dequeue();
    const { stopId, arrivalTime, changes } = node;
    exploredCount++;

    // await writeDebugLog(`\n[Node #${exploredCount}] --------------------------------`, debugStream);
    // await writeDebugLog('Exploring:\n' + formatNode(node), debugStream);
    
    if (changes > 2) {
      // await writeDebugLog('⏭️ Skip: Too many changes', debugStream);
      continue;
    }// discard paths with > 2 transfers
    // destination reached → reconstruct and collect

    if (stopId === destStopId) {
      // await writeDebugLog('\n🎯 DESTINATION REACHED!', debugStream);
      const path = await reconstructPath(node);
      if (path.length) {
        pathsFound++;
        // await writeDebugLog(`\n[Path #${pathsFound}] --------------------------------`, debugStream);
        // await writeDebugLog(formatPath(path), debugStream);

        const duration = path[path.length - 1].arrivalTime - path[0].departureTime;
        bestDuration = Math.min(bestDuration, duration);
        results.push({ path, duration, changes });
      }
      continue; // don’t stop, collect all possible trips
    }

    if (bestArrival.has(stopId) && bestArrival.get(stopId) <= arrivalTime) {
      // await writeDebugLog('⏭️ Skip: Better arrival time exists', debugStream);
      continue;
    }
    bestArrival.set(stopId, arrivalTime);

    const trips = await getTripsForStop(stopId, arrivalTime);
    // await writeDebugLog(`\nFound ${trips.length} possible trips from this stop`, debugStream);

    for (const trip of trips) {
      const { tripId, nextStopId, routeName, fare, busNumber, thisStopTime, nextStopTime, thisStopName, nextStopName } = trip;
      if (nextStopId == null) {
        // await writeDebugLog(`Skip: Last stop of trip ${tripId}`, debugStream);
        continue;
      }

      const child = {
        stopId: nextStopId,
        tripId: tripId, // Trip which we are using to get to nextStopId.
        routeName: routeName,
        busNumber: busNumber,
        stopName: nextStopName,
        arrivalTime: nextStopTime,
        fare: fare,
        // Things which are about the node not child.
        prevArrivalTime: thisStopTime,
        prevStopName: thisStopName,
        parent: node, // keep track of parent node
        changes: node.tripId && node.tripId !== tripId ? node.changes + 1 : node.changes
      }
      
      // await writeDebugLog('\n👉 Creating Child Node:', debugStream);
      // if (node.tripId && node.tripId !== tripId) {
      //   await writeDebugLog('🔄 ROUTE CHANGE:', debugStream);
      //   await writeDebugLog(`  From Trip: ${node.tripId}`, debugStream);
      //   await writeDebugLog(`  To Trip: ${tripId}`, debugStream);
      //   await writeDebugLog(`  Changes so far: ${child.changes}`, debugStream);
      // }

      // await writeDebugLog('Adding to queue:', debugStream);
      // await writeDebugLog(formatNode(child, 1), debugStream);

      pq.enqueue(child);
    }
  }
  // filter out trips with much higher durations
  // const filtered = results.filter(r => r.duration <= bestDuration + 3600000);
  // return only arrays of segments
  return results.map(r => r.path);
};