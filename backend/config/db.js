import mongoose from "mongoose";

export const connectDB = async ()=>{
    await mongoose.connect('mongodb+srv://admin:admin@cluster0.yxdbxbx.mongodb.net/OrderUP').then(()=>console.log('DB CONNECTED'));
}