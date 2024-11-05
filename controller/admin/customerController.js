const User = require("../../model/userModel/userSchema")
const Category = require("../../model/userModel/categorySchema")


const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";  
        let page = parseInt(req.query.page) || 1; 
        const limit = 20; 
        
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
        res.status(500).send("Error fetching user listing");
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
        const limit = 20; 
        
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

const addCategory = async (req,res)=>{

    try {
        const {name,description,status,cateOffer} = req.body;
        // console.log(req.body);

        const match = await Category.findOne({ name });
        if (match) {
            return res.json({ success: false, message: "Category already exists." });
        }
        
        const newcategory = new Category({
            name:name,
            description:description,
            isListed:status,
            categoryOffer:cateOffer,
        })

        const result = await newcategory.save()
        if(result){
            req.session.successMessage = "Category Adding is successful";
            req.session.errorMessage = "";
            res.redirect("/admin/category")
        }else{
            req.session.successMessage = "";
            req.session.errorMessage = "Category Adding is Not successful";
            res.redirect("/admin/category")
        }
    } catch (error) {
        console.log("error for addcategory:",error)
    }
}


const getCategoryById = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const category = await Category.findById(categoryId);
        res.json(category); 
    } catch (error) {
        console.error("Error fetching category by ID:", error);
        res.status(500).send("Server error");
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
        return res.status(500).send("Server error");
    }
};

const categoryListed = async (req,res) =>{

    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect("/admin/category")
        
    } catch (error) {
        console.log("error for category listed :",error);
        
        
    }
}
const categoryunListed = async (req,res) =>{

    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.redirect("/admin/category")
        
    } catch (error) {
        console.log("error for category listed :",error);
        
        
    }
}





module.exports ={customerInfo, customerBlocked, customerunBlocked, addCategory,
     getCategoryById, categoryInfo, categoryunListed, categoryListed, editCategory
    }