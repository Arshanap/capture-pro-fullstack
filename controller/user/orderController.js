const Cart = require("../../model/userModel/cartSchema")
const User = require("../../model/userModel/userSchema")
const Order = require("../../model/userModel/orderSchema")
const Product = require("../../model/userModel/productSchema")
const Address = require("../../model/userModel/adressSchema")
const Wallet = require("../../model/userModel/walletSchema")
const Coupon = require("../../model/userModel/couponSchema")



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
        const { address, paymentMethod, couponCode } = req.body; // Include couponCode in the request body
        const email = req.session.User;
        const user = await User.findOne({ email });
        const userId = user._id;
        console.log("code:",couponCode)
        if (!user) {
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        const selectedAddress = await Address.findById(address);
        if (!selectedAddress) {
            return res.status(400).json({ success: false, error: 'Invalid address' });
        }

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
                    name: product.productName,
                });
            }
        }

        let discountAmount = 0;

if (couponCode) {
    // Find the coupon and ensure it's active
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon) {
        return res.status(400).json({ success: false, error: 'Invalid or inactive coupon code.' });
    }

    // Check if the coupon has expired
    const currentDate = new Date();
    if (currentDate > coupon.expirationDate) {
        return res.status(400).json({ success: false, error: 'Coupon code has expired.' });
    }

    // Check if the total amount meets the minimum purchase requirement
    if (totalAmount < coupon.minPurchaseAmount) {
        return res.status(400).json({ 
            success: false, 
            error: `Minimum purchase amount of ${coupon.minPurchaseAmount} is required.` 
        });
    }

    // Since we only have a fixed discount method, apply the fixed discount
    discountAmount = coupon.discountAmount;
    if (discountAmount > totalAmount) {
        discountAmount = totalAmount; // Ensure the discount doesn't exceed the total amount
    }

    totalAmount -= discountAmount; // Apply the discount
}

// Deduct from wallet if using wallet balance
if (paymentMethod && paymentMethod.toString() === "Wallet") {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        return res.status(400).json({ success: false, error: 'No wallet found.' });
    }

    if (wallet.balance < totalAmount) {
        return res.status(400).json({ success: false, error: 'Insufficient wallet balance.' });
    }

    // Deduct the final amount from the wallet
    wallet.balance -= totalAmount;
    wallet.transaction.push({
        transactionType: 'debit',
        amount: totalAmount,
        status: 'completed'
    });
    await wallet.save();
}

// Create the new order
const newOrder = new Order({
    userId,
    orderId: await getNextOrderId(),
    orderedItems: items,
    totalPrice: totalAmount, // Original price before discount
    discount: discountAmount,
    finalAmount: totalAmount, // Final amount after discount
    paymentMethod,
    address: selectedAddress._id,
    invoiceDate: new Date(),
    createdOn: new Date(),
    couponApplied: !!couponCode
});

await newOrder.save();

// Reduce product stock
for (const item of items) {
    const product = await Product.findById(item.product);
    product.count -= item.quantity;
    await product.save();
}

// Clear the user's cart
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
        const { Id } = req.body;

        const order = await Order.findById(Id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentMethod === "Wallet") {
            const userId = order.userId;

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

        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.count += item.quantity; 
                await product.save();
            }
        }


        const result = await Order.findOneAndUpdate(
            { _id: Id },
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

const returnOrder = async (req,res)=>{
    try {
        const { Id } = req.body;
        // console.log("id is:",Id)

        const order = await Order.findById(Id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.paymentMethod === "Wallet") {
            const userId = order.userId;

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
  
  








module.exports ={loadOrder, placeOrder, loadSuccess, cancelOrder, loadOrderDetails, returnOrder}