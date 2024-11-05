
const User = require("../../model/userModel/userSchema")
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer")


const loadCurentChange = (req,res)=>{
    if(req.session.user){
        res.render("user/curentPassword")
    }else{
        res.redirect("/user/login")
    }
}

const loadEmail = (req,res)=>{
    const successMessage = req.session.successMessage || "";
    const errorMessage = req.session.errorMessage || "";
    res.render("user/emailVerifying",{successMessage,errorMessage})
}

const checkEmail = async (req,res)=>{
    try {
        const {email} = req.body;
        // console.log(email)
        const user = await User.findOne({email:email})
        // console.log(user)
        if(!user){
            // console.log("email not")
            req.session.successMessage=""
            req.session.errorMessage="this email is not registerd"
            res.redirect("/user/emailVerify")
        }else{
            // console.log("email is yes")
            req.session.successMessage="this email is conformation is successful"
            req.session.errorMessage=""
            res.redirect(`/user/forgotOTP?id=${email}`)
        }

        
    } catch (error) {
        console.log("error for email verifying",error)
    }
}



const checkPassword = async (req, res) => {
    // console.log("Request Body:", req.body);  // Log the request body to debug

    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.User;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User session not found." });
        }

        const user = await User.findOne({ email: userId });

        if (!user || !user.password) {
            console.log("User not found or missing password hash.");
            return res.status(404).json({ success: false, message: "User not found or missing password hash." });
        }

        // console.log("Current Password:", currentPassword);
        // console.log("User Password Hash:", user.password);

        const match = await bcrypt.compare(currentPassword, user.password);

        if (!match) {
            return res.status(401).json({ success: false, message: "Current password is incorrect." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const finish = await User.findByIdAndUpdate(user._id, { password: hashedNewPassword });

        if (finish) {
            req.session.user = null;
            req.session.User = null;
            req.session.successMessage1="Password changing is Success full"
            req.session.errorMessage1=""
            return res.status(200).json({ success: true, message: "Password changed successfully!", redirectUrl: "/user/login" });
        }
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({ success: false, message: "An error occurred while updating the password." });
    }
};



async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP is ${otp}</b>`
        });

        return info.accepted.length > 0;
        
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random()* 900000).toString()  
}


const loadForgotOTP = async (req,res)=>{
    try {
        const email = req.query.id;
        req.session.forgotUser=email
        const otp = generateOtp()
        console.log("forgot OTP:",otp)
        const emailSent = await sendVerificationEmail(email,otp);
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        if(!emailSent){
            return res.json("email-error")
        }

        req.session.userOTP = otp;
        req.session.expire = Date.now()+1000*60*3
        res.render(`user/forgotOTP`, {successMessage,errorMessage,email})

        
    } catch (error) {
        console.log("error for load forgot ",error)
    }
}

const checkOTP = (req, res) => {
    try {
        const email = req.session.forgotUser
        // console.log("email ithe", email)
        const otp = req.body.otp; 
        const OTP = req.session.userOTP;
        req.session.userOTP = Date.now() > req.session.expire ? null : req.session.userOTP
        // console.log("Received OTP:", otp);
        // console.log("Session OTP:", OTP);

        if (String(otp) === String(req.session.userOTP)) {
            // console.log("Password true")
            // req.session.forgotUser=null
            req.session.successMessage="OTP verify is successful"
            req.session.errorMessage=""
            return res.status(200).json({ success: true, message: "OTP verification successful", redirectUrl: `/user/change-Password?id=${email}` });
        } else {
            req.session.successMessage=""
            req.session.errorMessage="OTP verify is not successful"
            return res.status(401).json({ success: false, message: "OTP is incorrect." });
        }
    } catch (error) {
        console.log("Error in OTP verification:", error);
        return res.status(500).json({ success: false, message: "An error occurred while verifying OTP." });
    }
};


const resendOtp = async (req, res) => {
    try {
        const email  = req.query.id;
        // console.log("enthiiiye");
        

        if (!email) {
            // console.log("email no")
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }
        // console.log(email)
        const otp = generateOtp();
        req.session.userOTP = otp;
        req.session.expire = Date.now()+1000*60*3

        const emailSend = await sendVerificationEmail(email, otp);
        // console.log("ivide ethi")
        if (emailSend) {
            console.log("forgot Resent OTP forgot:", otp);
            return res.status(200).json({ success: true, message: "OTP Resent Successfully" });
        } else {
            return res.status(500).json({ success: false, message: "Failed to resend OTP, please try again." });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        return res.status(500).json({ success: false, message: "Internal server error during OTP resend" });
    }
};



const loadChangePassword = (req,res)=>{
    try {
        const email = req.query.id
        req.session.forgotEmail=email;
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        res.render("user/forgotPassword",{successMessage,errorMessage})
    } catch (error) {
        console.log("errror for loadChange password ",error)
    }
}



const conformPassword = async (req, res) => {
    try {
        const email = req.session.forgotEmail;
        const { newPassword } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Session expired or email not found." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await User.findOneAndUpdate(
            { email },                      
            { $set: { password: hashedPassword } });

        if (!result) {
            console.log("nononononononk")
            return res.status(404).json({ success: false, message: "User not found." });
        }

        req.session.forgotEmail = null;
        if(result){
            console.log("sette")
            req.session.successMessage="Password Change successful"
            req.session.errorMessage=""
            res.json({ success: true, message: "Password changed successfully!",redirectUrl:"/user/login" });
        }

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ success: false, message: "An error occurred while updating the password." });
    }
};

const loadCreatePassword = (req,res)=>{
    try {
        const email = req.query.id
        // console.log("email is:",email)
        res.render("user/createPassword",{email})
        
    } catch (error) {
        console.log("error for load create Password",error)
    }
}

const createPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        const result = await user.save();
        if(result){
            req.session.user=null;
            req.session.User=null;
            res.json({ success: true, message: "Password create successfully.", redirectUrl: "/user/login" });
        }

    } catch (error) {
        console.log("Error while setting password:", error);
        res.status(500).json({ success: false, message: "An error occurred while setting the password." });
    }
};






module.exports = {loadCurentChange, checkPassword, loadForgotOTP, loadEmail, checkEmail,
     checkOTP, loadChangePassword, conformPassword, resendOtp, loadCreatePassword, createPassword}