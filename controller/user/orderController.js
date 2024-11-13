const Cart = require("../../model/userModel/cartSchema")
const User = require("../../model/userModel/userSchema")
const Order = require("../../model/userModel/orderSchema")
const Product = require("../../model/userModel/productSchema")
const Address = require("../../model/userModel/adressSchema")



const loadOrder = async (req, res) => {
    try {
        const email = req.session.User;
        if (!email) {
            return res.redirect("/user/login");
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect("/user/login");
        }

        const orders = await Order.find({ userId: user._id }).populate({
            path: 'orderedItems.product',
            model: 'Product'
        });

        res.render("user/orderManagement", { user, orders });
    } catch (error) {
        console.error("Error loading orders:", error);
        res.status(500).send("Internal Server Error");
    }
};


async function getNextOrderId() {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomSuffix}`;
}

const placeOrder = async (req, res) => {
    try {
        const { address, paymentMethod } = req.body;
        const email = req.session.User;
        const user = await User.findOne({ email });
        const userId = user._id;

        if (!user) {
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        
        // console.log(address)
        const selectedAddress = await Address.findById(address);
        if (!selectedAddress) {
            return res.status(400).json({ success: false, error: 'Invalid address' });
        }

        // Rest of your code remains unchanged
        const cartDocuments = await Cart.find({ userId }).populate({
            path: 'items.productId',
            model: 'Product'
        });

        if (!cartDocuments || cartDocuments.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty' });
        }

        let totalAmount = 0;
        let totalQuantity = 0;
        const items = [];

        // Aggregate the items from all cart documents
        for (const cart of cartDocuments) {
            for (const item of cart.items) {
                const { productId, quantity, price } = item;
                const product = productId; // populated product details

                if (product.count < quantity) {
                    return res.status(400).json({
                        success: false,
                        error: `${product.productName} has insufficient stock. Only ${product.count} left.`
                    });
                }

                totalAmount += price * quantity;
                totalQuantity += quantity;
                items.push({
                    product: product._id,
                    quantity,
                    price,
                    name:product.productName,
                });
            }
        }

        // Create the order
        const newOrder = new Order({
            userId,
            orderId: await getNextOrderId(),
            orderedItems: items,
            totalPrice: totalAmount,
            discount: 0,
            finalAmount: totalAmount,
            paymentMethod,
            address: selectedAddress._id,
            invoiceDate: new Date(),
            createdOn: new Date(),
            couponApplied: false
        });

        await newOrder.save();

        for (const item of items) {
            const product = await Product.findById(item.product);
            product.count -= item.quantity;
            await product.save();
        }

        await Cart.deleteMany({ userId });

        res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};





const loadSuccess = (req,res)=>{
    try {
        const id = req.query.id;
        // console.log("id",id)

        res.render("user/orderSuccess", {orderId:id})
        
    } catch (error) {
        console.log("error for load success",error)
    }
}


const cancelOrder = async (req, res) => {
    try {
        // Extract orderId from the request body
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


const loadOrderDetails = async (req, res) => {
    try {
      const id = req.query.id;
    //   console.log("id", id);
  
      const email = req.session.User;
      const user = await User.findOne({ email });
  
      const order = await Order.findOne({ userId: user._id, orderId: id })
        .populate({
          path: 'orderedItems.product',
          model: 'Product'
        })
        .populate({
          path: 'address',
          model: 'Address' 
        });
  
    //   console.log(order);
  
      res.render("user/orderDetails", { user, order });
    } catch (error) {
      console.log("Error loading order details:", error);
    }
  };
  
  
  








module.exports ={loadOrder, placeOrder, loadSuccess, cancelOrder, loadOrderDetails}