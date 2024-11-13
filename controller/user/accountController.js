const Address = require("../../model/userModel/adressSchema")
const User = require("../../model/userModel/userSchema")








const loadAccount = async  (req,res)=>{
    try {
        if (!req.session.user) {
            return res.redirect("/user/login"); // Redirect to login if not authenticated
        }
        const useremail = req.session.User

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        req.session.successMessage = null;
        req.session.errorMessage = null;
        const user = await User.findOne({email:useremail})
        const addresses = await Address.find({userId:user._id})

        req.session.successMessage = "";
        req.session.errorMessage = "";
        if(req.session.user){
            res.render("user/addressManagement",{successMessage,errorMessage,addresses,user})
        }else{
            res.redirect("/user/login")
        }
        
    } catch (error) {
        console.error("error for Account load",error)
    }
}

const addAddress = async (req, res) => {
    try {
        const userId = req.session.User; 
        const { address, name, city, buildingName, state, pincode, type } = req.body; 

        const user = await User.findOne({ email: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const addresss = new Address({
            userId: user._id,
            address: {
                addresstype:type,
                name,
                city,
                buildingName,
                state,
                pincode,
                phone:user.phone,
                address,
                email:user.email,
            }
        });

       const result = await addresss.save();
        if(result){
            req.session.successMessage = "Address Adding is successful";
            req.session.errorMessage = "";
            res.redirect("/user/account")
        }else{
            req.session.successMessage = "";
            req.session.errorMessage = "Address Adding is not successful";
            res.redirect("/user/account")
        }

    } catch (error) {
        console.error("Error in addAddress:", error);
    }
};


const loadEdit = async (req,res)=>{
    try {
        const userid = req.session.User 
        const id = req.query.id
        const user = await User.findOne({email:userid})
        const addresses = await  Address.findOne({_id:id})
        if(addresses){
            res.render("user/editAddress",{addresses,user})
        }
        
    } catch (error) {
        console.log("error for loadEdit",error)
    }
}


const editAddress = async (req, res) => {
    try {
        const addressId = req.query.id;
        // console.log(addressId)
        const user = req.session.User; 

        if (!user) {
            return res.redirect("/user/login");
        }

        const { address, name, city, buildingName, state, pincode, type, phone } = req.body;

        const updatedAddress = {
            userId: user._id,
            address: {
                addresstype: type,
                name,
                city,
                buildingName,
                state,
                pincode,
                phone:phone, 
                address
            }
        };

        const result = await Address.findByIdAndUpdate(addressId, { $set: updatedAddress });
        if(result){
            req.session.successMessage = "Address editing is successful";
            req.session.errorMessage = "";
            res.redirect("/user/account")
        }else{
            req.session.successMessage = "";
            req.session.errorMessage = "Address editing is not successful";
            res.redirect("/user/account")
        }
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).send("An error occurred while updating the address.");
    }
};



const deleteAddress = async (req,res)=>{
    try {
        const addid = req.query.id;
        const result = await Address.deleteOne({_id:addid})
        res.redirect("/user/account")
        
    } catch (error) {
        console.log("error for delete Address",error)
    }
}


const loadDetails = async (req,res)=>{
    try {
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        req.session.successMessage = null;
        req.session.errorMessage = null;
        const email = req.session.User;
        const user = await User.findOne({email})

        res.render("user/details",{user,successMessage,errorMessage})
        
    } catch (error) {
        console.log("error for load details ",error)
    }
}

const editDetails = async (req,res)=>{
    try {
        const userEmail = req.session.User;
    
        if (!userEmail) {
            return res.redirect("/user/login");
        }
    
        const { name, email, phone } = req.body;

        req.session.User=null;
        req.session.User=email
    
        const updatedUserDetails = {
            name,
            email,
            phone
        };
    
        const result = await User.findOneAndUpdate(
            { email: userEmail }, 
            { $set: updatedUserDetails }, 
            { new: true }
        );
    
        if (result) {
            req.session.successMessage = "Details updated successfully";
            req.session.errorMessage = "";
            res.redirect("/user/details");
        } else {
            req.session.successMessage = "";
            req.session.errorMessage = "Failed to update details";
            res.redirect("/user/details");
        }
    } catch (error) {
        console.log("error for edit details ",error)
    }
}






module.exports = {loadAccount, addAddress, loadEdit, editAddress, deleteAddress, loadDetails, editDetails}