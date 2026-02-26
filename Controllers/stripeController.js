import dotenv from 'dotenv';
dotenv.config();
// controllers/stripeController.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // from your .env

export const createPaymentIntent = async (req, res) => {
    const { totalAmount } = req.body;
    console.log("🔍 Received amount from frontend:", totalAmount);
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Stripe accepts smallest currency unit
            currency: "usd",
        });
        console.log("✅ PaymentIntent created:", paymentIntent.id);

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
