import express from "express"
import { addToCart, removeFromCart, getCart, removeAllFromCart } from "../controllers/cartController.js"
import authMiddleware from "../middleware/auth.js"  // ← Changed

const cartRouter = express.Router()

// All cart routes require authentication
cartRouter.post("/add", authMiddleware, addToCart)
cartRouter.post("/remove", authMiddleware, removeFromCart)
cartRouter.post("/removeAll", authMiddleware, removeAllFromCart)
cartRouter.post("/get", authMiddleware, getCart)


export default cartRouter