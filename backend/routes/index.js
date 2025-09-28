const express = require('express');
const router = express.Router();
const { findNearerPoints } = require('../modules/nearerPoints');
const { loadGraph } = require('../modules/loadGraph.js');
const findAllTrips = require('../modules/searchRoute.js');
const cron = require("node-cron");

const Route = require("../models/route");
const Trip = require("../models/trip");

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/nearby', async (req, res) => {
  const { lat, lon, limit, skip = 0 } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
  }
  try {
    const points = await findNearerPoints(parseFloat(lat), parseFloat(lon), parseInt(limit) || 5, parseInt(skip) || 0);
    res.status(200).json({ success: true, data: points });
  } catch (error) {
    console.error('Error fetching nearby points:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/load-graph', async (req, res) => {
  try {
    const graph = await loadGraph();
    res.status(200).json({ success: true, data: graph });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
})

router.get('/search-route', async (req, res) => {
  const { origin, destination, time = null } = req.query;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: 'Origin and Destination are required' });
  }
  try {
    const t = time ? new Date(time) : new Date(new Date().toUTCString());
    const route = await findAllTrips(origin, destination, t.getTime());
    res.status(200).json({ success: true, data: route });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
})

// Utility to parse HH:MM string to Date object on a given day
function getDateTimeForToday(timeStr) {
 const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setUTCHours(hours - 5, minutes - 30, 0, 0); // crude shift to UTC if server is IST
  return now;
}

function getTimeDifferenceInMinutes(time1, time2) {
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);

  let diffInMinutes = (h2 - h1) * 60 + (m2 - m1);

  // if negative, assume time2 is on the next day
  if (diffInMinutes < 0) {
    diffInMinutes += 24 * 60;
  }

  return diffInMinutes;
}

// Generate trips for all active routes for today
async function generateTripsForToday() {
  const routes = await Route.find({ status: "active" }).populate("journey.pointId", "name code nearbyStops location").populate("buses.busId");

  for (const route of routes) {
    if (!route.schedule) continue;

    for (let i = 0; i < route.schedule.length; i++) {
      const tripTimes = route.schedule[i];
      const startTime = getDateTimeForToday(tripTimes[0]);

      // Build journey with expectedTime spread across stops
      const journey = route.journey.map((point, idx) => {
        const offsetMinutes = getTimeDifferenceInMinutes(tripTimes[0], tripTimes[idx]);
        return {
          name: point.pointId.name,
          pointId: point.pointId._id,
          coordinates: point.pointId.location.coordinates, // TODO: replace with actual stop coordinates if available
          expectedTime: new Date(startTime.getTime() + offsetMinutes * 60000),
        };
      });


      const trip = new Trip({
        busId: route.buses[i].busId,
        routeId: route._id,
        journey,
      });

      await loadGraph(trip, route, i);

      await trip.save();
    }
  }
}

// Schedule cron job to run daily at 00:00
cron.schedule("03 11 * * *", async () => {
  try {
    await generateTripsForToday();
  } catch (err) {
    console.error("❌ Error generating trips:", err);
  }
});

module.exports = router;
