const Order = require("../../model/userModel/orderSchema")


const loadOrder = async (req, res) => {
    try {
        // Fetch orders and populate product information
        const orders = await Order.find().populate({
            path: 'orderedItems.product',
            model: 'Product'
        })
        .populate({
            path: 'userId',
            model: 'User'
        });
       
        if (!orders || orders.length === 0) {
            console.log("orders is empty");
        }

        // Access the enum values from the Order model's schema
        const statuses = Order.schema.path('status').enumValues;
        // console.log(statuses);

        // Render the orders and statuses to the adminOrder view
        res.render("admin/adminOrder", { orders, statuses});
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




module.exports = {loadOrder, updateStatus, cancelOrder}