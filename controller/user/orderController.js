const Cart = require("../../model/userModel/cartSchema")
const User = require("../../model/userModel/userSchema")
const Order = require("../../model/userModel/orderSchema")
const Product = require("../../model/userModel/productSchema")
const Address = require("../../model/userModel/adressSchema")



const loadOrder = async (req,res)=>{
    try {
        const userid = req.session.User
        const user = await User.findOne({email:userid})
        if(!req.session.user){
            res.redirect("/user/login")
        }
        res.render("user/orderManagement",{user})
    } catch (error) {
        console.log("error for loadOrder",error)
    }
}


async function getNextOrderId() {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomSuffix}`;
}

const placeOrder = async (req, res) => {
    try {
        const { address, paymentMethod } = req.body; // Use addressId instead of address
        const orderId = await getNextOrderId();
        const email = req.session.User; 
        const user = await User.findOne({ email });

        // Check if the user exists
        if (!user) {
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        const userId = user._id;

        // Find the address from the Address collection using addressId
        const selectedAddress = await Address.findById(address);
        if (!selectedAddress) {
            return res.status(400).json({ success: false, error: 'Invalid address' });
        }

        // Fetch the user's cart
        const cart = await Cart.find({ userId }).populate({
            path: 'items.productId',
            model: 'Product'
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty' });
        }

        let totalAmount = 0;
        let totalQuantity = 0;
        const products = [];

        // Loop through the cart items and check for stock availability
        for (const item of cart.items) {
            const { productId, quantity, price } = item;

            if (productId.count < quantity) {
                return res.status(400).json({
                    success: false,
                    error: `${productId.productName} has insufficient stock. Only ${productId.count} left.`
                });
            }

            totalAmount += price * quantity;
            totalQuantity += quantity;
            products.push({
                product: productId._id,
                quantity,
                price
            });
        }

        // Create an array of items for the order
        const items = cart.items.map(item => ({
            productId: item.productId._id,
            productName: item.productId.productName,
            image: item.productId.productImage[0],
            price: item.price,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity
        }));

        // Create a new order
        const newOrder = new Order({
            orderId: orderId,
            orderedItems: items.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.totalPrice
            })),
            totalPrice: totalAmount,
            discount: 0,
            finalAmount: totalAmount,
            paymentMethod,
            address: selectedAddress._id, // Use the address from the Address collection
            invoiceDate: new Date(),
            status: 'Processing',
            createdOn: new Date(),
            couponApplied: false
        });

        await newOrder.save();

        // Update the product stock after the order is placed
        for (const item of products) {
            const product = await Product.findById(item.product);
            product.count -= item.quantity;
            await product.save();
        }

        // Clear the user's cart after placing the order
        await Cart.findByIdAndDelete(cart._id);

        res.json({ success: true, message: 'Order placed successfully', cartEmpty: true, orderId: newOrder._id });

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const loadSuccess = (req,res)=>{
    try {
        const id = req.query.id;
        console.log("id",id)

        res.render("user/orderSuccess", {orderId:id})
        
    } catch (error) {
        console.log("error for load success",error)
    }
}









module.exports ={loadOrder, placeOrder, loadSuccess}