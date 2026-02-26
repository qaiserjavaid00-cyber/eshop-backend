// controllers/adminDashboardController.js
import asyncHandler from "express-async-handler";
import Order from "../Models/Order.js";
import Variant from "../Models/Variant.js";
import User from "../Models/User.js";
import Product from "../Models/Product.js";



export const getRevenueStats = asyncHandler(async (req, res) => {

    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const revenueAgg = await Order.aggregate([
        {
            $match: {
                isPaid: true,
                orderStatus: { $ne: "Cancelled" },
            }
        },
        {
            $facet: {
                totalRevenue: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amountPaid" }
                        }
                    }
                ],
                thisMonth: [
                    {
                        $match: {
                            paidAt: { $gte: startOfThisMonth }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amountPaid" }
                        }
                    }
                ],
                lastMonth: [
                    {
                        $match: {
                            paidAt: {
                                $gte: startOfLastMonth,
                                $lte: endOfLastMonth
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amountPaid" }
                        }
                    }
                ]
            }
        }
    ]);

    const totalRevenue = revenueAgg[0].totalRevenue[0]?.total || 0;
    const thisMonthRevenue = revenueAgg[0].thisMonth[0]?.total || 0;
    const lastMonthRevenue = revenueAgg[0].lastMonth[0]?.total || 0;

    const percentageChange =
        lastMonthRevenue === 0
            ? 100
            : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    res.status(200).json({
        success: true,
        revenue: {
            total: totalRevenue,
            thisMonth: thisMonthRevenue,
            lastMonth: lastMonthRevenue,
            changePercent: Number(percentageChange.toFixed(2)),
        }
    });
});



export const getOrderStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = await Order.aggregate([
        {
            $facet: {
                totalOrders: [
                    { $count: "count" }
                ],

                thisMonthOrders: [
                    {
                        $match: {
                            createdAt: { $gte: startOfThisMonth }
                        }
                    },
                    { $count: "count" }
                ],

                pendingOrders: [
                    {
                        $match: {
                            orderStatus: "Processing"
                        }
                    },
                    { $count: "count" }
                ]
            }
        }
    ]);

    res.status(200).json({
        success: true,
        orders: {
            total: stats[0].totalOrders[0]?.count || 0,
            thisMonth: stats[0].thisMonthOrders[0]?.count || 0,
            pending: stats[0].pendingOrders[0]?.count || 0,
        }
    });
});


//////users 
// controllers/adminDashboardController.js

export const getCustomerStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1️⃣ Total customers (exclude admins)
    const totalCustomers = await User.countDocuments({
        isAdmin: false,
    });

    // 2️⃣ New customers this month
    const newCustomersThisMonth = await User.countDocuments({
        isAdmin: false,
        createdAt: { $gte: startOfThisMonth },
    });

    // 3️⃣ Active customers (users with at least one paid order)
    const activeCustomersAgg = await Order.aggregate([
        {
            $match: {
                isPaid: true,
                orderStatus: { $ne: "Cancelled" },
            },
        },
        {
            $group: {
                _id: "$orderdBy", // unique users
            },
        },
        {
            $count: "count",
        },
    ]);

    const activeCustomers = activeCustomersAgg[0]?.count || 0;

    res.status(200).json({
        success: true,
        customers: {
            total: totalCustomers,
            newThisMonth: newCustomersThisMonth,
            active: activeCustomers,
        },
    });
});


////get Top 5 products 
// controllers/adminDashboardController.js
export const getTopProducts = asyncHandler(async (req, res) => {
    // Aggregate total sold per product
    const topProducts = await Variant.aggregate([
        {
            $group: {
                _id: "$productId",
                totalSold: { $sum: "$sold" },
                totalRevenue: { $sum: { $multiply: ["$sold", "$price"] } }
            }
        },
        {
            $sort: { totalSold: -1 } // descending by sold units
        },
        { $limit: 5 }, // top 5 products
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productInfo"
            }
        },
        {
            $unwind: "$productInfo"
        },
        {
            $project: {
                _id: 0,
                productId: "$_id",
                title: "$productInfo.title",
                slug: "$productInfo.slug",
                images: "$productInfo.images",
                totalSold: 1,
                totalRevenue: 1
            }
        }
    ]);

    res.status(200).json({
        success: true,
        topProducts
    });
});

////inventory stats 

// controllers/adminDashboardController.js

export const getInventoryStats = asyncHandler(async (req, res) => {
    // Total products
    const totalProducts = await Product.countDocuments();

    // Total variants
    const totalVariants = await Variant.countDocuments();

    // Low stock variants (<=5)
    const lowStockVariants = await Variant.countDocuments({ quantity: { $lte: 5, $gt: 0 } });

    // Out-of-stock variants
    const outOfStockVariants = await Variant.countDocuments({ quantity: { $lte: 0 } });

    res.status(200).json({
        success: true,
        inventory: {
            totalProducts,
            totalVariants,
            lowStockVariants,
            outOfStockVariants,
        },
    });
});


