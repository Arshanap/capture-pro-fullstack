const User = require("../../model/userModel/userSchema")
const Product = require("../../model/userModel/productSchema")
const Cart = require("../../model/userModel/cartSchema")


const loadCart = async (req, res) => {
    try {
        
        const email = req.session.User;

        const user = await User.findOne({email})
        const userId = user._id;
        const cartItems = await Cart.find({ userId }).populate('items.productId');

        if (cartItems.length === 0) {
            return res.render("user/cartManagement", { proData: [], grandTotal: 0, message: "Your cart is empty." });
        }

        const proData = cartItems.flatMap(cart => cart.items.map(item => ({
            _id: item.productId._id,
            productName: item.productId.name,  
            productImage: item.productId.productImage || [],  
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            count: item.productId.count
        })));

        const grandTotal = proData.reduce((total, item) => total + item.totalPrice, 0);

        res.render("user/cartManagement", { proData, grandTotal });
    } catch (error) {
        console.log("Error loading cart:", error);
        res.status(500).send("An error occurred while loading the cart.");
    }
};





const addProduct = async (req, res) => {
    try {
        const { id, value } = req.body;
        const useremail = req.session.User;

        // Retrieve the user object based on the email to get the ObjectId
        const user = await User.findOne({ email: useremail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the product already exists in the cart for this user
        const exist = await Cart.findOne({ userId: user._id, "items.productId": id });
        if (exist) {
            req.session.successMessage = "";
            req.session.errorMessage = "";
            return res.json({
                success: false,
                message: req.session.errorMessage,
                redirectUrl: "/user/productlist"
            });
        }

        // Retrieve the product details
        const product = await Product.findOne({ _id: id });

        const newcart = new Cart({
            userId: user._id, 
            items: {
                productId: product._id,
                quantity: value,
                price: product.salePrice,
                totalPrice: product.salePrice * value,
                productCount: product.count,
            }
        });

        const result = await newcart.save();
        if (result) {
            req.session.successMessage = "";
            req.session.errorMessage = "";
            return res.json({
                success: true,
                message: req.session.successMessage,
                redirectUrl: `/user/productlist?id=${product._id}`,
                product: product
            });
        } else {
            req.session.successMessage = "";
            req.session.errorMessage = "Failed to add product to cart";
            return res.json({
                success: false,
                message: req.session.errorMessage,
                redirectUrl: "/user/productlist"
            });
        }
    } catch (error) {
        console.log("Error for add to cart:", error);
        return res.status(500).json({ success: false, message: "An unexpected error occurred." });
    }
};

const valueUpdate = async (req, res) => {
    try {
        const { productId, quantity } = req.body; 
        const email = req.session.User;
        // console.log("prodactId",productId);
        // console.log("quantity",quantity);


        const user = await User.findOne({ email });
        const userId = user._id 

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const cart = await Cart.findOne({ userId, 'items.productId': productId });

        if (!cart) {
            return res.status(400).json({ success: false, message: 'Cart not found' });
        }

        const existingItemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (existingItemIndex === -1) {
            return res.status(400).json({ success: false, message: 'Product not found in cart' });
        }

        cart.items[existingItemIndex].quantity = quantity

        cart.items[existingItemIndex].totalPrice = quantity * cart.items[existingItemIndex].price;

        const result = await cart.save();
        if (result) {
            // console.log("Quantity updated successfully");
            return res.json({ success: true, redirectUrl:"/user/cart"});
        } else {
            // console.log("Failed to update quantity");
            return res.json({ success: false, message: "Failed to update item" });
        }
    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



const removeProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const email = req.session.User;
        const user = await User.findOne({email})
        const userId = user._id;

        const exist = await Cart.findOne({ 
            userId, 
            "items.productId": productId 
        });

        if (!exist) {
            return res.status(404).json({ message: "Cart not found or product not in cart" });
        }

        const result = await Cart.deleteOne({ 
            userId, 
            "items.productId": productId 
        });

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "No product found for the user with the specified product" });
        }

        res.status(200).json({ message: "Product successfully removed from cart" });
    } catch (error) {
        console.error("Error deleting product from cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};






module.exports = {loadCart, addProduct, valueUpdate, removeProduct}