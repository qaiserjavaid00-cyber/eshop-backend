import Notification from "../Models/Notification.js";
import asyncHandler from "express-async-handler";

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Admin
export const createNotification = asyncHandler(async (req, res) => {
    const { message, startDate, endDate, priority, isActive } = req.body;

    if (!message) {
        res.status(400);
        throw new Error("Message is required");
    }

    const notification = await Notification.create({
        message,
        startDate: startDate || null,
        endDate: endDate || null,
        priority: priority || 0,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(notification);
});

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Public/Admin
export const getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find()
        .sort({ priority: -1, createdAt: -1 }); // higher priority first
    res.json(notifications);
});

// @desc    Get active notifications only
// @route   GET /api/notifications/active
// @access  Public
export const getActiveNotifications = asyncHandler(async (req, res) => {
    const now = new Date();
    const notifications = await Notification.find({
        isActive: true,
        $or: [
            { startDate: null, endDate: null },
            { startDate: { $lte: now }, endDate: { $gte: now } },
            { startDate: { $lte: now }, endDate: null },
            { startDate: null, endDate: { $gte: now } },
        ],
    }).sort({ priority: -1, createdAt: -1 });

    res.json(notifications);
});

// @desc    Get a single notification by ID
// @route   GET /api/notifications/:id
// @access  Admin
export const getNotificationById = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    res.json(notification);
});

// @desc    Update a notification
// @route   PUT /api/notifications/:id
// @access  Admin
export const updateNotification = asyncHandler(async (req, res) => {
    const { message, startDate, endDate, priority, isActive } = req.body;

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    notification.message = message || notification.message;
    notification.startDate = startDate !== undefined ? startDate : notification.startDate;
    notification.endDate = endDate !== undefined ? endDate : notification.endDate;
    notification.priority = priority !== undefined ? priority : notification.priority;
    notification.isActive = isActive !== undefined ? isActive : notification.isActive;

    const updated = await notification.save();
    res.json(updated);
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Admin
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }


    res.json({ message: "Notification removed successfully" });
});