const express = require('express');
const router = express.Router();
const Trip = require('../models/trip');

// Fetch Trip Data For GPS Simulation
router.get('/list', async (req, res) => {
    try {
        const trips = await Trip.find()
            .populate('routeId', 'name code')
            .populate('busId', 'busNumber currentStatus')
            .lean();

        res.status(200).json({
            success: true,
            data: trips,
            count: trips.length
        });
    } catch (error) {
        console.error('Error fetching trip data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trip data',
            message: error.message
        });
    }
});

// Fetch Trip Data For GPS Simulation
router.get('/', async (req, res) => {
    try {
        const { tripId = null, fromStopId = null, toStopId = null } = req.query;
        if(!tripId) {
            return res.status(400).json({
                success: false,
                message: 'tripId is required'
            });
        }
        const trips = await Trip.findOne({ _id: tripId })
            .populate('routeId', 'name code')
            .populate('busId', 'busNumber currentStatus')
            .lean();
        if(!trips){
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }
        let stops = [];
        let start = fromStopId ? false : true;
        for (let i = 0; i < trips.journey.length; i++) {
            if (trips.journey[i].pointId == fromStopId) {
                start = true;
            }
            if (start) {
                stops.push(trips.journey[i]);
            }
            if (start && trips.journey[i].pointId == toStopId) break;
        }

        res.status(200).json({
            success: true,
            data: stops,
            count: stops.length
        });
    } catch (error) {
        console.error('Error fetching trip data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trip data',
            message: error.message
        });
    }
});

module.exports = router;