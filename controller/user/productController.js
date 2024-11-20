const Product =require("../../model/userModel/productSchema")
const Category = require("../../model/userModel/categorySchema")
const User = require("../../model/userModel/userSchema")




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
        res.status(500).send("An error occurred while loading the product.");
    }
};

// const loadShop = async (req,res)=>{
//     try {
//         const email = req.query.id;
//         const user = await User.findOne({ email });
//         const category = await Category.find({ isListed: true });
    
//         if (category.length === 0) {
//           return res.status(400).json({ success: false, message: "No categories found" });
//         }
    
//         if (user && user.isBlocked) {
//           req.session.user = null;
//           req.session.User = null;
//           req.session.errorMessage = "Your account has been blocked. Please contact support.";
//           return res.redirect("/user/login");
//         }
    
//         const filter = {
//           isBlocked: true,
//           category: { $in: category.map(cat => cat._id) },
//         };
    
//         if (req.query.search) {
//           filter.productName = { $regex: new RegExp(".*" + req.query.search + ".*", "i") };
//         }
    
//         let product = await Product.find(filter);
    
//         const sortOptions = req.query.sort;
//         switch (sortOptions) {
//           case "lowToHigh":
//             product.sort((a, b) => a.salePrice - b.salePrice);
//             break;
//           case "highToLow":
//             product.sort((a, b) => b.salePrice - a.salePrice);
//             break;
//           case "aToZ":
//             product.sort((a, b) => a.productName.localeCompare(b.productName));
//             break;
//           case "zToA":
//             product.sort((a, b) => b.productName.localeCompare(a.productName));
//             break;
          
          
//         }
        

    
//         const sess = req.session.user;
//         return res.render("user/shop", { user, product, sess });
//       } catch (error) {
//         console.log("error for load shop",error)
//     }
// }


const loadShop = async (req, res) => {
    try {
        // Get the sorting option from the query or default to 'new'
        const sortOption = req.query.sort ;
        let sortCriteria;
        const category = await Category.find({ isListed: true });

        // if (category.length === 0) {
        //     return res.status(400).json({ success: false, message: "No categories found" });
        // }

        // if (req.query.categoryType) {
        //     filter.category = { $in: category.filter(cat => cat.name === req.query.categoryType).map(cat => cat._id) };
        //   }

        //   product = await Product.find(filter).populate('category', 'name');

        // Define sort criteria based on the selected option
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

        // Set up search query, pagination, and limit
        let search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        // Fetch products from the database with the selected criteria
        const product = await Product.find({
            productName: { $regex: search, $options: 'i' }, 
            isBlocked: false,  // Show products that are NOT blocked
            
        })
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit)
            .populate('category', 'name');

        // Get the total number of products for pagination
        const totalProducts = await Product.countDocuments({
            productName: { $regex: search, $options: 'i' },
            isBlocked: false,  // Count products that are NOT blocked
        });

        // Calculate total pages based on the limit
        const totalPages = Math.ceil(totalProducts / limit);

        // Return the fetched products along with pagination details
        res.render("user/shop",{
            product,
            totalProducts,
            totalPages,
            page,
            limit,
            sortOption
        });
    } catch (error) {
        console.log("Error in fetchProducts:", error);
        res.status(500).json({ message: "An error occurred while loading the products." });
    }
};






  




module.exports ={loadProduct, loadShop}