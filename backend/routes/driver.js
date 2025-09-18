const express = require('express');
const router = express.Router();
const Driver = require('../models/driver');
const Bus = require('../models/bus');
const { verifyUser } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Validation middleware for driver creation/update
const validateDriver = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('licenseNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('License number must contain only uppercase letters and numbers'),
  body('phone')
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name must not exceed 100 characters'),
  body('emergencyContact.phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid emergency contact phone number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// GET - Get all drivers (paginated, Admin only)
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

    // Parse filter params
    const { status, search } = req.query;
    let filter = {};

    // Filter by status
    if (status) {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Get driver counts and paginated data in parallel
    const [driverCounts, drivers] = await Promise.all([
      // Get counts for different driver statuses
      Driver.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
            },
            assigned: {
              $sum: { $cond: [{ $ne: ['$assignedBus', null] }, 1, 0] }
            },
            unassigned: {
              $sum: { $cond: [{ $eq: ['$assignedBus', null] }, 1, 0] }
            }
          }
        }
      ]),
      // Fetch paginated drivers
      Driver.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('assignedBus', 'busNumber currentStatus')
        .sort({ createdAt: -1 })
        .lean({virtuals: true})
    ]);

    const totalDrivers = await Driver.countDocuments(filter);
    const totalPages = Math.ceil(totalDrivers / limit);

    res.json({
      success: true,
      data: {
        drivers,
        pagination: {
          currentPage: page,
          totalPages,
          totalDrivers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        counts: driverCounts[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          assigned: 0,
          unassigned: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers'
    });
  }
});

// GET - Get driver by ID
router.get('/:id', async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const driver = await Driver.findById(req.params.id)
      .populate('assignedBus', 'busNumber currentStatus routeId')
      .populate('assignedBus.routeId', 'name code')
      .lean({virtuals: true});

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data: driver
    });

  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver'
    });
  }
});

// GET - Get drivers by status
router.get('/status/:status', async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    const { status } = req.params;
    let filter = {};

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    } else if (status === 'assigned') {
      filter.assignedBus = { $ne: null };
    } else if (status === 'unassigned') {
      filter.assignedBus = null;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Use: active, inactive, assigned, or unassigned'
      });
    }

    const drivers = await Driver.find(filter)
      .populate('assignedBus', 'busNumber currentStatus')
      .lean({virtuals: true})
      .sort({ name: 1 });

    res.json({
      success: true,
      data: drivers,
      count: drivers.length
    });

  } catch (error) {
    console.error('Error fetching drivers by status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers by status'
    });
  }
});

// POST - Create new driver
router.post('/', validateDriver, async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      id,
      name,
      licenseNumber,
      phone,
      address,
      dateOfBirth,
      emergencyContact,
      notes
    } = req.body;

    // Check if license number already exists
    const existingDriver = await Driver.findOne({ 
      licenseNumber: licenseNumber.toUpperCase() 
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: 'Driver with this license number already exists'
      });
    }

    // Create new driver
    const driver = new Driver({
      _id: _id,
      name: name.trim(),
      licenseNumber: licenseNumber.toUpperCase().trim(),
      phone: phone.trim(),
      address: address?.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      emergencyContact: emergencyContact ? {
        name: emergencyContact.name?.trim(),
        phone: emergencyContact.phone?.trim()
      } : undefined,
      notes: notes?.trim()
    });

    await driver.save();

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver
    });

  } catch (error) {
    console.error('Error creating driver:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Driver with this license number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create driver'
    });
  }
});

// PUT - Update driver by ID
router.put('/:id', validateDriver, async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || !req.user.admin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Admin privileges required.'
    //   });
    // }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    const {
      name,
      licenseNumber,
      phone,
      address,
      dateOfBirth,
      isActive,
      emergencyContact,
      notes
    } = req.body;

    // Check if license number is being changed and if it already exists
    if (licenseNumber && licenseNumber.toUpperCase() !== driver.licenseNumber) {
      const existingDriver = await Driver.findOne({ 
        licenseNumber: licenseNumber.toUpperCase(),
        _id: { $ne: driver._id }
      });

      if (existingDriver) {
        return res.status(400).json({
          success: false,
          error: 'Driver with this license number already exists'
        });
      }
    }

    // Update driver fields
    if (name !== undefined) driver.name = name.trim();
    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber.toUpperCase().trim();
    if (phone !== undefined) driver.phone = phone.trim();
    if (address !== undefined) driver.address = address?.trim();
    if (dateOfBirth !== undefined) driver.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (isActive !== undefined) driver.isActive = isActive;
    if (emergencyContact !== undefined) {
      driver.emergencyContact = emergencyContact ? {
        name: emergencyContact.name?.trim(),
        phone: emergencyContact.phone?.trim()
      } : undefined;
    }
    if (notes !== undefined) driver.notes = notes?.trim();

    await driver.save();

    // Populate the assignedBus field for response
    await driver.populate('assignedBus', 'busNumber currentStatus routeId').lean({virtuals: true});
    await driver.populate('assignedBus.routeId', 'name code').lean({virtuals: true});

    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });

  } catch (error) {
    console.error('Error updating driver:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Driver with this license number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update driver'
    });
  }
});

module.exports = router;
