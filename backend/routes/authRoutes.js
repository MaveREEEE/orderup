import express from "express"
import { login, register } from "../controllers/authController.js"

const authRouter = express.Router()

// Unified auth endpoints
authRouter.post("/login", login)
authRouter.post("/register", register)

export default authRouter