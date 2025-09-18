const mongoose = require('mongoose');
require('dotenv').config();

// Define the route schema
const routeSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  // Basic route information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Route code/identifier
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 10
  },

  // Route description
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Route type
  type: {
    type: String,
    enum: ['local', 'express', 'rapid', 'intercity', 'airport', 'metro'],
    required: true,
    default: 'local'
  },

  // Journey array containing all points (stations and stops) in sequence
  journey: [{
    pointId: {
      type: String,
      required: true,
      refPath: 'journey.pointType'
    },
    pointType: {
      type: String,
      enum: ['Station', 'Stop'],
      required: true
    },
    sequence: {
      type: Number,
      required: true,
      min: 1
    }
  }],

  schedule: [[String]],

  buses: [{
    busId: {
      type: String,
      required: true,
      ref: 'Bus'
    }
  }],

  // Route timing and frequency
  timing: {
    totalDuration: {
      type: Number, // in minutes
      required: true,
      min: 1
    },
    frequency: {
      type: Number, // minutes between trips
      required: true,
      min: 10
    },
    firstTrip: {
      type: String, // Format: "HH:MM"
      required: true
    },
    lastTrip: {
      type: String, // Format: "HH:MM"
      required: true
    },
  },

  // Peak hours definition
  peakHours: [{
    start: {
      type: String, // Format: "HH:MM"
      required: true
    },
    end: {
      type: String, // Format: "HH:MM"
      required: true
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    }]
  }],

  // Route status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'maintenance'],
    default: 'active'
  },

  connectivityUpdated: {
    type: Boolean,
    default: false
  },

  // Fare information for each point in journey array
  fares: [[{
    type: Number,
    required: true,
    min: 0
  }]],

  // Fare concessions
  concessions: [{
    type: {
      type: String,
      enum: ['student', 'senior', 'disabled', 'monthly_pass'],
      required: true
    },
    discount: {
      type: Number, // percentage
      required: true,
      min: 0,
      max: 100
    }
  }],

  // Route analytics and performance
  analytics: {
    averagePassengers: {
      type: Number,
      default: 0
    },
    onTimePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageSpeed: {
      type: Number, // km/h
      default: 0
    },
    totalTrips: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total stops count
+routeSchema.virtual('totalStops').get(function () {
  return this.journey.length + 2; // +2 for start and end stations
});

// Virtual for checking if route is currently operating
routeSchema.virtual('isOperating').get(function () {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const firstTripTime = parseInt(this.timing.firstTrip.split(':')[0]) * 60 + parseInt(this.timing.firstTrip.split(':')[1]);
  const lastTripTime = parseInt(this.timing.lastTrip.split(':')[0]) * 60 + parseInt(this.timing.lastTrip.split(':')[1]);

  return this.status === 'active' && currentTime >= firstTripTime && currentTime <= lastTripTime;
});

// Pre-save middleware to calculate total duration if not provided
routeSchema.pre('save', function (next) {
  if (!this.timing.totalDuration && this.journey.length > 0) {
    // Calculate duration based on first and last trip times
    const firstTime = parseInt(this.timing.firstTrip.split(':')[0]) * 60 + parseInt(this.timing.firstTrip.split(':')[1]);
    const lastTime = parseInt(this.timing.lastTrip.split(':')[0]) * 60 + parseInt(this.timing.lastTrip.split(':')[1]);
    this.timing.totalDuration = lastTime - firstTime;
  }
  next();
});

routeSchema.pre("insertMany", function (next, docs) {
  for (const doc of docs) {
    if (!doc.timing.totalDuration && doc.journey.length > 0) {
      const firstTime =
        parseInt(doc.timing.firstTrip.split(":")[0]) * 60 +
        parseInt(doc.timing.firstTrip.split(":")[1]);
      const lastTime =
        parseInt(doc.timing.lastTrip.split(":")[0]) * 60 +
        parseInt(doc.timing.lastTrip.split(":")[1]);
      doc.timing.totalDuration = lastTime - firstTime;
    }
  }
  next();
});

// Static method to find routes by status
routeSchema.statics.findByStatus = function (status) {
  return this.find({ status: status });
};

// Static method to find routes by type
routeSchema.statics.findByType = function (type) {
  return this.find({
    type: type,
    status: 'active'
  });
};

// Static method to find routes serving a specific station/stop
routeSchema.statics.findByStation = function (stationId) {
  return this.find({
    $or: [
      { startStation: stationId },
      { endStation: stationId },
      { 'journey.pointId': stationId, 'journey.pointType': 'Station' }
    ],
    status: 'active'
  });
};

// Static method to find routes within a time range
routeSchema.statics.findByTimeRange = function (startTime, endTime) {
  return this.find({
    'timing.firstTrip': { $lte: endTime },
    'timing.lastTrip': { $gte: startTime },
    status: 'active'
  });
};

// Instance method to add peak hour
routeSchema.methods.addPeakHour = function (start, end, days) {
  this.peakHours.push({
    start: start,
    end: end,
    days: days
  });
  return this.save();
};

// Instance method to remove peak hour
routeSchema.methods.removePeakHour = function (start, end, days) {
  this.peakHours = this.peakHours.filter(peak =>
    !(peak.start === start && peak.end === end &&
      JSON.stringify(peak.days.sort()) === JSON.stringify(days.sort()))
  );
  return this.save();
};


// Method to update fares array
routeSchema.methods.updateFares = async function (newFares) {
  if (newFares.length !== this.journey.length) {
    throw new Error('Number of fares must match number of journey points');
  }

  this.fares = newFares;
  return this.save();
};

// Method to find nearest points on route
routeSchema.statics.findNearestPoints = async function (lat, lon, maxDistance = 1000) {
  // Convert maxDistance from meters to degrees (approximate)
  const maxDistanceDegrees = maxDistance / 111000;

  const routes = await this.find({
    'journey.pointId': {
      $geoNear: {
        $geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        $maxDistance: maxDistance
      }
    }
  }).populate('journey.pointId');

  return routes.map(route => ({
    routeId: route._id,
    nearestPoints: route.journey
      .filter(point => {
        const pointLat = point.pointId.location.latitude;
        const pointLon = point.pointId.location.longitude;
        const distance = Math.sqrt(
          Math.pow(lat - pointLat, 2) +
          Math.pow(lon - pointLon, 2)
        );
        return distance <= maxDistanceDegrees;
      })
      .map(point => ({
        pointId: point.pointId._id,
        pointType: point.pointType,
        sequence: point.sequence,
        distance: point.distance,
        walkTime: point.walkTime
      }))
  }));
};

// Create and export the model
const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
