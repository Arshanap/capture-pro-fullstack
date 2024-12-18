const Wishlist = require("../../model/userModel/wishlistSchema")
const Product = require("../../model/userModel/productSchema")
const User = require("../../model/userModel/userSchema")
const {statusCodes} = require("../../config/key")
const {wishlistStrings} = require("../../config/key")


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
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: wishlistStrings.USERNOFOUND });
        }

        const id = req.body.id; // Corrected to get ID from req.body

        // Look for the user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: wishlistStrings.USERNOFOUND });
        }

        // Check if the product is already in the wishlist
        const exist = await Wishlist.findOne({ userId: user._id, "productItems.productId": id });
        if (exist) {
            return res.json({
                success: false,
                message: wishlistStrings.ALREADY,
                redirectUrl: "/user/productlist"
            });
        }

        // Find the product by its ID
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: wishlistStrings.NOTPRODUCT });
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
                message: wishlistStrings.PRODUCTADDSUCCESS,
                redirectUrl: `/user/productlist?id=${product._id}`,
                product: product
            });
        } else {
            return res.json({
                success: false,
                message: wishlistStrings.PRODUCTADDFAILD,
                redirectUrl: "/user/productlist"
            });
        }
    } catch (error) {
        console.error("Error for add wishlist:", error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: wishlistStrings.ERRORFORREMOVE });
    }
};


const removeProduct = async (req,res)=>{
    try {
        const id = req.query.id;
        const email = req.session.User;
        const user = await User.findOne({email})
        if(!id){
            console.log("product id is not")
        }

        const result = await Wishlist.deleteOne(
            {_id:id},
            { userId: user._id },  
        );

        if (result.nModified === 0) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: wishlistStrings.NOTPRODUCT });
        }

        // console.log(result)

        res.status(statusCodes.OK).json({ message: wishlistStrings.SUCCESS});
    } catch (error) {
        console.log("error for remove product in wishlist",error)
    }
}





module.exports = {addWishlist, loadWishlist, removeProduct}