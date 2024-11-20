const User = require("../../model/userModel/userSchema")
const Address = require("../../model/userModel/adressSchema")
const Cart = require("../../model/userModel/cartSchema")
const Coupon = require("../../model/userModel/couponSchema")



const loadCheckout = async (req, res) => {
    try {
        const email = req.session.User;
        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";
        req.session.successMessage = null;
        req.session.errorMessage = null;

        const user = await User.findOne({ email });
        const userId = user._id;

        // Retrieve the cart for the user and populate the items
        const cartItems = await Cart.findOne({ userId }).populate('items.productId');
        const address = await Address.find({ userId });

        const coupons = await Coupon.find();

        if (!address || address.length === 0) {
            console.log("This user has no address");
        }

        if (!cartItems || cartItems.items.length === 0) {
            return res.render("user/cartManagement", { 
                proData: [], 
                grandTotal: 0, 
                message: "Your cart is empty." 
            });
        }

        // Prepare the product data for rendering
        const proData = cartItems.items.map(item => ({
            _id: item.productId._id,
            productName: item.productId.productName,
            productImage: item.productId.productImage || [],
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            count: item.productId.count,
        }));

        // Access grandTotal and total from the cart document
        const grandTotal = cartItems.grandTotal;
        const total = cartItems.total;
        const Discount = cartItems.discountAmount

        // Render the checkout page
        res.render("user/checkout", {
            proData,
            addressData: address,
            coupons,
            successMessage,
            errorMessage,
            grandTotal,
            total,
            Discount
        });
    } catch (error) {
        console.log("Error loading checkout:", error);
    }
};





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


const applyCoupon = async (req, res) => {
    try {
      const { couponCode } = req.body;
  
      // Retrieve user information from the session
      const email = req.session.User;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found."
        });
      }
  
      const userId = user._id;
  
      // Retrieve the cart for the user
      const cart = await Cart.findOne({ userId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Your cart is empty."
        });
      }
  
      // Check if a coupon is already applied to the cart
      if (cart.couponCode) {
        return res.status(400).json({
          success: false,
          message: "A coupon is already applied to this cart."
        });
      }
  
      // Find the coupon in the database
      const coupon = await Coupon.findOne({ code: couponCode });
    //   console.log(coupon)
    //   console.log(couponCode);
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Invalid coupon code."
        });
      }
 // Check if the coupon is active and not expired
 const currentDate = new Date();
 if (!coupon.isActive || currentDate > coupon.expirationDate) {
   return res.status(400).json({
     success: false,
     message: "This coupon is either inactive or has expired."
   });
 }

 // Check if the cart's grand total meets the coupon's minimum purchase amount
 if (cart.grandTotal < coupon.minPurchaseAmount) {
   return res.status(400).json({
     success: false,
     message: `Minimum purchase amount of ${coupon.minPurchaseAmount} is required to apply this coupon.`
   });
 }

 // Apply discount logic
 let discountAmount = 0;
 if (coupon.discountType === "percentage") {
   discountAmount = (cart.grandTotal * coupon.discountAmount) / 100;
   if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
     discountAmount = coupon.maxDiscount;
   }
 } else if (coupon.discountType === "fixed") {
   discountAmount = coupon.discountAmount;
 }

 // Check if the coupon usage limit is reached
 if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
   return res.status(400).json({
     success: false,
     message: "This coupon has reached its usage limit."
   });
 }


 coupon.usedCount += 1;

 cart.couponCode = couponCode;

 cart.discountAmount = discountAmount;

 cart.grandTotal -= discountAmount

 await cart.save()
 await coupon.save()


 // Return the updated information
 return res.status(200).json({
   success: true,
   message: `Coupon applied successfully. You saved ${discountAmount}.`,
   discountAmount,
   grandTotal: cart.grandTotal
 });
      
    } catch (error) {
      console.error("Error applying coupon:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while applying the coupon."
      });
    }
  };
  
  const removeCoupon = async (req, res) => {
    try {
        const email = req.session.User;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found."
            });
        }

        const userId = user._id;
        
        // Retrieve the cart for the user
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        // Remove the coupon and reset discount
        cart.couponCode = null;
        cart.discountAmount = 0;
        cart.grandTotal = cart.total; // Update grandTotal without discount
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Coupon removed successfully."
        });
    } catch (error) {
        console.error("Error removing coupon:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while removing the coupon."
        });
    }
};











module.exports = {loadCheckout, addAddress, loadEditAddress, editAddress, applyCoupon, removeCoupon}