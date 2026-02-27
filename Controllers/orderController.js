
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Order from "../Models/Order.js";
import Cart from "../Models/Cart.js";
import Product from "../Models/Product.js";
import Variant from "../Models/Variant.js"
import User from "../Models/User.js";
import stripe from "../utils/stripe.js";
import Coupon from "../Models/Coupon.js";

export const createOrder = async (req, res) => {
    const userId = req.user._id;
    const { paymentIntent, address } = req.body;

    try {
        const userCart = await Cart.findOne({ orderdBy: userId }).populate("products.product");

        if (!userCart) {
            return res.status(400).json({ message: "Cart not found" });
        }

        const newOrder = new Order({
            products: userCart.products,
            paymentIntent,
            address,
            orderdBy: userId,

        });

        await newOrder.save();

        // Step 1: Decrement quantity & increment sold for each product
        const bulkUpdate = userCart.products.map((item) => {
            return {
                updateOne: {
                    filter: { _id: item.product._id },
                    update: {
                        $inc: {
                            quantity: -item.count,
                            sold: item.count,
                        },
                    },
                },
            };
        });

        await Product.bulkWrite(bulkUpdate);

        // Step 2: Empty the cart
        await Cart.deleteOne({ orderdBy: userId });

        res.status(201).json({ message: "Order placed successfully", orderId: newOrder._id });
    } catch (err) {
        console.error("❌ Order creation failed:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

/////////refund Order 

// refundOrder controller
export const refundOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order || !order.isPaid) throw new Error("Order cannot be refunded");

    // 1️⃣ Trigger Stripe refund only
    const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
    });

    // 2️⃣ Update order status tentatively
    order.orderStatus = "Refund Initiated"; // <- NEW
    await order.save();
    console.log("order refund", order)
    res.json({
        success: true,
        message: "Refund initiated. Stock will be reverted after Stripe confirmation.",
        refundId: refund.id,
    });
});

///// partial Refund Order

// @desc    Partially refund an order (ADMIN)
// @route   POST /order/:id/partial-refund
// @access  Admin
export const partialRefundOrder = asyncHandler(async (req, res) => {
    const { items } = req.body;
    /**
     * items = [
     *   { orderItemId: "...", quantity: 2 }
     * ]
     */

    const order = await Order.findById(req.params.id)
        .populate("products.product")
        .populate("products.variant");

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    if (!order.isPaid) {
        res.status(400);
        throw new Error("Only paid orders can be refunded");
    }

    let refundAmount = 0;

    // ===============================
    // 1️⃣ Validate refund quantities
    // ===============================
    items.forEach(({ orderItemId, quantity }) => {
        const item = order.products.id(orderItemId);
        if (!item) {
            throw new Error("Invalid order item");
        }

        const refundableQty =
            item.count - item.refundedQty - item.pendingRefundQty;

        if (quantity <= 0 || quantity > refundableQty) {
            throw new Error(
                `Invalid refund quantity for ${item.product?.title}`
            );
        }

        refundAmount += item.price * quantity;
    });

    if (refundAmount <= 0) {
        throw new Error("Refund amount must be greater than zero");
    }

    // ===============================
    // 2️⃣ Trigger Stripe partial refund ONLY
    // ===============================
    const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: Math.round(refundAmount * 100),
    });

    // ===============================
    // 3️⃣ Mark items as pending refund
    //     🔴 IMPORTANT: webhook will finalize
    // ===============================
    items.forEach(({ orderItemId, quantity }) => {
        const item = order.products.id(orderItemId);
        item.pendingRefundQty += quantity;
    });

    // 🔵 Status is temporary — webhook decides final
    order.orderStatus = "Refund Initiated";

    await order.save();

    res.json({
        success: true,
        message: "Partial refund initiated. Awaiting Stripe confirmation.",
        refundId: refund.id,
        refundAmount,
    });
});



////////create payment Intent

