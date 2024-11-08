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
const checkoutController= require("../controller/user/checkoutController")


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

// Orders
router.get("/user/orders", userAuth.checkSession, orderController.loadOrder)
router.post("/user/placeOrder", orderController.placeOrder)
router.get("/user/orderSuccess", userAuth.checkSession, orderController.loadSuccess)



module.exports = router