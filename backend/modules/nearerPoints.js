const Station = require('../models/station');
const Stop = require('../models/stop');

module.exports = {
    // Function to find nearer points (stations and stops) within a given radius
    findNearerPoints: async (latitude, longitude, limit, skip = 0) => {
        try {
            // Nearest stops
            const nearestStops = await Stop.find({
                status: 'active',
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [longitude, latitude] },
                        $maxDistance: 2000 // meters
                    }
                }
            }).limit(limit).skip(skip*limit);

            // Nearest stations
            const nearestStations = await Station.find({
                status: 'active',
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [longitude, latitude] },
                        $maxDistance: 5000 // meters
                    }
                }
            }).limit(limit).skip(skip*limit);

            return {stops: nearestStops, stations: nearestStations};
        } catch (error) {
            console.error('Error finding nearer points:', error);
            throw error;
        }
    }
};