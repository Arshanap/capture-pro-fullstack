const Admin = require("../../model/adminModel/adminSchema")
const User = require("../../model/userModel/userSchema")
const userSchema =require("../../model/userModel/userSchema")
const Category = require("../../model/userModel/categorySchema")
const Product = require("../../model/userModel/productSchema")


const loadLogin = (req,res)=>{
    res.render("admin/login")
}


const login = async (req,res)=>{
    
    try {

        const {email,password} = req.body;

        const admin = await Admin.findOne({email:email})

        if(!admin) return res.render("admin/login", {errorMessage:"Invalid credentials, Please try again"})
            req.session.Admin = true

            if(admin.password === password){
                req.session.Admin = email;
                res.redirect("/admin/dashboard")
            }
            if (req.session.Admin == true) {
                res.redirect("/admin/dashboard")
            }
    
        
    } catch (error) {
        console.log("Error for login in  dashbord",error);
            
    }

}




const loadEditUser = (req,res)=>{
    res.render("admin/editUser")
}

const loadDashboard = async (req, res) => {
    try {
        
        const admin = req.session.Admin
        if (!admin) {
            return res.redirect("/admin/login")
        } else {
            const user = await User.find();
            res.render("admin/dashboard",{user});
        } 

    } catch (error) {
        console.error(error)
    }
}

const loadlogout = (req,res)=>{
    req.session.Admin=null;
    res.redirect("/admin/login")
}

















module.exports = {loadLogin, login, loadEditUser, loadDashboard, loadlogout}