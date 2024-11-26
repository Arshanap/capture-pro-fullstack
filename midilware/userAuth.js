const User = require("../model/userModel/userSchema")


const islogin = async (req, res, next) => {
    const email = req.session.User;
    const user = await User.findOne({email})
    if (req.session.user && user.isBlocked===false) {
        return res.redirect("/user/home"); 
    } else {
        next(); 
    }
};


const checkSession = async (req,res,next)=>{
    const email = req.session.User;
    const user = await User.findOne({email})
    if(req.session.user && user.isBlocked===false){
       next()
    }else{
        res.redirect("/user/login")
    }
}

module.exports = { islogin, checkSession };
