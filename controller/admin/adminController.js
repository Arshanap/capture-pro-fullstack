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
        startDate = new Date(start);
        endDate = new Date(end);
    } else {
        switch (filter) {
            case 'daily':
                startDate = moment().startOf('day').toDate();
                endDate = moment().endOf('day').toDate();
                break;
            case 'weekly':
                startDate = moment().startOf('week').toDate();
                endDate = moment().endOf('week').toDate();
                break;
            case 'monthly':
                startDate = moment().startOf('month').toDate();
                endDate = moment().endOf('month').toDate();
                break;
            case 'yearly':
                startDate = moment().startOf('year').toDate();
                endDate = moment().endOf('year').toDate();
                break;
            default:
                throw new Error("Invalid filter type.");
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
                    totalProductOffers: { $sum: '$productOffer' },
                    totalCategoryOffer: { $sum: '$categoryOffer' }
                }
            }
        ]);

        return order[0] || null;
    } catch (error) {
        console.error('Error fetching sales report:', error);
        return null;
    }
};



const loadDashboard = async (req, res) => {
    try {
        const filter = req.query.filter || "yearly"; // Default to 'yearly'
        let start = req.query.start || null;
        let end = req.query.end || null;

        // Validate custom date range
        if (filter === 'custom') {
            if (!start || !end) {
                return res.status(400).send("Start and End dates are required for custom filter.");
            }

            start = new Date(start);
            end = new Date(end);

            if (isNaN(start) || isNaN(end)) {
                return res.status(400).send("Invalid date format.");
            }

            if (start > end) {
                return res.status(400).send("Start date cannot be after end date.");
            }
        }

        // Get sales report data
        const salesReport = await getSalesReport(filter, start, end);

        if (!salesReport) {
            return res.status(404).send("No sales data available for the specified filter.");
        }

        const {
            totalOrders,
            totalAmount,
            totalCancelledOrders,
            totalReturnedOrders,
            totalShippedOrders,
            totalDeliveredOrders
        } = salesReport;

        const chartLabels = ["Cancelled", "Returned", "Shipped", "Delivered"];
        const chartData = [
            totalCancelledOrders,
            totalReturnedOrders,
            totalShippedOrders,
            totalDeliveredOrders
        ];

        // Render the dashboard view
        res.render("admin/dashboard", {
            chartLabels: JSON.stringify(chartLabels),
            chartData: JSON.stringify(chartData),
            totalOrders,
            totalRevenue: totalAmount,
            cancelledOrders: totalCancelledOrders,
            returnedOrders: totalReturnedOrders,
            shippedOrders: totalShippedOrders,
            deliveredOrders: totalDeliveredOrders
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