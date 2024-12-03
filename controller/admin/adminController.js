const Admin = require("../../model/adminModel/adminSchema")
const User = require("../../model/userModel/userSchema")
const userSchema =require("../../model/userModel/userSchema")
const Category = require("../../model/userModel/categorySchema")
const Product = require("../../model/userModel/productSchema")
const Order = require("../../model/userModel/orderSchema")
const moment = require("moment")


const loadLogin = (req,res)=>{
    res.render("admin/login")
}


const login = async (req,res)=>{
    
    try {

        const {email,password} = req.body;

        const admin = await Admin.findOne({email:email})

        if(!admin) return res.render("admin/login", {errorMessage:"Invalid credentials, Please try again"})
            req.session.Admin = true

            if(admin.password === password){
                req.session.Admin = email;
                res.redirect("/admin/dashboard")
            }
            if (req.session.Admin == true) {
                res.redirect("/admin/dashboard")
            }
    
        
    } catch (error) {
        console.log("Error for login in  dashbord",error);
            
    }

}




const loadEditUser = (req,res)=>{
    res.render("admin/editUser")
}



const getSalesReport = async (filter, start, end) => {
    let startDate, endDate;

    if (filter === 'custom' && start && end) {
        // Convert string dates to UTC midnight to ensure consistent date handling
        startDate = moment(start).startOf('day').toDate();
        endDate = moment(end).endOf('day').toDate();
    } else {
        switch (filter) {
            case 'today':  // Changed from 'daily' to match frontend
                startDate = moment().startOf('day').toDate();
                endDate = moment().endOf('day').toDate();
                break;
            case 'week':  // Changed from 'weekly' to match frontend
                startDate = moment().startOf('week').toDate();
                endDate = moment().endOf('week').toDate();
                break;
            case 'month':  // Changed from 'monthly' to match frontend
                startDate = moment().startOf('month').toDate();
                endDate = moment().endOf('month').toDate();
                break;
            case 'year':
                startDate = moment().startOf('year').toDate();
                endDate = moment().endOf('year').toDate();
                break;
            default:
                // Default to current month if filter is invalid
                startDate = moment().startOf('year').toDate();
                endDate = moment().endOf('year').toDate();
        }
    }

    try {
        const order = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalPrice' },
                    totalCouponDiscount: { $sum: '$discount' },
                    totalCancelledOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
                    },
                    totalReturnedOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Returned"] }, 1, 0] },
                    },
                    totalShippedOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Shipped"] }, 1, 0] },
                    },
                    totalDeliveredOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
                    },
                    totalProcessingOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Processing"] }, 1, 0] },
                    },
                    totalPendingOrders:{
                        $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
                    },
                    totalProductOffers: { $sum: '$productOffer' },
                    totalCategoryOffer: { $sum: '$categoryOffer' }
                }
            }
        ]).exec(); // Added .exec() for proper promise handling

        return order[0] || {
            totalOrders: 0,
            totalAmount: 0,
            totalCouponDiscount: 0,
            totalCancelledOrders: 0,
            totalReturnedOrders: 0,
            totalShippedOrders: 0,
            totalDeliveredOrders: 0,
            totalProcessingOrders: 0,
            totalPendingOrders:0,
            totalProductOffers: 0,
            totalCategoryOffer: 0
        };
    } catch (error) {
        console.error('Error fetching sales report:', error);
        throw error; // Propagate error to be handled by the calling function
    }
};



const loadDashboard = async (req, res) => {
    try {
        const filter = req.query.filter || "year"; // Default to month view
        let start = req.query.start || null;
        let end = req.query.end || null;

        const salesReport = await getSalesReport(filter, start, end);

        if (!salesReport) {
            return res.status(404).send("No sales data available for the specified filter.");
        }

        const topSoldProducts = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
              $group: {
                _id: "$orderedItems.product",
                timesSold: { $sum: 1 },
              },
            },
            { $sort: { timesSold: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "products", 
                localField: "_id",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $project: {
                _id: 0,
                productId: "$_id",
                timesSold: 1,
                productDetails: { $arrayElemAt: ["$productDetails", 0] },
              },
            },
          ]);
        //   console.log(topSoldProducts);

          const topCategories = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
              $lookup: {
                from: "products", 
                localField: "orderedItems.product",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            { $unwind: "$productDetails" },
            {
              $lookup: {
                from: "categories", 
                localField: "productDetails.category",
                foreignField: "_id",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            {
              $group: {
                _id: "$categoryDetails._id",
                categoryName: { $first: "$categoryDetails.name" },
                timesSold: { $sum: "$orderedItems.quantity" }, 
              },
            },
            { $sort: { timesSold: -1 } }, 
            { $limit: 10 },
          ]);
          
        //   console.log(topCategories);
          

        const {
            totalOrders,
            totalAmount,
            totalCancelledOrders,
            totalReturnedOrders,
            totalShippedOrders,
            totalDeliveredOrders,
            totalProcessingOrders,
            totalPendingOrders,
        } = salesReport;

        // Render the dashboard view with the data
        res.render("admin/dashboard", {
            totalOrders,
            totalRevenue: totalAmount,
            cancelledOrders: totalCancelledOrders || 0,
            returnedOrders: totalReturnedOrders || 0,
            shippedOrders: totalShippedOrders || 0,
            deliveredOrders: totalDeliveredOrders || 0,
            totalProcessingOrders: totalProcessingOrders,
            totalPendingOrders:totalPendingOrders,
            topSoldProducts,
            topCategories,
        });
    } catch (error) {
        console.error("Error loading dashboard:", error);
        res.status(500).send("Internal Server Error");
    }
};






const loadlogout = (req,res)=>{
    req.session.Admin=null;
    res.redirect("/admin/login")
}

















module.exports = {loadLogin, login, loadEditUser, loadDashboard, loadlogout}