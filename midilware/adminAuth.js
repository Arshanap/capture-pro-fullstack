const islogin = (req,res,next)=>{
    if(req.session.Admin){
        res.redirect("/admin/dashboard")
    }else{
        next()
    }
}



const checkSession = (req,res,next)=>{
    if(req.session.Admin){
        next()
    }else{
        res.redirect("/admin/login")
    }
}








module.exports = {islogin, checkSession}