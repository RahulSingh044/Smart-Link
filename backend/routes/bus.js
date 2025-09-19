const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/bus');
const { verifyUser } = require('../middleware/authMiddleware');

// GET - Get all buses (paginated, Admin only)
router.get('/', async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    // Parse pagination query params
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    // Get bus counts and paginated data in parallel for optimization
    const [busCounts, buses] = await Promise.all([
      // Get counts for different bus statuses
      Bus.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'active'] }, 1, 0] }
            },
            maintenance: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'maintenance'] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'inactive'] }, 1, 0] }
            },
            breakdown: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'breakdown'] }, 1, 0] }
            }
          }
        }
      ]),
      // Fetch paginated buses
      Bus.find()
        .skip(skip)
        .limit(limit)
        .populate('currentTrip', 'startStation endStation')
        .populate('daySchedule.tripId', 'startStation endStation')
        .populate('driverId', 'name phone')
        .lean({ virtuals: true })
    ]);

    // Extract counts from aggregation result
    const counts = busCounts[0] || { total: 0, active: 0, maintenance: 0, inactive: 0, breakdown: 0 };

    res.json({
      success: true,
      data: buses,
      counts: {
        total: counts.total,
        active: counts.active,
        maintenance: counts.maintenance,
        inactive: counts.inactive,
        breakdown: counts.breakdown
      },
      pagination: {
        total: counts.total,
        page,
        limit,
        totalPages: Math.ceil(counts.total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch buses',
      details: err.message
    });
  }
});

// GET - Get a single bus by its bus number
router.get('/:busNumber', async (req, res) => {
  try {
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { busNumber } = req.params;

    // Find the bus by its busNumber
    const bus = await Bus.findOne({ busNumber: busNumber })
      .populate('driverId', 'name phone')
      .exec();

    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    res.json({
      success: true,
      data: bus
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bus',
      details: err.message
    });
  }
});


// POST - Add a single bus (Admin only)
router.post('/', async (req, res) => {
  try {

    // // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const busData = req.body;

    // Validate required fields
    const requiredFields = ['busNumber', 'plateNumber', 'vehicleInfo'];
    const missingFields = requiredFields.filter(field => !busData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Validate vehicle info
    const vehicleRequiredFields = ['make', 'model', 'year', 'capacity', 'licensePlate'];
    const missingVehicleFields = vehicleRequiredFields.filter(field => !busData.vehicleInfo[field]);

    if (missingVehicleFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required vehicle information',
        missingFields: missingVehicleFields
      });
    }

    // If day schedule is provided, validate it
    if (busData.daySchedule && busData.daySchedule.length > 0) {
      const scheduleRequiredFields = ['tripId', 'startTime'];
      const invalidSchedules = busData.daySchedule.filter(schedule =>
        scheduleRequiredFields.some(field => !schedule[field])
      );

      if (invalidSchedules.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid schedule entries found',
          invalidSchedules: invalidSchedules
        });
      }
    }

    const bus = new Bus(busData);
    const savedBus = await bus.save();

    res.status(201).json({
      success: true,
      message: 'Bus created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: 'Duplicate key error',
        errorType: 'duplicate',
        field: field,
        message: `${field} already exists`,
        errorCode: 11000
      });
    }

    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        errorType: 'validation',
        message: 'Data validation failed',
        validationErrors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create bus',
      errorType: 'database',
      message: error.message,
      errorCode: error.code || 'UNKNOWN'
    });
  }
});

// PUT - Set day schedule for a bus
router.put('/:busNumber/schedule', async (req, res) => {
  try {
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { busNumber } = req.params;
    const { trips } = req.body;

    const bus = await Bus.findOne({ busNumber });
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    await bus.setDaySchedule(trips);

    res.json({
      success: true,
      message: 'Bus schedule updated successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update bus schedule',
      details: err.message
    });
  }
});

// POST - Start a trip for a bus
router.post('/:busNumber/start-trip', verifyUser, async (req, res) => {
  try {
    const { busNumber } = req.params;
    const { tripId } = req.body;

    const bus = await Bus.findOne({ busNumber });
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    await bus.startTrip(tripId);

    res.json({
      success: true,
      message: 'Trip started successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to start trip',
      details: err.message
    });
  }
});

// POST - End current trip for a bus
router.post('/:busNumber/end-trip', verifyUser, async (req, res) => {
  try {
    const { busNumber } = req.params;

    const bus = await Bus.findOne({ busNumber });
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    await bus.endTrip();

    res.json({
      success: true,
      message: 'Trip ended successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to end trip',
      details: err.message
    });
  }
});

// GET - Get next scheduled trip for a bus
router.get('/:busNumber/next-trip', verifyUser, async (req, res) => {
  try {
    const { busNumber } = req.params;

    const bus = await Bus.findOne({ busNumber })
      .populate('daySchedule.tripId', 'startStation endStation scheduledTime')
      .lean();

    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    const nextTrip = bus.getNextTrip();

    res.json({
      success: true,
      data: nextTrip
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to get next trip',
      details: err.message
    });
  }
});

