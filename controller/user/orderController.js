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

        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = 5; // Number of orders per page
        const skip = (page - 1) * limit;

        // Fetch paginated orders with populated product details
        const orders = await Order.find({ userId: user._id })
            .populate({
                path: 'orderedItems.product',
                model: 'Product'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get the total number of orders
        const totalOrders = await Order.countDocuments({ userId: user._id });
        const totalPages = Math.ceil(totalOrders / limit);

        res.render("user/orderManagement", {
            user,
            orders,
            currentPage: page,
            totalPages,
        });
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
        const { address, paymentMethod, couponCode } = req.body;
        const email = req.session.User;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        const cart1=await Cart.findOne({ userId: user._id })

        if(cart1.grandTotal>1000 && paymentMethod === "Cash on Delivery"){
            return res.status(400).json({success:false,error:'cash on delivery is not possible above 1000'})
        }

        const userId = user._id;
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
        let totalProductOffer = 0;
        const items = [];

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

                // Calculate the product offer discount if applicable
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

        // Apply coupon code discount
        let discountAmount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (!coupon) {
                return res.status(400).json({ success: false, error: 'Invalid or inactive coupon code.' });
            }

            const currentDate = new Date();
            if (currentDate > coupon.expirationDate) {
                return res.status(400).json({ success: false, error: 'Coupon code has expired.' });
            }

            if (totalAmount < coupon.minPurchaseAmount) {
                return res.status(400).json({
                    success: false,
                    error: `Minimum purchase amount of ${coupon.minPurchaseAmount} is required.`
                });
            }

            discountAmount = coupon.discountAmount;
            if (discountAmount > totalAmount) {
                discountAmount = totalAmount;
            }

            // Deduct the discount amount from totalAmount
            totalAmount -= discountAmount;
        }

        // Update the cart's grandTotal with the discount amount
        
        const cart = await Cart.findOne({ userId });
        // Deduct from wallet if using wallet balance
        if (paymentMethod && paymentMethod.toString() === "Wallet") {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(400).json({ success: false, error: 'No wallet found.' });
            }

            if (wallet.balance < totalAmount) {
                console.log("keri keri keri")
                return res.status(400).json({ success: false, error: 'Insufficient wallet balance.' });
            }

            wallet.balance -= cart.grandTotal;
            wallet.transaction.push({
                transactionType: 'debit',
                amount: cart.grandTotal,
                status: 'completed'
            });
            await wallet.save();
        }
        
        // Create the new order
        const newOrder = new Order({
            userId,
            orderId: await getNextOrderId(),
            orderedItems: items,
            totalPrice: cart.grandTotal,
            discount: cart.discountAmount,
            finalAmount: totalAmount,
            paymentMethod,
            address: selectedAddress._id,
            invoiceDate: new Date(),
            createdOn: new Date(),
            couponApplied: !!couponCode,
            productOffer: totalProductOffer
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

        if (order.paymentMethod === "Wallet" || order.paymentMethod === "Razorpay" || (order.paymentMethod === "cashOnDelivery" && order.status === "Delivered")) {
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
                    console.log("saved")
                }
            }
        } else {
            return res.status(400).json({ message: "Order items are not available or invalid" });
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

        const result = await Order.findOneAndUpdate(
            { _id: Id },
            { returned: true  },
            { new: true }
        );
        if (result) {
            res.status(200).json({ message: "Order return request send successfully ", order: result });
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