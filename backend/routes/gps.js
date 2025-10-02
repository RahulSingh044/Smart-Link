const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const Bus = require('../models/bus');
const Trip = require('../models/trip');

// Configuration for the external server
const EXTERNAL_SERVER_URL = process.env.EXTERNAL_SERVER_URL || 'http://10.117.25.67:5000/eta';

// Function to calculate distance between two points
function calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Function to check if point is near a station/stop
function isNearPoint(currentLocation, pointCoordinates, threshold = 100) {
    return calculateDistance(
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: pointCoordinates[1], longitude: pointCoordinates[0] }
    ) <= threshold;
}

/**
 * Corrected helper:
 * Returns Date for timeStr on baseDate, rolling over to next day
 * if time is earlier than trip start time.
 */
function getDateTimeFromScheduled(timeStr, baseDate) {
    if (!timeStr || !baseDate) return null;

    const [hours, minutes] = timeStr.split(':').map(Number);

    // Always build in UTC, not local time
    let dt = new Date(Date.UTC(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        hours,
        minutes,
        0,
        0
    ));
    return dt;
}

/**
 * @route POST /api/gps
 * @description Receive GPS data from tracking devices and update trip history
 * @access Public
 */
router.post('/', async (req, res) => {
    try {
        const gpsData = req.body;
        const currentTime = new Date(gpsData.lastUpdated || new Date());

        if (!gpsData.busNumber || !gpsData.latitude || !gpsData.longitude) {
            return res.status(400).json({ success: false });
        }
        // console.log('Received GPS Data:', gpsData);


        const bus = await Bus.findOneAndUpdate(
            { busNumber: gpsData.busNumber },
            {
                location: {
                    latitude: gpsData.latitude,
                    longitude: gpsData.longitude,
                    heading: gpsData.heading || 0,
                    speed: gpsData.speed || 30,
                    lastUpdated: currentTime
                },
                'tracking.lastSeen': currentTime
            },
            { new: true }
        );



        if (!bus) {
            return res.status(200).json({ success: true });
        }

        const currentLocation = { latitude: gpsData.latitude, longitude: gpsData.longitude };

        const trip = await Trip.findById(gpsData.tripId);

        if (!trip.completed) {
            // Send location data to external server
            try {
                const response = await fetch(EXTERNAL_SERVER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        "lat": gpsData.latitude,
                        "lon": gpsData.longitude,
                        "gps_time": new Date(currentTime.getTime() + (330 * 60000)).toLocaleTimeString('en-IN', { 
                            hour12: false, 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata'
                        }),
                        "stops": trip.journey
                    })
                });
                const data = await response.json();
                console.log('Response from external server:', data);
            } catch (error) {
                console.error('Error sending data to external server:', error);
                // Continue processing even if external server request fails
            }
            const updates = {};

            if (!trip.isStarted && gpsData.speed > 0) {
                updates['journey.0.arrivedTime'] = currentTime;
                updates['isStarted'] = true;
            } else if (trip.isStarted) {
                if (trip.nextStopIndex < trip.journey.length) {
                    const nextStop = trip.journey[trip.nextStopIndex];
                    if (isNearPoint(currentLocation, nextStop.coordinates)) {
                        updates[`journey.${trip.nextStopIndex}.arrivedTime`] = currentTime;
                        updates['nextStopIndex'] = trip.nextStopIndex + 1;
                    }
                } else if (!trip.endStation.arrivedTime) {
                    if (isNearPoint(currentLocation, trip.endStation.coordinates)) {
                        updates['endStation.arrivedTime'] = currentTime;
                        updates['completed'] = true;
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                await trip.updateOne(
                    { _id: trip._id },
                    { $set: updates }
                );
            }
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error processing GPS data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process GPS data',
            message: error.message
        });
    }
});

module.exports = router;
