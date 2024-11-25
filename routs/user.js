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

// coupen
// router.get("/user/coupen", userAuth.checkSession, )




// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  
  // Route to create a Razorpay order
  router.post('/user/razorPay', async (req, res) => {
    // console.log('helloooo')
    const email = req.session.User
    const user = await User.findOne({email})
    const cart1 = await Cart.findOne({userId:user._id})
    const options = {
      amount: cart1.grandTotal*100, 
      currency: 'INR',
      receipt: 'receipt#1',
    };
    // console.log(options);
    
  
    try {
        const cart = await Cart.findOne({userId:user._id})
      const order = await razorpay.orders.create(options);
      res.json({
        key: process.env.RAZORPAY_KEY_SECRET, 
        amount: cart.grandTotal,
        currency: order.currency,
        id: order.id
      });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  
 
  router.post('/user/verify', async (req, res) => {
    // console.log('Verifying Razorpay payment...');
//  console.log("1")
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address } = req.body;
    console.log('Received data:', { razorpay_order_id, razorpay_payment_id, razorpay_signature, address });

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const userEmail = req.session.User;

    try {
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        const userId = user._id;
        const selectedAddress = await Address.findById(address);
        if (!selectedAddress) {
            return res.status(400).json({ success: false, error: 'Invalid address' });
        }
// console.log("2")
        const cartDocuments = await Cart.find({ userId }).populate({
            path: 'items.productId',
            model: 'Product'
        });

        if (!cartDocuments || cartDocuments.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty' });
        }

        let totalAmount = 0;
        let totalQuantity = 0;
        let totalProductOffer = 0;
        const items = [];
// console.log("3")
        // Loop through each item in the cart
        for (const cart of cartDocuments) {
            for (const item of cart.items) {
                const { productId, quantity, price } = item;
                const product = productId;

                if (product.count < quantity) {
                    return res.status(400).json({
                        success: false,
                        error: `${product.productName} has insufficient stock. Only ${product.count} left.`
                    });
                }

                let offer = 0;
                if (typeof product.salePrice === 'number' && typeof product.regularPrice === 'number') {
                    offer = product.regularPrice - product.salePrice;
                    totalProductOffer += offer * quantity;
                }

                totalAmount += price * quantity;
                totalQuantity += quantity;
                items.push({
                    product: product._id,
                    quantity,
                    price,
                    name: product.productName,
                });
            }
        }
// console.log("4")
        // Validate Razorpay signature
        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }
        const cart = await Cart.findOne({userId})

        const generatedOid = await getNextOrderId();

        const newOrder = new Order({
            userId,
            orderId: generatedOid,
            orderedItems: items,
            totalPrice: cart.grandTotal,
            discount: cart.discountAmount, 
            finalAmount: totalAmount,
            paymentMethod: 'Razorpay',
            address: selectedAddress._id,
            invoiceDate: new Date(),
            createdOn: new Date(),
            productOffer: totalProductOffer
        });
// console.log("5")
        await newOrder.save();

        // Reduce product stock
        for (const item of items) {
            const product = await Product.findById(item.product);
            product.count -= item.quantity;
            await product.save();
        }

        // Clear the user's cart
        await Cart.deleteMany({ userId });
// console.log("6")
        res.json({ success: true, message: 'Payment verified and order placed successfully', orderId: generatedOid });
    } catch (error) {
        console.error('Error during payment verification or order processing:', error);
        res.status(500).json({ status: 'failed', message: 'Error during payment verification or order processing' });
    }
});



async function getNextOrderId() {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomSuffix}`;
}


module.exports = router