const User = require("../../model/userModel/userSchema")



const loadOrder = async (req,res)=>{
    try {
        const userid = req.session.User
        const user = await User.findOne({email:userid})
        if(!req.session.user){
            res.redirect("/user/login")
        }
        res.render("user/orderManagement",{user})
    } catch (error) {
        console.log("error for loadOrder",error)
    }
}











module.exports ={loadOrder}