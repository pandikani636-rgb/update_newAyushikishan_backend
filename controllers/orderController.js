const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendWhatsapp = require('../utils/sendWhatsapp');
const sendCustomerEmail = require('../utils/sendCustomerEmail');

// Create New Order
exports.newOrder = asyncErrorHandler(async (req, res, next) => {

    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });

    // Send WhatsApp Notification
    await sendWhatsapp({
        name: req.user.name,
        phoneNo: shippingInfo.phoneNo,
        orderId: order._id,
        totalPrice: totalPrice
    });

    // Update Stock
    orderItems.forEach(async (i) => {
        await updateStock(i.product, i.quantity);
    });

    // Send Customer Order Confirmation Email
    const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #16a34a; padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Order Confirmed</h1>
                <p style="color: #dcfce7; margin-top: 5px; font-size: 14px;">Thank you for your purchase!</p>
            </div>
            <div style="padding: 30px;">
                <p style="color: #334155; font-size: 16px; font-weight: 600;">Hi ${req.user.name},</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">We have received your order and are currently processing it. Below are your order details:</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; color: #1e293b; font-weight: 700;">Order ID: <span style="color: #16a34a;">#${order._id}</span></p>
                    <p style="margin: 0; color: #1e293b; font-weight: 700;">Total Amount: <span style="color: #16a34a;">₹${totalPrice}</span></p>
                </div>

                <div style="margin-top: 30px;">
                    <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px;">Shipping Address</h3>
                    <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0;">
                        ${shippingInfo.address},<br>
                        ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pincode}<br>
                        Phone: ${shippingInfo.phoneNo}
                    </p>
                </div>

                <div style="margin-top: 40px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px;">If you have any questions, please contact our support team.</p>
                </div>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 12px; font-weight: 600;">© ${new Date().getFullYear()} Shree Kishan Aayushi. All rights reserved.</p>
            </div>
        </div>
    `;

    const customerEmailText = `
Order Confirmed - Thank you for your purchase!
Hi ${req.user.name},

We have received your order and are currently processing it. Below are your order details:
Order ID: #${order._id}
Total Amount: ₹${totalPrice}

Shipping Address:
${shippingInfo.address},
${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pincode}
Phone: ${shippingInfo.phoneNo}

If you have any questions, please contact our support team.
© ${new Date().getFullYear()} Shree Kishan Aayushi. All rights reserved.
    `;

    await sendCustomerEmail({
        email: req.user.email,
        subject: `Order Confirmation - #${order._id}`,
        html: customerEmailHtml,
        text: customerEmailText
    });

    res.status(201).json({
        success: true,
        order,
    });
});

// Endpoint to upload prescription file
exports.uploadPrescription = asyncErrorHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorHandler("Please upload a file", 400));
    }
    const prescriptionUrl = `uploads/${req.file.filename}`;

    res.status(200).json({
        success: true,
        url: prescriptionUrl
    });
});

// Get Single Order Details
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});


// Get Logged In User Orders
exports.myOrders = asyncErrorHandler(async (req, res, next) => {

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (!orders) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});


// Get All Orders ---ADMIN
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {

    const orders = await Order.find().sort({ createdAt: -1 });

    if (!orders) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        orders,
        totalAmount,
    });
});

// Update Order Status ---ADMIN
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("Already Delivered", 400));
    }

    if (req.body.status === "Shipped") {
        order.shippedAt = Date.now();
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });

    // Send Status Update Email
    const statusEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #16a34a; padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Order Status Update</h1>
                <p style="color: #dcfce7; margin-top: 5px; font-size: 14px;">Your order has a new update.</p>
            </div>
            <div style="padding: 30px;">
                <p style="color: #334155; font-size: 16px; font-weight: 600;">Hi ${order.user.name},</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">The status of your order <strong style="color: #1e293b;">#${order._id}</strong> has been updated.</p>
                
                <div style="background-color: #f8fafc; padding: 25px 20px; border-radius: 10px; margin: 25px 0; text-align: center; border: 2px dashed #bbf7d0;">
                    <p style="margin: 0; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Current Status</p>
                    <p style="margin: 10px 0 0 0; color: #16a34a; font-weight: 900; font-size: 22px; text-transform: uppercase; letter-spacing: 1.5px;">${req.body.status}</p>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px;">Thank you for shopping with us!</p>
                </div>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 12px; font-weight: 600;">© ${new Date().getFullYear()} Shree Kishan Aayushi. All rights reserved.</p>
            </div>
        </div>
    `;

    const statusEmailText = `
Order Status Update
Hi ${order.user.name},

The status of your order #${order._id} has been updated.
Current Status: ${req.body.status}

Thank you for shopping with us!
© ${new Date().getFullYear()} Shree Kishan Aayushi. All rights reserved.
    `;

    await sendCustomerEmail({
        email: order.user.email,
        subject: `Order Update - #${order._id}`,
        html: statusEmailHtml,
        text: statusEmailText
    });

    res.status(200).json({
        success: true
    });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
}

// Delete Order ---ADMIN
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    await order.remove();

    res.status(200).json({
        success: true,
    });
});