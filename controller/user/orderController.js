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


async function getNextOrderId() {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomSuffix}`;
}


const placeOrder = async (req,res)=>{

    try {
        const orderId = await getNextOrderId();
        console.log(orderId)

        
    } catch (error) {
        console.log("error for place order",error)
    }

}









module.exports ={loadOrder, placeOrder}