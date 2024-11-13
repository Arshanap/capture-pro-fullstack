const User = require("../../model/userModel/userSchema")
const Wallet = require("../../model/userModel/walletSchema")




const loadWallet = async (req,res)=>{
    try {
        const email = req.session.User;
        const user = await User.findOne({email})

        const wallet = await Wallet.findOne({userId:user._id})

        res.render("user/wallet",{wallet})
    } catch (error) {
        console.log("error for load wallet",error)
    }
}

// Express.js Controller
const addFund = async (req, res) => {
    try {
      const amount = parseFloat(req.body.amount); 
      const email = req.session.User;
      const user = await User.findOne({ email });
  
      let wallet = await Wallet.findOne({ userId: user._id });
  
      if (!wallet) {
        wallet = new Wallet({
          userId: user._id,
          balance: 0,
          transaction: []
        });
        await wallet.save();
      }
  
      wallet.balance += amount; 
  
      wallet.transaction.push({
        transactionType: 'credit',
        amount,
        status: 'completed'
      });
  
      await wallet.save();
  
      res.json({ success: true });
      console.log("Successfully added funds to the wallet");
    } catch (error) {
      console.log("Error adding funds to wallet:", error);
    }
  };
  
  



module.exports = {loadWallet, addFund}