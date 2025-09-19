const mongoose = require('mongoose');
require('dotenv').config();

const TripSchema = new mongoose.Schema({
    busId: { type: String, ref: 'Bus', default: null },
    routeId: { type: String, ref: 'Route', required: true },
    journey: [
        {
            name: { type: String, required: true },
            coordinates: { type: [Number], required: true },
            expectedTime: { type: Date, required: true },
            arrivedTime: { type: Date },
        }
    ],
    nextStopIndex: { type: Number, default: 0 }
});


module.exports = mongoose.model('Trip', TripSchema);