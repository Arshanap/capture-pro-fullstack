const Coupen = require("../../model/userModel/couponSchema")


const loadCoupen = async (req,res)=>{
    try {
        const coupon = await Coupen.find()

        res.render("admin/coupen",{coupon})

    } catch (error) {
        console.log("error for load coupons",error)
    }
}

const addCoupen = async (req, res) => {
    try {
      const { isActive, usageLimit, maxDiscount, expirationDate, minPurchaseAmount, discountAmount, discountType, couponCode } = req.body;
  
    //   console.log(isActive, usageLimit, maxDiscount, expirationDate, minPurchaseAmount, discountAmount, discountType, couponCode);
  
      const coupen = new Coupen({
        code: couponCode,
        discountType,
        discountAmount,
        minPurchaseAmount,
        expirationDate,
        maxDiscount,
        usageLimit,
        isActive,
      });
  
      await coupen.save();
  
      res.status(201).json({ message: 'Coupon added successfully!' });
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: 'Coupon code already exists. Please use a different code.' });
      } else {
        console.error("Error adding coupon on the admin side:", error);
        res.status(500).json({ message: 'An error occurred while adding the coupon. Please try again.' });
      }
    }
  };
  
  const deleteCoupon = async (req, res) => {
    try {
      const id = req.query.id;
    //   console.log("Coupon ID to delete:", id);
  
      const result = await Coupen.deleteOne({ _id: id });
  
      if (result.deletedCount > 0) {
        // console.log("Coupon deleted successfully");

        return res.status(200).json({ message: "Coupon has been deleted successfully." });
      } else {
        // console.log("No coupon found to delete");

        return res.status(404).json({ message: "Coupon not found." });
      }
    } catch (error) {
      console.error("Error deleting coupon on admin side:", error);
      return res.status(500).json({ message: "An error occurred while deleting the coupon. Please try again." });
    }
  };
  





module.exports = {loadCoupen, addCoupen, deleteCoupon}