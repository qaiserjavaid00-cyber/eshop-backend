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

////orderstats

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


export const getInventoryStats = asyncHandler(async (req, res) => {
    // Total products
    const totalProducts = await Product.countDocuments();

    // Total variants
    const totalVariants = await Variant.countDocuments();

    // Low stock variants (1–5)
    const lowStockVariants = await Variant.find({
        quantity: { $lte: 5, $gt: 0 },
    })
        .populate("productId", "title") // populate product title only
        .select("quantity size color");  // select fields you want

    // Out-of-stock variants (0 or less)
    const outOfStockVariants = await Variant.find({
        quantity: { $lte: 0 },
    })
        .populate("productId", "title")
        .select("quantity size color");

    // Map to clean frontend-friendly objects
    const lowStockProducts = lowStockVariants.map((v) => ({
        product: v.productId?.title || "Unknown Product",
        quantity: v.quantity,
        size: v.size,
        color: v.color,
    }));

    const outOfStockProducts = outOfStockVariants.map((v) => ({
        product: v.productId?.title || "Unknown Product",
        quantity: v.quantity,
        size: v.size,
        color: v.color,
    }));

    res.status(200).json({
        success: true,
        inventory: {
            totalProducts,
            totalVariants,
            lowStockCount: lowStockProducts.length,
            outOfStockCount: outOfStockProducts.length,
            lowStockProducts,
            outOfStockProducts,
        },
    });
});

/////////CHARTS

export const getRevenueStatsForChart = asyncHandler(async (req, res) => {
    const now = new Date();
    const past30Days = new Date();
    past30Days.setDate(now.getDate() - 29); // include today

    const revenueAgg = await Order.aggregate([
        {
            $match: {
                isPaid: true,
                orderStatus: { $ne: "Cancelled" },
                paidAt: { $gte: past30Days, $lte: now },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
                },
                dailyRevenue: { $sum: "$amountPaid" },
            },
        },
        { $sort: { _id: 1 } }, // sort by date ascending
    ]);

    // Fill missing dates with 0 revenue
    const revenueMap = {};
    revenueAgg.forEach((r) => (revenueMap[r._id] = r.dailyRevenue));

    const result = [];
    for (let d = new Date(past30Days); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);
        result.push({
            date: dateStr,
            revenue: revenueMap[dateStr] || 0,
        });
    }

    res.status(200).json({
        success: true,
        revenue: result,
    });
});


export const getOrderStatsChart = asyncHandler(async (req, res) => {
    const stats = await Order.aggregate([
        {
            $group: {
                _id: "$orderStatus",
                count: { $sum: 1 },
            },
        },
    ]);

    // Transform to object for easier frontend use
    const formattedStats = {};
    stats.forEach((s) => {
        formattedStats[s._id] = s.count;
    });

    res.status(200).json({
        success: true,
        ordersByStatus: formattedStats,
    });
});
