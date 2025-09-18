const mongoose = require('mongoose');


// Define the stop schema - specialized for bus stops only
const stopSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  // Basic stop information
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
      required: true,
    }
  },

  // Stop status
  status: {
    type: String,
    enum: ['active', 'inactive', 'temporary_closed'],
    default: 'active'
  },

  // Routes that serve this stop
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

  // Nearby connectivity
  nearbyStops: [{
    pointId: {
      type: String,
      required: true,
      refPath: "stops.pointType"
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

  // Basic analytics
  analytics: {
    dailyPassengerCount: {
      type: Number,
      default: 0
    },
    peakHours: [{
      start: { type: String, required: true },
      end: { type: String, required: true },
      averagePassengers: { type: Number, required: true }
    }]
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

stopSchema.index({ location: '2dsphere' });

// // Static method to find nearby stops
// stopSchema.statics.findNearby = function(latitude, longitude, maxDistance = 500) {
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

// Static method to find stops by status
stopSchema.statics.findByStatus = function (status) {
  return this.find({
    status: status
  });
};

// Static method to find stops by route
stopSchema.statics.findByRoute = function (routeId) {
  return this.find({
    'routes.routeId': routeId,
    status: 'active'
  });
};

// Instance method to add route
stopSchema.methods.addRoute = function (routeId, position, sequence) {
  const existingRoute = this.routes.find(route =>
    route.routeId.toString() === routeId.toString()
  );

  if (existingRoute) {
    throw new Error('Route already exists for this stop');
  }

  this.routes.push({
    routeId: routeId,
    position: position,
    sequence: sequence
  });

  return this.save();
};

// Instance method to remove route
stopSchema.methods.removeRoute = function (routeId) {
  this.routes = this.routes.filter(route =>
    !(route.routeId.toString() === routeId.toString())
  );
  return this.save();
};

// Instance method to check if stop is accessible
stopSchema.methods.isAccessible = function () {
  return this.status === 'active';
};

// Instance method to add peak hour data
stopSchema.methods.addPeakHour = function (start, end, averagePassengers) {
  this.analytics.peakHours.push({
    start: start,
    end: end,
    averagePassengers: averagePassengers
  });
  return this.save();
};

// Create and export the model
const Stop = mongoose.model('Stop', stopSchema);

module.exports = Stop;