// @desc    Create Stripe PaymentIntent(and Order if needed)
//     @route   POST / order / create - payment - intent
// @access  Private
// @desc    Create Stripe PaymentIntent (and Order if needed)
// @route   POST /order/create-payment-intent
// @access  Private
export const createPaymentIntent = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1️⃣ Fetch cart
    const cart = await Cart.findOne({ orderdBy: userId });
    if (!cart) throw new Error("Cart not found");

    // 2️⃣ Determine amount
    const amount = cart.totalAfterDiscount || cart.cartTotal;

    // 3️⃣ Check for existing unpaid order
    // let order = await Order.findOne({
    //     orderdBy: userId,
    //     isPaid: false,
    //     orderStatus: "Processing", // ✅ ONLY reusable orders
    // });

    // 4️⃣ If no unpaid order, create new
    // if (!order) {
        order = await Order.create({
            products: cart.products.map(item => ({
                product: item.product,
                variant: item.variant || null,
                size: item.size || null,
                color: item.color || null,
                price: item.price,
                count: item.count,
            })),
            address: JSON.stringify(req.body.shippingAddress || req.user.address || {}),
            orderdBy: userId,
            appliedCoupon: cart.appliedCoupon || null,
            amountPaid: amount,
        });
    // }

    console.log("ORDER CREATED ===", order);

    // 5️⃣ Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        metadata: {
            orderId: order._id.toString(),
            userId: userId.toString(),
        },
        automatic_payment_methods: { enabled: true },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
        clientSecret: paymentIntent.client_secret,
        orderId: order._id.toString(),
        amount,
        appliedCoupon: order.appliedCoupon || null,
    });
});

///Buy Now 

// @desc    Create Stripe PaymentIntent for Buy Now
// @route   POST /order/create-buy-now-payment-intent
// @access  Private
export const createBuyNowPaymentIntent = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { productId, variantId, quantity, couponCode, shippingAddress } = req.body;

    if (!productId || !quantity) {
        throw new Error("Product and quantity are required");
    }

    // 1️⃣ Get product
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    let price = product.basePrice;

    // 2️⃣ If variant exists
    let variant = null;
    if (variantId) {
        variant = await Variant.findById(variantId);
        if (!variant) throw new Error("Variant not found");
        price = variant.finalPrice || variant.price;
    }

    if (variant && variant.quantity < quantity) {
        throw new Error("Selected variant is out of stock");
    }

    if (!variant && product.stock < quantity) {
        throw new Error("Product is out of stock");
    }

    let total = price * quantity;
    let appliedCoupon = null;

    // 3️⃣ Handle coupon (same logic as cart)
    if (couponCode) {
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
        });

        if (!coupon) throw new Error("Invalid coupon");

        const discountAmount = (total * coupon.discount) / 100;
        total = total - discountAmount;

        appliedCoupon = {
            code: coupon.code,
            discount: coupon.discount,
        };
    }

    // 4️⃣ Create order (UNPAID)
    const order = await Order.create({
        products: [
            {
                product: product._id,
                variant: variant?._id || null,
                price,
                count: quantity,
            },
        ],
        address: JSON.stringify(
            shippingAddress || req.user.address || {}
        ),
        orderdBy: userId,
        appliedCoupon,
        amountPaid: total,
        orderStatus: "Processing",
        isPaid: false,
    });

    console.log("🟢 BUY NOW ORDER CREATED:", order._id);

    // 5️⃣ Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        metadata: {
            orderId: order._id.toString(),
            userId: userId.toString(),
        },
        automatic_payment_methods: { enabled: true },
    });

    // 6️⃣ Save PaymentIntent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
        clientSecret: paymentIntent.client_secret,
        orderId: order._id.toString(),
        amount: total,
        appliedCoupon,
    });
});

//////webhook

