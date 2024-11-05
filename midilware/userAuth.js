const User = require("../model/userModel/userSchema")


const islogin = (req, res, next) => {
   
    if (req.session.user) {
        return res.redirect("/user/home"); 
    } else {
        next(); 
    }
};


const checkSession = (req,res,next)=>{
    if(req.session.user){
       next()
    }else{
        res.redirect("/user/login")
    }
}

module.exports = { islogin, checkSession };
