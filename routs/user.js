const express = require("express")
const router = express.Router()
const userAuth = require("../midilware/userAuth")
const userController = require("../controller/user/userController")
const passport = require("passport")
const productController = require("../controller/user/productController")
const accountController = require("../controller/user/accountController")
const orderController = require("../controller/user/orderController")
const cartController = require("../controller/user/cartController")
const passwordController = require("../controller/user/passwordController")
const checkoutController = require("../controller/user/checkoutController")
const wishlistController = require("../controller/user/wishlistController")
const walletController = require("../controller/user/walletController")
const invoiceController = require("../controller/user/invoiceContoller")
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require("../model/userModel/userSchema")
const Cart = require("../model/userModel/cartSchema")
const Product = require("../model/userModel/productSchema")
const Order = require("../model/userModel/orderSchema")
const Address = require("../model/userModel/adressSchema")
const Coupon = require("../model/userModel/couponSchema")
const { v4: uuidv4 } = require('uuid');

// const coupenController = require("../controller/user/")


// login
router.get("/user/login", userAuth.islogin, userController.loadLogin)
router.post("/user/login", userController.login)

// signup
router.get("/user/signup", userAuth.islogin, userController.loadsignup)
router.post("/user/signup", userController.registerUser)

// OTP Verfy
router.get("/user/verfyOTP", userController.loadOTP)
router.post("/user/verifyOTP", userController.verifyOtp);

// change password
router.get("/user/changePassword", passwordController.loadCurentChange)
router.post("/user/changePassword", passwordController.checkPassword)

// forgot password 
router.get("/user/emailVerify", passwordController.loadEmail)
router.post("/user/emailVerify", passwordController.checkEmail)
router.get("/user/forgotOTP", passwordController.loadForgotOTP)
router.post("/user/forgotOTP",passwordController.checkOTP)
router.post("/user/forgotResendOtp", passwordController.resendOtp)
router.get("/user/change-Password", passwordController.loadChangePassword)
router.post("/user/change-Password", passwordController.conformPassword)

// create Password
router.get("/user/createPassword", passwordController.loadCreatePassword)
router.post("/user/createPassword", passwordController.createPassword)


// ResendOTP
router.post("/user/resendOtp", userController.resendOtp)

// Home
router.get('/user/home', userController.loadHome)

// Product
router.get("/user/productlist" ,userAuth.checkSession, productController.loadProduct)

// Google signup
router.get("/user/auth/google", passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/user/login" }), userController.checksession, (req, res) => {
    res.redirect("/user/home");
});


// logout
router.get("/user/logout", userController.loadlogout)

// Address Management
router.get("/user/account",userAuth.checkSession, accountController.loadAccount)
router.post("/user/addAddress", accountController.addAddress)
router.get("/user/editAddress",userAuth.checkSession, accountController.loadEdit)
router.post("/user/editAddress", accountController.editAddress)
router.get("/user/deleteAddress", accountController.deleteAddress)

// details 
router.get("/user/details", userAuth.checkSession, accountController.loadDetails)
router.post("/user/updateDetails", accountController.editDetails)

// Cart
router.get("/user/cart", userAuth.checkSession, cartController.loadCart)
router.post("/user/addToCart", cartController.addProduct)
router.delete("/user/cartRemove", cartController.removeProduct);
router.post("/user/valueUpdate", cartController.valueUpdate)

// checkout
router.get("/user/checkout", userAuth.checkSession, checkoutController.loadCheckout)
router.post('/user/checkoutAddAddress', checkoutController.addAddress)
router.get("/user/checkoutEditAddress", userAuth.checkSession, checkoutController.loadEditAddress)
router.post("/user/checkoutEditAddress", checkoutController.editAddress)
router.post('/user/applyCoupon', checkoutController.applyCoupon)
router.post("/user/removeCoupon", checkoutController.removeCoupon)

// Orders
router.get("/user/orders", userAuth.checkSession, orderController.loadOrder)
router.post("/user/placeOrder", orderController.placeOrder)
router.get("/user/orderSuccess", userAuth.checkSession, orderController.loadSuccess)
router.post("/user/cancelOrder", orderController.cancelOrder)
router.get("/user/orderDetails", userAuth.checkSession, orderController.loadOrderDetails)
router.post("/user/returnOrder", orderController.returnOrder)

// shop
router.get("/user/shop", userAuth.checkSession, productController.loadShop)

// wishlist
router.get("/user/wishlist", userAuth.checkSession, wishlistController.loadWishlist)
router.post("/user/addWishlist", wishlistController.addWishlist)
router.delete("/user/wishlistRemove", wishlistController.removeProduct)

// wallet 
router.get("/user/wallet", userAuth.checkSession, walletController.loadWallet)
router.post("/user/addFund", walletController.addFund)

// Invoice
router.get("/user/Invoice", invoiceController.getInvoice)