export const stripeWebhook = asyncHandler(async (req, res) => {
    let event;

    try {
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("⚠️ Webhook signature verification failed:", err.message);
        return res.sendStatus(400);
    }

    console.log(`✅ Stripe event received: ${event.type}`);

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        // Populate both product and variant
        const order = await Order.findById(orderId)
            .populate("products.product")
            .populate("products.variant");

        if (!order) return res.json({ received: true });
        if (order.isPaid) return res.json({ received: true });

        // ✅ Mark order as paid
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentIntent = {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100, // store as dollars
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            created: paymentIntent.created,
        };
        await order.save();

        // 🔥 Update stock safely
        try {
            const productOps = [];
            const variantOps = [];

            order.products.forEach((item, idx) => {
                console.log(`Processing order item #${idx}:`, {
                    product: item.product?._id,
                    variant: item.variant?._id,
                    count: item.count,
                });

                // Product stock
                if (item.product?._id && typeof item.product.stock === "number") {
                    productOps.push({
                        updateOne: {
                            filter: { _id: item.product._id },
                            update: { $inc: { stock: -item.count, sold: item.count } },
                        },
                    });
                }

                // Variant stock
                if (item.variant?._id && typeof item.variant.quantity === "number") {
                    variantOps.push({
                        updateOne: {
                            filter: { _id: item.variant._id },
                            update: { $inc: { quantity: -item.count, sold: item.count } },
                        },
                    });
                }
            });

            // Execute bulk writes separately
            if (productOps.length > 0) {
                console.log("Updating Product stock:", productOps);
                await Product.bulkWrite(productOps);
            }
            if (variantOps.length > 0) {
                console.log("Updating Variant stock:", variantOps);
                await Variant.bulkWrite(variantOps);
            }

            console.log("✅ Stock updated successfully");
        } catch (err) {
            console.error("❌ Stock update failed:", err);
        }

        // 🎟️ Mark coupon as used if exists
        if (order.appliedCoupon?.code) {
            const couponCode = order.appliedCoupon.code.toUpperCase();
            await Coupon.updateOne(
                { code: couponCode },
                { $addToSet: { usedBy: order.orderdBy } }
            );
            console.log(`✅ Coupon ${couponCode} applied for user ${order.orderdBy}`);
        }

        // 🧹 Clear cart
        await Cart.deleteMany({ orderdBy: order.orderdBy });
        console.log("🧹 Cart cleared for user", order.orderdBy);
    }


    /* ======================================================
       REFUNDS (FULL + PARTIAL)
    ====================================================== */
    if (event.type === "charge.refunded") {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        const order = await Order.findOne({ paymentIntentId })
            .populate("products.product")
            .populate("products.variant");

        if (!order) return res.json({ received: true });

        // 🔴 Determine if this is a full refund
        const totalRefunded = charge.amount_refunded / 100; // in dollars
        const isFullRefund = totalRefunded >= order.amountPaid;
        console.log(totalRefunded, isFullRefund)
        if (isFullRefund) {
            // ===============================
            // ✅ FULL REFUND — EXACTLY AS BEFORE
            // ===============================
            order.orderStatus = "Refunded";
            order.isPaid = false;          // funds returned
            order.amountPaid = 0;          // reset paid amount
            await order.save();

            // 🔥 Revert stock
            const productOps = [];
            const variantOps = [];
            order.products.forEach(item => {
                if (item.product?._id && typeof item.product.stock === "number") {
                    productOps.push({
                        updateOne: {
                            filter: { _id: item.product._id },
                            update: { $inc: { stock: item.count, sold: -item.count } },
                        },
                    });
                }
                if (item.variant?._id && typeof item.variant.quantity === "number") {
                    variantOps.push({
                        updateOne: {
                            filter: { _id: item.variant._id },
                            update: { $inc: { quantity: item.count, sold: -item.count } },
                        },
                    });
                }
            });
            if (productOps.length > 0) await Product.bulkWrite(productOps);
            if (variantOps.length > 0) await Variant.bulkWrite(variantOps);

            console.log(`✅ FULL refund processed for order ${order._id}`);
        }
        else {
            // ===============================
            // 🟡 PARTIAL REFUND (DEBUGGING VERSION)
            // ===============================
            const productOps = [];
            const variantOps = [];

            console.log("🔹 Entered PARTIAL REFUND block for order:", order._id);
            console.log("🔹 Order products before processing:", JSON.stringify(order.products, null, 2));

            order.products.forEach((item, index) => {
                console.log(`\n🔸 Processing product #${index}`, {
                    _id: item._id.toString(),
                    pendingRefundQty: item.pendingRefundQty,
                    refundedQty: item.refundedQty,
                    count: item.count,
                    productId: item.product?._id?.toString(),
                    variantId: item.variant?._id?.toString(),
                });

                if (item.pendingRefundQty && item.pendingRefundQty > 0) {
                    const qty = item.pendingRefundQty;

                    console.log(`🔹 Applying refund qty: ${qty} to productId ${item.product?._id}`);

                    item.refundedQty += qty;
                    item.pendingRefundQty = 0;

                    console.log(`🔹 Updated refundedQty: ${item.refundedQty}, pendingRefundQty: ${item.pendingRefundQty}`);

                    if (item.product?._id) {
                        productOps.push({
                            updateOne: {
                                filter: { _id: item.product._id },
                                update: { $inc: { stock: qty, sold: -qty } },
                            },
                        });
                        console.log(`🔹 Queued stock update for product ${item.product._id}`);
                    }

                    if (item.variant?._id) {
                        variantOps.push({
                            updateOne: {
                                filter: { _id: item.variant._id },
                                update: { $inc: { quantity: qty, sold: -qty } },
                            },
                        });
                        console.log(`🔹 Queued stock update for variant ${item.variant._id}`);
                    }
                } else {
                    console.log(`🔹 Skipping product #${index}, no pendingRefundQty`);
                }
            });

            console.log("🔹 Product bulk operations:", productOps);
            console.log("🔹 Variant bulk operations:", variantOps);

            if (productOps.length > 0) await Product.bulkWrite(productOps);
            if (variantOps.length > 0) await Variant.bulkWrite(variantOps);

            // Update amountPaid after partial refund
            order.amountPaid = order.products.reduce((sum, item) => {
                const paidUnits = item.count - item.refundedQty;
                return sum + paidUnits * item.price;
            }, 0);
            console.log(`🔹 Updated order.amountPaid: ${order.amountPaid}`);


            // 🔴 Mark products as modified to ensure Mongoose saves changes
            order.markModified("products");

            const fullyRefunded = order.products.every(
                (item) => item.refundedQty === item.count
            );

            console.log("🔹 fullyRefunded check:", fullyRefunded);

            if (fullyRefunded) {
                order.orderStatus = "Refunded";
                order.isPaid = false;
                console.log("🔹 Order fully refunded, status set to 'Refunded'");
            } else {
                order.orderStatus = "Partially Refunded";
                console.log("🔹 Order partially refunded, status set to 'Partially Refunded'");
            }

            await order.save();

            console.log(`🟡 Partial refund processed for order ${order._id}`);
            console.log("🔹 Order products after processing:", JSON.stringify(order.products, null, 2));
        }


    }


    res.json({ received: true });
});


