const Order = require("../../model/userModel/orderSchema")
const Wallet = require("../../model/userModel/walletSchema")
const Product = require("../../model/userModel/productSchema")


const loadOrder = async (req, res) => {
    try {
        const limit = 10;
        let page = parseInt(req.query.page, 10) || 1; 
        if (page < 1) page = 1; 
    
        const search = req.query.search || ""; 
        const skip = (page - 1) * limit;
    
        const filter = search
            ? { 'orderedItems.product.name': new RegExp(search, "i") } 
            : {};
    
        const orders = await Order.find(filter)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'orderedItems.product',
                model: 'Product'
            })
            .populate({
                path: 'userId',
                model: 'User'
            });
    
        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);
    
        const statuses = Order.schema.path('status').enumValues;
    
        res.render("admin/adminOrder", {
            orders,
            statuses,
            totalPages,
            currentPage: page,
            totalItems: totalOrders,
            search 
        });
    } catch (error) {
        console.log("error for load order admin sid", error);
    }
}

const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (order) {
            
            res.status(200).json({ message: "Order status updated successfully", order});
        }else{
            
            return res.status(404).json({ message: "Order not found" });
        }

        
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "An error occurred while updating status" });
    }
};


const cancelOrder = async (req, res) => {
    try {
        const { Id } = req.body;
        
        const order = await Order.findById(Id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentMethod === "Wallet" || order.paymentMethod === "Razorpay") {
            const userId = order.userId;
            const wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                return res.status(400).json({ message: "Wallet not found for the user" });
            }



            wallet.balance += order.totalPrice;


            

            wallet.transaction.push({
                transactionType: "credit",
                amount: order.totalPrice,
                status: "completed",
                orderId: order._id,
            });

            await wallet.save();
        }

        if (Array.isArray(order.orderedItems)) {
            for (const item of order.orderedItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.count += item.quantity;
                    await product.save();
                }
            }
        } else {
            return res.status(400).json({ message: "Order items are not available or invalid" });
        }
        
        const result = await Order.findOneAndUpdate(
            { _id:Id }, 
            { status: "Cancelled" },
            { new: true } 
        );

        if (result) {
            res.status(200).json({ message: "Order successfully cancelled", order: result });
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (error) {
        console.error("Error cancelling the order on user side:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// const loadOrderDetails = async (req,res)=>{
//     res.render("admin/sample")
// }

const loadOrderDetails = async (req, res) => {
    const orderId = req.query.id;
    // console.log("Order ID:", orderId);

    try {
        const order = await Order.findOne({ _id: orderId })
            .populate("userId")
            .populate("orderedItems.product")
            .populate("address");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Render the 'sample' view and pass the order details
        res.render("admin/orderDetails", { order });
    } catch (error) {
        console.error("Error loading order details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



const returnOrder = async (req,res)=>{
    try {
        const { Id } = req.query;
        // console.log("id is:",Id)

        const order = await Order.findById(Id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.paymentMethod === "Wallet" || order.paymentMethod === "Razorpay" || (order.paymentMethod === "cashOnDelivery" && order.status === "Delivered")) {
            const userId = order.userId;
            // console.log("ind ind ind")
            const wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                return res.status(400).json({ message: "Wallet not found for the user" });
            }

            wallet.balance += order.totalPrice; 

            wallet.transaction.push({
                transactionType: 'credit', 
                amount: order.totalPrice,
                status: 'completed',
                orderId: order._id,
            });

            await wallet.save();
        }

        const result = await Order.findOneAndUpdate(
            { _id: Id },
            { status: "Returned" },
            { new: true }
        );

        if (result) {
            res.status(200).json({ message: "Order successfully returned", order: result });
        } else {
            res.status(404).json({ message: "Order not found" });
        }
        
    } catch (error) {
        console.log("error for return order ",error)
    }
}

const cancelReturn = async (req,res)=>{
    try {
        const { Id } = req.query;
        console.log("id is:",Id)

        const order = await Order.findById(Id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const result = await Order.findOneAndUpdate(
            { _id: Id },
            { returned: false, status: "Delivered", requsted: true },
            { new: true }
        );
        if (result) {
            res.status(200).json({ message: "Order return request send successfully ", order: result });
        } else {
            res.status(404).json({ message: "Order not found" });
        }

        
    } catch (error) {
        console.log("error for cancel return order admin side ",error)
    }
  }


module.exports = {loadOrder, updateStatus, cancelOrder, loadOrderDetails, returnOrder, cancelReturn}