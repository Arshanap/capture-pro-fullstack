const User = require("../../model/userModel/userSchema")
const Address = require("../../model/userModel/adressSchema")
const Cart = require("../../model/userModel/cartSchema")



const loadCheckout = async (req,res)=>{
    try {
        
        const email = req.session.User;


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

        res.render("user/checkout", {proData, grandTotal, addressData:address});
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
     await address.save()


        
            return res.status(200).json({ success: true, message: "Address added successfully" });
            
        
        
    } catch (error) {
        console.log("error for checkout Add Address",error)
    }
}

const loadEditAddress = async (req,res)=>{
    try {
        const addressId = req.query.addressId;

        const addresses = await Address.findById({_id:addressId})

        res.render("user/checkoutEditAddress", {addresses})
        
    } catch (error) {
        console.log("error for load edit address in checkout",error)
    }
}





module.exports = {loadCheckout, addAddress, loadEditAddress}