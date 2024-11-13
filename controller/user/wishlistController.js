const Wishlist = require("../../model/userModel/wishlistSchema")
const Product = require("../../model/userModel/productSchema")
const User = require("../../model/userModel/userSchema")



const addWishlist = async (req, res) => {
    try {
        // Ensure that req.session.User contains a valid email
        const email = req.session.User;
        if (!email) {
            return res.status(401).json({ success: false, message: "User is not logged in" });
        }

        const id = req.query.id;

        // Look for the user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the product is already in the wishlist
        const exist = await Wishlist.findOne({ userId: user._id, "productItems.productId": id });
        if (exist) {
            return res.json({
                success: false,
                message: "This product is already in your wishlist",
                redirectUrl: "/user/productlist"
            });
        }

        // Find the product by its ID
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Add the product to the wishlist
        const newWishlist = new Wishlist({
            userId: user._id,
            productItems: [{ productId: product._id }]
        });

        const result = await newWishlist.save();

        if (result) {
            return res.json({
                success: true,
                message: "Product has been added to your wishlist",
                redirectUrl: `/user/productlist?id=${product._id}`,
                product: product
            });
        } else {
            return res.json({
                success: false,
                message: "Failed to add product to wishlist",
                redirectUrl: "/user/productlist"
            });
        }
    } catch (error) {
        console.error("Error for add wishlist:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};





module.exports = {addWishlist}