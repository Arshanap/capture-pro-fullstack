const Order = require("../../model/userModel/orderSchema")


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