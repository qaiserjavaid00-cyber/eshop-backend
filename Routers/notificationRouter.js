import express from "express";
import {
    createNotification,
    getAllNotifications,
    getActiveNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
} from "../Controllers/notificationController.js";
import { admin, protect } from "../middleware/protect.js";


const notificationRouter = express.Router();

// Public
notificationRouter.get("/", getAllNotifications);
notificationRouter.get("/active", getActiveNotifications);

// Admin protected
notificationRouter.post("/", protect, admin, createNotification);
notificationRouter.get("/:id", protect, admin, getNotificationById);
notificationRouter.put("/edit/:id", protect, admin, updateNotification);
notificationRouter.delete("/del/:id", protect, admin, deleteNotification);

export default notificationRouter;