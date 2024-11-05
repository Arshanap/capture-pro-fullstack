const Product =require("../../model/userModel/productSchema")




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






module.exports ={loadProduct}