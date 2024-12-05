const User = require("../../model/userModel/userSchema")
const Product = require("../../model/userModel/productSchema")
const Cart = require("../../model/userModel/cartSchema")
const {statusCodes} = require("../../config/key")


const loadCart = async (req, res) => {
    try {
        const email = req.session.User;  // Get the user's email from the session

        // Retrieve the user from the database based on the email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(statusCodes.BAD_REQUEST).send("User not found.");
        }
        const userId = user._id;

        // Retrieve the user's cart and populate product details
        const cartItems = await Cart.find({ userId }).populate('items.productId');

        // If no items are in the cart, render the empty cart message
        if (cartItems.length === 0 || cartItems[0].items.length === 0) {
            return res.render("user/cartManagement", { proData: [], grandTotal: 0, message: "Your cart is empty." });
        }

        // Flatten the cart items to a format suitable for rendering
        const proData = cartItems.flatMap(cart => 
            cart.items.map(item => ({
                _id: item.productId._id,
                productName: item.productId.productName,
                productImage: item.productId.productImage || [],
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.totalPrice,
                count: item.productId.count
            }))
        );

        // Calculate the grand total for the cart
        const grandTotal = proData.reduce((total, item) => total + item.totalPrice, 0);

        // Render the cart page with the cart data and grand total
        res.render("user/cartManagement", { proData, grandTotal });

    } catch (error) {
        console.log("Error loading cart:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while loading the cart.");
    }
};





const addProduct = async (req, res) => {
    try {
        const { id, value } = req.body;
        const useremail = req.session.User;

        // Retrieve the user object based on the email to get the ObjectId
        const user = await User.findOne({ email: useremail });
        if (!user) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "User not found" });
        }

        // Check if a cart already exists for the user
        let cart = await Cart.findOne({ userId: user._id });

        // Retrieve the product details
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "Product not found" });
        }

        // If the cart exists, check if the product already exists
        if (cart) {
            // Check if the product is already in the cart
            const productIndex = cart.items.findIndex(item => item.productId.toString() === id);

            if (productIndex > -1) {
                // Product already exists in the cart, update the quantity and totalPrice
                return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "This product is already in the cart." });
            } else {
                // Product does not exist in the cart, add it
                if (value > product.count) {
                    return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "Not enough stock available" });
                }

                cart.items.push({
                    productId: product._id,
                    quantity: value,
                    price: product.salePrice,
                    totalPrice: product.salePrice * value,
                    productCount: product.count
                });
            }
        } else {
            // If no cart exists, create a new cart with the product in the items array
            if (value > product.count) {
                return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "Not enough stock available" });
            }

            cart = new Cart({
                userId: user._id,
                items: [{
                    productId: product._id,
                    quantity: value,
                    price: product.salePrice,
                    totalPrice: product.salePrice * value,
                    productCount: product.count
                }]
            });
        }

        // Recalculate the total and grandTotal for the cart
        cart.total = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
        cart.grandTotal = cart.total;

        // Save the cart
        const result = await cart.save();
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
            req.session.errorMessage = "";
            return res.json({
                success: false,
                message: req.session.errorMessage,
                redirectUrl: "/user/productlist"
            });
        }
    } catch (error) {
        console.log("Error for add to cart:", error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "An unexpected error occurred." });
    }
};




const valueUpdate = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const email = req.session.User;

        // Retrieve the user object based on the email to get the ObjectId
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'User not found' });
        }

        const userId = user._id;
        // Find the cart for the user that contains the specified product
        const cart = await Cart.findOne({ userId, 'items.productId': productId });

        if (!cart) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'Cart not found' });
        }

        // Locate the item in the cart's items array
        const existingItemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (existingItemIndex === -1) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: 'Product not found in cart' });
        }

        // Update the quantity and recalculate the total price for the item
        cart.items[existingItemIndex].quantity = quantity;
        cart.items[existingItemIndex].totalPrice = quantity * cart.items[existingItemIndex].price;

        // Save the updated cart to the database
        const result = await cart.save();

        if (result) {
            return res.json({ success: true, redirectUrl: "/user/cart" });
        } else {
            return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to update item" });
        }
    } catch (error) {
        console.error("Error updating quantity:", error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal Server Error" });
    }
};




const removeProduct = async (req, res) => {
    try {
        const productId = req.query.id; 
        const email = req.session.User; 

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: "User not found" });
        }
        const userId = user._id;

        // Check if the cart exists and contains the product
        const cart = await Cart.findOne({ userId, "items.productId": productId });
        if (!cart) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: "Cart not found or product not in cart" });
        }

        // Use $pull to remove the product from the items array
        const result = await Cart.updateOne(
            { userId },
            { $pull: { items: { productId } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: "No product found for the user with the specified product" });
        }

        res.status(statusCodes.OK).json({ message: "Product successfully removed from cart" });
    } catch (error) {
        console.error("Error removing product from cart:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};







module.exports = {loadCart, addProduct, valueUpdate, removeProduct}