// coupen
// router.get("/user/coupen", userAuth.checkSession, )


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Route to create a Razorpay order
router.post('/user/razorPay', async (req, res) => {
    const email = req.session.User;
    const user = await User.findOne({ email });
    const cart1 = await Cart.findOne({ userId: user._id });
    const options = {
        amount: cart1.grandTotal * 100, // Amount in paise
        currency: 'INR',
        receipt: 'receipt#1',
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json({
            key: process.env.RAZORPAY_KEY_ID,
            amount: cart1.grandTotal,
            currency: order.currency,
            id: order.id
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Route to verify Razorpay payment
router.post('/user/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address, type } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const userEmail = req.session.User;

    try {
        const user = await User.findOne({ email: userEmail });
        if (!user) return res.status(400).json({ success: false, error: 'User not found' });

        const selectedAddress = await Address.findById(address);
        if (!selectedAddress) return res.status(400).json({ success: false, error: 'Invalid address' });

        const cartDocuments = await Cart.find({ userId: user._id }).populate({
            path: 'items.productId',
            model: 'Product'
        });

        if (!cartDocuments || cartDocuments.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty' });
        }

        const order = await Cart.findOne({ userId: user._id }).populate("items.productId");

        if (!order) {
          return res.status(400).json({ error: "Cart not found" });
        }
        
            const stockErrors = []; // Array to collect errors
            var handleStock1 = []; // Array to collect successful stock updates
          
            // Iterate over order items and process stock validation
            for (const item of order.items) {
              const product = await Product.findById(item.productId);
          
              if (!product || product.count < item.quantity) {
                stockErrors.push(
                  `Product "${product?.productName || "Unknown Product"}" is out of stock.`
                );
              } else {
                handleStock1.push(product);
              }
            }
          
            if (stockErrors.length > 0) {
                return res.status(400).json({
                  message: "Stock verification failed for some products.",
                  errors: stockErrors, // Array of error messages
                });
              }
          

        let totalAmount = 0;
        const items = [];

        for (const cart of cartDocuments) {
            for (const item of cart.items) {
                const { productId, quantity, price } = item;
                const product = productId;
                totalAmount += price * quantity;
                items.push({
                    product: product._id,
                    quantity,
                    price,
                    name: product.productName,
                });
            }
        }

        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

            if (generated_signature !== razorpay_signature) {
                const generatedOid = await getNextOrderId();
    
                // Save the order with 'failed' status if payment failed
                const newOrder = new Order({
                    userId: user._id,
                    orderId: generatedOid,
                    orderedItems: items,
                    totalPrice: cartDocuments[0].grandTotal,
                    finalAmount: totalAmount,
                    paymentMethod: 'Razorpay',
                    paymentStatus: "Failed",
                    status:"Pending",
                    address: selectedAddress._id,
                    invoiceDate: new Date(),
                    createdOn: new Date(),
                });
                await newOrder.save();
                await Cart.deleteMany({ userId: user._id });
                return res.status(200).json({ success: true, error: 'Payment not success but order saved' });
            }

        const generatedOid = await getNextOrderId();

        const newOrder = new Order({
            userId: user._id,
            orderId: generatedOid,
            orderedItems: items,
            totalPrice: cartDocuments[0].grandTotal,
            finalAmount: totalAmount,
            paymentMethod: 'Razorpay',
            paymentStatus: "Success",
            address: selectedAddress._id,
            invoiceDate: new Date(),
            createdOn: new Date(),
            paymentStatus: type === "failed" ? "Failed" : "Success",
        });

        await newOrder.save();

        for (const item of items) { 
            const product = await Product.findById(item.product);
            product.count -= item.quantity;
            await product.save();
        }

        await Cart.deleteMany({ userId: user._id })

        res.json({ success: true, message: 'Payment processed and order placed', orderId: generatedOid });
    } catch (error) {
        console.error('Error during payment verification or order processing:', error);
        res.status(500).json({ success: false, message: 'Error during payment verification or order processing' });
    }
});


  // repay failed

  const razorpay1 = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Route to create Razorpay order
router.post("/user/razorPay2", async (req, res) => {
    const { Id } = req.body;

    try {
        const order = await Order.findById(Id);
        if (!order) return res.status(400).json({ error: "Order not found" });

        const options = {
            amount: order.finalAmount * 100,
            currency: "INR",
            receipt: `order_rcptid_${Id}`
        };

        const razorpayOrder = await razorpay1.orders.create(options);
        res.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Failed to create Razorpay order" });
    }
});

// Route to verify payment and place order
router.post("/user/verify2", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, Id } = req.body;

    try {
        // Find the order and populate the ordered items
        const order = await Order.findById(Id).populate("orderedItems.product");
        if (!order) {
          return res.status(400).json({ error: "Order not found" });
        }
      
        // Arrays to handle stock validation results
        const stockErrors = []; // Collects error messages
        const handleStock = []; // Collects successfully validated products
      
        // Iterate over ordered items for stock validation
        for (const item of order.orderedItems) {
          const product = await Product.findById(item.product);
      
          if (!product || product.count < item.quantity) {
            // Add errors to the stockErrors array
            stockErrors.push(
              `Product "${product?.productName || "Unknown Product"}" is out of stock.`
            );
          } else {
            // Add valid products to handleStock
            handleStock.push(product);
          }
        }
      
        // Check for any errors
        if (stockErrors.length > 0) {
          return res.status(400).json({
            message: "Stock verification failed for some products.",
            error: "Stock verification failed for some products.",
          });
        }
      

      
        

        // Validate Razorpay signature
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        const generatedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: "Invalid signature" });
        }

        // Update order status
        order.paymentStatus = "Success";
        order.status = "Processing";
        await order.save();

        // Reduce stock for ordered items
        for (const item of order.orderedItems) {
            const product = item.product;
            if (product.count < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${product.productName}` });
            }
            product.count -= item.quantity;
            await product.save();
        }


        res.json({ success: true, message: "Payment verified and order placed successfully." });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});

  

async function getNextOrderId() {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomSuffix}`;
}


module.exports = router