const express = require('express');
const router = express.Router();

const { verifyUser } = require('../middleware/authMiddleware');
const bus = require('../models/bus');
const route = require('../models/route');
const station = require('../models/station');
const stop = require('../models/stop');
const User = require('../models/user');

/* GET admin page. */
router.get("/dashboard", async (req, res) => {
    // Check if the authenticated user has the 'admin' custom claim
    // if (req.user && req.user.admin === true) {
    if(true){
        const buses = await bus.countDocuments();
        const routes = await route.countDocuments();
        const stations = await station.countDocuments();
        const stops = await stop.countDocuments();
        const onTimePercentage = await bus.aggregate([
            { $match: { currentStatus: 'active' } },
            { $group: { _id: null, avg: { $avg: '$operationalData.onTimePercentage' } } }
        ]);
        res.json({ message: "Welcome to the admin dashboard!", buses, routes, stations, stops, onTimePerformance: onTimePercentage[0]?.avg});
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
});


router.post("/set-admin", async (req, res) => {
    // if (req.user && req.user.admin === true) {
    if(true){
        const { uid, email } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) {
                let admin = await User.create({ email, adminId: uid });
                await admin.save();
                res.status(200).json({ message: "User has been set as admin." });
            } else {
                res.status(404).json({ message: "User already exists." });
            }
        }catch (error) {
            console.log(error);
            res.status(500).json({ message: "An error occurred while setting the user as admin.", error: error.message });
        }
    }
});

module.exports = router;