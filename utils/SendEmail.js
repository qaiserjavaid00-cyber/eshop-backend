import nodemailer from "nodemailer";

export const sendConfirmationEmail = async (to, order) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"My Shop" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Order Confirmation - My Shop",
        html: `
            <h2>Thank you for your order!</h2>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Total:</strong> Rs. ${order.paymentIntent.amount / 100}</p>
            <p><strong>Status:</strong> ${order.orderStatus}</p>
            <p>We’ll notify you once your order is shipped.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
};
