



const loadCheckout = async (req,res)=>{
    try {
        res.render("user/checkout")
        
    } catch (error) {
        console.log("error for load check out", error)
    }
}





module.exports = {loadCheckout}