import userModel from "../models/userModel.js"

// add to cart
const addToCart = async (req, res) => {
    try {
        console.log("Adding to cart - userId:", req.body.userId, "itemId:", req.body.itemId, "amount:", req.body.amount);
        
        let userData = await userModel.findById(req.body.userId)
        if (!userData) {
            return res.json({success:false, message:"User not found"})
        }
        
        let cartData = userData.cartData;
        const amount = req.body.amount || 1;
        
        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = amount;
        } else {
            cartData[req.body.itemId] += amount;
        }
        
        await userModel.findByIdAndUpdate(req.body.userId, {cartData});
        
        console.log("✅ Cart saved to database:", cartData);
       
        res.json({success:true, message:"Added to Cart"});
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error Add to Cart"})
    }
}


// remove from cart
const removeFromCart = async (req,res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        if (!userData) {
            return res.json({success:false,message:"User not found"})
        }
        
        let cartData = await userData.cartData;
        if (cartData[req.body.itemId]>0) {
            cartData[req.body.itemId] -=1;
        }
        await userModel.findByIdAndUpdate(req.body.userId,{cartData})
        res.json({success:true,message:"Removed from cart"});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error Remove from Cart"})
    }
}

//remove all
const removeAllFromCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        if (!userData) {
            return res.json({success:false,message:"User not found"})
        }
        
        let cartData = await userData.cartData;
        if (cartData[req.body.itemId] !== undefined) {
            delete cartData[req.body.itemId];
        }
        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: "All quantities removed from cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error Remove All From Cart" });
    }
}


// fetch cart data
const getCart = async (req,res) => {
    try {
        let userData = await userModel.findById(req.body.userId)
        if (!userData) {
            return res.json({success:false,message:"User not found"})
        }
        
        let cartData = await userData.cartData;
        res.json ({success:true,cartData})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error Fetch Cart"})
    }
}

export {addToCart,removeFromCart,removeAllFromCart,getCart}