const bcrypt = require("bcrypt")
const User = require("../../model/userModel/userSchema")
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const Product = require("../../model/userModel/productSchema")
const Category = require("../../model/userModel/categorySchema")
const {statusCodes} = require("../../config/key")
const {userController} = require("../../config/key")


const loadsignup = (req, res) => {
    const successMessage = req.session.successMessage;
    const errorMessage = req.session.errorMessage;

    // Clear the messages after they are displayed
    req.session.successMessage = null;
    req.session.errorMessage = null;

    // Render the "user/signup" page with the success and error messages
    res.render("user/signup", { successMessage, errorMessage });
};


const loadLogin = (req, res) => {
    req.session.successMessage = null; 
    const successMessage1 = req.session.successMessage1 || "";
    const errorMessage1 = req.session.errorMessage1 || "";
    req.session.successMessage1 = null;
    req.session.errorMessage1 = null;
    res.render("user/login", {successMessage:'',errorMessage:'',successMessage1,errorMessage1});
    
};

const loadOTP = (req,res)=>{
    res.render("user/verfyOTP",{errorMessage:""})
}

function generateOtp(){
    return Math.floor(100000 + Math.random()* 900000).toString()  
}

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
            subject: "Verify your account", // Corrected typo
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP is ${otp}</b>` // Closed the <b> tag properly
        });

        return info.accepted.length > 0;
        
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}



const registerUser = async (req,res) =>{
    
    const {name, phone, email, password} = req.body

    try {   


        const existingUser = await User.findOne({ email: email });
        
        if (existingUser) {
            
            req.session.errorMessage = "User with this email already exists!";
            return res.redirect("/user/signup");
        }

        const otp = generateOtp()

        const emailSent = await sendVerificationEmail(email,otp);

        if(!emailSent){
            return res.json("email-error")
        }

        req.session.userOtp = otp;
        req.session.otpExpires=Date.now()+1000*60*1
        req.session.userData = {name,phone,email,password};

        res.redirect("/user/verfyOTP")
        console.log("OTP send",otp)

        

    } catch (error) {
        console.log("Error for OTP creating",error)
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send(userController.INTERNAL)
    }
}

const securePassword = async (password)=>{
    try {

        const passwordHash = await bcrypt.hash(password,10)

        return passwordHash;
        
    } catch (error) {
        console.log("error for securePassword",error)
    }
}





const login = async (req, res) => {
    // Use default values to avoid undefined errors
    const successMessage1 = req.session.successMessage1 || "";
    const errorMessage1 = req.session.errorMessage1 || "";
    
    // Clear messages from session after retrieval
    req.session.successMessage1 = null;
    req.session.errorMessage1 = null;

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render("user/login", {
                errorMessage1,
                successMessage1,
                successMessage: '',
                errorMessage: "This user does not exist."
            });
        }

        if (user.isBlocked) {
            req.session.user = null;
            req.session.User = null;
            return res.render("user/login", {
                errorMessage1,
                successMessage1,
                successMessage: '',
                errorMessage: "This user is blocked."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("user/login", {
                errorMessage1,
                successMessage1,
                successMessage: '',
                errorMessage: "Password is not correct, please try again."
            });
        }

        // Set user session on successful login
        req.session.User = email;
        req.session.user = true;
        res.redirect(`/user/home?id=${email}`);
    } catch (error) {
        console.error("Error during login:", error);
        res.render("user/login", {
            errorMessage1,
            successMessage1,
            successMessage: '',
            errorMessage: "Login was not successful."
        });
    }
};


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;  // Corrected to access otp from req.body
        const user = req.session.userData;

        // console.log("OTP received:", otp);
        req.session.userOtp = Date.now() > req.session.otpExpires ? null : req.session.userOtp

        if (!user) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: userController.SESSIONEXPIRED });
        }

        if (String(otp) === String(req.session.userOtp)) {
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });

            const result = await saveUserData.save();

            req.session.userOtp = null;
            req.session.userData = null;
            if(result){
                req.session.successMessage1 = "user signup is successfully";
                req.session.errorMessage1 = "";
                return res.status(statusCodes.OK).json({ success: true, message: userController.USERSUCCESS, redirectUrl: "/user/login" });
            }else{
                req.session.successMessage1 = "";
                req.session.errorMessage1 = "user singup not successfully";
            }
            
        } else {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: userController.INVALIDOTP });
        }
    } catch (error) {
        console.error("Error verifying OTP", error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: userController.ERROROTP });
    }
};




const resendOtp = async (req, res) => {
    try {
        const email  = req.session.userData.email;
        // console.log(email)
        console.log("enthiiiye");
        

        if (!email) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: userController.NOTFOUNDEMAIL });
        }

        const otp = generateOtp();
        req.session.userOtp = otp;
        req.session.otpExpires=Date.now()+1000*60*1
        const emailSend = await sendVerificationEmail(email, otp);

        if (emailSend) {
            console.log("Resent OTP:", otp);
            return res.status(statusCodes.OK).json({ success: true, message: userController.SUCCESSRESEND });
        } else {
            return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: userController.RENDTRY });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: userController.RESENDOTPERROR });
    }
};




const loadHome = async (req, res) => {
    try {
        const email = req.query.id;

        const user = await User.findOne({ email });
        const category = await Category.find({ isListed: true });
        
        if (category.length === 0) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: userController.NOTCATEGORY });
        }

        if (user && user.isBlocked) {
            req.session.user = null;
            req.session.User = null;
            req.session.errorMessage = "Your account has been blocked. Please contact support.";
            return res.redirect("/user/login");
        }

        const filter = {
            isBlocked: false, 
            category: { $in: category.map(cat => cat._id) }
        };

        if (req.query.search) {
            filter.productName = { $regex: new RegExp(".*" + req.query.search + ".*", "i") };
        }

        const product = await Product.find(filter);

        const sess = req.session.user;
        return res.render("user/home", { user, product, sess });

    } catch (error) {
        console.log("Error rendering user home page:", error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send(userController.INTERNAL);
    }
};



const loadlogout = (req,res)=>{
    req.session.user=null;
    req.session.User=null;
    res.redirect("/user/login")
}


const checksession = async (req, res, next) => {
    try {
        
        const { email } = req.user;

        req.session.user = true;
        req.session.User = email;
        next();

    } catch (error) {
        console.log("Error during Google authentication check", error);
        return res.render("user/login", {
            successMessage1:"",
            errorMessage1:"",
            successMessage: "",
            errorMessage: "An error occurred, please try again"
        });
    }
};







module.exports = {loadLogin, loadsignup, registerUser, verifyOtp, login, resendOtp, loadOTP,loadHome, loadlogout, checksession}