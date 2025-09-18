const mongoose = require('mongoose');
const Driver = require("./driver");
const { route } = require('../routes');

// Define the bus schema
const busSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  // Basic bus information
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },

  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },

  // Current active trip
  currentRoute: {
    type: String,
    ref: 'Route',
    default: null
  },

  // Day's schedule of trips
  daySchedule: [{
    tripId: {
      type: String,
      ref: 'Trip',
      required: true
    },
    startTime: {
      type: String,
      required: true // Format: "HH:mm"
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],

  // Vehicle details
  vehicleInfo: {
    make: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 1990,
      max: new Date().getFullYear() + 1
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 200
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    }
  },

  // Current status and location
  currentStatus: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'breakdown'],
    default: 'inactive'
  },

  // eta: {
  //   type: Object,
  //   default: null
  // },

  // Real-time location data
  location: {
    latitude: {
      type: Number,
      required: function() {
        return this.currentStatus === 'active';
      },
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: function() {
        return this.currentStatus === 'active';
      },
      min: -180,
      max: 180
    },
    heading: {
      type: Number,
      min: 0,
      max: 360
    },
    speed: {
      type: Number,
      min: 0,
      max: 200 // km/h
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Driver information
  driverId: {
    type: String,
    ref: 'Driver'
  },

  // Maintenance and service records
  maintenance: {
    lastServiceDate: {
      type: Date
    },
    nextServiceDate: {
      type: Date
    },
    mileage: {
      type: Number,
      min: 0
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100 // percentage
    }
  },

  // Real-time tracking metadata
  tracking: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    deviceId: {
      type: String,
      // unique: true,
      // sparse: true
    },
    signalStrength: {
      type: Number,
      min: 0,
      max: 100
    }
  },

  // Operational data
  operationalData: {
    totalTrips: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number,
      default: 0 // in kilometers
    },
    averageSpeed: {
      type: Number,
      default: 0
    },
    onTimePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if bus is currently running
busSchema.virtual('isRunning').get(function () {
  return this.currentStatus === 'active' && this.tracking.isOnline;
});

// Virtual for checking if bus has a driver assigned
busSchema.virtual('hasDriver').get(function () {
  return !!this.driverId;
});

// Pre-save middleware for various validations and updates
busSchema.pre('save', async function (next) {
  const now = new Date();

  // Update tracking timestamps when location changes
  if (this.isModified('location.latitude') || this.isModified('location.longitude')) {
    this.location.lastUpdated = now;
    this.tracking.lastSeen = now;
  }

  // Handle driver assignment changes
  if (this.isModified('driverId')) {
    try {
      if (this.driverId) {
        // Ensure driver isn't already assigned to another bus
        const existingBus = await this.constructor.findOne({
          driverId: this.driverId,
          _id: { $ne: this._id }
        });

        if (existingBus) {
          throw new Error('Driver is already assigned to another bus');
        }

        // Update driver's assignedBus
        await Driver.findByIdAndUpdate(this.driverId, { assignedBus: this._id });
      } else if (this._oldDriver) {
        // Clear previous driver's assignment
        await Driver.findByIdAndUpdate(this._oldDriver, { $unset: { assignedBus: 1 } });
      }
    } catch (err) {
      return next(err);
    }
  }

  // Validate status changes
  if (this.isModified('currentStatus')) {
    if (this.currentStatus === 'active' && !this.driverId) {
      return next(new Error('Cannot activate bus without assigned driver'));
    }
    if (this.currentStatus !== 'active' && this.currentTrip) {
      return next(new Error('Cannot change status while bus is on a trip'));
    }
  }

  // Store old driver ID for reference
  if (this.isModified('driverId')) {
    this._oldDriver = this.driverId;
  }

  next();
});

// Pre-insertMany middleware
busSchema.pre("insertMany", async function (next, docs) {
  try {

    for (let doc of docs) {

      // Update lastSeen when location is present
      if (doc.location && (doc.location.latitude || doc.location.longitude)) {
        doc.location.lastUpdated = new Date();
        if (!doc.tracking) doc.tracking = {};
        doc.tracking.lastSeen = new Date();
      }

      // Assign driver
      if (doc.driverId) {
        await Driver.findByIdAndUpdate(doc.driverId, { assignedBus: doc._id });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to change the driver of the bus
busSchema.methods.changeDriver = async function (newDriverId) {
  // If the driver is not actually changing, do nothing
  if (this.driverId && this.driverId.toString() === newDriverId.toString()) {
    return this;
  }

  // Remove this bus from the old driver's assignedBus, if any
  if (this.driverId) {
    try {
      const Driver = require('./driver');
      await Driver.findByIdAndUpdate(
        this.driverId,
        { $unset: { assignedBus: 1 } }
      );
    } catch (err) {
      // Log error but continue
      console.error('Failed to remove bus from old driver:', err.message);
    }
  }

  // Assign this bus to the new driver's assignedBus
  if (newDriverId) {
    try {
      const Driver = require('./driver');
      await Driver.findByIdAndUpdate(
        newDriverId,
        { assignedBus: this._id }
      );
    } catch (err) {
      // Log error but continue
      console.error('Failed to assign bus to new driver:', err.message);
    }
  }

  // Update the bus's driverId
  this.driverId = newDriverId;
  return this.save();
};

// Instance method to unassign driver from bus
busSchema.methods.unassignDriver = async function () {
  if (!this.driverId) {
    return this;
  }

  // Remove this bus from the driver's assignedBus
  try {
    const Driver = require('./driver');
    await Driver.findByIdAndUpdate(
      this.driverId,
      { $unset: { assignedBus: 1 } }
    );
  } catch (err) {
    console.error('Failed to remove bus from driver:', err.message);
  }

  // Clear the bus's driverId
  this.driverId = undefined;
  return this.save();
};


// Instance method to update location
busSchema.methods.updateLocation = async function (latitude, longitude, heading, speed) {
  if (!this.currentStatus === 'active') {
    throw new Error('Cannot update location for inactive bus');
  }

  const now = new Date();
  this.location.latitude = latitude;
  this.location.longitude = longitude;
  this.location.heading = heading;
  this.location.speed = speed;
  this.location.lastUpdated = now;
  this.tracking.lastSeen = now;
  this.tracking.isOnline = true;

  // Update operational data
  if (this.location.lastUpdated && this.location.speed) {
    const timeDiff = (now - this.location.lastUpdated) / 3600000; // Convert to hours
    const distance = (this.location.speed * timeDiff); // Distance in km
    this.operationalData.totalDistance += distance;
    
    // Update average speed (weighted average)
    const totalTrips = this.operationalData.totalTrips || 1;
    this.operationalData.averageSpeed = 
      ((this.operationalData.averageSpeed * (totalTrips - 1)) + speed) / totalTrips;
  }

  await this.save();

  // If bus is on a trip, update trip progress
  if (this.currentTrip) {
    try {
      const Trip = require('./trip');
      await Trip.findByIdAndUpdate(this.currentTrip, {
        'currentLocation': {
          coordinates: [longitude, latitude],
          timestamp: now,
          speed: speed,
          heading: heading
        }
      });
    } catch (err) {
      console.error(`Failed to update trip location: ${err.message}`);
      // Don't throw error to prevent location update failure
    }
  }

  return this;
};

// Instance method to set day schedule
busSchema.methods.setDaySchedule = async function (trips) {
  // trips should be an array of { tripId, startTime }
  if (!Array.isArray(trips)) {
    throw new Error('Trips must be an array');
  }

  // Validate and sort trips by start time
  this.daySchedule = trips
    .map(trip => ({
      tripId: trip.tripId,
      startTime: trip.startTime,
      completed: false
    }))
    .sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

  try {
    // Update all trips with this bus ID
    const Trip = require('./trip');
    await Trip.updateMany(
      { _id: { $in: trips.map(t => t.tripId) } },
      { busId: this._id }
    );
    return this.save();
  } catch (err) {
    throw new Error(`Failed to update trips with bus assignment: ${err.message}`);
  }
};

// Instance method to start trip
busSchema.methods.startTrip = async function (tripId) {
  if (this.currentTrip) {
    throw new Error('Bus is already assigned to a trip');
  }
  if (this.currentStatus !== 'active') {
    throw new Error('Bus must be in active status to start trip');
  }
  if (!this.driverId) {
    throw new Error('Bus must have a driver assigned to start trip');
  }

  // Verify trip is in day schedule
  const scheduledTrip = this.daySchedule.find(t => t.tripId.toString() === tripId.toString());
  if (!scheduledTrip) {
    throw new Error('Trip is not in bus day schedule');
  }
  if (scheduledTrip.completed) {
    throw new Error('Trip has already been completed');
  }

  this.currentTrip = tripId;
  this.tracking.isOnline = true;
  this.tracking.lastSeen = new Date();
  
  try {
    const Trip = require('./trip');
    await Trip.findByIdAndUpdate(tripId, { 
      busId: this._id,
      status: 'in-progress'
    });
    return this.save();
  } catch (err) {
    throw new Error(`Failed to update trip with bus assignment: ${err.message}`);
  }
};

// Instance method to end trip
busSchema.methods.endTrip = async function () {
  if (!this.currentTrip) {
    throw new Error('Bus is not currently assigned to any trip');
  }

  try {
    const Trip = require('./trip');
    // Update trip status
    await Trip.findByIdAndUpdate(this.currentTrip, { 
      status: 'completed'
    });
    
    // Mark trip as completed in day schedule
    const tripIndex = this.daySchedule.findIndex(t => t.tripId.toString() === this.currentTrip.toString());
    if (tripIndex !== -1) {
      this.daySchedule[tripIndex].completed = true;
    }
    
    // Update bus stats
    this.operationalData.totalTrips += 1;
    this.currentTrip = null;
    
    // Check if this was the last trip of the day
    const hasRemainingTrips = this.daySchedule.some(trip => !trip.completed);
    if (!hasRemainingTrips && this.currentStatus === 'active') {
      this.currentStatus = 'inactive';
    }

    return this.save();
  } catch (err) {
    throw new Error(`Failed to end trip: ${err.message}`);
  }
};

// Helper method to get next scheduled trip
busSchema.methods.getNextTrip = function() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return this.daySchedule.find(trip => {
    if (trip.completed) return false;
    const [hours, minutes] = trip.startTime.split(':').map(Number);
    const tripTime = hours * 60 + minutes;
    return tripTime > currentTime;
  });
};

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;
