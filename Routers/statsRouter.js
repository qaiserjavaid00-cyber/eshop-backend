// routes/adminDashboardRoutes.js
import express from "express";
import { getCustomerStats, getInventoryStats, getOrderStats, getOrderStatsChart, getRevenueStats, getRevenueStatsForChart, getTopProducts } from "../Controllers/statsController.js";
import { admin, protect } from "../middleware/protect.js";


const statsRouter = express.Router();

statsRouter.get("/admin/revenue", getRevenueStats);
statsRouter.get("/admin/revenue/chart", getRevenueStatsForChart);
statsRouter.get("/admin/orders", getOrderStats);
statsRouter.get("/admin/orders/chart", getOrderStatsChart);

statsRouter.get("/admin/customers", getCustomerStats);
statsRouter.get("/admin/top-products", getTopProducts);
statsRouter.get("/admin/inventory", getInventoryStats);
export default statsRouter;
