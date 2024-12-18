const statusCodes = Object.freeze({
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
})

const wishlistStrings = Object.freeze({
    SUCCESS:"Product successfully removed from wishlist",
    ERRORFORREMOVE:"error for add product in wishlist",
    NOTPRODUCT:"Product not found in wishlist",
    PRODUCTADDSUCCESS:"Product has been added to your wishlist",
    PRODUCTADDFAILD:"Failed to add product to wishlist",
    ALREADY:"This product is already in your wishlist",
    USERNOFOUND:"User not found",
})

const walletStrings = Object.freeze({
    LOADWALLET:"An error occurred while loading the wallet.",
    BALANCE:"Wallet not found. Please add funds to your wallet.",
})

const userController = Object.freeze({
    INTERNAL:"Internal Server Error",
    NOTCATEGORY:'No categories found',
    RESENDOTPERROR:"Internal server error during OTP resend",
    RENDTRY:"Failed to resend OTP, please try again.",
    SUCCESSRESEND:"OTP Resent Successfully",
    NOTFOUNDEMAIL:"Email not found in session",
    ERROROTP:"An error occurred during OTP verification.",
    INVALIDOTP:"Invalid OTP, please try again.",
    USERSUCCESS:"User registered successfully!",
    SESSIONEXPIRED:"Session expired. Please try again."
})

const productStrings = Object.freeze({
    LOADSHOPERROR:"An error occurred while loading the products.",
    LOADPRODUCTERROR:"An error occurred while loading the product.",
})



module.exports = {statusCodes, wishlistStrings, walletStrings, userController, productStrings}