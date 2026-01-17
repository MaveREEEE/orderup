import express from "express"
import cors from "cors"
import path from "path"
import fs from 'fs'
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoutes.js"
import userRouter from "./routes/userRoutes.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoutes.js"
import orderRouter from "./routes/orderRoutes.js"
import categoryRouter from "./routes/categoryRoutes.js"
import inventoryRouter from "./routes/inventoryRoutes.js"
import adminRouter from "./routes/adminRoutes.js"
import settingsRouter from "./routes/settingsRoutes.js";
import roleRouter from "./routes/roleRoutes.js";
import authRouter from "./routes/authRoutes.js"
import promoCodeRouter from "./routes/promoCodeRoutes.js"
import recommendRouter from "./routes/recommendRoutes.js";


//app config
const app = express()
const port = process.env.PORT || 4000

//middleware
app.use(express.json())
app.use(cors())

//db connection
connectDB();

// api endpoints
app.use("/api/auth", authRouter);
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/user", userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order", orderRouter)
app.use("/api/category", categoryRouter);
app.use('/uploads/categories', express.static('uploads/categories'));
app.use("/api/inventory", inventoryRouter)
app.use("/api/admin", adminRouter)
app.use("/api/settings", settingsRouter);
app.use("/api/roles", roleRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))
app.use("/api/promo", promoCodeRouter);
app.use("/api/recommend", recommendRouter);

if (!fs.existsSync('uploads/branding')) {
  fs.mkdirSync('uploads/branding', { recursive: true });
}
app.get("/",(req,res)=>{
    res.send("API Working")
})

app.listen(port,()=>{
    console.log(`Server Started on port ${port}`)
})
