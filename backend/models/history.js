const mongoose = require('mongoose');

const TripHistorySchema = new mongoose.Schema({
    historyId: { type: String, required: true, unique: true },
    tripId: { type: String, ref: 'Trip', required: true },
    busId: { type: String, ref: 'Bus', required: true },
    routeId: { type: String, ref: 'Route', required: true },
    date: { type: Date, default: () => new Date().setHours(0,0,0,0) }, // Store only the date part
    startStation: {
        coordinates: { type: [Number], required: true },
        expectedTime: { type: Date, required: true },
        arrivedTime: { type: Date },
    },
    endStation: {
        coordinates: { type: [Number], required: true },
        expectedTime: { type: Date, required: true },
        arrivedTime: { type: Date },
    },
    stops: [
        {
            coordinates: { type: [Number], required: true },
            expectedTime: { type: Date, required: true },
            arrivedTime: { type: Date },
        }
    ],
    completed: { type: Boolean, default: false },
    isStarted: { type: Boolean, default: false },
    nextStopIndex: { type: Number, default: 0 }
});

module.exports = mongoose.model('TripHistory', TripHistorySchema);
