const Product =require("../../model/userModel/productSchema")
const Category = require("../../model/userModel/categorySchema")
const User = require("../../model/userModel/userSchema")
const {statusCodes} = require("../../config/key")



const loadProduct = async (req, res) => {
    try {
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        
        req.session.errorMessage = "";
        const id = req.query.id;
        const prodata = await Product.findOne({_id:id,isBlocked: false});
        
        if (!prodata) {
            return res.redirect("/user/home")
        }

        const category = prodata.category;

       
        const relatedProdatas = await Product.find({ 
            category: category, 
            _id: { $ne: id }, 
            isBlocked: false 
        }).limit(3); 

        res.render("user/productlist", { relatedProdatas, prodata});
        
    } catch (error) {
        console.log("Error in loading product list for user side:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send("An error occurred while loading the product.");
    }
};




const loadShop = async (req, res) => {
    try {
        const sortOption = req.query.sort || ''; // Sorting option
        const categoryType = req.query.categoryType || null; // Filter by category type
        const page = parseInt(req.query.page) || 1; // Current page
        const limit = 6; // Products per page
        const skip = (page - 1) * limit; // Skip products for pagination
        let sortCriteria;
        let search = req.query.search || ''; // Search term

        // Fetch categories for filtering
        const category = await Category.find({ isListed: true });

        // Determine sort criteria
        switch (sortOption) {
            case 'price-low-high':
                sortCriteria = { salePrice: 1 };
                break;
            case 'price-high-low':
                sortCriteria = { salePrice: -1 };
                break;
            case 'a-z':
                sortCriteria = { productName: 1 };
                break;
            case 'z-a':
                sortCriteria = { productName: -1 };
                break;
            default:
                sortCriteria = { createdAt: -1 };
        }

        // Create filter for query
        let filter = {
            productName: { $regex: search, $options: 'i' },
            isBlocked: false, // Exclude blocked products
        };

        if (categoryType) {
            const matchingCategory = category.find(cat => cat.name === categoryType);
            if (matchingCategory) {
                filter.category = matchingCategory._id; // Filter by category
            } else {
                return res.render("user/shop", {
                    product: [],
                    totalProducts: 0,
                    totalPages: 0,
                    page,
                    limit,
                    sortOption,
                    categoryType,
                });
            }
        }

        // Fetch products with filters, sorting, and pagination
        const product = await Product.find(filter)
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit)
            .populate('category', 'name');

        // Total product count for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        // Render the shop page with products and pagination details
        res.render("user/shop", {
            product,
            totalProducts,
            totalPages,
            page,
            limit,
            sortOption,
            categoryType,
            category,
        });
    } catch (error) {
        console.error("Error in loadShop:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ message: "An error occurred while loading the products." });
    }
};






module.exports ={loadProduct, loadShop}