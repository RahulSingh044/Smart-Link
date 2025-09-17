const mongoose = require('mongoose');

// Define the station schema - specialized for stations only
const stationSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  // Basic station information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  // Station status and operational data
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'closed'],
    default: 'active'
  },

  // Routes that serve this station
  routes: [{
    routeId: {
      type: String,
      ref: 'Route',
      required: true
    },
    position: {
      type: String,
      enum: ['start', 'end', 'intermediate'],
      required: true
    },
    sequence: {
      type: Number,
      required: true,
      min: 1
    }
  }],

  // Station connectivity
  nearbyStops: [{
    pointId: {
      type: String,
      required: true,
      refPath: "nearbyStops.pointType"
    },
    pointType: {
      type: String,
      enum: ['Station', 'Stop'],
      required: true
    },
    routeId: {
      type: String,
      ref: 'Route',
      required: true
    },
    distance: {
      type: Number,
      min: 1
    },
    walktime: {
      type: String,
      default: "00:00"
    }
  }],

  // Historical and analytics data
  analytics: {
    dailyPassengerCount: {
      type: Number,
      default: 0
    },
    peakHours: [{
      start: { type: String, required: true },
      end: { type: String, required: true },
      averagePassengers: { type: Number, required: true }
    }],
    averageWaitTime: {
      type: Number,
      default: 0
    },
    onTimePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

stationSchema.index({ location: '2dsphere' });

// Static method to find nearby stations
// stationSchema.statics.findNearby = function (latitude, longitude, maxDistance = 1000) {
//   return this.find({
//     'location.latitude': {
//       $gte: latitude - (maxDistance / 111), // Rough conversion: 1 degree ≈ 111 km
//       $lte: latitude + (maxDistance / 111)
//     },
//     'location.longitude': {
//       $gte: longitude - (maxDistance / (111 * Math.cos(latitude * Math.PI / 180))),
//       $lte: longitude + (maxDistance / (111 * Math.cos(latitude * Math.PI / 180)))
//     },
//     status: 'active'
//   });
// };

// Static method to find stations by status
stationSchema.statics.findByStatus = function (status) {
  return this.find({
    status: status
  });
};

// Static method to find stations by route
stationSchema.statics.findByRoute = function (routeId) {
  return this.find({
    'routes.routeId': routeId,
    status: 'active'
  });
};

// Instance method to add route
stationSchema.methods.addRoute = function (routeId, position, sequence) {
  const existingRoute = this.routes.find(route =>
    route.routeId.toString() === routeId.toString()
  );

  if (existingRoute) {
    throw new Error('Route already exists for this station');
  }

  this.routes.push({
    routeId: routeId,
    position: position,
    sequence: sequence
  });

  return this.save();
};

// Instance method to remove route
stationSchema.methods.removeRoute = function (routeId) {
  this.routes = this.routes.filter(route =>
    !(route.routeId.toString() === routeId.toString())
  );
  return this.save();
};

// Instance method to check if station is accessible
stationSchema.methods.isAccessible = function () {
  return this.status === 'active';
};


// Create and export the model
const Station = mongoose.model('Station', stationSchema);

module.exports = Station;