// POST - Add multiple buses (Bulk insert - Admin only)
router.post('/bulk', async (req, res) => {
  try {
    const { buses } = req.body;

    if (!Array.isArray(buses) || buses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Buses array is required and must not be empty'
      });
    }

    if (buses.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create more than 100 buses at once'
      });
    }

    // Validate all buses
    const requiredFields = ['busNumber', 'plateNumber', 'vehicleInfo'];
    const vehicleRequiredFields = ['make', 'model', 'year', 'capacity', 'licensePlate'];

    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];

      // Check required fields
      const missingFields = requiredFields.filter(field => !bus[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Bus at index ${i} is missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Validate vehicleInfo
      if (!bus.vehicleInfo) {
        return res.status(400).json({
          success: false,
          error: `Bus at index ${i} is missing vehicleInfo object`
        });
      }

      const missingVehicleFields = vehicleRequiredFields.filter(field => !bus.vehicleInfo[field]);
      if (missingVehicleFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Bus at index ${i} vehicleInfo missing fields: ${missingVehicleFields.join(', ')}`
        });
      }

      // Validate ranges
      const currentYear = new Date().getFullYear();
      if (bus.vehicleInfo.year < 1990 || bus.vehicleInfo.year > currentYear + 1) {
        return res.status(400).json({
          success: false,
          error: `Bus at index ${i} vehicleInfo.year must be between 1990 and ${currentYear + 1}`
        });
      }

      if (bus.vehicleInfo.capacity < 1 || bus.vehicleInfo.capacity > 200) {
        return res.status(400).json({
          success: false,
          error: `Bus at index ${i} vehicleInfo.capacity must be between 1 and 200`
        });
      }
    }

    // Insert all buses at once
    const createdBuses = await Bus.insertMany(buses, { ordered: true });


    res.status(201).json({
      success: true,
      message: `All ${createdBuses.length} buses created successfully`,
      createdBuses
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'Unknown';
      return res.status(400).json({
        success: false,
        error: 'Duplicate key error',
        field,
        message: field !== 'Unknown' ? `${field} already exists` : 'Duplicate key exists',
        errorCode: 11000
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create buses',
      message: error.message
    });
  }
});

// PUT - Change route assignment for a bus (Admin only)
router.put('/:busNumber/change-route', async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { busNumber } = req.params;
    const { newRouteId } = req.body;

    if (!newRouteId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: newRouteId'
      });
    }

    // Find the bus by its number
    const bus = await Bus.findOne({ busNumber: busNumber });
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    // Use the model's changeRoute method
    await bus.changeRoute(newRouteId);

    res.json({
      success: true,
      message: 'Bus route assignment updated successfully',
      busNumber: bus.busNumber,
      newRouteId: newRouteId
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to change bus route assignment',
      message: err.message
    });
  }
});


// PUT - Change status of a bus (Admin only)
router.put('/:busNumber/change-status', async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { busNumber } = req.params;
    const { newStatus } = req.body;

    // Validate newStatus
    const allowedStatuses = ['active', 'inactive', 'maintenance', 'breakdown'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing required field: newStatus',
        allowedStatuses
      });
    }

    // Find the bus by its number
    const bus = await Bus.findOne({ busNumber: busNumber });
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    // Update the status
    bus.currentStatus = newStatus;
    await bus.save();

    res.json({
      success: true,
      message: 'Bus status updated successfully',
      busNumber: bus.busNumber,
      newStatus: bus.currentStatus
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to change bus status',
      message: err.message
    });
  }
});

// POST - Change the driver of a bus (Admin only)
router.put('/:busNumber/change-driver', async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { busNumber } = req.params;
    const { newDriverId } = req.body;

    // Validate newDriverId
    if (!newDriverId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: newDriverId'
      });
    }

    // Find the bus by its number
    const bus = await Bus.findOne({ busNumber: busNumber });
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    // Update the driver
    await bus.changeDriver(newDriverId);

    res.json({
      success: true,
      message: 'Bus driver changed successfully',
      busNumber: bus.busNumber,
      newDriverId: bus.driverId
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to change bus driver',
      message: err.message
    });
  }
});

// PATCH - Update multiple details of a bus (Admin only)
router.patch('/:busNumber', async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { busNumber } = req.params;
    const updateData = req.body;

    // Find the bus by its number
    const bus = await Bus.findOne({ busNumber: busNumber });
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    // List of fields that can be updated directly
    const updatableFields = [
      'busNumber',
      'routeId',
      'currentStatus',
      'driverId',
      'schedule',
      'maintenance',
      'vehicleInfo',
      'location',
      'tracking',
      'operationalData'
    ];

    // Update allowed fields
    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        // If the field is an object, merge instead of replace
        if (typeof updateData[field] === 'object' && updateData[field] !== null && typeof bus[field] === 'object' && bus[field] !== null) {
          bus[field] = { ...bus[field]._doc || bus[field], ...updateData[field] };
        } else {
          bus[field] = updateData[field];
        }
      }
    });

    await bus.save();

    res.json({
      success: true,
      message: 'Bus details updated successfully',
      bus: bus
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update bus details',
      message: err.message
    });
  }
});


module.exports = router;