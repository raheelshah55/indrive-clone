const express = require('express');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Settings = require('../models/Settings'); // 👈 THIS WAS LIKELY MISSING!
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

router.put('/approve-driver/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.driverProfile.isApproved = true;
        await user.save();
        res.status(200).json({ message: "Approved!", user });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

router.get('/rides', verifyToken, async (req, res) => {
    try {
        const rides = await Ride.find().populate('rider', 'name email').populate('driver', 'name email').sort({ createdAt: -1 });
        res.status(200).json(rides);
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

router.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

router.put('/rides/:id/status', verifyToken, async (req, res) => {
    try {
        const ride = await Ride.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (req.body.status === 'completed' || req.body.status === 'canceled') {
            req.app.get('io').emit('rideCompleted', ride);
        }
        res.status(200).json(ride);
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

// --- SETTINGS ROUTES ---
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        res.status(200).json(settings);
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

// --- 7. UPDATE PRICING SETTINGS (Admin Only) ---
router.put('/settings', verifyToken, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        
        // Save the 3 different vehicle categories!
        settings.Car = req.body.Car;
        settings.Bike = req.body.Bike;
        settings.Rickshaw = req.body.Rickshaw;
        
        await settings.save();
        res.status(200).json({ message: "Settings updated!", settings });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
//for update
module.exports = router;