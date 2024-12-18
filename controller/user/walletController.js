const User = require("../../model/userModel/userSchema")
const Wallet = require("../../model/userModel/walletSchema")
const {statusCodes} = require("../../config/key")
const {walletStrings} = require("../../config/key")


const loadWallet = async (req, res) => {
  try {
      const email = req.session.User;
      const user = await User.findOne({ email });

      // if (!user) {
      //     return res.render("user/wallet", {totalPages, wallet: null, message: "User not found." });
      // }

      const wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet) {
          // If wallet is not found, handle it gracefully
          return res.render("user/wallet", {
            totalPages:1,
            currentPage:1,
              wallet: { balance: 0, transaction: [] }, // Default values
              message: walletStrings.BALANCE
          });
      }

      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = 5; // Number of transactions per page
      const skip = (page - 1) * limit;

      const reversedTransactions = wallet.transaction.reverse();

     const transactions = reversedTransactions.slice(skip, skip + limit);
      const totalTransactions = wallet.transaction.length;
      const totalPages = Math.ceil(totalTransactions / limit);

      res.render("user/wallet", {
          wallet: {
              balance: wallet.balance,
              transaction: transactions,
          },
          currentPage: page,
          totalPages,
      });
  } catch (error) {
      console.log("Error loading wallet", error);
      res.render("user/wallet", {
          wallet: null,
          totalPages,
          message: walletStrings.LOADWALLET,
          
      });
  }
};



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