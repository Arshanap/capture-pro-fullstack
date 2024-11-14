const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const adminAuth =  require("../midilware/adminAuth")
const adminController = require("../controller/admin/adminController")
const customerController = require("../controller/admin/customerController")
const productContoller = require("../controller/admin/productController")
const orderController = require("../controller/admin/orderControlller")
const coupenController = require("../controller/admin/coupenController")
// const upload = require("../helper/multer")

// login
router.get("/login", adminAuth.islogin, adminController.loadLogin)
router.post("/login", adminController.login)

// dashboard
router.get("/dashboard", adminController.loadDashboard)

//user
router.get("/users",adminAuth.checkSession, customerController.customerInfo)
router.get("/blockCustomer", customerController.customerBlocked)
router.get("/unblockCustomer", customerController.customerunBlocked)
// router.get("/editUser",adminAuth.checkSession, adminController.loadEditUser)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/re-image');  
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);  
    }
});
const upload = multer({ storage })

//logout
router.get("/logout", adminController.loadlogout)

// product
router.get("/products",adminAuth.checkSession, productContoller.loadProducts)
router.post('/addproduct', upload.array('images', 4), productContoller.addProduct)
router.get("/listProduct",productContoller.listProduct)
router.get("/unlistProduct",productContoller.unlistProduct)
// router.post("/deleteImage", productContoller.deleteSingleImage)
router.post('/productedit', upload.array('image', 4), productContoller.editProduct2)
router.get('/getProductData', productContoller.editProduct);
router.get("/productedit",adminAuth.checkSession, productContoller.editProduct)

// category
router.get("/category",adminAuth.checkSession, customerController.categoryInfo)
router.post("/addcategory", customerController.addCategory)
router.get("/getCategoryById", adminAuth.checkSession, customerController.getCategoryById)
router.post("/editcategory", customerController.editCategory)
router.get("/listed", customerController.categoryListed)
router.get("/unlisted", customerController.categoryunListed)

// orders
router.get("/order",adminAuth.checkSession, orderController.loadOrder)
router.post("/changeOrderStatus", orderController.updateStatus)
router.post("/cancelOrder", orderController.cancelOrder)

// coupen
router.get("/coupen",adminAuth.checkSession, coupenController.loadCoupen)
router.post("/addCoupen", coupenController.addCoupen)
router.delete("/deleteCoupon", coupenController.deleteCoupon)
router.get("/editCoupon", adminAuth.checkSession, coupenController.loadEditCoupon)
router.post("/editCoupon", coupenController.editCoupon)



module.exports = router