////loged user orders 
export const getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const orders = await Order.find({ orderdBy: userId })
        .populate("products.product")
        .sort({ createdAt: -1 });

    res.json(orders);
});

////get order by orderId
////loged user orders 
export const getOrderById = asyncHandler(async (req, res) => {

    const orderId = req.params.orderId
    const order = await Order.findById(orderId)
        .populate("products.product").populate("products.variant")


    res.json(order);
});


// ✅ ADMIN: Get all orders
export const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({})
        .populate("orderdBy", "name email")
        .populate("products.product")
        .sort({ createdAt: -1 })
    res.json(orders);
});



// ✅ ADMIN: Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    order.orderStatus = status;
    await order.save();

    res.json({ message: "Order status updated", order });
});




export const createCODOrder = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("cart");
    if (!user || !user.cart) throw new Error("No cart found");

    const cartItems = user.cart.products;

    const order = await Order.create({
        products: cartItems,
        paymentIntent: {
            id: "COD_" + new Date().getTime(),
            amount: user.cart.totalAfterDiscount || user.cart.cartTotal,
            currency: "PKR",
            status: "Cash on Delivery",
            created: Date.now(),
        },
        address: user.address,
        orderdBy: req.user._id,
        orderStatus: "Processing",
    });

    // Optional: Clear cart after order
    user.cart.products = [];
    user.cart.cartTotal = 0;
    user.cart.totalAfterDiscount = 0;
    await user.cart.save();

    res.status(201).json(order);
});


