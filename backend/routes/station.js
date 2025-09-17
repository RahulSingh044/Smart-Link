const express = require('express');
const router = express.Router();
const Station = require('../models/station');
const { verifyUser } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// GET - Get all stations (paginated, Admin only)
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

    // Get station counts and paginated data in parallel for optimization
    const [stationCounts, stations] = await Promise.all([
      // Get counts for different station statuses
      Station.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
            },
            maintenance: {
              $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
            },
            closed: {
              $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
            }
          }
        }
      ]),
      // Fetch paginated stations
      Station.find()
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true })
    ]);

    // Extract counts from aggregation result
    const counts = stationCounts[0] || { total: 0, active: 0, inactive: 0, maintenance: 0, closed: 0 };

    res.json({
      success: true,
      data: stations,
      counts: {
        total: counts.total,
        active: counts.active,
        inactive: counts.inactive,
        maintenance: counts.maintenance,
        closed: counts.closed
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
      error: 'Failed to fetch stations',
      details: err.message
    });
  }
});

// POST - Add a single station (Admin only)
router.post('/', async (req, res) => {
  try {

    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const stationData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'coordinates'];
    const missingFields = requiredFields.filter(field => !stationData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }
    // Validate coordinates if present
    if (stationData.coordinates) {
      if (typeof stationData.coordinates[0] !== 'number' ||
        typeof stationData.coordinates[1] !== 'number') {
        errors.push('Coordinates must contain numeric latitude and longitude');
      } else {
        // Validate coordinate ranges
        if (stationData.coordinates[1] < -90 || stationData.coordinates[1] > 90) {
          errors.push('Latitude must be between -90 and 90');
        }
        if (stationData.coordinates[0] < -180 || stationData.coordinates[0] > 180) {
          errors.push('Longitude must be between -180 and 180');
        }
      }
    }

    stationData.location = {
      type: 'Point',
      coordinates: stationData.coordinates
    };
    delete stationData.coordinates;
    const station = new Station(stationData);
    await station.save();

    res.status(201).json({
      success: true,
      message: 'Station created successfully'
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
      error: 'Failed to create station',
      errorType: 'database',
      message: error.message,
      errorCode: error.code || 'UNKNOWN'
    });
  }
});

// POST - Add multiple stations (Bulk insert - Admin only)
router.post('/bulk', async (req, res) => {
  try {
    // // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { stations } = req.body;

    if (!Array.isArray(stations) || stations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Stations array is required and must not be empty'
      });
    }

    if (stations.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create more than 100 stations at once'
      });
    }

    // Validate each station and separate valid from invalid
    const validStations = [];
    const validationErrors = [];
    const requiredFields = ['name', 'coordinates'];

    stations.forEach((station, index) => {
      const errors = [];

      // Check required fields
      const missingFields = requiredFields.filter(field => !station[field]);
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate coordinates if present
      if (station.coordinates) {
        if (typeof station.coordinates[0] !== 'number' ||
          typeof station.coordinates[1] !== 'number') {
          errors.push('Coordinates must contain numeric latitude and longitude');
        } else {
          // Validate coordinate ranges
          if (station.coordinates[1] < -90 || station.coordinates[1] > 90) {
            errors.push('Latitude must be between -90 and 90');
          }
          if (station.coordinates[0] < -180 || station.coordinates[0] > 180) {
            errors.push('Longitude must be between -180 and 180');
          }
        }
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: index,
          station: station.name || 'Unknown',
          errors: errors,
          stationData: station // Include the problematic station data for debugging
        });
      } else {
        // Convert coordinates to location format
        const stationToInsert = { ...station };
        if (stationToInsert.coordinates) {
          stationToInsert.location = {
            type: 'Point',
            coordinates: stationToInsert.coordinates
          };
          delete stationToInsert.coordinates;
        }
        validStations.push(stationToInsert);
      }
    });

    let createdStations = [];
    let insertErrors = [];

    // Insert valid stations if any exist
    if (validStations.length > 0) {
      try {
        createdStations = await Station.insertMany(validStations, { ordered: false });
      } catch (insertError) {
        if (insertError.name === 'BulkWriteError') {
          // Handle partial success in bulk insert
          createdStations = insertError.result.insertedDocs || [];

          // Process write errors
          insertError.writeErrors.forEach(err => {
            const errorType = err.code === 11000 ? 'duplicate' : 'database';
            const field = err.code === 11000 ? Object.keys(err.keyPattern)[0] : null;

            insertErrors.push({
              station: err.op.name || 'Unknown',
              errorType: errorType,
              field: field,
              message: err.code === 11000
                ? `${field} already exists`
                : err.errmsg,
              errorCode: err.code,
              stationData: err.op
            });
          });
        } else {
          // Handle other database errors
          insertErrors.push({
            station: 'Multiple',
            errorType: 'database',
            field: null,
            message: insertError.message,
            errorCode: insertError.code || 'UNKNOWN',
            stationData: null
          });
        }
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: '',
      summary: {
        totalStations: stations.length,
        validStations: validStations.length,
        createdStations: createdStations.length,
        validationErrors: validationErrors.length,
        insertErrors: insertErrors.length
      },
      createdStations: createdStations,
      errors: {
        validationErrors: validationErrors,
        insertErrors: insertErrors
      }
    };

    // Determine status code based on results
    let statusCode = 201;
    if (validationErrors.length > 0 || insertErrors.length > 0) {
      statusCode = 207; // Multi-Status (partial success)
      response.message = `Partial success: ${createdStations.length} stations created, ${validationErrors.length + insertErrors.length} failed`;
    } else {
      response.message = `All ${createdStations.length} stations created successfully`;
    }

    res.status(statusCode).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk station creation',
      message: error.message
    });
  }
});

module.exports = router;
