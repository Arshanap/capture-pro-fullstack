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

      console.log('arshankuttide coupon',coupen)
  
      await coupen.save();
  
      return res.status(200).json({ success:true,message: 'Coupon added successfully!' });
    } catch (error) {
      return res.status(400).json({success:false,error:'something occured'})
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


  const loadEditCoupon = async (req,res)=>{
    try {
        const id = req.query.id;

        const coupon = await Coupen.findById(id)
        if (coupon.expirationDate) {
            coupon.expirationDate = coupon.expirationDate.toISOString().split('T')[0];
          }

        res.render("admin/editCoupon",{coupon})
        
    } catch (error) {
        console.log("error for load edit coupon",error)
    }
  }





  
  const editCoupon = async (req, res) => {
    try {
      const id = req.query.id;
      const {
        code,
        discountType,
        discountAmount,
        minPurchaseAmount,
        expirationDate,
        maxDiscount,
        usageLimit,
        isActive,
      } = req.body;
    //   console.log(code,
    //     discountType,
    //     discountAmount,
    //     minPurchaseAmount,
    //     expirationDate,
    //     maxDiscount,
    //     usageLimit,
        // isActive,)
  
      const result = await Coupen.findByIdAndUpdate(
        id,
        {
          code,
          discountType,
          discountAmount,
          minPurchaseAmount,
          expirationDate,
          maxDiscount,
          usageLimit,
          isActive,
        },
        { new: true, runValidators: true } 
      );
  
      if (result) {
        return res.status(200).json({ message: "Coupon has been updated successfully." });
      } else {
        return res.status(404).json({ message: "Coupon not found." });
      }
    } catch (error) {
      console.error("Error updating coupon on admin side:", error);
      return res.status(500).json({ message: "An error occurred while updating the coupon. Please try again." });
    }
  };
  





module.exports = {loadCoupen, addCoupen, deleteCoupon, editCoupon, loadEditCoupon}