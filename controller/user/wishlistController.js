const Wishlist = require("../../model/userModel/wishlistSchema")
const Product = require("../../model/userModel/productSchema")
const User = require("../../model/userModel/userSchema")
const {statusCodes} = require("../../config/key")


const loadWishlist = async (req,res)=>{
    try {
        const email = req.session.User;
        const user = await User.findOne({ email });
    
        const wishlist = await Wishlist.find({ userId: user._id })
            .populate({
                path: 'productItems.productId',
                model: 'Product'
            });
    
        res.render("user/wishlist", { wishlist });
    } catch (error) {
        console.log("error for load wishlist ",error)
    }
}






const addWishlist = async (req, res) => {
    try {
        // Ensure that req.session.User contains a valid email
        const email = req.session.User;
        if (!email) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "User is not logged in" });
        }

        const id = req.body.id; // Corrected to get ID from req.body

        // Look for the user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "User not found" });
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
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "Product not found" });
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
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
    }
};


const removeProduct = async (req,res)=>{
    try {
        console.log("ethi ethi ethi")
        const id = req.query.id;
        const email = req.session.User;
        const user = await User.findOne({email})

        const result = await Wishlist.deleteOne(
            {_id:id},
            { userId: user._id },  
        );

        if (result.nModified === 0) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: "Product not found in wishlist" });
        }

        // console.log(result)

        res.status(statusCodes.OK).json({ message: "Product successfully removed from wishlist"});
    } catch (error) {
        console.log("error for remove product in wishlist",error)
    }
}





module.exports = {addWishlist, loadWishlist, removeProduct}