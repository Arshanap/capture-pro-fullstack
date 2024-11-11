const Product =require("../../model/userModel/productSchema")
const Category = require("../../model/userModel/categorySchema")
const User = require("../../model/userModel/userSchema")




const loadProduct = async (req, res) => {
    try {
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        
        req.session.errorMessage = "";
        const id = req.query.id;
        const prodata = await Product.findOne({_id:id,isBlocked: true});
        
        if (!prodata) {
            return res.redirect("/user/home")
        }

        const category = prodata.category;

       
        const relatedProdatas = await Product.find({ 
            category: category, 
            _id: { $ne: id }, 
            isBlocked: true 
        }).limit(3); 

        res.render("user/productlist", { relatedProdatas, prodata});
        
    } catch (error) {
        console.log("Error in loading product list for user side:", error);
        res.status(500).send("An error occurred while loading the product.");
    }
};

const loadShop = async (req,res)=>{
    try {
        const email = req.query.id;
        const user = await User.findOne({ email });
        const category = await Category.find({ isListed: true });
    
        if (category.length === 0) {
          return res.status(400).json({ success: false, message: "No categories found" });
        }
    
        if (user && user.isBlocked) {
          req.session.user = null;
          req.session.User = null;
          req.session.errorMessage = "Your account has been blocked. Please contact support.";
          return res.redirect("/user/login");
        }
    
        const filter = {
          isBlocked: true,
          category: { $in: category.map(cat => cat._id) },
        };
    
        if (req.query.search) {
          filter.productName = { $regex: new RegExp(".*" + req.query.search + ".*", "i") };
        }
    
        let product = await Product.find(filter);
    
        const sortOptions = req.query.sort;
        switch (sortOptions) {
          case "lowToHigh":
            product.sort((a, b) => a.salePrice - b.salePrice);
            break;
          case "highToLow":
            product.sort((a, b) => b.salePrice - a.salePrice);
            break;
          case "aToZ":
            product.sort((a, b) => a.productName.localeCompare(b.productName));
            break;
          case "zToA":
            product.sort((a, b) => b.productName.localeCompare(a.productName));
            break;
          
        }
    
        const sess = req.session.user;
        return res.render("user/shop", { user, product, sess });
      } catch (error) {
        console.log("error for load shop",error)
    }
}





module.exports ={loadProduct, loadShop}