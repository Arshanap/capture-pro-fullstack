const User = require("../../model/userModel/userSchema")
const Address = require("../../model/userModel/adressSchema")
const Cart = require("../../model/userModel/cartSchema")



const loadCheckout = async (req,res)=>{
    try {
        
        const email = req.session.User;
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        req.session.successMessage = null;
        req.session.errorMessage = null;

        const user = await User.findOne({email})
        const userId = user._id;
        const cartItems = await Cart.find({ userId }).populate('items.productId');
        const address = await Address.find({userId:userId})

        if(!address){
            console.log("this user have no address")
        }

        if (cartItems.length === 0) {
            return res.render("user/cartManagement", { proData: [], grandTotal: 0, message: "Your cart is empty." });
        }

        const proData = cartItems.flatMap(cart => cart.items.map(item => ({
            _id: item.productId._id,
            productName: item.productId.productName,  
            productImage: item.productId.productImage || [],  
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            count: item.productId.count
        })))

        const grandTotal = proData.reduce((total, item) => total + item.totalPrice, 0);

        res.render("user/checkout", {proData, grandTotal, addressData:address, successMessage, errorMessage});
    } catch (error) {
        console.log("error for load check out", error)
    }
}



const addAddress = async (req,res)=>{
    try {
        // console.log("ethi")
        const {fullName, pinCode, city, state, buildingName, fullAddress, type, phone} = req.body;
        // console.log(fullName, pinCode, city, state, buildingName, fullAddress, type, phone)

        const email = req.session.User;
        const user = await User.findOne({email})

        if(!user){
            console.log("user not found")
            return res.status(404).json({ message: "User not found" });
        }

        const address = new Address({
            userId: user._id,
            address: {
                addresstype:type,
                name:fullName,
                city,
                buildingName,
                pincode:pinCode,
                phone:phone,
                address:fullAddress,
                email:user.email,
                state,
            }
        })
     const result = await address.save()

    //  if(result){
    //     console.log("etthhhhiiiiii sette")
    //     req.session.successMessage = "Address adding is successful";
    //     req.session.errorMessage = "";
    //     res.redirect("/user/checkout")
    // }else{
    //     console.log("paaali")
    //     req.session.successMessage = "";
    //     req.session.errorMessage = "Address adding is not successful";
    //     res.redirect("/user/checkout")
    // }
        
            return res.status(200).json({ success: true, message: "Address added successfully" });
            
        
        
    } catch (error) {
        console.log("error for checkout Add Address",error)
    }
}

const loadEditAddress = async (req,res)=>{
    try {
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        const addressId = req.query.addressId;

        const addresses = await Address.findById({_id:addressId})

        res.render("user/checkoutEditAddress", {addresses})
        
    } catch (error) {
        console.log("error for load edit address in checkout",error)
    }
}


const editAddress = async (req,res)=>{
    try {
        const id = req.query.id;
        const email = req.session.User;
        const user = await User.findOne({email})
    
        // console.log(id)
        const {fullName, pinCode, city, state, buildingName, fullAddress, type, phone} = req.body;

        // console.log(fullName, pinCode, city, state, buildingName, fullAddress, type, phone)

        const updatedAddress = {
            userId: user._id,
            address: {
                addresstype: type,
                name:fullName,
                city,
                buildingName,
                state,
                pincode:pinCode,
                phone:phone, 
                address:fullAddress,
            }
        };

        const result = await Address.findByIdAndUpdate(id, { $set: updatedAddress });

        if(result){
            // console.log("etthhhhiiiiii sette")
            req.session.successMessage = "Address editing is successful";
            req.session.errorMessage = "";
            res.redirect("/user/checkout")
        }else{
            // console.log("paaali")
            req.session.successMessage = "";
            req.session.errorMessage = "Address editing is not successful";
            res.redirect("/user/checkout")
        }
        
    } catch (error) {
        console.log("error for edit address in checkout",error)
    }
}





module.exports = {loadCheckout, addAddress, loadEditAddress, editAddress}