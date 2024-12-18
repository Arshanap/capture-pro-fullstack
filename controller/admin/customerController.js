const User = require("../../model/userModel/userSchema")
const Category = require("../../model/userModel/categorySchema")
const Product = require("../../model/userModel/productSchema")
const {statusCodes} = require("../../config/key")


const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";  
        let page = parseInt(req.query.page) || 1; 
        const limit = 10; 
        
        const userData = await User.find({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },  
                { email: { $regex: ".*" + search + ".*", $options: "i" } } 
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit) 
        .exec();

        
        const count = await User.countDocuments({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ]
        });

        
        res.render("admin/users", {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,  
            search 
        });

    } catch (error) {
        console.error("Error fetching user listing", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send("Error fetching user listing");
    }
};
const categoryInfo = async (req,res)=>{
    try {

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
    
        req.session.successMessage = "";
        req.session.errorMessage = "";

        let search = req.query.search || "";  
        let page = parseInt(req.query.page) || 1; 
        const limit = 10; 
        
        const cateData = await Category.find({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit) 
        .exec();

        const count = await Category.countDocuments({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        });

        res.render("admin/categoryManagement", {
            data: cateData,
            totalPages: Math.ceil(count / limit),  
            currentPage: page,  
            search,
            successMessage,
            errorMessage
        });
        
        
    } catch (error) {
        console.log("error for categoryManage ment");
    }
}


const customerBlocked = async (req,res)=>{

    try {

        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect("/admin/users")
        
    } catch (error) {
        console.log("error for update true",error);
    }

}

const customerunBlocked = async (req,res)=>{

    try {

        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect("/admin/users")
        
    } catch (error) {
        console.log("error for update false",error);
    }
}

// const addCategory = async (req, res) => {
//     try {
//         const { name, description, status, cateOffer } = req.body;

//         // Use an upsert operation
//         const result = await Category.updateOne(
//             { name: { $regex: new RegExp(`^${name}$`, "i") } }, // Case-insensitive check
//             { 
//                 $setOnInsert: { 
//                     name,
//                     description,
//                     isListed: status,
//                     categoryOffer: cateOffer
//                 }
//             },
//             { upsert: true } // Insert only if it doesn't exist
//         );

//         if (result.upsertedCount > 0) {
//             
//             return res.json({ success: true, message: "Category added successfully." });
//             // res.redirect("/admin/category");
//         } else {
//             return res.json({ success: false, message: "Category already exists." });
//         }
//     } catch (error) {
//         console.error("Error adding category:", error);
//         
//         res.redirect("/admin/category");
//     }
// };

const addCategory = async (req, res) => {
    try {
        const { name, description, status, cateOffer } = req.body;

        // Use an upsert operation
        const result = await Category.updateOne(
            { name: { $regex: new RegExp(`^${name}$`, "i") } }, // Case-insensitive check
            { 
                $setOnInsert: { 
                    name,
                    description,
                    isListed: status,
                    categoryOffer: cateOffer
                }
            },
            { upsert: true } // Insert only if it doesn't exist
        );

        if (result.upsertedCount > 0) {
            req.session.successMessage = "Category added successfully.";
            req.session.errorMessage = "";
            return res.json({ success: true, message: "Category added successfully." });
        } else {
            req.session.successMessage = "";
            req.session.errorMessage = "An error occurred. Please try again.";
            return res.json({ success: false, message: "Category already exists." });
        }
    } catch (error) {
        console.error("Error adding category:", error);
        return res.status(500).json({ success: false, message: "An error occurred. Please try again." });
    }
};




const getCategoryById = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const category = await Category.findById(categoryId);
        res.json(category); 
    } catch (error) {
        console.error("Error fetching category by ID:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send("Server error");
    }
};

const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const { name, description, status,  } = req.body;

        const exist = await Category.findOne({ 
            name: { $regex: `^${name}$`, $options: "i" }, 
            _id: { $ne: id } 
        });
        

        if(exist){
            req.session.successMessage = "";
            req.session.errorMessage = "this Catecory is aldredy exist, pleace try again!";
            return res.redirect("/admin/category")
        }


        const result = await Category.updateOne({ _id: id }, {
            name,
            description,
            isListed: status === 'true',
        });
        if(result){
            req.session.successMessage = "Category Editing is successful";
            req.session.errorMessage = "";
            return res.redirect("/admin/category")
        }else{
            req.session.successMessage = "";
            req.session.errorMessage = "Category Editing is Not successful";
            return res.redirect("/admin/category")
        } 
    } catch (error) {
        console.log("Error editing category:", error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).send("Server error");
    }
};




const toggleCategory = async (req, res) => {
    try {
        const { id, isListing } = req.body;
        // console.log(id, isListing)
        let isListed = isListing
        await Category.updateOne({ _id: id }, { $set: { isListed } });
        res.json({ success: true, message: `Category ${isListing ? "listed" : "unlisted"} successfully` });
    } catch (error) {
        console.error("Error toggling category:", error);
        res.json({ success: false, message: "Failed to update category." });
    }
};

const addCategoryOffer = async (req, res) => {
    try {
        const { offerP } = req.body;  // Get offer percentage from the request body
        const { id } = req.query;  // Get categoryId from the query string

        // console.log("Received offerP:", offerP, "for categoryId:", id);

        // Validate the offer percentage
        if (!offerP || isNaN(offerP) || Number(offerP) <= 0) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid offer percentage. It must be a number greater than 0."
            });
        }

        // Find the category by ID
        const category = await Category.findById(id);
        if (!category) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Category not found."
            });
        }

        category.categoryOffer = Number(offerP);  // Update the offer percentage in the category
        await category.save();

        const products = await Product.find({ category: id });
        for (const product of products) {
            const discountAmount = (product.regularPrice * Number(offerP)) / 100;
            product.salePrice = Math.round(product.salePrice - discountAmount);
            await product.save();
        }

        res.status(statusCodes.OK).json({
            success: true,
            message: "Category offer added and product prices updated successfully.",
            category
        });
    } catch (error) {
        console.error("Error while adding category offer:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "An error occurred while adding the category offer. Please try again later."
        });
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const { id } = req.query; // Get categoryId from the query string

        // console.log("Received request to remove offer for categoryId:", id);

        // Find the category by ID
        const category = await Category.findById(id);
        if (!category) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Category not found."
            });
        }

        // Check if the category already has an offer
        if (category.categoryOffer === 0) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "No offer found for this category."
            });
        }
        const offer = category.categoryOffer;
        // Remove the category offer by setting categoryOffer to 0
        category.categoryOffer = 0;
        

        // Update the products in the category by resetting the salePrice and clearing categoryOffer
        const products = await Product.find({ category: id });
        for (const product of products) {
            const discountAmount = (product.regularPrice * offer) / 100;
            Math.round(product.salePrice += discountAmount  )
            await product.save();
        }
        await category.save();

        res.status(statusCodes.OK).json({
            success: true,
            message: "Category offer removed successfully.",
            category
        });
    } catch (error) {
        console.error("Error while removing category offer:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "An error occurred while removing the category offer. Please try again later."
        });
    }
};






module.exports ={customerInfo, customerBlocked, customerunBlocked, addCategory,toggleCategory, 
     getCategoryById, categoryInfo, editCategory, addCategoryOffer, removeCategoryOffer
    }